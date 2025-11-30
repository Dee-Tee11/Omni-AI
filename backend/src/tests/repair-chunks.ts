import { supabase } from './lib/supabase.js';

async function repairChunks() {
    console.log('Starting chunk repair...');

    // 1. Fetch all chunks with NULL document_id
    // Note: We might need to fetch in batches if there are many, but for now let's try all
    const { data: chunks, error } = await supabase
        .from('document_chunks')
        .select('id, metadata')
        .is('document_id', null);

    if (error) {
        console.error('Error fetching chunks:', error);
        return;
    }

    if (!chunks || chunks.length === 0) {
        console.log('No chunks found needing repair.');
        return;
    }

    console.log(`Found ${chunks.length} chunks to repair.`);

    let successCount = 0;
    let errorCount = 0;

    for (const chunk of chunks) {
        const metadata = chunk.metadata as any;
        if (metadata && metadata.documentId) {
            const { error: updateError } = await supabase
                .from('document_chunks')
                .update({ document_id: metadata.documentId })
                .eq('id', chunk.id);

            if (updateError) {
                console.error(`Failed to update chunk ${chunk.id}:`, updateError);
                errorCount++;
            } else {
                successCount++;
                if (successCount % 100 === 0) {
                    process.stdout.write('.');
                }
            }
        } else {
            console.warn(`Chunk ${chunk.id} has no documentId in metadata.`);
            errorCount++;
        }
    }

    console.log('\nRepair complete.');
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

repairChunks();
