import { supabase } from './lib/supabase.js';

async function cleanupOrphanedChunks() {
    console.log('Cleaning up orphaned chunks...');

    // Delete chunks where document_id is still null
    const { data, error } = await supabase
        .from('document_chunks')
        .delete()
        .is('document_id', null);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Orphaned chunks deleted successfully.');
    }

    // Show current state
    const { count: totalChunks } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });

    const { count: totalDocs } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

    console.log(`\nCurrent state:`);
    console.log(`  Documents: ${totalDocs}`);
    console.log(`  Chunks: ${totalChunks}`);
}

cleanupOrphanedChunks();
