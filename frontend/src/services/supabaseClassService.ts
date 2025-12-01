import { SupabaseClient } from '@supabase/supabase-js';
import { Class, ClassWithContent } from './api';

export const supabaseClassService = {
    async getAllClasses(client: SupabaseClient): Promise<Class[]> {
        const { data, error } = await client
            .from('classes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            color: c.color,
            createdAt: c.created_at,
            updatedAt: c.created_at, // Supabase doesn't always have updated_at by default unless configured
            documentIds: [], // We'll need to fetch these if needed, or join
            flashcardSetIds: [],
            quizSetIds: []
        }));
    },

    async createClass(client: SupabaseClient, data: { name: string; description?: string; color?: string }, userId: string): Promise<Class> {
        const { data: newClass, error } = await client
            .from('classes')
            .insert([{
                name: data.name,
                description: data.description,
                color: data.color,
                user_id: userId
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            id: newClass.id,
            name: newClass.name,
            description: newClass.description,
            color: newClass.color,
            createdAt: newClass.created_at,
            updatedAt: newClass.created_at,
            documentIds: [],
            flashcardSetIds: [],
            quizSetIds: []
        };
    },

    async updateClass(client: SupabaseClient, id: string, data: { name?: string; description?: string; color?: string }): Promise<Class> {
        const { data: updatedClass, error } = await client
            .from('classes')
            .update({
                name: data.name,
                description: data.description,
                color: data.color
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: updatedClass.id,
            name: updatedClass.name,
            description: updatedClass.description,
            color: updatedClass.color,
            createdAt: updatedClass.created_at,
            updatedAt: updatedClass.created_at,
            documentIds: [],
            flashcardSetIds: [],
            quizSetIds: []
        };
    },

    async deleteClass(client: SupabaseClient, id: string): Promise<void> {
        const { error } = await client
            .from('classes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getClass(client: SupabaseClient, id: string): Promise<ClassWithContent> {
        // Fetch class details
        const { data: classData, error: classError } = await client
            .from('classes')
            .select('*')
            .eq('id', id)
            .single();

        if (classError) throw classError;

        // Fetch related documents (via junction table if exists, or just mock for now if table not ready)
        // Assuming we have a class_documents table
        const { data: docsData, error: docsError } = await client
            .from('class_documents')
            .select('document_id')
            .eq('class_id', id);

        if (docsError && docsError.code !== 'PGRST116') { // Ignore if table doesn't exist yet, but better to handle
            console.warn("Error fetching class documents", docsError);
        }

        // Fetch flashcard sets
        const { data: flashcardSets, error: fsError } = await client
            .from('flashcard_sets')
            .select('*')
            .eq('class_id', id);

        if (fsError && fsError.code !== '42P01') console.warn("Error fetching flashcard sets", fsError);

        // Fetch quiz sets
        const { data: quizSets, error: qsError } = await client
            .from('quiz_sets')
            .select('*')
            .eq('class_id', id);

        if (qsError && qsError.code !== '42P01') console.warn("Error fetching quiz sets", qsError);

        return {
            id: classData.id,
            name: classData.name,
            description: classData.description,
            color: classData.color,
            createdAt: classData.created_at,
            updatedAt: classData.created_at,
            documentIds: docsData?.map(d => d.document_id) || [],
            flashcardSetIds: flashcardSets?.map(fs => fs.id) || [],
            quizSetIds: quizSets?.map(qs => qs.id) || [],
            flashcardSets: flashcardSets?.map(fs => ({
                id: fs.id,
                classId: fs.class_id,
                documentId: fs.document_id,
                name: fs.name,
                flashcards: [], // We might need to fetch these separately or join
                createdAt: fs.created_at
            })) || [],
            quizSets: quizSets?.map(qs => ({
                id: qs.id,
                classId: qs.class_id,
                documentId: qs.document_id,
                name: qs.name,
                questions: [],
                createdAt: qs.created_at,
                bestScore: qs.score
            })) || []
        };
    },

    async addDocumentToClass(client: SupabaseClient, classId: string, documentId: string): Promise<void> {
        const { error } = await client
            .from('class_documents')
            .insert([{ class_id: classId, document_id: documentId }]);

        if (error) throw error;
    },

    async removeDocumentFromClass(client: SupabaseClient, classId: string, documentId: string): Promise<void> {
        const { error } = await client
            .from('class_documents')
            .delete()
            .match({ class_id: classId, document_id: documentId });

        if (error) throw error;
    }
};
