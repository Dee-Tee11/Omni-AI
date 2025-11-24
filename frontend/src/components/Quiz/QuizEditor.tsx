import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Plus, X, Check, AlertCircle } from 'lucide-react';

interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

interface QuizEditorProps {
    questions: QuizQuestion[];
    onSave: (questions: QuizQuestion[]) => void;
    onCancel: () => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ questions, onSave, onCancel }) => {
    const [editedQuestions, setEditedQuestions] = useState<QuizQuestion[]>(
        questions.map(q => ({ ...q }))
    );
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [errors, setErrors] = useState<{ [key: number]: string }>({});

    const validateQuestion = (question: QuizQuestion, index: number): boolean => {
        const newErrors = { ...errors };

        if (!question.question.trim()) {
            newErrors[index] = 'A pergunta não pode estar vazia';
            setErrors(newErrors);
            return false;
        }

        if (question.options.length < 2) {
            newErrors[index] = 'Deve haver pelo menos 2 opções';
            setErrors(newErrors);
            return false;
        }

        if (question.options.some(opt => !opt.trim())) {
            newErrors[index] = 'Todas as opções devem ter texto';
            setErrors(newErrors);
            return false;
        }

        if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
            newErrors[index] = 'Resposta correta inválida';
            setErrors(newErrors);
            return false;
        }

        delete newErrors[index];
        setErrors(newErrors);
        return true;
    };

    const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
        const updated = [...editedQuestions];
        updated[index] = { ...updated[index], [field]: value };
        setEditedQuestions(updated);
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updated = [...editedQuestions];
        updated[questionIndex].options[optionIndex] = value;
        setEditedQuestions(updated);
    };

    const addOption = (questionIndex: number) => {
        const updated = [...editedQuestions];
        updated[questionIndex].options.push('');
        setEditedQuestions(updated);
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        const updated = [...editedQuestions];
        if (updated[questionIndex].options.length <= 2) return;

        updated[questionIndex].options.splice(optionIndex, 1);

        // Adjust correctIndex if needed
        if (updated[questionIndex].correctIndex === optionIndex) {
            updated[questionIndex].correctIndex = 0;
        } else if (updated[questionIndex].correctIndex > optionIndex) {
            updated[questionIndex].correctIndex--;
        }

        setEditedQuestions(updated);
    };

    const removeQuestion = (index: number) => {
        const updated = editedQuestions.filter((_, i) => i !== index);
        setEditedQuestions(updated);
        setEditingIndex(null);
    };

    const addNewQuestion = () => {
        const newQuestion: QuizQuestion = {
            id: `new-${Date.now()}`,
            question: '',
            options: ['', ''],
            correctIndex: 0,
            explanation: '',
            difficulty: 'medium'
        };
        setEditedQuestions([...editedQuestions, newQuestion]);
        setEditingIndex(editedQuestions.length);
    };

    const handleSave = () => {
        // Validate all questions
        let hasErrors = false;
        editedQuestions.forEach((q, i) => {
            if (!validateQuestion(q, i)) {
                hasErrors = true;
            }
        });

        if (hasErrors) {
            alert('Por favor, corrija os erros antes de salvar');
            return;
        }

        if (editedQuestions.length === 0) {
            alert('Deve haver pelo menos uma pergunta');
            return;
        }

        onSave(editedQuestions);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem'
        }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: 'white',
                    borderRadius: '24px',
                    maxWidth: '900px',
                    width: '100%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '800',
                            color: '#1F2937',
                            marginBottom: '0.25rem'
                        }}>
                            Editar Quiz
                        </h2>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                            Personalize as perguntas conforme necessário
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        style={{
                            background: '#F3F4F6',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            color: '#6B7280'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Questions List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem 2rem'
                }}>
                    {editedQuestions.map((question, qIndex) => (
                        <div
                            key={question.id}
                            style={{
                                background: editingIndex === qIndex ? '#FFF7ED' : '#F9FAFB',
                                border: `2px solid ${editingIndex === qIndex ? '#EA580C' : '#E5E7EB'}`,
                                borderRadius: '16px',
                                padding: '1.5rem',
                                marginBottom: '1rem'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '1rem'
                            }}>
                                <span style={{
                                    background: '#EA580C',
                                    color: 'white',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.875rem',
                                    fontWeight: '700'
                                }}>
                                    Pergunta {qIndex + 1}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setEditingIndex(editingIndex === qIndex ? null : qIndex)}
                                        style={{
                                            background: editingIndex === qIndex ? '#EA580C' : '#F3F4F6',
                                            color: editingIndex === qIndex ? 'white' : '#6B7280',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '0.5rem',
                                            cursor: 'pointer'
                                        }}
                                        title={editingIndex === qIndex ? 'Fechar' : 'Editar'}
                                    >
                                        {editingIndex === qIndex ? <Check size={16} /> : <Edit2 size={16} />}
                                    </button>
                                    <button
                                        onClick={() => removeQuestion(qIndex)}
                                        style={{
                                            background: '#FEF2F2',
                                            color: '#EF4444',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '0.5rem',
                                            cursor: 'pointer'
                                        }}
                                        title="Remover pergunta"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {editingIndex === qIndex ? (
                                <>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: '#374151',
                                            marginBottom: '0.5rem'
                                        }}>
                                            Pergunta
                                        </label>
                                        <textarea
                                            value={question.question}
                                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid #D1D5DB',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                fontFamily: 'inherit',
                                                minHeight: '80px',
                                                resize: 'vertical'
                                            }}
                                            placeholder="Digite a pergunta..."
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: '#374151',
                                            marginBottom: '0.5rem'
                                        }}>
                                            Opções
                                        </label>
                                        {question.options.map((option, oIndex) => (
                                            <div
                                                key={oIndex}
                                                style={{
                                                    display: 'flex',
                                                    gap: '0.5rem',
                                                    marginBottom: '0.5rem',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    checked={question.correctIndex === oIndex}
                                                    onChange={() => updateQuestion(qIndex, 'correctIndex', oIndex)}
                                                    style={{ cursor: 'pointer' }}
                                                    title="Marcar como resposta correta"
                                                />
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.5rem',
                                                        border: '1px solid #D1D5DB',
                                                        borderRadius: '8px',
                                                        fontSize: '0.875rem'
                                                    }}
                                                    placeholder={`Opção ${oIndex + 1}`}
                                                />
                                                {question.options.length > 2 && (
                                                    <button
                                                        onClick={() => removeOption(qIndex, oIndex)}
                                                        style={{
                                                            background: '#FEF2F2',
                                                            color: '#EF4444',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            padding: '0.5rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {question.options.length < 6 && (
                                            <button
                                                onClick={() => addOption(qIndex)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    border: '2px dashed #D1D5DB',
                                                    borderRadius: '8px',
                                                    background: 'white',
                                                    color: '#6B7280',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    marginTop: '0.5rem'
                                                }}
                                            >
                                                <Plus size={14} />
                                                Adicionar opção
                                            </button>
                                        )}
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: '#374151',
                                            marginBottom: '0.5rem'
                                        }}>
                                            Explicação (opcional)
                                        </label>
                                        <textarea
                                            value={question.explanation || ''}
                                            onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid #D1D5DB',
                                                borderRadius: '8px',
                                                fontSize: '0.875rem',
                                                fontFamily: 'inherit',
                                                minHeight: '60px',
                                                resize: 'vertical'
                                            }}
                                            placeholder="Explicação da resposta..."
                                        />
                                    </div>

                                    {errors[qIndex] && (
                                        <div style={{
                                            marginTop: '1rem',
                                            padding: '0.75rem',
                                            background: '#FEF2F2',
                                            border: '1px solid #FEE2E2',
                                            borderRadius: '8px',
                                            color: '#991B1B',
                                            fontSize: '0.875rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <AlertCircle size={16} />
                                            {errors[qIndex]}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <p style={{
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: '#1F2937',
                                        marginBottom: '0.75rem'
                                    }}>
                                        {question.question || '(Pergunta vazia)'}
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {question.options.map((option, oIndex) => (
                                            <div
                                                key={oIndex}
                                                style={{
                                                    padding: '0.5rem 0.75rem',
                                                    background: question.correctIndex === oIndex ? '#ECFDF5' : 'white',
                                                    border: `1px solid ${question.correctIndex === oIndex ? '#10B981' : '#E5E7EB'}`,
                                                    borderRadius: '8px',
                                                    fontSize: '0.875rem',
                                                    color: question.correctIndex === oIndex ? '#065F46' : '#4B5563',
                                                    fontWeight: question.correctIndex === oIndex ? '600' : '400'
                                                }}
                                            >
                                                {String.fromCharCode(65 + oIndex)}. {option || '(Opção vazia)'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={addNewQuestion}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            border: '2px dashed #D1D5DB',
                            borderRadius: '16px',
                            background: 'white',
                            color: '#6B7280',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: '600'
                        }}
                    >
                        <Plus size={20} />
                        Adicionar Nova Pergunta
                    </button>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.5rem 2rem',
                    borderTop: '1px solid #E5E7EB',
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: '1px solid #D1D5DB',
                            borderRadius: '12px',
                            background: 'white',
                            color: '#374151',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '1rem'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '0.75rem 2rem',
                            border: 'none',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '1rem',
                            boxShadow: '0 4px 6px rgba(234, 88, 12, 0.2)'
                        }}
                    >
                        Salvar e Iniciar Quiz
                    </button>
                </div>
            </motion.div>
        </div>
    );
};