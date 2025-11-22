import Groq from 'groq-sdk';
import { pdfService } from './pdfService.js';
import crypto from 'crypto';
import type { GenerateFlashcardsRequest, FlashcardSet, Flashcard } from '../types/index.js';
import { env } from '../config.js';

const groq = new Groq({
    apiKey: env.GROQ_API_KEY,
});

const MODEL = 'llama-3.3-70b-versatile';

export class FlashcardService {
    async generateFlashcards(request: GenerateFlashcardsRequest): Promise<FlashcardSet> {
        const { documentId, count = 10, includeImages = false } = request;

        // Get document and chunks
        const docData = await pdfService.getDocument(documentId);
        if (!docData) {
            throw new Error('Document not found');
        }

        const { document, chunks } = docData;

        // Use first N chunks or entire document text (limited for token efficiency)
        const maxChars = 8000; // Limit context size
        const textToAnalyze = document.textContent.slice(0, maxChars);

        // Build prompt for flashcard generation
        const systemPrompt = `Você é um especialista em criar flashcards educacionais de alta qualidade.

REGRAS PARA CRIAR FLASHCARDS:
- Crie flashcards claros, objetivos e didáticos
- Cada flashcard deve ter uma PERGUNTA e uma RESPOSTA
- As perguntas devem testar conceitos importantes do conteúdo
- As respostas devem ser concisas mas completas
- Varie o tipo de perguntas: definições, aplicações, comparações, etc.
- Evite perguntas muito óbvias ou muito complexas
- Retorne APENAS um array JSON válido no formato especificado`;

        const userPrompt = `Analise o seguinte conteúdo educacional e crie exatamente ${count} flashcards:

CONTEÚDO:
${textToAnalyze}

Retorne um array JSON com o seguinte formato:
[
  {
    "question": "Qual é...?",
    "answer": "A resposta é...",
    "difficulty": "easy|medium|hard"
  }
]

Crie ${count} flashcards variados e de qualidade.`;

        try {
            const completion = await groq.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7, // Higher temperature for creativity
                max_tokens: 2500,
                response_format: { type: 'json_object' },
            });

            const responseText = completion.choices[0]?.message?.content || '{}';

            // Parse JSON response
            let flashcardsData: any;
            try {
                flashcardsData = JSON.parse(responseText);

                // Handle different possible JSON structures
                const flashcardsArray = flashcardsData.flashcards || flashcardsData;

                if (!Array.isArray(flashcardsArray)) {
                    throw new Error('Response is not an array');
                }

                const flashcards: Flashcard[] = flashcardsArray.map((card: any) => ({
                    id: crypto.randomUUID(),
                    question: card.question || card.q || '',
                    answer: card.answer || card.a || '',
                    documentId,
                    difficulty: card.difficulty || 'medium',
                    // Images can be added later if includeImages is true
                }));

                return {
                    documentId,
                    documentName: document.filename,
                    flashcards,
                    createdAt: new Date(),
                };
            } catch (parseError) {
                console.error('Error parsing flashcards JSON:', parseError);
                console.error('Response text:', responseText);

                // Fallback: create generic flashcards
                return this.createFallbackFlashcards(documentId, document.filename, count);
            }
        } catch (error: any) {
            console.error('Error generating flashcards:', error);
            throw new Error(`Erro ao gerar flashcards: ${error.message}`);
        }
    }

    private createFallbackFlashcards(documentId: string, filename: string, count: number): FlashcardSet {
        const flashcards: Flashcard[] = Array.from({ length: count }, (_, i) => ({
            id: crypto.randomUUID(),
            question: `Pergunta de revisão ${i + 1}`,
            answer: `Revise o conteúdo do documento para responder esta pergunta.`,
            documentId,
            difficulty: 'medium' as const,
        }));

        return {
            documentId,
            documentName: filename,
            flashcards,
            createdAt: new Date(),
        };
    }

    async updateFlashcardReview(
        flashcardId: string,
        difficulty: 'easy' | 'medium' | 'hard'
    ): Promise<void> {
        // Implement spaced repetition algorithm (SM-2 or similar)
        // For now, this is a placeholder
        const now = new Date();
        let daysUntilNext = 1;

        switch (difficulty) {
            case 'easy':
                daysUntilNext = 7;
                break;
            case 'medium':
                daysUntilNext = 3;
                break;
            case 'hard':
                daysUntilNext = 1;
                break;
        }

        // In a real implementation, you'd save this to a database
        console.log(`Flashcard ${flashcardId} reviewed as ${difficulty}, next review in ${daysUntilNext} days`);
    }
}

export const flashcardService = new FlashcardService();
