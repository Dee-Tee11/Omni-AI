import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight, Sparkles } from 'lucide-react';
import { generateFlashcards, type FlashcardSet } from '../../services/api';
import './FlashcardQuickView.css';

interface FlashcardQuickViewProps {
    documentId: string;
    onOpenFullView?: () => void;
}

export const FlashcardQuickView: React.FC<FlashcardQuickViewProps> = ({
    documentId,
    onOpenFullView
}) => {
    const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        if (documentId) {
            loadFlashcards();
        }
    }, [documentId]);

    const loadFlashcards = async () => {
        setIsLoading(true);
        try {
            const cards = await generateFlashcards(documentId, 10);
            setFlashcardSet(cards);
            setCurrentIndex(0);
            setIsFlipped(false);
        } catch (error) {
            console.error('Error loading flashcards:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleAnswer = () => {
        // Award XP based on difficulty
        // const xpRewards = {
        //     hard: 50,   // More XP for harder cards
        //     medium: 30,
        //     easy: 20
        // };

        // const xpGained = xpRewards[difficulty];
        // addEnergy(xpGained);

        // Show XP gain animation
        // setShowXPGain(true);
        // setTimeout(() => setShowXPGain(false), 2000);

        // Move to next card
        if (currentIndex < (flashcardSet?.flashcards.length || 0) - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        } else {
            // Restart from beginning
            setCurrentIndex(0);
            setIsFlipped(false);
        }
    };

    const currentCard = flashcardSet?.flashcards[currentIndex];

    if (isLoading) {
        return (
            <div className="flashcard-quick-view loading">
                <div className="card-header">
                    <div className="card-icon">
                        <Brain size={20} />
                    </div>
                    <h3 className="card-title">Flashcards</h3>
                </div>
                <div className="loading-content">
                    <Sparkles className="spinning" size={32} />
                    <p>Gerando...</p>
                </div>
            </div>
        );
    }

    if (!flashcardSet || !currentCard) {
        return (
            <div className="flashcard-quick-view empty">
                <div className="card-header">
                    <div className="card-icon">
                        <Brain size={20} />
                    </div>
                    <h3 className="card-title">Flashcards</h3>
                </div>
                <div className="empty-content">
                    <p>Nenhum flashcard disponível</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flashcard-quick-view">
            {/* XP Gain Animation */}


            <div className="card-header">
                <div className="card-icon purple">
                    <Brain size={20} />
                </div>
                <h3 className="card-title">Flashcards</h3>
            </div>

            <div className="quick-progress">
                <span className="progress-text">
                    {currentIndex + 1} / {flashcardSet.flashcards.length}
                </span>
                <div className="progress-bar">
                    <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{
                            width: `${((currentIndex + 1) / flashcardSet.flashcards.length) * 100}%`
                        }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            <div
                className={`mini-flashcard ${isFlipped ? 'flipped' : ''}`}
                onClick={handleFlip}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isFlipped ? 'answer' : 'question'}
                        initial={{ opacity: 0, rotateY: 90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: -90 }}
                        transition={{ duration: 0.2 }}
                        className="card-face"
                    >
                        <div className="face-label">
                            {isFlipped ? 'Resposta' : 'Pergunta'}
                        </div>
                        <div className="face-content">
                            {isFlipped ? currentCard.answer : currentCard.question}
                        </div>
                        <div className="flip-hint">
                            {isFlipped ? 'Como foi?' : 'Clique para ver'}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {isFlipped && (
                <motion.div
                    className="quick-actions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); handleAnswer(); }}
                        className="action-btn hard"
                        title="Difícil +50 XP"
                    >
                        😓
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleAnswer(); }}
                        className="action-btn medium"
                        title="Médio +30 XP"
                    >
                        😐
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleAnswer(); }}
                        className="action-btn easy"
                        title="Fácil +20 XP"
                    >
                        😊
                    </button>
                </motion.div>
            )}

            {onOpenFullView && (
                <button className="expand-btn" onClick={onOpenFullView}>
                    Ver Todos
                    <ChevronRight size={16} />
                </button>
            )}
        </div>
    );
};
