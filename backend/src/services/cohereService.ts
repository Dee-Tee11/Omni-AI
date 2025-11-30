import { CohereClient } from 'cohere-ai';
import { env } from '../config.js';

if (!env.COHERE_API_KEY) {
    console.warn('Cohere API key is missing. Embeddings will fail.');
}

const cohere = new CohereClient({
    token: env.COHERE_API_KEY || 'dummy',
});

export class CohereService {
    /**
     * Generates multimodal embeddings for text and/or images.
     * Uses 'embed-multilingual-v3.0' or 'embed-english-v3.0' which supports 1024 dimensions.
     * Note: Check specific model documentation for multimodal support. 
     * For true multimodal (image+text to same space), we need 'embed-multimodal-v3.0'.
     */
    async embed(texts: string[], images: string[] = []): Promise<number[][]> {
        try {
            // Cohere API limit is typically 96 texts per call
            const BATCH_SIZE = 96;
            const allEmbeddings: number[][] = [];

            for (let i = 0; i < texts.length; i += BATCH_SIZE) {
                const batchTexts = texts.slice(i, i + BATCH_SIZE);

                const response = await cohere.embed({
                    model: 'embed-multilingual-v3.0',
                    texts: batchTexts,
                    inputType: 'search_document',
                    embeddingTypes: ['float'],
                });

                if (Array.isArray(response.embeddings)) {
                    allEmbeddings.push(...(response.embeddings as number[][]));
                } else if (response.embeddings && 'float' in response.embeddings) {
                    allEmbeddings.push(...(response.embeddings.float as number[][]));
                } else {
                    throw new Error('Unexpected embedding format from Cohere');
                }
            }

            return allEmbeddings;
        } catch (error) {
            console.error('Error generating embeddings:', error);
            throw error;
        }
    }

    /**
     * Embed a single query
     */
    async embedQuery(text: string): Promise<number[]> {
        const response = await cohere.embed({
            model: 'embed-multilingual-v3.0',
            texts: [text],
            inputType: 'search_query',
            embeddingTypes: ['float'],
        });

        if (Array.isArray(response.embeddings)) {
            return (response.embeddings as number[][])[0];
        }

        if (response.embeddings && 'float' in response.embeddings) {
            return (response.embeddings.float as number[][])[0];
        }

        throw new Error('Failed to embed query');
    }
}

export const cohereService = new CohereService();
