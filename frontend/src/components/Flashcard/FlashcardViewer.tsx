import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Brain, Sparkles, Loader2, FileText, Play, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateFlashcards, getDocuments, getAllClasses, saveFlashcardSet, type FlashcardSet, type Document, type Class } from '../../services/api';
import { autoSaveFlashcardsToClass } from '../../services/classHelpers';
import { useSearchParams } from 'react-router-dom';
import { useGamification } from '../../context/GamificationContext';

interface FlashcardViewerProps {
  documentId?: string;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ documentId: propDocumentId }) => {
  const [searchParams] = useSearchParams();
  const urlDocumentId = searchParams.get('doc');
  const urlSetId = searchParams.get('setId');

  // State for Selection Mode
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(propDocumentId || urlDocumentId);
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);

  // State for Flashcard Mode
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcardsStarted, setFlashcardsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Save to Class
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const { addEnergy, currentEra, civilizationXP } = useGamification();

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (propDocumentId || urlDocumentId) {
      setSelectedDocumentId(propDocumentId || urlDocumentId);
    }
  }, [propDocumentId, urlDocumentId]);

  // Load saved flashcard set if setId is present
  useEffect(() => {
    if (urlSetId) {
      loadSavedFlashcards(urlSetId);
    }
  }, [urlSetId]);

  const loadSavedFlashcards = async (setId: string) => {
    try {
      setIsGenerating(true);
      const savedSet = await import('../../services/api').then(m => m.getFlashcardSet(setId));

      if (savedSet && savedSet.flashcards) {
        // Map saved flashcards to FlashcardSet format
        const mappedSet: FlashcardSet = {
          documentId: savedSet.documentId,
          documentName: savedSet.name, // Use set name as document name or fetch doc name
          createdAt: savedSet.createdAt,
          flashcards: savedSet.flashcards.map(f => ({
            id: f.id,
            question: f.front,
            answer: f.back,
            documentId: savedSet.documentId
          }))
        };

        setFlashcardSet(mappedSet);
        setFlashcardsStarted(true);
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch (err: any) {
      console.error('Error loading saved flashcards:', err);
      setError('Erro ao carregar flashcards salvos.');
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

  const handleStartFlashcards = async () => {
    if (!selectedDocumentId) return;

    setIsGenerating(true);
    setError(null);

    try {
      const cards = await generateFlashcards(selectedDocumentId, flashcardCount);
      setFlashcardSet(cards);
      setFlashcardsStarted(true);
      setCurrentIndex(0);
      setIsFlipped(false);

      // Auto-save to class if document belongs to one
      await autoSaveFlashcardsToClass(selectedDocumentId, cards);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao gerar flashcards');
    } finally {
      setIsGenerating(false);
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
    // Award XP based on difficulty
    const xpReward = difficulty === 'hard' ? 30 : difficulty === 'medium' ? 20 : 10;
    addEnergy(xpReward);

    if (currentIndex < (flashcardSet?.flashcards.length || 0) - 1) {
      handleNext();
    }
  };

  const handleRestart = () => {
    setFlashcardsStarted(false);
    setFlashcardSet(null);
  };

  const loadClasses = async () => {
    try {
      const data = await getAllClasses();
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
    if (!selectedClassId || !flashcardSet) return;

    try {
      await saveFlashcardSet({
        classId: selectedClassId,
        documentId: flashcardSet.documentId,
        name: `Flashcards - ${flashcardSet.documentName}`,
        flashcards: flashcardSet.flashcards.map(f => ({
          id: f.id,
          front: f.question,
          back: f.answer,
        }))
      });
      alert('Flashcards salvos na aula com sucesso!');
      setShowSaveModal(false);
    } catch (error) {
      console.error('Error saving to class:', error);
      alert('Erro ao salvar flashcards na aula');
    }
  };

  const currentCard = flashcardSet?.flashcards[currentIndex];

  // Render Flashcard Mode (Active Flashcards)
  if (flashcardsStarted && flashcardSet) {
    return (
      <div className="flashcard-container">
        <div className="flashcard-header glass">
          <div>
            <h1 className="gradient-text">Flashcards de Estudo</h1>
            <p>{flashcardSet.documentName}</p>
          </div>
          <div className="header-actions">
            <button onClick={handleOpenSaveModal} className="btn btn-primary">
              <Plus size={20} />
              Salvar na Aula
            </button>
            <button onClick={handleRestart} className="btn btn-secondary">
              <RotateCcw size={20} />
              Voltar
            </button>
          </div>
        </div>

        {error ? (
          <div className="flashcard-error glass">
            <h2>Erro ao gerar flashcards</h2>
            <p>{error}</p>
            <button onClick={handleStartFlashcards} className="btn btn-primary">
              Tentar Novamente
            </button>
          </div>
        ) : currentCard ? (
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
                    title="Difícil - +30 XP"
                  >
                    Difícil
                  </button>
                  <button
                    onClick={() => handleReview('medium')}
                    className="review-btn medium"
                    title="Médio - +20 XP"
                  >
                    Médio
                  </button>
                  <button
                    onClick={() => handleReview('easy')}
                    className="review-btn easy"
                    title="Fácil - +10 XP"
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
        ) : null}

        {showSaveModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Salvar Flashcards na Aula</h2>
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
            background: linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 100%);
            border-radius: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }

          .flashcard-header h1 {
            font-size: 2rem;
            margin: 0;
            color: #0369A1;
            font-weight: 800;
          }

          .gradient-text {
            background: linear-gradient(135deg, #0369A1, #0284C7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .flashcard-header p {
            color: #075985;
            margin: 0.25rem 0 0;
            opacity: 0.8;
          }

          .header-actions {
            display: flex;
            gap: 0.75rem;
          }

          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-size: 1rem;
          }

          .btn-primary {
            background: linear-gradient(135deg, #0369A1 0%, #0284C7 100%);
            color: white;
            box-shadow: 0 4px 6px rgba(3, 105, 161, 0.2);
          }

          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(3, 105, 161, 0.3);
          }

          .btn-secondary {
            background: #F3F4F6;
            color: #374151;
          }

          .btn-secondary:hover {
            background: #E5E7EB;
          }

          .btn-secondary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .flashcard-error {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            text-align: center;
            padding: 3rem;
            background: #FEF2F2;
            border-radius: 24px;
          }

          .flashcard-error h2 {
            margin: 0;
            color: #991B1B;
          }

          .flashcard-error p {
            color: #DC2626;
            margin: 0;
          }

          .flashcard-progress {
            text-align: center;
          }

          .progress-text {
            font-size: 0.875rem;
            color: #6B7280;
            margin-bottom: 0.5rem;
            font-weight: 500;
          }

          .progress-bar {
            height: 8px;
            background: #E5E7EB;
            border-radius: 999px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(135deg, #0369A1, #0284C7);
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
            background: white;
            border: 2px solid #E5E7EB;
            border-radius: 24px;
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
          }

          .flashcard-front {
            z-index: 2;
            transform: rotateY(0deg);
          }

          .flashcard-back {
            transform: rotateY(180deg);
            background: linear-gradient(135deg, rgba(3, 105, 161, 0.05), rgba(2, 132, 199, 0.05)), white;
          }

          .card-label {
            font-size: 0.875rem;
            font-weight: 700;
            color: #0369A1;
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
            color: #1F2937;
          }

          .flip-hint {
            font-size: 0.8125rem;
            color: #9CA3AF;
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
            border-radius: 12px;
            border: 2px solid;
            background: transparent;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .review-btn.hard {
            border-color: #EF4444;
            color: #EF4444;
          }

          .review-btn.hard:hover {
            background: #EF4444;
            color: white;
          }

          .review-btn.medium {
            border-color: #F59E0B;
            color: #F59E0B;
          }

          .review-btn.medium:hover {
            background: #F59E0B;
            color: white;
          }

          .review-btn.easy {
            border-color: #10B981;
            color: #10B981;
          }

          .review-btn.easy:hover {
            background: #10B981;
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

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
          }

          .modal-content {
            background: white;
            border-radius: 1rem;
            padding: 2rem;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          .modal-content h2 {
            margin: 0 0 1.5rem 0;
            font-size: 1.5rem;
            color: #1f2937;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #374151;
            font-size: 0.9rem;
          }

          .class-select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
            font-size: 1rem;
            transition: all 0.2s;
            font-family: inherit;
            background: white;
          }

          .class-select:focus {
            outline: none;
            border-color: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
          }

          .modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 2rem;
          }
        `}</style>
      </div>
    );
  }

  // Render Selection Mode (New Layout)
  return (
    <div className="flashcard-selection-container">
      {/* Header Section */}
      <div className="flashcard-selection-header">
        <div className="title-group">
          <div className="title">
            <Brain size={32} strokeWidth={2.5} />
            <h1>Flashcards de Estudo</h1>
          </div>
          <p className="subtitle">Selecione um documento e comece a estudar</p>
        </div>

        <div className="xp-badge">
          <Sparkles size={18} fill="currentColor" />
          <span>{currentEra} • {civilizationXP} XP</span>
        </div>
      </div>

      <div className="content-grid">
        {/* Left Panel: Documents & Settings */}
        <div className="documents-panel">
          <h2 className="panel-title">Meus Documentos</h2>

          <div className="count-selector">
            <span className="selector-label">Número de Flashcards:</span>
            <div className="count-options">
              {[5, 10, 15, 20].map(count => (
                <button
                  key={count}
                  className={`count-btn ${flashcardCount === count ? 'active' : ''}`}
                  onClick={() => setFlashcardCount(count)}
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
        <div className="main-area">
          {isGenerating && (
            <div className="loading-overlay">
              <Loader2 className="spinning" size={48} />
              <h3 className="text-xl font-bold text-gray-800">Gerando Flashcards...</h3>
              <p className="text-gray-500">Nossa IA está criando perguntas de estudo</p>
            </div>
          )}

          {selectedDocumentId ? (
            <>
              <div className="mb-8">
                <div className="icon-circle">
                  <FileText size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {documents.find(d => d.id === selectedDocumentId)?.filename || 'Documento Selecionado'}
                </h2>
                <p className="text-gray-500">
                  Pronto para estudar? Vamos gerar {flashcardCount} flashcards sobre este conteúdo.
                </p>
              </div>

              <button className="start-btn" onClick={handleStartFlashcards}>
                <Play size={24} fill="currentColor" />
                Começar Estudo
              </button>
            </>
          ) : (
            <>
              <Brain size={80} strokeWidth={1} className="empty-icon" />
              <h2 className="empty-title">Selecione um documento</h2>
              <p className="empty-desc">
                Escolha um documento da lista à esquerda e o número de flashcards para começar a estudar.
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        .flashcard-selection-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 1rem;
          height: calc(100vh - 100px);
          max-width: 1400px;
          margin: 0 auto;
        }

        .flashcard-selection-header {
          background: linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 100%);
          border-radius: 24px;
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          flex-shrink: 0;
        }

        .title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .title h1 {
          font-size: 2rem;
          font-weight: 800;
          color: #0369A1;
          margin: 0;
        }

        .subtitle {
          color: #075985;
          opacity: 0.8;
          font-size: 1rem;
          font-weight: 500;
          margin: 0;
        }

        .xp-badge {
          background: #10B981;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 0.875rem;
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 2rem;
          flex: 1;
          min-height: 0;
        }

        .documents-panel {
          background: white;
          border-radius: 24px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #F3F4F6;
        }

        .panel-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1F2937;
          margin: 0;
        }

        .count-selector {
          background: #F0F9FF;
          padding: 1.25rem;
          border-radius: 16px;
          border: 1px solid #E0F2FE;
        }

        .selector-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 700;
          color: #0369A1;
          margin-bottom: 1rem;
        }

        .count-options {
          display: flex;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .count-btn {
          flex: 1;
          padding: 0.75rem 0;
          border-radius: 10px;
          border: 1px solid #BAE6FD;
          background: white;
          color: #075985;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .count-btn:hover {
          background: #F0F9FF;
          border-color: #0284C7;
        }

        .count-btn.active {
          background: #0369A1;
          color: white;
          border-color: #0369A1;
          box-shadow: 0 4px 6px rgba(3, 105, 161, 0.2);
          transform: translateY(-1px);
        }

        .documents-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          overflow-y: auto;
          padding-right: 0.5rem;
          flex: 1;
        }

        .documents-list::-webkit-scrollbar {
          width: 6px;
        }

        .documents-list::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 3px;
        }

        .documents-list::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 3px;
        }

        .document-item {
          padding: 1rem;
          border-radius: 12px;
          background: white;
          border: 1px solid #E5E7EB;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .document-item:hover {
          border-color: #7DD3FC;
          background: #F0F9FF;
        }

        .document-item.selected {
          background: #F0F9FF;
          border-color: #0369A1;
          box-shadow: 0 0 0 1px #0369A1;
        }

        .doc-name {
          font-weight: 600;
          color: #374151;
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doc-date {
          font-size: 0.75rem;
          color: #9CA3AF;
          display: flex;
          justify-content: space-between;
        }

        .main-area {
          background: white;
          border-radius: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          border: 1px solid #F3F4F6;
        }

        .loading-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
          backdrop-filter: blur(4px);
        }

        .spinning {
          animation: spin 1s linear infinite;
          color: #0369A1;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .icon-circle {
          width: 96px;
          height: 96px;
          background: #E0F2FE;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: #0369A1;
        }

        .start-btn {
          margin-top: 2.5rem;
          background: linear-gradient(135deg, #0369A1 0%, #0284C7 100%);
          color: white;
          padding: 1.25rem 4rem;
          border-radius: 16px;
          font-weight: 700;
          font-size: 1.25rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 15px -3px rgba(3, 105, 161, 0.3);
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .start-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 20px 25px -5px rgba(3, 105, 161, 0.4);
        }

        .empty-icon {
          color: #E5E7EB;
          margin-bottom: 2rem;
        }

        .empty-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1F2937;
          margin-bottom: 0.75rem;
        }

        .empty-desc {
          color: #6B7280;
          font-size: 1.1rem;
          max-width: 400px;
          line-height: 1.5;
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
          }

          .documents-panel {
            max-height: 400px;
          }
        }
      `}</style>
    </div>
  );
};
