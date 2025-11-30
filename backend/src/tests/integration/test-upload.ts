import { pdfService } from './services/pdfService.js';
import { supabase } from './lib/supabase.js';
import { PDFDocument } from 'pdf-lib';
import { env } from './config.js';

async function testUpload() {
    console.log('Testing Upload...');

    // 1. Create a dummy PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText('This is a test document for RAG debugging.');
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const dummyFile = {
        fieldname: 'pdf',
        originalname: 'test-debug.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: buffer,
        size: buffer.length,
        destination: '',
        filename: '',
        path: '',
        stream: null as any
    };

    const userId = 'test-user-' + Date.now();
    console.log(`Uploading as User: ${userId}`);

    try {
        // 2. Upload
        const doc = await pdfService.processUpload(dummyFile, userId);
        console.log('Upload successful!');
        console.log('Document ID:', doc.id);

        // 3. Verify in DB
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', doc.id)
            .single();

        if (error) {
            console.error('Error fetching document from DB:', error);
        } else {
            console.log('Document found in DB:', data.id);
        }

        // 4. Verify chunks
        const { count } = await supabase
            .from('document_chunks')
            .select('*', { count: 'exact', head: true })
            .eq('document_id', doc.id); // Note: column name might be document_id or metadata->>documentId depending on schema
        // vectorService inserts with metadata: { documentId: ... } AND document_id column?
        // Let's check vectorService again. It inserts:
        // { user_id, content, embedding, metadata: { documentId... } }
        // Wait, does it insert `document_id` column?
        // vectorService.ts line 40: .insert(documentsToInsert)
        // documentsToInsert has: user_id, content, embedding, metadata.
        // It DOES NOT have document_id as a top-level column in the insert object!

        console.log('Chunks found in DB:', count);

    } catch (error: any) {
        console.error('Upload failed:', error);
    }
}

testUpload();
