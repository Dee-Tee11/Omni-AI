import { vectorService } from './vectorService.js';
import { geminiService } from './geminiService.js';
import type { QueryRequest, QueryResponse } from '../types/index.js';
import path from 'path';
import { env } from '../config.js';

const IMAGES_DIR = path.join(env.UPLOADS_PATH, 'images');

export class RAGService {
    async query(request: QueryRequest, userId: string): Promise<QueryResponse> {
        const { question, documentIds, topK = 5 } = request;

        // Step 1: Retrieve relevant chunks from Supabase
        const relevantChunks = await vectorService.query(question, userId, topK, documentIds);

        if (relevantChunks.length === 0) {
            return {
                answer: 'Não encontrei informação relevante nos documentos enviados para responder a essa pergunta.',
                sources: [],
                model: 'gemini-1.5-pro',
            };
        }

        // Step 2: Prepare context for Gemini
        const textContext = relevantChunks.map((chunk, idx) =>
            `[Fonte ${idx + 1} - Página ${chunk.pageNumber}]\n${chunk.content}`
        );

        // Deduplicate pages to avoid sending the same image multiple times
        const uniquePages = new Set<string>();
        const imagesContext: string[] = [];

        relevantChunks.forEach(chunk => {
            const pageKey = `${chunk.documentId}-${chunk.pageNumber}`;
            if (!uniquePages.has(pageKey) && chunk.pageNumber > 0) {
                uniquePages.add(pageKey);
                // Construct image path: uploads/images/{documentId}/page-{pageNumber}.png
                // Note: pageNumber in metadata is 1-based, file is page-1.png
                const imagePath = path.join(IMAGES_DIR, chunk.documentId, `page-${chunk.pageNumber}.png`);
                imagesContext.push(imagePath);
            }
        });

        // Step 3: Generate answer using Gemini
        const answer = await geminiService.generateAnswer(question, {
            text: textContext,
            images: imagesContext
        });

        return {
            answer,
            sources: relevantChunks.map(chunk => ({
                chunkId: chunk.chunkId,
                documentId: chunk.documentId,
                pageNumber: chunk.pageNumber,
                content: chunk.content,
                similarity: chunk.similarity,
            })),
            model: 'gemini-1.5-pro',
        };
    }

    // Stream query is not yet implemented for Gemini in this refactor
    // We can implement it later if needed, for now we stick to standard query
    async streamQuery(request: QueryRequest, userId: string): Promise<AsyncIterable<string>> {
        // Fallback to non-streaming for now or implement Gemini streaming
        const response = await this.query(request, userId);

        async function* streamGenerator() {
            yield response.answer;
        }

        return streamGenerator();
    }
}

export const ragService = new RAGService();