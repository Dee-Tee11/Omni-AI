import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronRight, Check, X, Zap, RotateCcw, Play, FileText, Edit } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useGamification } from '../../context/GamificationContext';
import { generateQuiz, QuizQuestion, getDocuments, Document } from '../../services/api';
import { QuizEditor } from './QuizEditor';
import './QuizView.css';

interface QuizViewProps {
    documentId?: string;
}

export const QuizView: React.FC<QuizViewProps> = ({ documentId: propDocumentId }) => {
    const [searchParams] = useSearchParams();
    const urlDocumentId = searchParams.get('doc');

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

    // State for Editor
    const [showEditor, setShowEditor] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);

    const { addEnergy, currentEra, civilizationXP } = useGamification();

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        if (propDocumentId || urlDocumentId) {
            setSelectedDocumentId(propDocumentId || urlDocumentId);
        }
    }, [propDocumentId, urlDocumentId]);

    const fetchDocuments = async () => {
        try {
            const docs = await getDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const handleGenerateQuiz = async () => {
        if (!selectedDocumentId) return;

        setIsGenerating(true);
        try {
            const data = await generateQuiz(selectedDocumentId, questionCount);

            if (data.questions && Array.isArray(data.questions)) {
                setGeneratedQuestions(data.questions);
                setShowEditor(true); // Show editor after generation
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

    const handleStartQuizDirectly = () => {
        // Start quiz immediately with generated questions
        setQuestions(generatedQuestions);
        setQuizStarted(true);
        setShowEditor(false);
        setCurrentIndex(0);
        setSelectedOption(null);
        setShowResult(false);
    };

    const handleSaveAndStartQuiz = (editedQuestions: QuizQuestion[]) => {
        // Start quiz with edited questions
        setQuestions(editedQuestions);
        setQuizStarted(true);
        setShowEditor(false);
        setCurrentIndex(0);
        setSelectedOption(null);
        setShowResult(false);
    };

    const handleCancelEditor = () => {
        setShowEditor(false);
        setGeneratedQuestions([]);
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
            addEnergy(50);
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
            setQuizStarted(false);
            setQuestions([]);
        }
    };

    const handleRestart = () => {
        setQuizStarted(false);
        setQuestions([]);
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
                    <button
                        className="reload-btn"
                        onClick={handleRestart}
                        title="Voltar para seleção"
                    >
                        <RotateCcw size={16} />
                    </button>
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
                    <p className="question-text">{currentQuestion.question}</p>
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
                                <span className="option-text">{option}</span>
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
                            <p className="explanation-text">
                                {currentQuestion.explanation}
                            </p>
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
            </div>
        );
    }

    // Render Editor Modal
    if (showEditor) {
        return (
            <>
                <div className="quiz-container">
                    <div className="quiz-header-section">
                        <div className="quiz-title-group">
                            <div className="quiz-title">
                                <Target size={32} strokeWidth={2.5} />
                                <h1>Quiz Gerado</h1>
                            </div>
                            <p className="quiz-subtitle">Revise e edite as perguntas antes de começar</p>
                        </div>
                    </div>

                    <div className="main-quiz-area" style={{ padding: '3rem' }}>
                        <Edit size={64} strokeWidth={1.5} className="empty-state-icon" style={{ color: '#EA580C' }} />
                        <h2 className="empty-state-title">Quiz Pronto para Edição</h2>
                        <p className="empty-state-desc" style={{ marginBottom: '2rem' }}>
                            {generatedQuestions.length} perguntas foram geradas. Você pode editar ou iniciar diretamente.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={handleStartQuizDirectly}
                                style={{
                                    padding: '1rem 2rem',
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Play size={20} fill="currentColor" />
                                Iniciar Agora
                            </button>
                            <button
                                onClick={() => setShowEditor(true)}
                                style={{
                                    padding: '1rem 2rem',
                                    background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px rgba(234, 88, 12, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Edit size={20} />
                                Editar Perguntas
                            </button>
                        </div>
                    </div>
                </div>

                <QuizEditor
                    questions={generatedQuestions}
                    onSave={handleSaveAndStartQuiz}
                    onCancel={handleCancelEditor}
                />
            </>
        );
    }

    // Render Selection Mode
    return (
        <div className="quiz-container">
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

                            <button className="start-quiz-btn" onClick={handleGenerateQuiz}>
                                <Play size={24} fill="currentColor" />
                                Gerar Quiz
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