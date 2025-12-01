import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UploadZone } from './UploadZone';
import { FlashcardViewer } from './Flashcard/FlashcardViewer';
import { QuizView } from './Quiz/QuizView';
import { StudyTabs, TabType } from './StudyTabs';
import { ChatInterface } from './ChatInterface';
import { Book, Plus, FileText, Trash2 } from 'lucide-react';
import { getDocuments, deleteDocument, type Document } from '../services/api';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<TabType>('chat');

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
    setViewMode('chat');
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
          <h1>Lexis</h1>
          <p>O teu assistente de estudo inteligente.</p>
        </div>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">

        {/* Center Hero - Study Area */}
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
                  <Book size={64} className="kit-icon" />
                </div>
                <h2>Área de Estudo</h2>
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
                    ← Voltar
                  </button>
                  <h2 className="document-title">
                    {activeDocument.filename}
                  </h2>
                </div>
                <div className="document-viewer-single">
                  {viewMode === 'chat' && <ChatInterface documentId={activeDocument.id} />}
                  {viewMode === 'flashcards' && <FlashcardViewer documentId={activeDocument.id} />}
                  {viewMode === 'quiz' && <QuizView documentId={activeDocument.id} />}
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
                    onClick={() => {
                      setActiveDocument(doc);
                      setViewMode('chat');
                    }}
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

          {/* Study Tabs: Flashcards, Quiz, Chat */}
          {activeDocument && (
            <StudyTabs
              activeTab={viewMode}
              onTabChange={setViewMode}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
