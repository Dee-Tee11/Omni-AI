// Helper functions for bidirectional class integration
import { getAllClasses, saveFlashcardSet, saveQuizSet, type FlashcardSet, type QuizSet } from './api';

/**
 * Automatically saves flashcards to the appropriate class if the document belongs to one
 */
export async function autoSaveFlashcardsToClass(
    documentId: string,
    flashcardSet: FlashcardSet
): Promise<void> {
    try {
        const classes = await getAllClasses();

        // Find class that contains this document
        const matchingClass = classes.find(cls => cls.documentIds.includes(documentId));

        if (matchingClass) {
            // Save flashcards to the class
            await saveFlashcardSet({
                classId: matchingClass.id,
                documentId: documentId,
                name: `Flashcards - ${flashcardSet.documentName}`,
                flashcards: flashcardSet.flashcards.map(f => ({
                    id: f.id,
                    front: f.question,
                    back: f.answer,
                }))
            });

            console.log(`Flashcards automatically saved to class: ${matchingClass.name}`);
        }
    } catch (error) {
        console.error('Error auto-saving flashcards to class:', error);
        // Don't throw - this is a background operation
    }
}

/**
 * Automatically saves quiz to the appropriate class if the document belongs to one
 */
export async function autoSaveQuizToClass(
    documentId: string,
    quizSet: any // QuizSet type
): Promise<void> {
    try {
        const classes = await getAllClasses();

        // Find class that contains this document
        const matchingClass = classes.find(cls => cls.documentIds.includes(documentId));

        if (matchingClass) {
            // Save quiz to the class
            await saveQuizSet({
                classId: matchingClass.id,
                documentId: documentId,
                name: `Quiz - ${quizSet.documentName}`,
                questions: quizSet.questions.map((q: any) => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctIndex,
                    explanation: q.explanation,
                }))
            });

            console.log(`Quiz automatically saved to class: ${matchingClass.name}`);
        }
    } catch (error) {
        console.error('Error auto-saving quiz to class:', error);
        // Don't throw - this is a background operation
    }
}

/**
 * Get all saved flashcard sets from all classes
 */
export async function getAllSavedFlashcardSets() {
    try {
        const classes = await getAllClasses();
        const allSets: any[] = [];

        for (const cls of classes) {
            // Note: We need to fetch full class data to get flashcard sets
            // This is a simplified version - you might want to optimize this
            const response = await fetch(`/api/classes/${cls.id}`);
            const classData = await response.json();

            if (classData.flashcardSets) {
                allSets.push(...classData.flashcardSets.map((set: any) => ({
                    ...set,
                    className: cls.name,
                    classColor: cls.color,
                })));
            }
        }

        return allSets;
    } catch (error) {
        console.error('Error getting all flashcard sets:', error);
        return [];
    }
}

/**
 * Get all saved quiz sets from all classes
 */
export async function getAllSavedQuizSets() {
    try {
        const classes = await getAllClasses();
        const allSets: any[] = [];

        for (const cls of classes) {
            const response = await fetch(`/api/classes/${cls.id}`);
            const classData = await response.json();

            if (classData.quizSets) {
                allSets.push(...classData.quizSets.map((set: any) => ({
                    ...set,
                    className: cls.name,
                    classColor: cls.color,
                })));
            }
        }

        return allSets;
    } catch (error) {
        console.error('Error getting all quiz sets:', error);
        return [];
    }
}
