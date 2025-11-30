import { supabase } from './lib/supabase.js';
import { cohereService } from './services/cohereService.js';

async function debugQuery() {
    console.log('Debug query...\n');

    // Get the latest uploaded document
    const { data: docs } = await supabase
        .from('documents')
        .select('id, user_id, filename')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!docs || docs.length === 0) {
        console.log('No documents found!');
        return;
    }

    const doc = docs[0];
    console.log(`Document: ${doc.filename}`);
    console.log(`User: ${doc.user_id}`);
    console.log(`Doc ID: ${doc.id}\n`);

    // Check chunks for this document
    const { count } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', doc.id);

    console.log(`Chunks in DB for this doc: ${count}\n`);

    // Test embedding query
    const query = "Quais são os pontos mais importantes?";
    const embedding = await cohereService.embedQuery(query);
    console.log(`Embedding generated (length: ${embedding.length})\n`);

    // Test RPC call with low threshold
    const { data: results, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: embedding,
        match_threshold: 0.0, // Very low threshold to see all results
        match_count: 10,
        filter_user_id: doc.user_id
    });

    if (error) {
        console.error('RPC Error:', error);
        return;
    }

    console.log(`RPC returned ${results?.length || 0} results\n`);

    if (results && results.length > 0) {
        results.forEach((r: any, i: number) => {
            console.log(`[${i}] Similarity: ${r.similarity?.toFixed(4) || 'N/A'}`);
            console.log(`    Doc ID: ${r.document_id}`);
            console.log(`    Matches target: ${r.document_id === doc.id ? 'YES' : 'NO'}`);
            console.log('');
        });
    } else {
        console.log('No results from RPC - this is the problem!');
    }
}

debugQuery();
