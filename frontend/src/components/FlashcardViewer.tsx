import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Home, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateFlashcards, type Flashcard, type FlashcardSet } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';

interface FlashcardViewerProps {
  documentId?: string;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ documentId: propDocumentId }) => {
  const [searchParams] = useSearchParams();
  const documentId = propDocumentId || searchParams.get('doc');

  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (documentId) {
      generateCards();
    }
  }, [documentId]);

  const generateCards = async () => {
    if (!documentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const cards = await generateFlashcards(documentId, 10);
      setFlashcardSet(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao gerar flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (!flashcardSet || currentIndex >= flashcardSet.flashcards.length - 1) return;
    setCurrentIndex(prev => prev + 1);
    setIsFlipped(false);
  };

  const handlePrevious = () => {
    if (currentIndex <= 0) return;
    setCurrentIndex(prev => prev - 1);
    setIsFlipped(false);
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const handleReview = (difficulty: 'easy' | 'medium' | 'hard') => {
    console.log(`Reviewed as: ${difficulty}`);
    if (currentIndex < (flashcardSet?.flashcards.length || 0) - 1) {
      handleNext();
    }
  };

  const currentCard = flashcardSet?.flashcards[currentIndex];

  return (
    <div className="flashcard-container">
      <div className="flashcard-header glass">
        <div>
          <h1 className="gradient-text">Flashcards de Estudo</h1>
          <p>{flashcardSet?.documentName || 'Carregando...'}</p>
        </div>
        <div className="header-actions">
          <button onClick={generateCards} disabled={isLoading} className="btn btn-secondary">
            <RotateCcw size={20} />
            Regenerar
          </button>
          {documentId && (
            <Link to={`/chat?doc=${documentId}`} className="btn btn-primary">
              <Sparkles size={20} />
              Chat com IA
            </Link>
          )}
          <Link to="/" className="btn btn-secondary">
            <Home size={20} />
            Dashboard
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flashcard-loading">
          <Loader2 className="spinning" size={64} />
          <h2>Gerando flashcards...</h2>
          <p>Analisando o documento e criando perguntas de estudo</p>
        </div>
      ) : error ? (
        <div className="flashcard-error glass">
          <h2>Erro ao gerar flashcards</h2>
          <p>{error}</p>
          <button onClick={generateCards} className="btn btn-primary">
            Tentar Novamente
          </button>
        </div>
      ) : flashcardSet && currentCard ? (
        <>
          <div className="flashcard-progress">
            <div className="progress-text">
              Cartão {currentIndex + 1} de {flashcardSet.flashcards.length}
            </div>
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

          <div className="flashcard-viewer">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="flashcard-wrapper"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={`flashcard ${isFlipped ? 'flipped' : ''}`}
                  onClick={handleFlip}
                >
                  <div className="flashcard-inner">
                    <div className="flashcard-front">
                      <div className="card-label">Pergunta</div>
                      <div className="card-content">
                        {currentCard.question}
                      </div>
                      <div className="flip-hint">Clique para ver a resposta</div>
                    </div>
                    <div className="flashcard-back">
                      <div className="card-label">Resposta</div>
                      <div className="card-content">
                        {currentCard.answer}
                      </div>
                      <div className="flip-hint">Clique para voltar</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flashcard-controls">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="btn btn-secondary control-btn"
              >
                <ChevronLeft size={20} />
                Anterior
              </button>

              <div className="review-buttons">
                <button
                  onClick={() => handleReview('hard')}
                  className="review-btn hard"
                  title="Difícil - Revisar em breve"
                >
                  Difícil
                </button>
                <button
                  onClick={() => handleReview('medium')}
                  className="review-btn medium"
                  title="Médio - Revisar em alguns dias"
                >
                  Médio
                </button>
                <button
                  onClick={() => handleReview('easy')}
                  className="review-btn easy"
                  title="Fácil - Revisar em uma semana"
                >
                  Fácil
                </button>
              </div>

              <button
                onClick={handleNext}
                disabled={currentIndex >= flashcardSet.flashcards.length - 1}
                className="btn btn-secondary control-btn"
              >
                Próximo
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flashcard-empty glass">
          <Sparkles size={64} style={{ opacity: 0.5 }} />
          <h2>Nenhum flashcard gerado</h2>
          <p>Selecione um documento no dashboard para gerar flashcards</p>
          <Link to="/" className="btn btn-primary">
            Ir para Dashboard
          </Link>
        </div>
      )}

      <style>{`
        .flashcard-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 1.5rem;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .flashcard-header {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .flashcard-header h1 {
          font-size: 2rem;
          margin: 0;
        }

        .flashcard-header p {
          color: var(--color-text-secondary);
          margin: 0.25rem 0 0;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .flashcard-loading,
        .flashcard-error,
        .flashcard-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          text-align: center;
          padding: 3rem;
        }

        .flashcard-loading h2,
        .flashcard-error h2,
        .flashcard-empty h2 {
          margin: 0;
        }

        .flashcard-loading p,
        .flashcard-error p,
        .flashcard-empty p {
          color: var(--color-text-secondary);
          margin: 0;
        }

        .flashcard-progress {
          text-align: center;
        }

        .progress-text {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.5rem;
        }

        .progress-bar {
          height: 6px;
          background: var(--color-bg-tertiary);
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--color-accent-gradient);
          border-radius: 999px;
        }

        .flashcard-viewer {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .flashcard-wrapper {
          flex: 1;
          perspective: 1000px;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .flashcard {
          width: 100%;
          height: 400px;
          position: relative;
          cursor: pointer;
        }

        .flashcard.flipped .flashcard-inner {
          transform: rotateY(180deg);
        }

        .flashcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }

        .flashcard-front,
        .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem;
          background: var(--color-bg-secondary);
          border: 2px solid var(--glass-border);
          border-radius: var(--radius-xl);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
        }

        .flashcard-front {
            z-index: 2;
            transform: rotateY(0deg);
        }

        .flashcard-back {
          transform: rotateY(180deg);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)), var(--color-bg-secondary);
        }

        .card-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-accent-primary);
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-content {
          font-size: 1.5rem;
          font-weight: 500;
          text-align: center;
          line-height: 1.6;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .flip-hint {
          font-size: 0.8125rem;
          color: var(--color-text-tertiary);
          margin-top: 1.5rem;
        }

        .flashcard-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
          justify-content: space-between;
        }

        .control-btn {
          min-width: 120px;
        }

        .review-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .review-btn {
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-md);
          border: 2px solid;
          background: transparent;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .review-btn.hard {
          border-color: var(--color-error);
          color: var(--color-error);
        }

        .review-btn.hard:hover {
          background: var(--color-error);
          color: white;
        }

        .review-btn.medium {
          border-color: var(--color-warning);
          color: var(--color-warning);
        }

        .review-btn.medium:hover {
          background: var(--color-warning);
          color: white;
        }

        .review-btn.easy {
          border-color: var(--color-success);
          color: var(--color-success);
        }

        .review-btn.easy:hover {
          background: var(--color-success);
          color: white;
        }

        @media (max-width: 768px) {
          .flashcard-container {
            padding: 1rem;
          }

          .flashcard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .flashcard {
            height: 350px;
          }

          .flashcard-controls {
            flex-direction: column;
          }

          .review-buttons {
            width: 100%;
            justify-content: space-between;
          }

          .review-btn {
            flex: 1;
            padding: 0.75rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};
