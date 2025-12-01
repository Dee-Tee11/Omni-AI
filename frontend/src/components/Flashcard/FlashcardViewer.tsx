import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Plus, Brain, Loader2, FileText, Play } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import sanitizeHtml from 'sanitize-html';
import { useAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '../../lib/supabase';
import { supabaseFlashcardService } from '../../services/supabaseFlashcardService';
import { supabaseClassService } from '../../services/supabaseClassService';
import { generateFlashcards, getDocuments, Document, type Class, type FlashcardSet } from '../../services/api';
import { autoSaveFlashcardsToClass } from '../../services/classHelpers';
import './FlashcardViewer.css';

interface FlashcardViewerProps {
  documentId?: string;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ documentId: propDocumentId }) => {
  const [searchParams] = useSearchParams();
  const urlDocumentId = searchParams.get('doc');
  const urlSetId = searchParams.get('setId');
  const { getToken } = useAuth();

  const getClient = async () => {
    return await createClerkSupabaseClient(getToken);
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcardsStarted, setFlashcardsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [flashcardSet, setFlashcardSet] = useState<any>(null);
  const [flashcardCount, setFlashcardCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // State for Save to Class
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');



  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (propDocumentId || urlDocumentId) {
      setSelectedDocumentId(propDocumentId || urlDocumentId || '');
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
      const client = await getClient();
      const savedSet = await supabaseFlashcardService.getFlashcardSet(client, setId);

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
      const client = await getClient();
      await autoSaveFlashcardsToClass(client, selectedDocumentId, cards);
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

  const handleReview = () => {
    // Award XP based on difficulty
    // const xpReward = difficulty === 'hard' ? 30 : difficulty === 'medium' ? 20 : 10;
    // addEnergy(xpReward);

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
    if (!selectedClassId || !flashcardSet) return;

    try {
      const client = await getClient();
      await supabaseFlashcardService.saveFlashcardSet(client, {
        classId: selectedClassId,
        documentId: flashcardSet.documentId,
        name: `Flashcards - ${flashcardSet.documentName}`,
        flashcards: flashcardSet.flashcards.map(f => ({
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
                        <div className="card-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentCard.question) }} />
                        <div className="flip-hint">Clique para ver a resposta</div>
                      </div>
                      <div className="flashcard-back">
                        <div className="card-label">Resposta</div>
                        <div className="card-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentCard.answer) }} />
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
                    onClick={() => handleReview()}
                    className="review-btn hard"
                    title="Difícil"
                  >
                    Difícil
                  </button>
                  <button
                    onClick={() => handleReview()}
                    className="review-btn medium"
                    title="Médio"
                  >
                    Médio
                  </button>
                  <button
                    onClick={() => handleReview()}
                    className="review-btn easy"
                    title="Fácil"
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
            </div >
          </>
        ) : null}

        {
          showSaveModal && (
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
          )
        }

      </div >
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

    </div>
  );
};
