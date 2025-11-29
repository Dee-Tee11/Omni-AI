export interface Document {
    id: string;
    userId?: string; // Added for multi-tenancy
    filename: string;
    uploadDate: Date;
    pageCount: number;
    textContent: string;
    chunkCount: number;
    imageCount: number;
}

export interface ImageMetadata {
    id: string;
    documentId: string;
    pageNumber: number;
    index: number;
    width: number;
    height: number;
    path: string;
}

export interface TextChunk {
    id: string;
    documentId: string;
    content: string;
    pageNumber: number;
    chunkIndex: number;
    startPosition: number;
    endPosition: number;
    relatedImages?: string[]; // Array of image IDs
}

export interface Embedding {
    chunkId: string;
    vector: number[];
    metadata: {
        documentId: string;
        pageNumber: number;
        content: string;
    };
}

export interface QueryRequest {
    question: string;
    documentIds?: string[]; // Optional: filter by specific documents
    topK?: number; // Number of chunks to retrieve (default: 5)
}

export interface QueryResponse {
    answer: string;
    sources: Array<{
        chunkId: string;
        documentId: string;
        pageNumber: number;
        content: string;
        similarity: number;
        relatedImages?: string[];
    }>;
    model: string;
}

export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    documentId: string;
    pageNumber?: number;
    imageUrl?: string; // Optional image from PDF
    difficulty?: 'easy' | 'medium' | 'hard';
    lastReviewed?: Date;
    nextReview?: Date;
}

export interface FlashcardSet {
    documentId: string;
    documentName: string;
    flashcards: Flashcard[];
    createdAt: Date;
}

export interface GenerateFlashcardsRequest {
    documentId: string;
    count?: number; // Number of flashcards to generate (default: 10)
    includeImages?: boolean; // Whether to include images in flashcards
}

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
    createdAt: Date;
}

export interface GenerateQuizRequest {
    documentId: string;
    count?: number; // Number of questions to generate (default: 10)
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}
