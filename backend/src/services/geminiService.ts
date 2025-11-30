import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config.js';
import fs from 'fs/promises';

if (!env.GEMINI_API_KEY) {
    console.warn('Gemini API key is missing. Generation will fail.');
}

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || 'dummy');

// Using Gemini 2.5 Pro
const MODEL_NAME = 'gemini-2.5-pro';

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
            // Enhanced system prompt for better responses
            const systemPrompt = `Você é um assistente de estudos especializado e preciso.

INSTRUÇÕES CRÍTICAS:
1. Use APENAS informações do contexto fornecido abaixo
2. Se a resposta não estiver no contexto, diga explicitamente "Não encontrei essa informação nos documentos fornecidos"
3. Cite SEMPRE as fontes mencionando os números das páginas
4. Estruture respostas com markdown para melhor legibilidade

FORMATAÇÃO OBRIGATÓRIA:
- Use ## para títulos de seção principais
- Use **negrito** para conceitos-chave e definições
- Use listas numeradas (1., 2., 3.) para sequências e processos
- Use listas com bullets (-) para pontos relacionados
- No final, inclua: "📚 **Fontes**: Páginas X, Y, Z"

EVITE ABSOLUTAMENTE:
❌ Inventar informação não presente no contexto
❌ Usar conhecimento geral não relacionado aos documentos
❌ Respostas vagas sem evidência específica
❌ Afirmações sem citar a fonte`;

            const contextText = context.text
                .map((text, idx) => `[Fonte ${idx + 1}]\n${text}`)
                .join('\n\n---\n\n');

            const fullPrompt = `${systemPrompt}

CONTEXTO DOS DOCUMENTOS:
${contextText}

PERGUNTA DO ESTUDANTE:
${question}

RESPOSTA (estruturada e completa):`;

            const imageParts = await Promise.all(
                context.images.map(async (imagePath) => {
                    const imageData = await fs.readFile(imagePath);
                    return {
                        inlineData: {
                            data: imageData.toString('base64'),
                            mimeType: 'image/png',
                        },
                    };
                })
            );

            // Construct the request object correctly for the SDK
            const result = await this.model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [
                        { text: fullPrompt },
                        ...imageParts.map(part => ({
                            inlineData: part.inlineData
                        }))
                    ]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topP: 0.9,
                    topK: 40,
                    maxOutputTokens: 2048,
                }
            });

            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error generating answer with Gemini:', error);
            throw error;
        }
    }
}

export const geminiService = new GeminiService();
