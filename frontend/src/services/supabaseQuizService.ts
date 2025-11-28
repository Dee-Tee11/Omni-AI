import { SupabaseClient } from '@supabase/supabase-js';
import { SavedQuizSet } from './api';

export const supabaseQuizService = {
    async saveQuizSet(client: SupabaseClient, data: {
        classId: string;
        documentId: string;
        name: string;
        questions: Array<{
            question: string;
            options: string[];
            correctAnswer: number;
            explanation?: string;
        }>
    }): Promise<SavedQuizSet> {
        // 1. Create the set
        const { data: set, error: setError } = await client
            .from('quiz_sets')
            .insert([{
                class_id: data.classId,
                document_id: data.documentId,
                name: data.name,
                score: 0
            }])
            .select()
            .single();

        if (setError) throw setError;

        // 2. Create the questions
        const questionsToInsert = data.questions.map(q => ({
            set_id: set.id,
            question: q.question,
            options: q.options, // Supabase handles JSONB automatically
            correct_answer: q.correctAnswer,
            explanation: q.explanation
        }));

        const { data: questions, error: questionsError } = await client
            .from('quiz_questions')
            .insert(questionsToInsert)
            .select();

        if (questionsError) throw questionsError;

        return {
            id: set.id,
            classId: set.class_id,
            documentId: set.document_id,
            name: set.name,
            questions: questions.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                correctAnswer: q.correct_answer,
                explanation: q.explanation
            })),
            createdAt: set.created_at,
            bestScore: set.score
        };
    },

    async getQuizSet(client: SupabaseClient, id: string): Promise<SavedQuizSet> {
        const { data: set, error: setError } = await client
            .from('quiz_sets')
            .select('*')
            .eq('id', id)
            .single();

        if (setError) throw setError;

        const { data: questions, error: questionsError } = await client
            .from('quiz_questions')
            .select('*')
            .eq('set_id', id);

        if (questionsError) throw questionsError;

        return {
            id: set.id,
            classId: set.class_id,
            documentId: set.document_id,
            name: set.name,
            questions: questions.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                correctAnswer: q.correct_answer,
                explanation: q.explanation
            })),
            createdAt: set.created_at,
            bestScore: set.score
        };
    },

    async updateQuizScore(client: SupabaseClient, id: string, score: number): Promise<void> {
        // Only update if higher? Or always update last score?
        // For now, let's assume we update the score.
        // If we want "best score", we might need logic.
        // Let's just update 'score' column.

        const { error } = await client
            .from('quiz_sets')
            .update({ score: score })
            .eq('id', id);

        if (error) throw error;
    },

    async deleteQuizSet(client: SupabaseClient, id: string): Promise<void> {
        const { error } = await client
            .from('quiz_sets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
