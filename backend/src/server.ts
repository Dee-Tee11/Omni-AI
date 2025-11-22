import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { env } from './config.js';
import { pdfService } from './services/pdfService.js';
import { vectorService } from './services/vectorService.js';
import { ragService } from './services/ragService.js';
import { flashcardService } from './services/flashcardService.js';

const app = express();
const PORT = env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Upload PDF endpoint
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`Processing upload: ${req.file.originalname}`);

        // Process PDF
        const document = await pdfService.processUpload(req.file);

        // Get chunks and add to vector database
        const docData = await pdfService.getDocument(document.id);
        if (docData) {
            await vectorService.addChunks(docData.chunks);
        }

        res.json({
            success: true,
            document,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all documents
app.get('/api/documents', async (req, res) => {
    try {
        const documents = await pdfService.getAllDocuments();
        res.json({ documents });
    } catch (error: any) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single document
app.get('/api/documents/:id', async (req, res) => {
    try {
        const docData = await pdfService.getDocument(req.params.id);
        if (!docData) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(docData);
    } catch (error: any) {
        console.error('Get document error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete document
app.delete('/api/documents/:id', async (req, res) => {
    try {
        const documentId = req.params.id;

        // Delete from vector database
        await vectorService.deleteDocumentChunks(documentId);

        // Delete document files
        const success = await pdfService.deleteDocument(documentId);

        if (!success) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: error.message });
    }
});

// RAG Query endpoint
app.post('/api/query', async (req, res) => {
    try {
        const { question, documentIds, topK } = req.body;

        if (!question || typeof question !== 'string') {
            return res.status(400).json({ error: 'Question is required' });
        }

        console.log(`Processing query: "${question.slice(0, 100)}..."`);

        const response = await ragService.query({
            question,
            documentIds,
            topK,
        });

        res.json(response);
    } catch (error: any) {
        console.error('Query error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate flashcards
app.post('/api/flashcards/generate', async (req, res) => {
    try {
        const { documentId, count, includeImages } = req.body;

        if (!documentId) {
            return res.status(400).json({ error: 'Document ID is required' });
        }

        console.log(`Generating flashcards for document: ${documentId}`);

        const flashcardSet = await flashcardService.generateFlashcards({
            documentId,
            count,
            includeImages,
        });

        res.json(flashcardSet);
    } catch (error: any) {
        console.error('Flashcard generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update flashcard review
app.post('/api/flashcards/:id/review', async (req, res) => {
    try {
        const { difficulty } = req.body;

        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }

        await flashcardService.updateFlashcardReview(req.params.id, difficulty);

        res.json({ success: true });
    } catch (error: any) {
        console.error('Update review error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Vector database stats
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await vectorService.getCollectionStats();
        const documents = await pdfService.getAllDocuments();

        res.json({
            totalDocuments: documents.length,
            totalChunks: stats.count,
            documents: documents.map(d => ({
                id: d.id,
                filename: d.filename,
                pageCount: d.pageCount,
                chunkCount: d.chunkCount,
                imageCount: d.imageCount,
            })),
        });
    } catch (error: any) {
        console.error('Stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Initialize vector service and start server
async function startServer() {
    try {
        console.log('Initializing vector service...');
        await vectorService.initialize();

        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════╗
║   Omni-AI Backend Server Running      ║
║   Port: ${PORT}                           ║
║   Environment: ${env.NODE_ENV}              ║
╚════════════════════════════════════════╝

API Endpoints:
  - POST   /api/upload              Upload PDF
  - GET    /api/documents           List documents
  - GET    /api/documents/:id       Get document
  - DELETE /api/documents/:id       Delete document
  - POST   /api/query               Ask question (RAG)
  - POST   /api/flashcards/generate Generate flashcards
  - GET    /api/stats               Get statistics
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
