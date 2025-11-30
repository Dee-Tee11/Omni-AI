import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { Document, TextChunk, ImageMetadata } from '../types/index.js';
import { env } from '../config.js';
import { supabase } from '../lib/supabase.js';
import { vectorService } from './vectorService.js';
import { cohereService } from './cohereService.js';
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

            // Create chunks for this page (semantic chunking)
            const pageChunks = await this.createPageChunks(pageText, documentId, i, chunks.length);
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

    // Semantic chunking using sentence similarity
    private async createPageChunks(text: string, documentId: string, pageNumber: number, startIndex: number): Promise<TextChunk[]> {
        const chunks: TextChunk[] = [];

        // Split by sentences
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

        // If very short, return as single chunk
        if (sentences.length < 3 || text.length < 200) {
            return [{
                id: `${documentId}-chunk-${startIndex}`,
                documentId,
                content: text.trim(),
                pageNumber,
                chunkIndex: startIndex,
                startPosition: 0,
                endPosition: text.length,
            }];
        }

        try {
            // Generate embeddings for semantic analysis
            const sentenceTexts = sentences.map(s => s.trim());
            const embeddings = await cohereService.embed(sentenceTexts);

            // Calculate cosine similarity between consecutive sentences
            const similarities: number[] = [];
            for (let i = 0; i < embeddings.length - 1; i++) {
                similarities.push(this.cosineSimilarity(embeddings[i], embeddings[i + 1]));
            }

            // Find breakpoints where similarity drops (topic change)
            const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;

            const breakpoints: number[] = [0];
            for (let i = 0; i < similarities.length; i++) {
                // Break if similarity drops significantly below average (15% drop)
                // OR if it drops below an absolute floor (0.65) indicating weak relation
                const isRelativeDrop = similarities[i] < avgSim * 0.85;
                const isAbsoluteLow = similarities[i] < 0.65;

                if (isRelativeDrop || isAbsoluteLow) {
                    breakpoints.push(i + 1);
                }
            }
            breakpoints.push(sentenceTexts.length);

            // Create chunks from breakpoints
            let chunkIndex = startIndex;
            for (let i = 0; i < breakpoints.length - 1; i++) {
                const start = breakpoints[i];
                const end = breakpoints[i + 1];
                const content = sentenceTexts.slice(start, end).join(' ').trim();

                if (content.length < 50) continue;

                if (content.length > 5000) {
                    const subChunks = this.splitLargeChunk(content, documentId, pageNumber, chunkIndex);
                    chunks.push(...subChunks);
                    chunkIndex += subChunks.length;
                } else {
                    chunks.push({
                        id: `${documentId}-chunk-${chunkIndex}`,
                        documentId,
                        content,
                        pageNumber,
                        chunkIndex,
                        startPosition: start,
                        endPosition: end,
                    });
                    chunkIndex++;
                }
            }
        } catch (error) {
            console.error('Semantic chunking failed:', error);
            // If semantic chunking fails, return single chunk instead of falling back to paragraph-based
            return [{
                id: `${documentId}-chunk-${startIndex}`,
                documentId,
                content: text.trim(),
                pageNumber,
                chunkIndex: startIndex,
                startPosition: 0,
                endPosition: text.length,
            }];
        }

        // If no chunks were created (shouldn't happen), return single chunk
        if (chunks.length === 0) {
            console.warn('Semantic chunking produced no chunks, returning single chunk');
            return [{
                id: `${documentId}-chunk-${startIndex}`,
                documentId,
                content: text.trim(),
                pageNumber,
                chunkIndex: startIndex,
                startPosition: 0,
                endPosition: text.length,
            }];
        }

        return chunks;
    }

    // Cosine similarity helper
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }

    // Split large chunks
    private splitLargeChunk(text: string, documentId: string, pageNumber: number, startIndex: number): TextChunk[] {
        const chunks: TextChunk[] = [];
        const MAX_SIZE = 800;
        const words = text.split(/\s+/);

        for (let i = 0; i < words.length; i += MAX_SIZE) {
            const content = words.slice(i, i + MAX_SIZE).join(' ');
            chunks.push({
                id: `${documentId}-chunk-${startIndex + chunks.length}`,
                documentId,
                content,
                pageNumber,
                chunkIndex: startIndex + chunks.length,
                startPosition: i,
                endPosition: i + Math.min(MAX_SIZE, words.length - i),
            });
        }
        return chunks;
    }

    // Fallback: paragraph-based chunking
    private createParagraphChunks(text: string, documentId: string, pageNumber: number, startIndex: number): TextChunk[] {
        const chunks: TextChunk[] = [];
        const paragraphs = text.split(/\n\s*\n/);
        let currentChunkContent = '';
        let chunkIndex = startIndex;
        const TARGET_SIZE = 1000;

        for (const para of paragraphs) {
            const trimmed = para.trim();
            if (!trimmed) continue;

            if (currentChunkContent.length + trimmed.length > TARGET_SIZE && currentChunkContent) {
                chunks.push({
                    id: `${documentId}-chunk-${chunkIndex}`,
                    documentId,
                    content: currentChunkContent.trim(),
                    pageNumber,
                    chunkIndex,
                    startPosition: 0,
                    endPosition: currentChunkContent.length,
                });
                chunkIndex++;
                currentChunkContent = '';
            }
            currentChunkContent += trimmed + '\n\n';
        }

        if (currentChunkContent.trim()) {
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
