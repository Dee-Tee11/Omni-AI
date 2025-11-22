import React, { useState, useEffect } from 'react';
import { FileText, Brain, Sparkles, TrendingUp, Upload as UploadIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { UploadZone } from './UploadZone';
import { getDocuments, getStats, type Document } from '../services/api';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [showUpload, setShowUpload] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [docs, statsData] = await Promise.all([
                getDocuments(),
                getStats(),
            ]);
            setDocuments(docs);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleUploadSuccess = () => {
        setShowUpload(false);
        loadData();
    };

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1 className="gradient-text">Omni-AI</h1>
                    <p>Sistema Inteligente de Estudos</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowUpload(!showUpload)}
                >
                    <UploadIcon size={20} />
                    {showUpload ? 'Ocultar Upload' : 'Novo Documento'}
                </button>
            </header>

            {showUpload && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="upload-section"
                >
                    <UploadZone onUploadSuccess={handleUploadSuccess} />
                </motion.div>
            )}

            <div className="stats-grid">
                <StatCard
                    icon={<FileText size={32} />}
                    title="Documentos"
                    value={stats?.totalDocuments || 0}
                    color="var(--color-accent-primary)"
                />
                <StatCard
                    icon={<Brain size={32} />}
                    title="Chunks Processados"
                    value={stats?.totalChunks || 0}
                    color="var(--color-info)"
                />
                <StatCard
                    icon={<Sparkles size={32} />}
                    title="Pronto para RAG"
                    value={documents.length > 0 ? 'Sim' : 'Não'}
                    color="var(--color-success)"
                />
                <StatCard
                    icon={<TrendingUp size={32} />}
                    title="Taxa de Sucesso"
                    value="100%"
                    color="var(--color-accent-secondary)"
                />
            </div>

            <section className="documents-section">
                <h2>Seus Documentos</h2>
                {documents.length === 0 ? (
                    <div className="empty-state glass">
                        <FileText size={48} style={{ opacity: 0.5 }} />
                        <h3>Nenhum documento enviado</h3>
                        <p>Faça upload do seu primeiro PDF para começar</p>
                        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
                            <UploadIcon size={20} />
                            Fazer Upload
                        </button>
                    </div>
                ) : (
                    <div className="documents-grid">
                        {documents.map((doc, idx) => (
                            <DocumentCard key={doc.id} document={doc} index={idx} />
                        ))}
                    </div>
                )}
            </section>

            <style>{`
        .dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-content h1 {
          font-size: 3rem;
          margin: 0;
        }

        .header-content p {
          color: var(--color-text-secondary);
          margin: 0.5rem 0 0;
        }

        .upload-section {
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .documents-section h2 {
          margin-bottom: 1.5rem;
        }

        .documents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .empty-state h3 {
          margin: 0;
        }

        .empty-state p {
          color: var(--color-text-secondary);
          margin: 0;
        }

        @media (max-width: 768px) {
          .dashboard {
            padding: 1rem;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
        </div>
    );
};

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => (
    <motion.div
        className="stat-card glass"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
    >
        <div className="stat-icon" style={{ color }}>
            {icon}
        </div>
        <div className="stat-content">
            <h4>{title}</h4>
            <p className="stat-value">{value}</p>
        </div>
        <style>{`
      .stat-card {
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        cursor: default;
      }

      .stat-icon {
        flex-shrink: 0;
      }

      .stat-content h4 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-secondary);
      }

      .stat-value {
        margin: 0.25rem 0 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--color-text-primary);
      }
    `}</style>
    </motion.div>
);

interface DocumentCardProps {
    document: Document;
    index: number;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, index }) => (
    <motion.div
        className="document-card card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
    >
        <div className="document-header">
            <FileText size={32} className="document-icon" />
            <h3>{document.filename}</h3>
        </div>
        <div className="document-meta">
            <span>{document.pageCount} páginas</span>
            <span>{document.chunkCount} chunks</span>
            {document.imageCount > 0 && <span>{document.imageCount} imagens</span>}
        </div>
        <div className="document-actions">
            <Link to={`/chat?doc=${document.id}`} className="btn btn-primary">
                <Brain size={18} />
                Fazer Perguntas
            </Link>
            <Link to={`/flashcards?doc=${document.id}`} className="btn btn-secondary">
                <Sparkles size={18} />
                Gerar Flashcards
            </Link>
        </div>
        <style>{`
      .document-card {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .document-header {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .document-icon {
        color: var(--color-accent-primary);
        flex-shrink: 0;
      }

      .document-header h3 {
        margin: 0;
        font-size: 1.125rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .document-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }

      .document-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: auto;
      }

      .document-actions .btn {
        flex: 1;
        font-size: 0.875rem;
        padding: 0.625rem 1rem;
      }
    `}</style>
    </motion.div>
);
