import { vectorService } from './services/vectorService.js';
import { supabase } from './lib/supabase.js';
import { cohereService } from './services/cohereService.js';
import { env } from './config.js';

async function testRetrieval() {
    console.log('Testing Retrieval...');
    console.log('Supabase URL:', env.SUPABASE_URL);

    // 1. Check counts
    const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });
    console.log('Total documents in DB:', docCount);

    const { count: chunkCount } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });
    console.log('Total chunks in DB:', chunkCount);

    // 2. Get a user ID and document
    const { data: documents, error } = await supabase
        .from('documents')
        .select('user_id, id, title')
        .limit(1);

    if (error || !documents || documents.length === 0) {
        console.error('No documents found to test with.');
        return;
    }

    const userId = documents[0].user_id;
    const documentId = documents[0].id;
    const title = documents[0].title;

    console.log(`Testing with User: ${userId}`);
    console.log(`Target Document: ${title} (${documentId})`);

    const query = "Quais são os pontos mais importantes?";
    console.log(`Query: "${query}"`);

    // 3. Test Vector Search (Raw)
    console.log('--- Raw Vector Search Results (Top 10) ---');
    const embedding = await cohereService.embedQuery(query);
    const { data: rawResults, error: rpcError } = await supabase.rpc('match_document_chunks', {
        query_embedding: embedding,
        match_threshold: 0.1, // Low threshold
        match_count: 10,
        filter_user_id: userId
    });

    if (rpcError) {
        console.error('RPC Error:', rpcError);
        return;
    }

    console.log(`Raw results count: ${rawResults?.length || 0}`);
    if (rawResults) {
        rawResults.forEach((doc: any, i: number) => {
            console.log(`[${i}] Score: ${doc.similarity.toFixed(4)} | DocID: ${doc.document_id}`);
        });
    }

    // 4. Test Service Query (with filter)
    console.log('\n--- Service Query (Filtered by Document ID) ---');
    try {
        const results = await vectorService.query(query, userId, 5, [documentId]);
        console.log(`Filtered results count: ${results.length}`);

        // Check if the documentId matches any of the raw results
        const matchingRaw = rawResults?.filter((r: any) => r.document_id === documentId);
        console.log(`Raw results matching docId: ${matchingRaw?.length || 0}`);

    } catch (e: any) {
        console.error('Service Query Error:', e.message);
    }
}

testRetrieval();
