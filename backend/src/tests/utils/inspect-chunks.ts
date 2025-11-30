import { supabase } from './lib/supabase.js';

async function inspectChunks() {
    console.log('Inspecting chunks...\n');

    // Get all chunks with their document_id
    const { data: chunks } = await supabase
        .from('document_chunks')
        .select('id, document_id, metadata, content')
        .limit(5);

    if (!chunks || chunks.length === 0) {
        console.log('No chunks found!');
        return;
    }

    chunks.forEach((chunk, i) => {
        console.log(`Chunk ${i + 1}:`);
        console.log(`  ID: ${chunk.id}`);
        console.log(`  document_id column: ${chunk.document_id}`);
        console.log(`  metadata.documentId: ${(chunk.metadata as any)?.documentId}`);
        console.log(`  content: ${chunk.content.substring(0, 50)}...`);
        console.log('');
    });

    // Get documents
    const { data: docs } = await supabase
        .from('documents')
        .select('id, filename');

    console.log('Documents:');
    docs?.forEach(doc => {
        console.log(`  ${doc.id}: ${doc.filename}`);
    });
}

inspectChunks();
