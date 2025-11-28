import React, { useState, useEffect } from 'react';
import sanitizeHtml from 'sanitize-html';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronRight, Check, X, Zap, RotateCcw, Play, FileText, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '../../lib/supabase';
import { supabaseQuizService } from '../../services/supabaseQuizService';
import { supabaseClassService } from '../../services/supabaseClassService';
import { generateQuiz, QuizQuestion, getDocuments, Document, type Class } from '../../services/api';
import { autoSaveQuizToClass } from '../../services/classHelpers';
import './QuizView.css';

interface QuizViewProps {
    documentId?: string;
}

export const QuizView: React.FC<QuizViewProps> = ({ documentId: propDocumentId }) => {
    const [searchParams] = useSearchParams();
    const urlDocumentId = searchParams.get('doc');
    const urlSetId = searchParams.get('setId');
    const { getToken } = useAuth();

    const getClient = async () => {
        return await createClerkSupabaseClient(getToken);
    };

    // State for Selection Mode
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(propDocumentId || urlDocumentId);
    const [questionCount, setQuestionCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);

    // State for Quiz Mode
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [showXPGain, setShowXPGain] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);

    // State for Save to Class
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    const { addEnergy, currentEra, civilizationXP } = useGamification();

    useEffect(() => {
        fetchDocuments();
    }, []);

    // If documentId is provided via props or URL, we might want to auto-select it
    useEffect(() => {
        if (propDocumentId || urlDocumentId) {
            setSelectedDocumentId(propDocumentId || urlDocumentId);
        }
    }, [propDocumentId, urlDocumentId]);

    // Load saved quiz set if setId is present
    useEffect(() => {
        if (urlSetId) {
            loadSavedQuiz(urlSetId);
        }
    }, [urlSetId]);

    const loadSavedQuiz = async (setId: string) => {
        try {
            setIsGenerating(true);
            const client = await getClient();
            const savedQuiz = await supabaseQuizService.getQuizSet(client, setId);

            if (savedQuiz && savedQuiz.questions) {
                // Map saved questions to QuizQuestion format
                const mappedQuestions: QuizQuestion[] = savedQuiz.questions.map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    correctIndex: q.correctAnswer,
                    explanation: q.explanation
                }));

                setQuestions(mappedQuestions);
                setQuizStarted(true);
                setCurrentIndex(0);
                setSelectedOption(null);
                setShowResult(false);
            }
        } catch (error) {
            console.error('Error loading saved quiz:', error);
            alert('Erro ao carregar o quiz salvo.');
        } finally {
            setIsGenerating(false);
        }
    };

    const fetchDocuments = async () => {
        try {
            const docs = await getDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const handleStartQuiz = async () => {
        if (!selectedDocumentId) return;

        setIsGenerating(true);
        try {
            const data = await generateQuiz(selectedDocumentId, questionCount);

            if (data.questions && Array.isArray(data.questions)) {
                setQuestions(data.questions);
                setQuizStarted(true);
                setCurrentIndex(0);
                setSelectedOption(null);
                setShowResult(false);

                // Auto-save to class if document belongs to one
                const client = await getClient();
                await autoSaveQuizToClass(client, selectedDocumentId, data);
            } else {
                throw new Error('Invalid quiz data format');
            }
        } catch (error) {
            console.error('Error generating quiz:', error);
            alert('Erro ao gerar o quiz. Por favor, tente novamente.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOptionClick = (index: number) => {
        if (showResult) return;
        setSelectedOption(index);
    };

    const handleSubmit = () => {
        if (selectedOption === null) return;

        const currentQuestion = questions[currentIndex];
        const correct = selectedOption === currentQuestion.correctIndex;
        setIsCorrect(correct);
        setShowResult(true);

        if (correct) {
            addEnergy(50); // 50 XP por acerto
            setShowXPGain(true);
            setTimeout(() => setShowXPGain(false), 2000);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowResult(false);
        } else {
            // Quiz Finished
            // Could add a summary screen here, for now just reset to selection
            setQuizStarted(false);
            setQuestions([]);
        }
    };

    const handleRestart = () => {
        setQuizStarted(false);
        setQuestions([]);
    };

    const loadClasses = async () => {
        try {
            const client = await getClient();
            const data = await supabaseClassService.getAllClasses(client);
            setClasses(data);
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    };

    const handleOpenSaveModal = () => {
        loadClasses();
        setShowSaveModal(true);
    };

    const handleConfirmSave = async () => {
        if (!selectedClassId || !questions.length || !selectedDocumentId) return;

        try {
            const docName = documents.find(d => d.id === selectedDocumentId)?.filename || 'Documento';

            const client = await getClient();
            await supabaseQuizService.saveQuizSet(client, {
                classId: selectedClassId,
                documentId: selectedDocumentId,
                name: `Quiz - ${docName}`,
                questions: questions.map(q => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctIndex,
                    explanation: q.explanation,
                }))
            });
            alert('Quiz salvo na aula com sucesso!');
            setShowSaveModal(false);
        } catch (error) {
            console.error('Error saving to class:', error);
            alert('Erro ao salvar quiz na aula');
        }
    };

    // Render Quiz Mode (Active Quiz)
    if (quizStarted) {
        const currentQuestion = questions[currentIndex];

        return (
            <div className="quiz-view">
                <AnimatePresence>
                    {showXPGain && (
                        <motion.div
                            className="xp-gain-notification"
                            initial={{ opacity: 0, y: -20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -30, scale: 0.6 }}
                        >
                            <Zap size={16} />
                            <span>+50 XP</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="card-header">
                    <div className="card-icon orange">
                        <Target size={20} />
                    </div>
                    <h3 className="card-title">Quiz em Andamento</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="reload-btn"
                            onClick={handleOpenSaveModal}
                            title="Salvar na Aula"
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            className="reload-btn"
                            onClick={handleRestart}
                            title="Voltar para seleção"
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>
                </div>

                <div className="quiz-progress">
                    <span className="progress-text">
                        Questão {currentIndex + 1} / {questions.length}
                    </span>
                    <div className="progress-bar">
                        <motion.div
                            className="progress-fill"
                            initial={{ width: 0 }}
                            animate={{
                                width: `${((currentIndex + 1) / questions.length) * 100}%`
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                <div className="quiz-question">
                    <p className="question-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQuestion.question) }} />
                </div>

                <div className="quiz-options">
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedOption === index;
                        const isCorrectOption = index === currentQuestion.correctIndex;
                        const showCorrect = showResult && isCorrectOption;
                        const showWrong = showResult && isSelected && !isCorrect;

                        return (
                            <motion.button
                                key={index}
                                className={`quiz-option ${isSelected ? 'selected' : ''} ${showCorrect ? 'correct' : ''
                                    } ${showWrong ? 'wrong' : ''}`}
                                onClick={() => handleOptionClick(index)}
                                disabled={showResult}
                                whileHover={!showResult ? { scale: 1.02 } : {}}
                                whileTap={!showResult ? { scale: 0.98 } : {}}
                            >
                                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                                <span className="option-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(option) }} />
                                {showCorrect && <Check size={20} className="result-icon" />}
                                {showWrong && <X size={20} className="result-icon" />}
                            </motion.button>
                        );
                    })}
                </div>

                {!showResult ? (
                    <button
                        className="submit-btn"
                        onClick={handleSubmit}
                        disabled={selectedOption === null}
                    >
                        Confirmar Resposta
                    </button>
                ) : (
                    <motion.div
                        className={`result-feedback ${isCorrect ? 'correct' : 'wrong'}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="result-icon-large">
                            {isCorrect ? <Check size={32} /> : <X size={32} />}
                        </div>
                        <p className="result-text">
                            {isCorrect ? '🎉 Correto! +50 XP' : '❌ Incorreto. Tenta novamente!'}
                        </p>
                        {currentQuestion.explanation && (
                            <p className="explanation-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQuestion.explanation) }} />
                        )}
                        <button className="next-btn" onClick={handleNext}>
                            {currentIndex < questions.length - 1 ? (
                                <>
                                    Próxima Questão
                                    <ChevronRight size={16} />
                                </>
                            ) : (
                                'Finalizar Quiz'
                            )}
                        </button>
                    </motion.div>
                )}

                {
                    showSaveModal && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Salvar Quiz na Aula</h2>
                                <div className="form-group">
                                    <label>Selecione a Aula</label>
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        className="class-select"
                                    >
                                        <option value="">-- Selecione uma aula --</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>Cancelar</button>
                                    <button className="btn btn-primary" onClick={handleConfirmSave} disabled={!selectedClassId}>Salvar</button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        );
    }

    // Render Selection Mode (New Layout)
    return (
        <div className="quiz-container">
            {/* Header Section */}
            <div className="quiz-header-section">
                <div className="quiz-title-group">
                    <div className="quiz-title">
                        <Target size={32} strokeWidth={2.5} />
                        <h1>Quiz de Conhecimento</h1>
                    </div>
                    <p className="quiz-subtitle">Selecione um documento e teste seus conhecimentos</p>
                </div>

                <div className="xp-badge">
                    <Zap size={18} fill="currentColor" />
                    <span>{currentEra} • {civilizationXP} XP</span>
                </div>
            </div>

            <div className="quiz-content-grid">
                {/* Left Panel: Documents & Settings */}
                <div className="documents-panel">
                    <h2 className="panel-title">Meus Documentos</h2>

                    <div className="question-count-selector">
                        <span className="selector-label">Número de Perguntas:</span>
                        <div className="count-options">
                            {[5, 10, 15, 20].map(count => (
                                <button
                                    key={count}
                                    className={`count-btn ${questionCount === count ? 'active' : ''}`}
                                    onClick={() => setQuestionCount(count)}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="documents-list">
                        {documents.length === 0 ? (
                            <div className="text-gray-400 text-center py-4">
                                Nenhum documento encontrado
                            </div>
                        ) : (
                            documents.map(doc => (
                                <div
                                    key={doc.id}
                                    className={`document-item ${selectedDocumentId === doc.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedDocumentId(doc.id)}
                                >
                                    <div className="doc-name" title={doc.filename}>
                                        {doc.filename}
                                    </div>
                                    <div className="doc-date">
                                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                                        <span>{doc.pageCount} pág</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Main Area */}
                <div className="main-quiz-area">
                    {isGenerating && (
                        <div className="loading-overlay">
                            <div className="loading-spinner"></div>
                            <h3 className="text-xl font-bold text-gray-800">Gerando seu Quiz...</h3>
                            <p className="text-gray-500">Nossa IA está criando perguntas personalizadas</p>
                        </div>
                    )}

                    {selectedDocumentId ? (
                        <>
                            <div className="mb-8">
                                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                                    <FileText size={48} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    {documents.find(d => d.id === selectedDocumentId)?.filename || 'Documento Selecionado'}
                                </h2>
                                <p className="text-gray-500">
                                    Pronto para começar? Vamos gerar {questionCount} perguntas sobre este conteúdo.
                                </p>
                            </div>

                            <button className="start-quiz-btn" onClick={handleStartQuiz}>
                                <Play size={24} fill="currentColor" />
                                Começar Quiz
                            </button>
                        </>
                    ) : (
                        <>
                            <Target size={80} strokeWidth={1} className="empty-state-icon" />
                            <h2 className="empty-state-title">Selecione um documento</h2>
                            <p className="empty-state-desc">
                                Escolha um documento da lista à esquerda e o número de perguntas para começar seu teste de conhecimento.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
