import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadZone } from './UploadZone';
import { FlashcardViewer } from './FlashcardViewer';
import { StudyTabs } from './StudyTabs';
import { ChatInterface } from './ChatInterface';
import CivilizationPath from './CivilizationPath';
import { useGamification } from '../context/GamificationContext';
import { Book, Archive, Hammer, Plus, FileText, Trash2, X } from 'lucide-react';
import { getDocuments, deleteDocument, type Document } from '../services/api';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const { currentEra, civilizationXP } = useGamification();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (doc: any) => {
    setActiveDocument(doc);
    setShowUpload(false);
    loadDocuments();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      try {
        await deleteDocument(id);
        loadDocuments();
        if (activeDocument?.id === id) {
          setActiveDocument(null);
        }
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1>Olá, Explorador!</h1>
          <p>Vamos construir a tua civilização hoje.</p>
        </div>
        <div className="dashboard-xp-badge">
          {currentEra} • {civilizationXP} XP
        </div>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">

        {/* Center Hero - Builder's Kit */}
        <div className="builders-kit-card">
          <div className="builders-kit-gradient" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="builders-kit-content"
          >
            {!activeDocument ? (
              <>
                <div className="kit-icon-container">
                  <Hammer size={64} className="kit-icon" />
                </div>
                <h2>Kit de Construção</h2>
                <p>
                  Selecione um documento da lista ou faça upload de um novo para começar a estudar.
                </p>

                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className="add-document-btn"
                >
                  <Plus size={20} />
                  Adicionar Documento
                </button>
              </>
            ) : (
              <div style={{ width: '100%' }}>
                <div className="active-document-header">
                  <button
                    onClick={() => setActiveDocument(null)}
                    className="back-btn"
                  >
                    ← Voltar para o Kit
                  </button>
                  <h2 className="document-title">
                    {activeDocument.filename}
                  </h2>
                </div>
                <div className="document-viewer-single">
                  <ChatInterface documentId={activeDocument.id} />
                </div>
              </div>
            )}
          </motion.div>

          {/* Upload Modal Overlay */}
          {showUpload && (
            <div className="upload-modal-overlay">
              <div className="upload-modal-content">
                <UploadZone onUploadSuccess={handleUploadSuccess} />
                <button
                  onClick={() => setShowUpload(false)}
                  className="cancel-btn"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Cards */}
        <div className="sidebar-column">
          {/* My Documents List */}
          <div className="documents-card">
            <div className="card-header">
              <div className="card-icon">
                <Book size={20} />
              </div>
              <h3 className="card-title">Minhas Aulas</h3>
            </div>

            <div className="documents-list">
              {isLoading ? (
                <p className="loading-text">Carregando...</p>
              ) : documents.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum documento ainda.</p>
                  <p>Faça upload para começar!</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setActiveDocument(doc)}
                    className={`document-item ${activeDocument?.id === doc.id ? 'active' : ''}`}
                  >
                    <div className="document-content">
                      <div className="document-icon">
                        <FileText size={18} />
                      </div>
                      <div className="document-info">
                        <p className="document-name">
                          {doc.filename}
                        </p>
                        <p className="document-date">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, doc.id)}
                      className="delete-btn"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Study Tabs: Flashcards, Quiz, Resumo */}
          {activeDocument && (
            <StudyTabs
              documentId={activeDocument.id}
              onOpenFlashcardModal={() => setShowFlashcardModal(true)}
            />
          )}

          {/* Time Capsule */}
          <div className="time-capsule-card">
            <div className="card-header">
              <div className="card-icon blue">
                <Archive size={20} />
              </div>
              <h3 className="card-title">Cápsula do Tempo</h3>
            </div>
            <div className="capsule-content">
              <span className="capsule-text">Histórico de estudo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard Modal */}
      <AnimatePresence>
        {showFlashcardModal && activeDocument && (
          <motion.div
            className="flashcard-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFlashcardModal(false)}
          >
            <motion.div
              className="flashcard-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close-btn"
                onClick={() => setShowFlashcardModal(false)}
              >
                <X size={24} />
              </button>
              <FlashcardViewer documentId={activeDocument.id} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Section - Civilization Path */}
      <section className="civilization-section">
        <h3 className="section-title">Caminho da Civilização</h3>
        <CivilizationPath />
      </section>
    </div>
  );
};

export default Dashboard;
