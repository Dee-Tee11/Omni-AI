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
        topK: number = 5,
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

        // Call Supabase RPC function
        const { data: matchDocuments, error } = await supabase.rpc('match_document_chunks', { // Changed RPC name
            query_embedding: queryEmbedding,
            match_threshold: 0.5, // Adjust threshold as needed
            match_count: topK,
            filter_user_id: userId
        });

        if (error) {
            console.error('Error querying Supabase:', error);
            throw new Error(`Vector search failed: ${error.message}`);
        }

        // Filter by documentIds if specified (client-side filter after retrieval, 
        // or we could add it to RPC but array filtering in SQL is slightly more complex)
        // For now, let's filter the results if needed. 
        // Ideally, we should pass documentIds to the RPC for efficiency.
        let results = matchDocuments || [];

        if (documentIds && documentIds.length > 0) {
            results = results.filter((doc: any) =>
                documentIds.includes(doc.document_id) // Changed from metadata.documentId to document_id column
            );
        }

        return results.map((doc: any) => ({
            chunkId: doc.id,
            content: doc.content,
            documentId: doc.document_id, // Changed from metadata.documentId
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

