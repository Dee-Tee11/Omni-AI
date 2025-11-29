import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root directory
config({ path: join(__dirname, '..', '.env') });

export const env = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Auth
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY,

    // AI Services
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    COHERE_API_KEY: process.env.COHERE_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    // Database
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // Paths
    UPLOADS_PATH: join(process.cwd(), 'uploads'),
};

// Validate required environment variables
const requiredEnvVars = [
    'CLERK_SECRET_KEY',
    'CLERK_PUBLISHABLE_KEY',
    'COHERE_API_KEY',
    'GEMINI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
];

for (const envVar of requiredEnvVars) {
    if (!env[envVar as keyof typeof env]) {
        console.warn(`WARNING: Missing environment variable ${envVar}`);
    }
}
