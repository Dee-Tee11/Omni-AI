import Groq from 'groq-sdk';
import { vectorService } from './vectorService.js';
import type { QueryRequest, QueryResponse } from '../types/index.js';
import { env } from '../config.js';

const groq = new Groq({
    apiKey: env.GROQ_API_KEY,
});

const MODEL = 'llama-3.3-70b-versatile';

export class RAGService {
    async query(request: QueryRequest): Promise<QueryResponse> {
        const { question, documentIds, topK = 5 } = request;

        // Step 1: Retrieve relevant chunks from vector database
        const relevantChunks = await vectorService.query(question, topK, documentIds);

        if (relevantChunks.length === 0) {
            return {
                answer: 'Não encontrei informação relevante nos documentos enviados para responder a essa pergunta.',
                sources: [],
                model: MODEL,
            };
        }

        // Step 2: Build context from retrieved chunks
        const context = relevantChunks
            .map((chunk, idx) =>
                `[Fonte ${idx + 1} - Página ${chunk.pageNumber}]\n${chunk.content}`
            )
            .join('\n\n---\n\n');

        // Step 3: Build prompt for Groq
        const systemPrompt = `Você é um assistente de estudos inteligente. Sua função é responder perguntas baseando-se EXCLUSIVAMENTE no contexto fornecido dos documentos do aluno.

REGRAS IMPORTANTES:
- Responda APENAS com base nas informações do contexto fornecido
- Se a informação não estiver no contexto, diga claramente que não encontrou a informação
- Seja claro, conciso e didático
- Cite as fontes quando relevante (ex: "Segundo a Fonte 1...")
- Use formatação markdown para melhorar a legibilidade
- Se houver fórmulas ou expressões matemáticas, use notação clara`;

        const userPrompt = `CONTEXTO DOS DOCUMENTOS:
${context}

PERGUNTA DO ALUNO:
${question}

Por favor, responda à pergunta baseando-se exclusivamente no contexto fornecido acima.`;

        // Step 4: Call Groq API
        try {
            const completion = await groq.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.3, // Lower temperature for more focused answers
                max_tokens: 1500,
            });

            const answer = completion.choices[0]?.message?.content ||
                'Desculpe, não consegui gerar uma resposta.';

            return {
                answer,
                sources: relevantChunks.map(chunk => ({
                    chunkId: chunk.chunkId,
                    documentId: chunk.documentId,
                    pageNumber: chunk.pageNumber,
                    content: chunk.content,
                    similarity: chunk.similarity,
                })),
                model: MODEL,
            };
        } catch (error: any) {
            console.error('Error calling Groq API:', error);
            throw new Error(`Erro ao gerar resposta: ${error.message}`);
        }
    }

    async streamQuery(request: QueryRequest): Promise<AsyncIterable<string>> {
        const { question, documentIds, topK = 5 } = request;

        // Retrieve relevant chunks
        const relevantChunks = await vectorService.query(question, topK, documentIds);

        if (relevantChunks.length === 0) {
            async function* emptyStream() {
                yield 'Não encontrei informação relevante nos documentos enviados.';
            }
            return emptyStream();
        }

        // Build context and prompt
        const context = relevantChunks
            .map((chunk, idx) =>
                `[Fonte ${idx + 1} - Página ${chunk.pageNumber}]\n${chunk.content}`
            )
            .join('\n\n---\n\n');

        const systemPrompt = `Você é um assistente de estudos inteligente. Responda perguntas baseando-se EXCLUSIVAMENTE no contexto fornecido.`;

        const userPrompt = `CONTEXTO:\n${context}\n\nPERGUNTA:\n${question}`;

        // Stream response from Groq
        const stream = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 1500,
            stream: true,
        });

        async function* streamGenerator() {
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    yield content;
                }
            }
        }

        return streamGenerator();
    }
}

export const ragService = new RAGService();