import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronRight, Check, X, Zap, RotateCcw } from 'lucide-react';
import { useGamification } from '../context/GamificationContext';
import './QuizView.css';

interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

interface QuizViewProps {
    documentId: string;
}

export const QuizView: React.FC<QuizViewProps> = ({ documentId }) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showXPGain, setShowXPGain] = useState(false);
    const { addEnergy } = useGamification();

    useEffect(() => {
        loadQuiz();
    }, [documentId]);

    const loadQuiz = async () => {
        setIsLoading(true);
        try {
            // TODO: Implement API call to generate quiz
            // For now, using mock data
            const mockQuestions: QuizQuestion[] = [
                {
                    question: 'Qual é o objetivo principal de um Sistema de Gestão de Base de Dados?',
                    options: [
                        'Armazenar ficheiros de texto',
                        'Gerir o acesso e manipulação de dados',
                        'Criar gráficos',
                        'Enviar emails'
                    ],
                    correctIndex: 1
                },
                {
                    question: 'O que significa SGBD?',
                    options: [
                        'Sistema Geral de Bases Digitais',
                        'Sistema de Gestão de Base de Dados',
                        'Sistema Global de Backup Diário',
                        'Sistema de Gráficos e Bases Digitais'
                    ],
                    correctIndex: 1
                }
            ];
            setQuestions(mockQuestions);
            setCurrentIndex(0);
            setSelectedOption(null);
            setShowResult(false);
        } catch (error) {
            console.error('Error loading quiz:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOptionClick = (index: number) => {
        if (showResult) return;
        setSelectedOption(index);
    };

    const handleSubmit = () => {
        if (selectedOption === null) return;

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
            // Restart quiz
            setCurrentIndex(0);
            setSelectedOption(null);
            setShowResult(false);
        }
    };

    const currentQuestion = questions[currentIndex];

    if (isLoading) {
        return (
            <div className="quiz-view loading">
                <div className="card-header">
                    <div className="card-icon orange">
                        <Target size={20} />
                    </div>
                    <h3 className="card-title">Quiz</h3>
                </div>
                <div className="loading-content">
                    <Target className="spinning" size={32} />
                    <p>Gerando quiz...</p>
                </div>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="quiz-view empty">
                <div className="card-header">
                    <div className="card-icon orange">
                        <Target size={20} />
                    </div>
                    <h3 className="card-title">Quiz</h3>
                </div>
                <div className="empty-content">
                    <p>Nenhum quiz disponível</p>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-view">
            {/* XP Gain Notification */}
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
                <h3 className="card-title">Quiz</h3>
                <button
                    className="reload-btn"
                    onClick={loadQuiz}
                    title="Regenerar Quiz"
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
                    <button className="next-btn" onClick={handleNext}>
                        {currentIndex < questions.length - 1 ? (
                            <>
                                Próxima Questão
                                <ChevronRight size={16} />
                            </>
                        ) : (
                            'Recomeçar Quiz'
                        )}
                    </button>
                </motion.div>
            )}
        </div>
    );
};
