import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const FLASHCARD_SETS_FILE = path.join(DATA_DIR, 'flashcard-sets.json');
const QUIZ_SETS_FILE = path.join(DATA_DIR, 'quiz-sets.json');

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

class ClassService {
    private async ensureDataDir() {
        try {
            await fs.access(DATA_DIR);
        } catch {
            await fs.mkdir(DATA_DIR, { recursive: true });
        }
    }

    private async readClasses(): Promise<Class[]> {
        try {
            const data = await fs.readFile(CLASSES_FILE, 'utf-8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    private async writeClasses(classes: Class[]): Promise<void> {
        await this.ensureDataDir();
        await fs.writeFile(CLASSES_FILE, JSON.stringify(classes, null, 2));
    }

    private async readFlashcardSets(): Promise<SavedFlashcardSet[]> {
        try {
            const data = await fs.readFile(FLASHCARD_SETS_FILE, 'utf-8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    private async writeFlashcardSets(sets: SavedFlashcardSet[]): Promise<void> {
        await this.ensureDataDir();
        await fs.writeFile(FLASHCARD_SETS_FILE, JSON.stringify(sets, null, 2));
    }

    private async readQuizSets(): Promise<SavedQuizSet[]> {
        try {
            const data = await fs.readFile(QUIZ_SETS_FILE, 'utf-8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    private async writeQuizSets(sets: SavedQuizSet[]): Promise<void> {
        await this.ensureDataDir();
        await fs.writeFile(QUIZ_SETS_FILE, JSON.stringify(sets, null, 2));
    }

    // ===== CLASS MANAGEMENT =====

    async createClass(data: { name: string; description?: string; color?: string }): Promise<Class> {
        const classes = await this.readClasses();
        const newClass: Class = {
            id: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: data.name,
            description: data.description,
            color: data.color || '#10b981',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            documentIds: [],
            flashcardSetIds: [],
            quizSetIds: [],
        };
        classes.push(newClass);
        await this.writeClasses(classes);
        return newClass;
    }

    async getAllClasses(): Promise<Class[]> {
        return await this.readClasses();
    }

    async getClass(id: string): Promise<Class | null> {
        const classes = await this.readClasses();
        return classes.find(c => c.id === id) || null;
    }

    async updateClass(id: string, updates: Partial<Pick<Class, 'name' | 'description' | 'color'>>): Promise<Class | null> {
        const classes = await this.readClasses();
        const index = classes.findIndex(c => c.id === id);
        if (index === -1) return null;

        classes[index] = {
            ...classes[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        await this.writeClasses(classes);
        return classes[index];
    }

    async deleteClass(id: string): Promise<boolean> {
        const classes = await this.readClasses();
        const filtered = classes.filter(c => c.id !== id);
        if (filtered.length === classes.length) return false;
        await this.writeClasses(filtered);
        return true;
    }

    async addDocumentToClass(classId: string, documentId: string): Promise<Class | null> {
        const classes = await this.readClasses();
        const index = classes.findIndex(c => c.id === classId);
        if (index === -1) return null;

        if (!classes[index].documentIds.includes(documentId)) {
            classes[index].documentIds.push(documentId);
            classes[index].updatedAt = new Date().toISOString();
            await this.writeClasses(classes);
        }
        return classes[index];
    }

    async removeDocumentFromClass(classId: string, documentId: string): Promise<Class | null> {
        const classes = await this.readClasses();
        const index = classes.findIndex(c => c.id === classId);
        if (index === -1) return null;

        classes[index].documentIds = classes[index].documentIds.filter(id => id !== documentId);
        classes[index].updatedAt = new Date().toISOString();
        await this.writeClasses(classes);
        return classes[index];
    }

    // ===== FLASHCARD SET MANAGEMENT =====

    async saveFlashcardSet(data: {
        classId: string;
        documentId: string;
        name: string;
        flashcards: SavedFlashcardSet['flashcards'];
    }): Promise<SavedFlashcardSet> {
        const sets = await this.readFlashcardSets();
        const classes = await this.readClasses();

        const newSet: SavedFlashcardSet = {
            id: `flashcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            classId: data.classId,
            documentId: data.documentId,
            name: data.name,
            flashcards: data.flashcards,
            createdAt: new Date().toISOString(),
        };

        sets.push(newSet);
        await this.writeFlashcardSets(sets);

        // Add to class
        const classIndex = classes.findIndex(c => c.id === data.classId);
        if (classIndex !== -1) {
            classes[classIndex].flashcardSetIds.push(newSet.id);
            classes[classIndex].updatedAt = new Date().toISOString();
            await this.writeClasses(classes);
        }

        return newSet;
    }

    async getFlashcardSet(id: string): Promise<SavedFlashcardSet | null> {
        const sets = await this.readFlashcardSets();
        return sets.find(s => s.id === id) || null;
    }

    async getFlashcardSetsByClass(classId: string): Promise<SavedFlashcardSet[]> {
        const sets = await this.readFlashcardSets();
        return sets.filter(s => s.classId === classId);
    }

    async deleteFlashcardSet(id: string): Promise<boolean> {
        const sets = await this.readFlashcardSets();
        const filtered = sets.filter(s => s.id !== id);
        if (filtered.length === sets.length) return false;
        await this.writeFlashcardSets(filtered);

        // Remove from class
        const classes = await this.readClasses();
        for (const cls of classes) {
            const index = cls.flashcardSetIds.indexOf(id);
            if (index !== -1) {
                cls.flashcardSetIds.splice(index, 1);
                cls.updatedAt = new Date().toISOString();
            }
        }
        await this.writeClasses(classes);

        return true;
    }

    // ===== QUIZ SET MANAGEMENT =====

    async saveQuizSet(data: {
        classId: string;
        documentId: string;
        name: string;
        questions: SavedQuizSet['questions'];
    }): Promise<SavedQuizSet> {
        const sets = await this.readQuizSets();
        const classes = await this.readClasses();

        const newSet: SavedQuizSet = {
            id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            classId: data.classId,
            documentId: data.documentId,
            name: data.name,
            questions: data.questions,
            createdAt: new Date().toISOString(),
        };

        sets.push(newSet);
        await this.writeQuizSets(sets);

        // Add to class
        const classIndex = classes.findIndex(c => c.id === data.classId);
        if (classIndex !== -1) {
            classes[classIndex].quizSetIds.push(newSet.id);
            classes[classIndex].updatedAt = new Date().toISOString();
            await this.writeClasses(classes);
        }

        return newSet;
    }

    async getQuizSet(id: string): Promise<SavedQuizSet | null> {
        const sets = await this.readQuizSets();
        return sets.find(s => s.id === id) || null;
    }

    async getQuizSetsByClass(classId: string): Promise<SavedQuizSet[]> {
        const sets = await this.readQuizSets();
        return sets.filter(s => s.classId === classId);
    }

    async updateQuizScore(id: string, score: number): Promise<SavedQuizSet | null> {
        const sets = await this.readQuizSets();
        const index = sets.findIndex(s => s.id === id);
        if (index === -1) return null;

        sets[index].lastAttempted = new Date().toISOString();
        if (!sets[index].bestScore || score > sets[index].bestScore!) {
            sets[index].bestScore = score;
        }
        await this.writeQuizSets(sets);
        return sets[index];
    }

    async deleteQuizSet(id: string): Promise<boolean> {
        const sets = await this.readQuizSets();
        const filtered = sets.filter(s => s.id !== id);
        if (filtered.length === sets.length) return false;
        await this.writeQuizSets(filtered);

        // Remove from class
        const classes = await this.readClasses();
        for (const cls of classes) {
            const index = cls.quizSetIds.indexOf(id);
            if (index !== -1) {
                cls.quizSetIds.splice(index, 1);
                cls.updatedAt = new Date().toISOString();
            }
        }
        await this.writeClasses(classes);

        return true;
    }

    // ===== GET CLASS WITH ALL CONTENT =====

    async getClassWithContent(classId: string) {
        const classData = await this.getClass(classId);
        if (!classData) return null;

        const flashcardSets = await this.getFlashcardSetsByClass(classId);
        const quizSets = await this.getQuizSetsByClass(classId);

        return {
            ...classData,
            flashcardSets,
            quizSets,
        };
    }
}

export const classService = new ClassService();
