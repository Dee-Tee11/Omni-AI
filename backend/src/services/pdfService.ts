import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import crypto from 'crypto';
import type { Document, TextChunk, ImageMetadata } from '../types/index.js';
import { env } from '../config.js';
import { supabase } from '../lib/supabase.js';
import { vectorService } from './vectorService.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';

const UPLOADS_DIR = env.UPLOADS_PATH;
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');

export class PDFService {
    constructor() {
        this.ensureDirectories();
    }

    private async ensureDirectories() {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        await fs.mkdir(IMAGES_DIR, { recursive: true });
    }

    async processUpload(file: Express.Multer.File, userId: string): Promise<Document> {
        const documentId = crypto.randomUUID();
        const buffer = file.buffer;

        // Extract text using pdf-parse
        const pdfData = await pdfParse(buffer);
        const textContent = pdfData.text;
        const pageCount = pdfData.numpages;

        // Convert pages to images
        const images = await this.convertPagesToImages(buffer, documentId);

        // Save PDF file locally
        const pdfPath = path.join(UPLOADS_DIR, `${documentId}.pdf`);
        await fs.writeFile(pdfPath, buffer);

        // Insert metadata into Supabase 'documents' table
        const { error: dbError } = await supabase
            .from('documents')
            .insert({
                id: documentId,
                user_id: userId,
                filename: file.originalname,
                file_path: `${documentId}.pdf`,
            });

        if (dbError) {
            console.error('Error inserting document into Supabase:', dbError);
            throw new Error(`Failed to save document metadata: ${dbError.message}`);
        }

        // Create semantic chunks
        const chunks = this.createSemanticChunks(textContent, documentId, userId);

        // Save chunks to Supabase
        await vectorService.addChunks(chunks, userId);

        const document: Document = {
            id: documentId,
            filename: file.originalname,
            uploadDate: new Date(),
            pageCount,
            textContent,
            chunkCount: chunks.length,
            imageCount: images.length,
        };

        return document;
    }

    private async convertPagesToImages(pdfBuffer: Buffer, documentId: string): Promise<ImageMetadata[]> {
        const images: ImageMetadata[] = [];
        const docImagesDir = path.join(IMAGES_DIR, documentId);
        await fs.mkdir(docImagesDir, { recursive: true });

        try {
            // Convert Buffer to Uint8Array for pdfjs
            const uint8Array = new Uint8Array(pdfBuffer);

            // Load the document
            const loadingTask = pdfjsLib.getDocument({
                data: uint8Array,
                standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/',
            });

            const pdfDocument = await loadingTask.promise;
            const numPages = pdfDocument.numPages;

            for (let i = 1; i <= numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 }); // 1.5 scale for better quality

                // Create canvas
                const canvas = createCanvas(viewport.width, viewport.height);
                const context = canvas.getContext('2d');

                // Render page to canvas
                await page.render({
                    canvasContext: context as any,
                    viewport: viewport,
                    canvas: canvas as any, // Required for legacy build
                }).promise;

                // Save as PNG
                const imageBuffer = await canvas.encode('png');
                const imagePath = path.join(docImagesDir, `page-${i}.png`);
                await fs.writeFile(imagePath, imageBuffer);

                images.push({
                    id: `${documentId}-img-${i}`,
                    documentId,
                    pageNumber: i,
                    index: i - 1,
                    width: viewport.width,
                    height: viewport.height,
                    path: imagePath
                });
            }
        } catch (error) {
            console.error('Error converting PDF to images:', error);
        }

        return images;
    }

    private createSemanticChunks(text: string, documentId: string, userId: string): TextChunk[] {
        const chunks: TextChunk[] = [];

        // Split by double newline (paragraphs)
        const paragraphs = text.split(/\n\s*\n/);

        let currentChunkContent = '';
        let currentChunkStartIndex = 0;
        let chunkIndex = 0;

        const TARGET_CHUNK_SIZE = 1000; // characters (~250 tokens)

        for (const paragraph of paragraphs) {
            const trimmedPara = paragraph.trim();
            if (!trimmedPara) continue;

            // If adding this paragraph exceeds target size, save current chunk and start new
            if (currentChunkContent.length + trimmedPara.length > TARGET_CHUNK_SIZE && currentChunkContent.length > 0) {
                chunks.push({
                    id: `${documentId}-chunk-${chunkIndex}`,
                    documentId,
                    content: currentChunkContent.trim(),
                    pageNumber: 0, // TODO: Implement better page mapping for semantic chunks
                    chunkIndex,
                    startPosition: currentChunkStartIndex,
                    endPosition: currentChunkStartIndex + currentChunkContent.length,
                });

                chunkIndex++;
                currentChunkContent = '';
                currentChunkStartIndex += currentChunkContent.length; // Approximation
            }

            currentChunkContent += trimmedPara + '\n\n';
        }

        // Add remaining content
        if (currentChunkContent.trim().length > 0) {
            chunks.push({
                id: `${documentId}-chunk-${chunkIndex}`,
                documentId,
                content: currentChunkContent.trim(),
                pageNumber: 0,
                chunkIndex,
                startPosition: currentChunkStartIndex,
                endPosition: currentChunkStartIndex + currentChunkContent.length,
            });
        }

        return chunks;
    }

    async deleteDocument(documentId: string): Promise<boolean> {
        try {
            await fs.unlink(path.join(UPLOADS_DIR, `${documentId}.pdf`));
            const imagesDir = path.join(IMAGES_DIR, documentId);
            await fs.rm(imagesDir, { recursive: true, force: true });
            return true;
        } catch {
            return false;
        }
    }
}

export const pdfService = new PDFService();
