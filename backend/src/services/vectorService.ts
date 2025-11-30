import { supabase } from '../lib/supabase.js';
import { cohereService } from './cohereService.js';
import type { TextChunk } from '../types/index.js';

export class VectorService {

    async addChunks(chunks: TextChunk[], userId: string): Promise<void> {
        if (chunks.length === 0) return;

        console.log(`Generating embeddings for ${chunks.length} chunks...`);

        // Prepare data for insertion
        const documentsToInsert = [];

        // Process in batches to avoid API limits if necessary, but Cohere handles batching well
        // We need to generate embeddings first
        const texts = chunks.map(c => c.content);

        // Generate embeddings using Cohere
        const embeddings = await cohereService.embed(texts);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            documentsToInsert.push({
                user_id: userId,
                document_id: chunk.documentId, // Explicitly set document_id column
                content: chunk.content,
                embedding: embeddings[i],
                metadata: {
                    documentId: chunk.documentId,
                    pageNumber: chunk.pageNumber,
                    chunkIndex: chunk.chunkIndex,
                    startPosition: chunk.startPosition,
                    endPosition: chunk.endPosition
                }
            });
        }

        // Insert into Supabase
        const { error } = await supabase
            .from('document_chunks') // Changed from 'documents' to 'document_chunks'
            .insert(documentsToInsert);

        if (error) {
            console.error('Error inserting documents into Supabase:', error);
            throw new Error(`Failed to store vectors: ${error.message}`);
        }

        console.log(`✓ Added ${chunks.length} chunks to Supabase`);
    }

    async query(
        queryText: string,
        userId: string,
        topK: number = 8, // Increased default for better context
        documentIds?: string[]
    ): Promise<Array<{
        chunkId: string;
        content: string;
        documentId: string;
        pageNumber: number;
        similarity: number;
    }>> {
        // Generate embedding for query
        const queryEmbedding = await cohereService.embedQuery(queryText);

        // Step 1: Fetch more candidates with low threshold
        const { data: matchDocuments, error } = await supabase.rpc('match_document_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: 0.2, // Low threshold to get more candidates
            match_count: topK * 3, // 3x candidates for reranking
            filter_user_id: userId
        });

        if (error) {
            console.error('Error querying Supabase:', error);
            throw new Error(`Vector search failed: ${error.message}`);
        }

        let results = matchDocuments || [];

        // Step 2: Filter by documentIds if specified
        if (documentIds && documentIds.length > 0) {
            results = results.filter((doc: any) =>
                documentIds.includes(doc.document_id)
            );
        }

        // Step 3: Sort by similarity (reranking)
        const sortedResults = results.sort((a: any, b: any) => b.similarity - a.similarity);

        // Step 4: Apply adaptive threshold
        if (sortedResults.length === 0) {
            return [];
        }

        const bestScore = sortedResults[0].similarity;
        const adaptiveThreshold = Math.max(
            0.3,                    // Minimum absolute threshold
            bestScore * 0.65        // 65% of best score
        );

        // Step 5: Filter by adaptive threshold and limit to topK
        const filteredResults = sortedResults
            .filter((doc: any) => doc.similarity >= adaptiveThreshold)
            .slice(0, topK);

        console.log(`Query results: ${filteredResults.length}/${results.length} chunks (threshold: ${adaptiveThreshold.toFixed(3)}, best: ${bestScore.toFixed(3)})`);

        return filteredResults.map((doc: any) => ({
            chunkId: doc.id,
            content: doc.content,
            documentId: doc.document_id,
            pageNumber: doc.metadata.pageNumber,
            similarity: doc.similarity
        }));
    }

    async deleteDocumentChunks(documentId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('document_chunks') // Changed table name
            .delete()
            .match({ document_id: documentId, user_id: userId }); // Changed match criteria

        if (error) {
            console.error('Error deleting document chunks:', error);
            // Don't throw, just log
        }
    }
}

export const vectorService = new VectorService();

