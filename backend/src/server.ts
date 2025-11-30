import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import { env } from './config.js';
import { pdfService } from './services/pdfService.js';
import { vectorService } from './services/vectorService.js';
import { ragService } from './services/ragService.js';
import { flashcardService } from './services/flashcardService.js';
import { quizService } from './services/quizService.js';
import { requireAuth } from './middleware/auth.js';
import { supabase } from './lib/supabase.js';

// Extend Express Request type to include Clerk auth
declare global {
    namespace Express {
        interface Request {
            auth: {
                userId: string;
                sessionId: string;
            };
        }
    }
}

dotenv.config();

const app = express();

// Security Headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://clerk.clerk.com", "https://*.clerk.accounts.dev"],
            connectSrc: ["'self'", "https://*.clerk.accounts.dev", "https://*.supabase.co"],
            imgSrc: ["'self'", "data:", "https://img.clerk.com"],
            workerSrc: ["'self'", "blob:"],
        },
    },
}));

const PORT = env.PORT;

app.use(cors());
app.use(express.json());
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
app.post('/api/upload', requireAuth, upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.auth.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log(`Processing upload: ${req.file.originalname}`);

        // Process PDF (now handles vectorService.addChunks internally)
        const document = await pdfService.processUpload(req.file, userId);

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
app.get('/api/documents', requireAuth, async (req, res) => {
    try {
        const userId = req.auth.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Query documents from Supabase
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (error) throw error;

        const documents = (data || []).map(doc => ({
            ...doc,
            uploadDate: doc.created_at || new Date().toISOString()
        }));

        res.json({ documents });
    } catch (error: any) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single document
app.get('/api/documents/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.auth.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json({
            ...data,
            uploadDate: data.created_at || new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Get document error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete document
app.delete('/api/documents/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.auth.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const documentId = req.params.id;

        // Delete from vector database
        await vectorService.deleteDocumentChunks(documentId, userId);

        // Delete document files
        const success = await pdfService.deleteDocument(documentId);

        // Delete from Supabase documents table (cascades to document_chunks)
        await supabase
            .from('documents')
            .delete()
            .eq('id', documentId)
            .eq('user_id', userId);

        res.json({ success: true });
    } catch (error: any) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: error.message });
    }
});

// RAG Query endpoint
app.post('/api/query', requireAuth, async (req, res) => {
    try {
        const userId = req.auth.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { question, documentIds, topK } = req.body;

        if (!question || typeof question !== 'string') {
            return res.status(400).json({ error: 'Question is required' });
        }

        console.log(`Processing query: "${question.slice(0, 100)}..."`);

        const response = await ragService.query({
            question,
            documentIds,
            topK,
        }, userId);

        res.json(response);
    } catch (error: any) {
        console.error('Query error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate flashcards
app.post('/api/flashcards/generate', requireAuth, async (req, res) => {
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
app.post('/api/quiz/generate', requireAuth, async (req, res) => {
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
app.post('/api/summaries/generate', requireAuth, async (req, res) => {
    try {
        const { documentId } = req.body;

        const userId = req.auth.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

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
        }, userId);

        res.json({ summary: result.answer });
    } catch (error: any) {
        console.error('Summary generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update flashcard review
app.post('/api/flashcards/:id/review', requireAuth, async (req, res) => {
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
app.get('/api/stats', requireAuth, async (req, res) => {
    try {
        const userId = req.auth.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get documents from Supabase
        const { data: documents } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', userId);

        // Get chunk count
        const { count: chunkCount } = await supabase
            .from('document_chunks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        res.json({
            totalDocuments: documents?.length || 0,
            totalChunks: chunkCount || 0,
            documents: documents || [],
        });
    } catch (error: any) {
        console.error('Stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== CLASS/SUBJECT MANAGEMENT ENDPOINTS =====
// Removed as we migrated to Supabase direct access from frontend
// The backend now focuses on RAG and AI generation services


// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
async function startServer() {
    try {
        console.log('Starting Omni-AI Backend...');
        console.log('✓ Supabase connection configured');
        console.log('✓ Vector service ready (using Supabase pgvector)');

        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════╗
║   Omni-AI Backend Server Running      ║
║   Port: ${PORT}                           ║
║   Environment: ${env.NODE_ENV}              ║
║   Vector DB: Supabase (pgvector)       ║
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
