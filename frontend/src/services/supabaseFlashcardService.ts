import { SupabaseClient } from '@supabase/supabase-js';
import { SavedFlashcardSet } from './api';

export const supabaseFlashcardService = {
    async saveFlashcardSet(client: SupabaseClient, data: {
        classId: string;
        documentId: string;
        name: string;
        flashcards: Array<{ front: string; back: string }>
    }): Promise<SavedFlashcardSet> {
        // 1. Create the set
        const { data: set, error: setError } = await client
            .from('flashcard_sets')
            .insert([{
                class_id: data.classId,
                document_id: data.documentId,
                name: data.name,
                user_id: (await client.auth.getUser()).data.user?.id // RLS handles this usually, but good to be explicit if needed, though RLS relies on auth.uid()
            }])
            .select()
            .single();

        if (setError) throw setError;

        // 2. Create the cards
        const cardsToInsert = data.flashcards.map(card => ({
            set_id: set.id,
            front: card.front,
            back: card.back,
            status: 'new'
        }));

        const { data: cards, error: cardsError } = await client
            .from('flashcards')
            .insert(cardsToInsert)
            .select();

        if (cardsError) throw cardsError;

        return {
            id: set.id,
            classId: set.class_id,
            documentId: set.document_id,
            name: set.name,
            flashcards: cards.map(c => ({
                id: c.id,
                front: c.front,
                back: c.back,
                // status: c.status // Add to type if needed later
            })),
            createdAt: set.created_at
        };
    },

    async getFlashcardSet(client: SupabaseClient, id: string): Promise<SavedFlashcardSet> {
        const { data: set, error: setError } = await client
            .from('flashcard_sets')
            .select('*')
            .eq('id', id)
            .single();

        if (setError) throw setError;

        const { data: cards, error: cardsError } = await client
            .from('flashcards')
            .select('*')
            .eq('set_id', id);

        if (cardsError) throw cardsError;

        return {
            id: set.id,
            classId: set.class_id,
            documentId: set.document_id,
            name: set.name,
            flashcards: cards.map(c => ({
                id: c.id,
                front: c.front,
                back: c.back
            })),
            createdAt: set.created_at
        };
    },

    async deleteFlashcardSet(client: SupabaseClient, id: string): Promise<void> {
        const { error } = await client
            .from('flashcard_sets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
