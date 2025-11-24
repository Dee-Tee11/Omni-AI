import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Types
export interface Document {
    id: string;
    filename: string;
    uploadDate: string;
    pageCount: number;
    chunkCount: number;
    imageCount: number;
}

export interface QueryResponse {
    answer: string;
    sources: Array<{
        chunkId: string;
        documentId: string;
        pageNumber: number;
        content: string;
        similarity: number;
    }>;
    model: string;
}

export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    documentId: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface FlashcardSet {
    documentId: string;
    documentName: string;
    flashcards: Flashcard[];
    createdAt: string;
}

// API Functions

export const uploadDocument = async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data.document;
};

export const getDocuments = async (): Promise<Document[]> => {
    const response = await api.get('/documents');
    return response.data.documents;
};

export const getDocument = async (id: string): Promise<any> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
};

export const deleteDocument = async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
};

export const askQuestion = async (
    question: string,
    documentIds?: string[],
    topK?: number
): Promise<QueryResponse> => {
    const response = await api.post('/query', {
        question,
        documentIds,
        topK,
    });
    return response.data;
};

export const generateFlashcards = async (
    documentId: string,
    count?: number,
    includeImages?: boolean
): Promise<FlashcardSet> => {
    const response = await api.post('/flashcards/generate', {
        documentId,
        count,
        includeImages,
    });
    return response.data;
};

export const generateSummary = async (
    documentId: string
): Promise<{ summary: string }> => {
    const response = await api.post('/summaries/generate', {
        documentId,
    });
    return response.data;
};

export const reviewFlashcard = async (
    flashcardId: string,
    difficulty: 'easy' | 'medium' | 'hard'
): Promise<void> => {
    await api.post(`/flashcards/${flashcardId}/review`, {
        difficulty,
    });
};

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuizSet {
    documentId: string;
    documentName: string;
    questions: QuizQuestion[];
    createdAt: string;
}

export const generateQuiz = async (
    documentId: string,
    count?: number,
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
): Promise<QuizSet> => {
    const response = await api.post('/quiz/generate', {
        documentId,
        count,
        difficulty,
    });
    return response.data;
};

export const getStats = async (): Promise<any> => {
    const response = await api.get('/stats');
    return response.data;
};

// ===== CLASS/SUBJECT MANAGEMENT =====

export interface Class {
    id: string;
    name: string;
    description?: string;
    color?: string;
    createdAt: string;
    updatedAt: string;
    documentIds: string[];
    flashcardSetIds: string[];
    quizSetIds: string[];
}

export interface SavedFlashcardSet {
    id: string;
    classId: string;
    documentId: string;
    name: string;
    flashcards: Array<{
        id: string;
        front: string;
        back: string;
        imageUrl?: string;
    }>;
    createdAt: string;
    lastReviewed?: string;
}

export interface SavedQuizSet {
    id: string;
    classId: string;
    documentId: string;
    name: string;
    questions: Array<{
        id: string;
        question: string;
        options: string[];
        correctAnswer: number;
        explanation?: string;
    }>;
    createdAt: string;
    lastAttempted?: string;
    bestScore?: number;
}

export interface ClassWithContent extends Class {
    flashcardSets: SavedFlashcardSet[];
    quizSets: SavedQuizSet[];
}

// Class CRUD
export const createClass = async (data: { name: string; description?: string; color?: string }): Promise<Class> => {
    const response = await api.post('/classes', data);
    return response.data;
};

export const getAllClasses = async (): Promise<Class[]> => {
    const response = await api.get('/classes');
    return response.data.classes;
};

export const getClass = async (id: string): Promise<ClassWithContent> => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
};

export const updateClass = async (id: string, data: { name?: string; description?: string; color?: string }): Promise<Class> => {
    const response = await api.put(`/classes/${id}`, data);
    return response.data;
};

export const deleteClass = async (id: string): Promise<void> => {
    await api.delete(`/classes/${id}`);
};

export const addDocumentToClass = async (classId: string, documentId: string): Promise<Class> => {
    const response = await api.post(`/classes/${classId}/documents`, { documentId });
    return response.data;
};

export const removeDocumentFromClass = async (classId: string, documentId: string): Promise<Class> => {
    const response = await api.delete(`/classes/${classId}/documents/${documentId}`);
    return response.data;
};

// Flashcard Sets
export const saveFlashcardSet = async (data: {
    classId: string;
    documentId: string;
    name: string;
    flashcards: SavedFlashcardSet['flashcards'];
}): Promise<SavedFlashcardSet> => {
    const response = await api.post('/flashcard-sets', data);
    return response.data;
};

export const getFlashcardSet = async (id: string): Promise<SavedFlashcardSet> => {
    const response = await api.get(`/flashcard-sets/${id}`);
    return response.data;
};

export const deleteFlashcardSet = async (id: string): Promise<void> => {
    await api.delete(`/flashcard-sets/${id}`);
};

// Quiz Sets
export const saveQuizSet = async (data: {
    classId: string;
    documentId: string;
    name: string;
    questions: SavedQuizSet['questions'];
}): Promise<SavedQuizSet> => {
    const response = await api.post('/quiz-sets', data);
    return response.data;
};

export const getQuizSet = async (id: string): Promise<SavedQuizSet> => {
    const response = await api.get(`/quiz-sets/${id}`);
    return response.data;
};

export const updateQuizScore = async (id: string, score: number): Promise<SavedQuizSet> => {
    const response = await api.post(`/quiz-sets/${id}/score`, { score });
    return response.data;
};

export const deleteQuizSet = async (id: string): Promise<void> => {
    await api.delete(`/quiz-sets/${id}`);
};

export default api;
