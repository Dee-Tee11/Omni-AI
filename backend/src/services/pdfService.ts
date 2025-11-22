import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';
import crypto from 'crypto';
import type { Document, TextChunk, ImageMetadata } from '../types/index.js';
import { env } from '../config.js';

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

    async processUpload(file: Express.Multer.File): Promise<Document> {
        const documentId = crypto.randomUUID();
        const buffer = file.buffer;

        // Extract text using pdf-parse
        const pdfData = await pdfParse(buffer);
        const textContent = pdfData.text;
        const pageCount = pdfData.numpages;

        // Extract images using pdf-lib
        const images = await this.extractImages(buffer, documentId);

        // Create text chunks
        const chunks = this.createChunks(textContent, documentId);

        // Save PDF file
        const pdfPath = path.join(UPLOADS_DIR, `${documentId}.pdf`);
        await fs.writeFile(pdfPath, buffer);

        // Save metadata
        const document: Document = {
            id: documentId,
            filename: file.originalname,
            uploadDate: new Date(),
            pageCount,
            textContent,
            chunkCount: chunks.length,
            imageCount: images.length,
        };

        const metadataPath = path.join(UPLOADS_DIR, `${documentId}.json`);
        await fs.writeFile(metadataPath, JSON.stringify({ document, chunks, images }, null, 2));

        return document;
    }

    private async extractImages(pdfBuffer: Buffer, documentId: string): Promise<ImageMetadata[]> {
        const images: ImageMetadata[] = [];

        try {
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            const pages = pdfDoc.getPages();
            const docImagesDir = path.join(IMAGES_DIR, documentId);
            await fs.mkdir(docImagesDir, { recursive: true });

            let imageIndex = 0;

            for (let pageNum = 0; pageNum < pages.length; pageNum++) {
                const page = pages[pageNum];

                // Get images from page (pdf-lib doesn't directly extract images easily)
                // For now, we'll use a placeholder approach
                // In production, you might want to use pdf.js or pdfjs-dist for better image extraction

                // This is a simplified version - you may need additional libraries
                // like canvas or sharp for proper image extraction
                const pageImages = await this.extractPageImages(page, pageNum, documentId, imageIndex);
                images.push(...pageImages);
                imageIndex += pageImages.length;
            }
        } catch (error) {
            console.error('Error extracting images:', error);
        }

        return images;
    }

    private async extractPageImages(
        page: any,
        pageNum: number,
        documentId: string,
        startIndex: number
    ): Promise<ImageMetadata[]> {
        // Placeholder implementation
        // In production, use pdfjs-dist or similar for proper image extraction
        // For now, we'll return empty array and implement this later with proper library
        return [];
    }

    private createChunks(text: string, documentId: string): TextChunk[] {
        const chunks: TextChunk[] = [];
        const chunkSize = 800; // characters
        const overlap = 200; // overlap between chunks

        let startPos = 0;
        let chunkIndex = 0;

        while (startPos < text.length) {
            const endPos = Math.min(startPos + chunkSize, text.length);
            const content = text.slice(startPos, endPos).trim();

            if (content.length > 0) {
                chunks.push({
                    id: `${documentId}-chunk-${chunkIndex}`,
                    documentId,
                    content,
                    pageNumber: this.estimatePageNumber(startPos, text.length, 1), // Simplified
                    chunkIndex,
                    startPosition: startPos,
                    endPosition: endPos,
                });
                chunkIndex++;
            }

            startPos += chunkSize - overlap;
        }

        return chunks;
    }

    private estimatePageNumber(position: number, totalLength: number, totalPages: number): number {
        return Math.ceil((position / totalLength) * totalPages);
    }

    async getDocument(documentId: string): Promise<{ document: Document; chunks: TextChunk[] } | null> {
        try {
            const metadataPath = path.join(UPLOADS_DIR, `${documentId}.json`);
            const data = await fs.readFile(metadataPath, 'utf-8');
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    async getAllDocuments(): Promise<Document[]> {
        try {
            const files = await fs.readdir(UPLOADS_DIR);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            const documents: Document[] = [];
            for (const file of jsonFiles) {
                const data = await fs.readFile(path.join(UPLOADS_DIR, file), 'utf-8');
                const { document } = JSON.parse(data);
                documents.push(document);
            }

            return documents.sort((a, b) =>
                new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
            );
        } catch {
            return [];
        }
    }

    async deleteDocument(documentId: string): Promise<boolean> {
        try {
            // Delete PDF file
            await fs.unlink(path.join(UPLOADS_DIR, `${documentId}.pdf`));

            // Delete metadata
            await fs.unlink(path.join(UPLOADS_DIR, `${documentId}.json`));

            // Delete images directory
            const imagesDir = path.join(IMAGES_DIR, documentId);
            await fs.rm(imagesDir, { recursive: true, force: true });

            return true;
        } catch {
            return false;
        }
    }
}

export const pdfService = new PDFService();
