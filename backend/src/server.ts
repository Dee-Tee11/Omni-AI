import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { env } from './config.js';
import { pdfService } from './services/pdfService.js';
import { vectorService } from './services/vectorService.js';
import { ragService } from './services/ragService.js';
import { flashcardService } from './services/flashcardService.js';
import { quizService } from './services/quizService.js';
import { classService } from './services/classService.js';

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

// Generate quiz
app.post('/api/quiz/generate', async (req, res) => {
    try {
        const { documentId, count, difficulty } = req.body;

        if (!documentId) {
            return res.status(400).json({ error: 'Document ID is required' });
        }

        console.log(`Generating quiz for document: ${documentId}`);

        const quizSet = await quizService.generateQuiz({
            documentId,
            count,
            difficulty,
        });

        res.json(quizSet);
    } catch (error: any) {
        console.error('Quiz generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate summary
app.post('/api/summaries/generate', async (req, res) => {
    try {
        const { documentId } = req.body;

        if (!documentId) {
            return res.status(400).json({ error: 'Document ID is required' });
        }

        console.log(`Generating summary for document: ${documentId}`);

        // Generate summary using RAG service with a comprehensive prompt
        const summaryPrompt = `Crie um resumo completo e detalhado deste documento.

Organize o resumo da seguinte forma:
- Use "# Resumo" como título principal
- Crie seções com "## " para tópicos principais
- Use "### " para subtópicos
- Use listas com "- " para pontos importantes
- Use listas numeradas "1. " para sequências
- Separe parágrafos com linhas em branco
- Destaque conceitos-chave e informações importantes
- Mantenha estrutura clara e hierárquica

Seja abrangente e inclua todos os pontos principais do documento.`;

        const result = await ragService.query({
            question: summaryPrompt,
            documentIds: [documentId],
            topK: 20 // Get more chunks for comprehensive summary
        });

        res.json({ summary: result.answer });
    } catch (error: any) {
        console.error('Summary generation error:', error);
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

// ===== CLASS/SUBJECT MANAGEMENT ENDPOINTS =====

// Create a new class
app.post('/api/classes', async (req, res) => {
    try {
        const { name, description, color } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Class name is required' });
        }
        const newClass = await classService.createClass({ name, description, color });
        res.json(newClass);
    } catch (error: any) {
        console.error('Create class error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all classes
app.get('/api/classes', async (req, res) => {
    try {
        const classes = await classService.getAllClasses();
        res.json({ classes });
    } catch (error: any) {
        console.error('Get classes error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single class with all content
app.get('/api/classes/:id', async (req, res) => {
    try {
        const classData = await classService.getClassWithContent(req.params.id);
        if (!classData) {
            return res.status(404).json({ error: 'Class not found' });
        }
        res.json(classData);
    } catch (error: any) {
        console.error('Get class error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update class
app.put('/api/classes/:id', async (req, res) => {
    try {
        const { name, description, color } = req.body;
        const updated = await classService.updateClass(req.params.id, { name, description, color });
        if (!updated) {
            return res.status(404).json({ error: 'Class not found' });
        }
        res.json(updated);
    } catch (error: any) {
        console.error('Update class error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete class
app.delete('/api/classes/:id', async (req, res) => {
    try {
        const success = await classService.deleteClass(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Class not found' });
        }
        res.json({ success: true });
    } catch (error: any) {
        console.error('Delete class error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add document to class
app.post('/api/classes/:id/documents', async (req, res) => {
    try {
        const { documentId } = req.body;
        if (!documentId) {
            return res.status(400).json({ error: 'Document ID is required' });
        }
        const updated = await classService.addDocumentToClass(req.params.id, documentId);
        if (!updated) {
            return res.status(404).json({ error: 'Class not found' });
        }
        res.json(updated);
    } catch (error: any) {
        console.error('Add document to class error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove document from class
app.delete('/api/classes/:id/documents/:documentId', async (req, res) => {
    try {
        const updated = await classService.removeDocumentFromClass(req.params.id, req.params.documentId);
        if (!updated) {
            return res.status(404).json({ error: 'Class not found' });
        }
        res.json(updated);
    } catch (error: any) {
        console.error('Remove document from class error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save flashcard set
app.post('/api/flashcard-sets', async (req, res) => {
    try {
        const { classId, documentId, name, flashcards } = req.body;
        if (!classId || !documentId || !name || !flashcards) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const saved = await classService.saveFlashcardSet({ classId, documentId, name, flashcards });
        res.json(saved);
    } catch (error: any) {
        console.error('Save flashcard set error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get flashcard set
app.get('/api/flashcard-sets/:id', async (req, res) => {
    try {
        const set = await classService.getFlashcardSet(req.params.id);
        if (!set) {
            return res.status(404).json({ error: 'Flashcard set not found' });
        }
        res.json(set);
    } catch (error: any) {
        console.error('Get flashcard set error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete flashcard set
app.delete('/api/flashcard-sets/:id', async (req, res) => {
    try {
        const success = await classService.deleteFlashcardSet(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Flashcard set not found' });
        }
        res.json({ success: true });
    } catch (error: any) {
        console.error('Delete flashcard set error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save quiz set
app.post('/api/quiz-sets', async (req, res) => {
    try {
        const { classId, documentId, name, questions } = req.body;
        if (!classId || !documentId || !name || !questions) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const saved = await classService.saveQuizSet({ classId, documentId, name, questions });
        res.json(saved);
    } catch (error: any) {
        console.error('Save quiz set error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get quiz set
app.get('/api/quiz-sets/:id', async (req, res) => {
    try {
        const set = await classService.getQuizSet(req.params.id);
        if (!set) {
            return res.status(404).json({ error: 'Quiz set not found' });
        }
        res.json(set);
    } catch (error: any) {
        console.error('Get quiz set error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update quiz score
app.post('/api/quiz-sets/:id/score', async (req, res) => {
    try {
        const { score } = req.body;
        if (typeof score !== 'number') {
            return res.status(400).json({ error: 'Score is required' });
        }
        const updated = await classService.updateQuizScore(req.params.id, score);
        if (!updated) {
            return res.status(404).json({ error: 'Quiz set not found' });
        }
        res.json(updated);
    } catch (error: any) {
        console.error('Update quiz score error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete quiz set
app.delete('/api/quiz-sets/:id', async (req, res) => {
    try {
        const success = await classService.deleteQuizSet(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Quiz set not found' });
        }
        res.json({ success: true });
    } catch (error: any) {
        console.error('Delete quiz set error:', error);
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

        // Restore vector store from saved documents
        console.log('Restoring vector store from saved documents...');
        const documents = await pdfService.getAllDocuments();
        let restoredCount = 0;

        for (const doc of documents) {
            try {
                const docData = await pdfService.getDocument(doc.id);
                if (docData && docData.chunks) {
                    console.log(`Restoring document: ${doc.filename} (${docData.chunks.length} chunks)`);
                    await vectorService.addChunks(docData.chunks);
                    restoredCount++;
                }
            } catch (err) {
                console.error(`Failed to restore document ${doc.id}:`, err);
            }
        }
        console.log(`✓ Restored ${restoredCount} documents to vector store`);

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
  - POST   /api/quiz/generate       Generate quiz
  - GET    /api/stats               Get statistics
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
