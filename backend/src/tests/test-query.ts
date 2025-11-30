import { ragService } from './services/ragService.js';
import { supabase } from './lib/supabase.js';

async function testQuery() {
    console.log('Testing query...');

    // Get first user with documents
    const { data: docs } = await supabase
        .from('documents')
        .select('user_id, id, filename')
        .limit(1);

    if (!docs || docs.length === 0) {
        console.log('No documents found. Please upload a document first.');
        return;
    }

    const userId = docs[0].user_id;
    const docId = docs[0].id;
    console.log(`Using user: ${userId}, doc: ${docs[0].filename}`);

    try {
        const result = await ragService.query({
            question: "Quais são os pontos mais importantes?",
            documentIds: [docId],
            topK: 5
        }, userId);

        console.log('SUCCESS!');
        console.log('Answer:', result.answer);
        console.log('Sources:', result.sources.length);
    } catch (error: any) {
        console.error('ERROR:', error.message);
        console.error('Stack:', error.stack);
    }
}

testQuery();
