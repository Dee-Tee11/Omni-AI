import Groq from 'groq-sdk';
import { supabase } from '../lib/supabase.js';
import crypto from 'crypto';
import type { GenerateQuizRequest, QuizSet, QuizQuestion } from '../types/index.js';
import { env } from '../config.js';

const groq = new Groq({
    apiKey: env.GROQ_API_KEY,
});

const MODEL = 'llama-3.3-70b-versatile';

export class QuizService {
    async generateQuiz(request: GenerateQuizRequest): Promise<QuizSet> {
        const { documentId, count = 10, difficulty = 'mixed' } = request;

        // Get document from Supabase
        const { data: document, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (error || !document) {
            throw new Error('Document not found');
        }

        // Get document chunks for content
        const { data: chunks } = await supabase
            .from('document_chunks')
            .select('content')
            .eq('document_id', documentId)
            .limit(15); // Get first 15 chunks for context

        // Use chunks or limit context size
        const maxChars = 12000; // Limit context size
        const textToAnalyze = chunks?.map(c => c.content).join('\n\n').slice(0, maxChars) || '';

        // Build prompt for quiz generation
        const systemPrompt = `Você é um especialista em criar quizzes educacionais de alta qualidade.

REGRAS PARA CRIAR QUIZ:
- Crie perguntas de múltipla escolha claras e objetivas
- Cada pergunta deve ter 4 opções de resposta
- Apenas UMA opção deve ser correta
- As perguntas devem testar a compreensão do conteúdo
- Varie a dificuldade das perguntas
- Retorne APENAS um array JSON válido no formato especificado`;

        const userPrompt = `Analise o seguinte conteúdo educacional e crie exatamente ${count} perguntas de quiz:

CONTEÚDO:
${textToAnalyze}

Retorne um array JSON com o seguinte formato:
[
  {
    "question": "O enunciado da pergunta...",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctIndex": 0, // Índice da resposta correta (0-3)
    "explanation": "Breve explicação do porquê esta é a resposta correta",
    "difficulty": "easy|medium|hard"
  }
]

Crie ${count} perguntas variadas e de qualidade.`;

        try {
            const completion = await groq.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: 3000,
                response_format: { type: 'json_object' },
            });

            const responseText = completion.choices[0]?.message?.content || '{}';

            // Parse JSON response
            let quizData: any;
            try {
                quizData = JSON.parse(responseText);

                // Handle different possible JSON structures
                const questionsArray = quizData.questions || quizData.quiz || quizData;

                if (!Array.isArray(questionsArray)) {
                    throw new Error('Response is not an array');
                }

                const questions: QuizQuestion[] = questionsArray.map((q: any) => ({
                    id: crypto.randomUUID(),
                    question: q.question || q.q || '',
                    options: q.options || [],
                    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                    explanation: q.explanation || '',
                    difficulty: q.difficulty || 'medium',
                }));

                return {
                    documentId,
                    documentName: document.filename,
                    questions,
                    createdAt: new Date(),
                };
            } catch (parseError) {
                console.error('Error parsing quiz JSON:', parseError);
                console.error('Response text:', responseText);

                // Fallback: create generic quiz
                return this.createFallbackQuiz(documentId, document.filename, count);
            }
        } catch (error: any) {
            console.error('Error generating quiz:', error);
            throw new Error(`Erro ao gerar quiz: ${error.message}`);
        }
    }

    private createFallbackQuiz(documentId: string, filename: string, count: number): QuizSet {
        const questions: QuizQuestion[] = Array.from({ length: count }, (_, i) => ({
            id: crypto.randomUUID(),
            question: `Pergunta de revisão ${i + 1} sobre ${filename}`,
            options: [
                'Resposta correta (placeholder)',
                'Opção incorreta 1',
                'Opção incorreta 2',
                'Opção incorreta 3'
            ],
            correctIndex: 0,
            explanation: 'Não foi possível gerar o quiz automaticamente. Por favor, tente novamente.',
            difficulty: 'medium' as const,
        }));

        return {
            documentId,
            documentName: filename,
            questions,
            createdAt: new Date(),
        };
    }
}

export const quizService = new QuizService();
