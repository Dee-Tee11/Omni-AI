import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root directory
config({ path: join(__dirname, '..', '.env') });

// Validate required environment variables
if (!process.env.GROQ_API_KEY) {
    console.error('ERROR: GROQ_API_KEY is not set in .env file');
    process.exit(1);
}

export const env = {
    PORT: process.env.PORT || '3000',
    GROQ_API_KEY: process.env.GROQ_API_KEY!,
    CHROMA_PATH: process.env.CHROMA_PATH || './chroma_db',
    UPLOADS_PATH: process.env.UPLOADS_PATH || './uploads',
    NODE_ENV: process.env.NODE_ENV || 'development',
};
