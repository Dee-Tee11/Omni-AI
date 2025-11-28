import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to create a Supabase client with the Clerk session token.
 * This is required for RLS to work correctly.
 * 
 * @param getToken - The getToken function from Clerk's useAuth() hook
 * @returns A Supabase client instance authenticated with the user's token
 */
export const createClerkSupabaseClient = async (getToken: () => Promise<string | null>) => {
    const token = await getToken({ template: 'supabase' });

    if (!token) {
        throw new Error('No Clerk session token found');
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });
};
