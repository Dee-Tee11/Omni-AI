import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config.js';
import fs from 'fs/promises';

if (!env.GEMINI_API_KEY) {
    console.warn('Gemini API key is missing. Generation will fail.');
}

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || 'dummy');

// Using Gemini 1.5 Pro (or 2.5 if available via API name, usually 'gemini-1.5-pro-latest')
const MODEL_NAME = 'gemini-1.5-pro-latest';

export class GeminiService {
    private model;

    constructor() {
        this.model = genAI.getGenerativeModel({ model: MODEL_NAME });
    }

    async generateAnswer(
        question: string,
        context: { text: string[], images: string[] }
    ): Promise<string> {
        try {
            const prompt = [
                "Você é um assistente de estudos inteligente e útil.",
                "Responda à pergunta do usuário com base EXCLUSIVAMENTE no contexto fornecido (texto e imagens).",
                "Se a resposta não estiver no contexto, diga que não sabe.",
                "Cite as fontes sempre.",
                "\nCONTEXTO DE TEXTO:",
                ...context.text,
                "\nPERGUNTA:",
                question
            ];

            const imageParts = await Promise.all(
                context.images.map(async (imagePath) => {
                    const imageData = await fs.readFile(imagePath);
                    return {
                        inlineData: {
                            data: imageData.toString('base64'),
                            mimeType: 'image/png', // Assuming PNG for now, logic should detect
                        },
                    };
                })
            );

            const result = await this.model.generateContent([
                ...prompt,
                ...imageParts
            ]);

            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error generating answer with Gemini:', error);
            throw error;
        }
    }
}

export const geminiService = new GeminiService();
