import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseClassService } from './supabaseClassService';
import { supabaseFlashcardService } from './supabaseFlashcardService';
import { supabaseQuizService } from './supabaseQuizService';
import { type FlashcardSet } from './api';

/**
 * Automatically saves flashcards to the appropriate class if the document belongs to one
 */
export async function autoSaveFlashcardsToClass(
    client: SupabaseClient,
    documentId: string,
    flashcardSet: FlashcardSet
): Promise<void> {
    try {
        const classes = await supabaseClassService.getAllClasses(client);

        // Find class that contains this document
        const matchingClass = classes.find(cls => cls.documentIds.includes(documentId));

        if (matchingClass) {
            // Save flashcards to the class
            await supabaseFlashcardService.saveFlashcardSet(client, {
                classId: matchingClass.id,
                documentId: documentId,
                name: `Flashcards - ${flashcardSet.documentName}`,
                flashcards: flashcardSet.flashcards.map(f => ({
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
    client: SupabaseClient,
    documentId: string,
    quizSet: any // QuizSet type
): Promise<void> {
    try {
        const classes = await supabaseClassService.getAllClasses(client);

        // Find class that contains this document
        const matchingClass = classes.find(cls => cls.documentIds.includes(documentId));

        if (matchingClass) {
            // Save quiz to the class
            await supabaseQuizService.saveQuizSet(client, {
                classId: matchingClass.id,
                documentId: documentId,
                name: `Quiz - ${quizSet.documentName}`,
                questions: quizSet.questions.map((q: any) => ({
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

