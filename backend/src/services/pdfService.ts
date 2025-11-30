import fs from 'fs/promises';
import path from 'path';
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

        // Convert Buffer to Uint8Array for pdfjs
        const uint8Array = new Uint8Array(buffer);

        // Load the document
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/',
        });

        const pdfDocument = await loadingTask.promise;
        const pageCount = pdfDocument.numPages;
        let fullText = '';
        const chunks: TextChunk[] = [];

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
                created_at: new Date().toISOString(),
            });

        if (dbError) {
            console.error('Error inserting document into Supabase:', dbError);
            throw new Error(`Failed to save document metadata: ${dbError.message}`);
        }

        // Process each page for Text and Images
        const images: ImageMetadata[] = [];
        const docImagesDir = path.join(IMAGES_DIR, documentId);
        await fs.mkdir(docImagesDir, { recursive: true });

        for (let i = 1; i <= pageCount; i++) {
            const page = await pdfDocument.getPage(i);

            // 1. Extract Text
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';

            // Create chunks for this page
            const pageChunks = this.createPageChunks(pageText, documentId, i, chunks.length);
            chunks.push(...pageChunks);

            // 2. Render Image
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            await page.render({
                canvasContext: context as any,
                viewport: viewport,
                canvas: canvas as any,
            }).promise;

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

        // Save chunks to Supabase
        await vectorService.addChunks(chunks, userId);

        const document: Document = {
            id: documentId,
            filename: file.originalname,
            uploadDate: new Date(),
            pageCount,
            textContent: fullText,
            chunkCount: chunks.length,
            imageCount: images.length,
        };

        return document;
    }

    // Helper to create chunks specifically for a page
    private createPageChunks(text: string, documentId: string, pageNumber: number, startIndex: number): TextChunk[] {
        const chunks: TextChunk[] = [];
        const paragraphs = text.split(/\n\s*\n/); // Split by paragraphs or double newlines

        let currentChunkContent = '';
        let chunkIndex = startIndex;
        const TARGET_CHUNK_SIZE = 1000;

        for (const paragraph of paragraphs) {
            const trimmedPara = paragraph.trim();
            if (!trimmedPara) continue;

            if (currentChunkContent.length + trimmedPara.length > TARGET_CHUNK_SIZE && currentChunkContent.length > 0) {
                chunks.push({
                    id: `${documentId}-chunk-${chunkIndex}`,
                    documentId,
                    content: currentChunkContent.trim(),
                    pageNumber, // Correct page number!
                    chunkIndex,
                    startPosition: 0, // Simplified for now
                    endPosition: currentChunkContent.length,
                });
                chunkIndex++;
                currentChunkContent = '';
            }
            currentChunkContent += trimmedPara + '\n\n';
        }

        if (currentChunkContent.trim().length > 0) {
            chunks.push({
                id: `${documentId}-chunk-${chunkIndex}`,
                documentId,
                content: currentChunkContent.trim(),
                pageNumber,
                chunkIndex,
                startPosition: 0,
                endPosition: currentChunkContent.length,
            });
        }

        return chunks;
    }

    async getDocument(documentId: string): Promise<Document | null> {
        // This method is kept for compatibility but should ideally be replaced by direct Supabase calls
        // or implemented to fetch from Supabase if needed by other services
        return null;
    }

    async getAllDocuments(): Promise<Document[]> {
        // This method is kept for compatibility but should ideally be replaced by direct Supabase calls
        return [];
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
