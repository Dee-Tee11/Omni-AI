import { pipeline } from '@xenova/transformers';
import type { TextChunk, Embedding } from '../types/index.js';

const COLLECTION_NAME = 'document_chunks';

interface StoredChunk {
    id: string;
    content: string;
    embedding: number[];
    metadata: {
        documentId: string;
        pageNumber: number;
        chunkIndex: number;
    };
}

export class VectorService {
    private embedder: any;
    private chunks: Map<string, StoredChunk> = new Map();
    private initialized = false;

    constructor() {
        console.log('✓ Using in-memory vector storage (no external database required)');
    }

    async initialize() {
        if (this.initialized) return;

        // Initialize embedding model
        console.log('Loading embedding model...');
        this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✓ Embedding model ready');

        this.initialized = true;
    }

    async generateEmbedding(text: string): Promise<number[]> {
        await this.initialize();

        const output = await this.embedder(text, {
            pooling: 'mean',
            normalize: true,
        });

        return Array.from(output.data);
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    async addChunks(chunks: TextChunk[]): Promise<void> {
        await this.initialize();

        if (chunks.length === 0) return;

        console.log(`Generating embeddings for ${chunks.length} chunks...`);

        // Generate embeddings for all chunks
        for (const chunk of chunks) {
            const embedding = await this.generateEmbedding(chunk.content);

            this.chunks.set(chunk.id, {
                id: chunk.id,
                content: chunk.content,
                embedding,
                metadata: {
                    documentId: chunk.documentId,
                    pageNumber: chunk.pageNumber,
                    chunkIndex: chunk.chunkIndex,
                },
            });
        }

        console.log(`✓ Added ${chunks.length} chunks to vector storage`);
    }

    async query(
        queryText: string,
        topK: number = 5,
        documentIds?: string[]
    ): Promise<Array<{
        chunkId: string;
        content: string;
        documentId: string;
        pageNumber: number;
        similarity: number;
    }>> {
        await this.initialize();

        // Generate embedding for query
        const queryEmbedding = await this.generateEmbedding(queryText);

        // Calculate similarities
        const results: Array<{
            chunkId: string;
            content: string;
            documentId: string;
            pageNumber: number;
            similarity: number;
        }> = [];

        for (const [id, chunk] of this.chunks) {
            // Filter by documentIds if specified
            if (documentIds && documentIds.length > 0) {
                if (!documentIds.includes(chunk.metadata.documentId)) {
                    continue;
                }
            }

            const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);

            results.push({
                chunkId: id,
                content: chunk.content,
                documentId: chunk.metadata.documentId,
                pageNumber: chunk.metadata.pageNumber,
                similarity,
            });
        }

        // Sort by similarity (descending) and take top K
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, topK);
    }

    async deleteDocumentChunks(documentId: string): Promise<void> {
        await this.initialize();

        let deleteCount = 0;
        for (const [id, chunk] of this.chunks) {
            if (chunk.metadata.documentId === documentId) {
                this.chunks.delete(id);
                deleteCount++;
            }
        }

        console.log(`✓ Deleted ${deleteCount} chunks for document ${documentId}`);
    }

    async getCollectionStats(): Promise<{
        count: number;
        documents: number;
    }> {
        await this.initialize();

        const uniqueDocuments = new Set<string>();
        for (const chunk of this.chunks.values()) {
            uniqueDocuments.add(chunk.metadata.documentId);
        }

        return {
            count: this.chunks.size,
            documents: uniqueDocuments.size,
        };
    }
}

export const vectorService = new VectorService();

