import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Loader2, BookOpen, Calendar, Eye } from 'lucide-react';
import { getDocuments, generateSummary, type Document } from '../../services/api';
import './SummariesView.css';

interface Summary {
    id: string;
    documentId: string;
    documentName: string;
    content: string;
    createdAt: string;
}

export const SummariesView: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
    const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDocuments();
        loadSummaries();
    }, []);

    const loadDocuments = async () => {
        try {
            const docs = await getDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSummaries = () => {
        try {
            const saved = localStorage.getItem('summaries');
            if (saved) {
                setSummaries(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading summaries:', error);
        }
    };

    const handleGenerateSummary = async () => {
        if (!selectedDocumentId) return;

        setIsGenerating(true);
        try {
            const doc = documents.find(d => d.id === selectedDocumentId);
            const result = await generateSummary(selectedDocumentId);

            const newSummary: Summary = {
                id: Date.now().toString(),
                documentId: selectedDocumentId,
                documentName: doc?.filename || 'Documento',
                content: result.summary,
                createdAt: new Date().toISOString()
            };

            const updatedSummaries = [newSummary, ...summaries];
            setSummaries(updatedSummaries);
            localStorage.setItem('summaries', JSON.stringify(updatedSummaries));
            setSelectedSummary(newSummary);
        } catch (error) {
            console.error('Error generating summary:', error);
            alert('Erro ao gerar resumo. Por favor, tente novamente.');
        } finally {
            setIsGenerating(false);
        }
    };

    const processInlineMarkdown = (text: string) => {
        // Process bold (**text** or __text__)
        let processed = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        processed = processed.replace(/__(.+?)__/g, '<strong>$1</strong>');

        // Process italic (*text* or _text_)
        processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
        processed = processed.replace(/_(.+?)_/g, '<em>$1</em>');

        // Process inline code (`code`)
        processed = processed.replace(/`(.+?)`/g, '<code>$1</code>');

        return { __html: processed };
    };

    const formatSummaryContent = (content: string) => {
        // First, normalize line breaks and split content
        const normalized = content.replace(/\r\n/g, '\n');
        const lines = normalized.split('\n');

        const elements: JSX.Element[] = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();

            // Skip empty lines
            if (!line) {
                i++;
                continue;
            }

            // Check for headings
            if (line.startsWith('# ')) {
                elements.push(
                    <h2 key={`h2-${i}`} className="summary-heading" dangerouslySetInnerHTML={processInlineMarkdown(line.substring(2))} />
                );
                i++;
                continue;
            }

            if (line.startsWith('## ')) {
                elements.push(
                    <h3 key={`h3-${i}`} className="summary-subheading" dangerouslySetInnerHTML={processInlineMarkdown(line.substring(3))} />
                );
                i++;
                continue;
            }

            if (line.startsWith('### ')) {
                elements.push(
                    <h4 key={`h4-${i}`} className="summary-subheading-small" dangerouslySetInnerHTML={processInlineMarkdown(line.substring(4))} />
                );
                i++;
                continue;
            }

            // Check for bullet list
            if (line.startsWith('- ')) {
                const listItems: string[] = [];
                while (i < lines.length && lines[i].trim().startsWith('- ')) {
                    listItems.push(lines[i].trim().substring(2));
                    i++;
                }
                elements.push(
                    <ul key={`ul-${i}`} className="summary-list">
                        {listItems.map((item, idx) => (
                            <li key={idx} dangerouslySetInnerHTML={processInlineMarkdown(item)} />
                        ))}
                    </ul>
                );
                continue;
            }

            // Check for numbered list (more flexible regex)
            if (line.match(/^\d+[\.\-\)]\s*/)) {
                const listItems: string[] = [];
                while (i < lines.length && lines[i].trim().match(/^\d+[\.\-\)]\s*/)) {
                    // Remove the number and separator
                    const text = lines[i].trim().replace(/^\d+[\.\-\)]\s*/, '');
                    listItems.push(text);
                    i++;
                }
                elements.push(
                    <ol key={`ol-${i}`} className="summary-list">
                        {listItems.map((item, idx) => (
                            <li key={idx} dangerouslySetInnerHTML={processInlineMarkdown(item)} />
                        ))}
                    </ol>
                );
                continue;
            }

            // Regular paragraph - collect consecutive non-empty lines
            let paragraph = line;
            i++;
            while (i < lines.length && lines[i].trim() &&
                !lines[i].trim().startsWith('#') &&
                !lines[i].trim().startsWith('- ') &&
                !lines[i].trim().match(/^\d+[\.\-\)]\s*/)) {
                paragraph += ' ' + lines[i].trim();
                i++;
            }

            if (paragraph) {
                elements.push(
                    <p key={`p-${i}`} className="summary-paragraph" dangerouslySetInnerHTML={processInlineMarkdown(paragraph)} />
                );
            }
        }

        return elements;
    };

    if (loading) {
        return (
            <div className="summaries-container">
                <div className="loading-state">
                    <Loader2 className="spinning" size={48} />
                    <p>Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="summaries-container">
            <div className="summaries-header">
                <div className="title-group">
                    <BookOpen size={32} strokeWidth={2.5} />
                    <h1>Resumos Inteligentes</h1>
                </div>
                <p className="subtitle">Gere resumos automáticos dos seus documentos com IA</p>
            </div>

            <div className="summaries-layout">
                {/* Left Panel: Generate Summary */}
                <div className="generate-panel">
                    <h2 className="panel-title">Gerar Novo Resumo</h2>

                    <div className="documents-list">
                        {documents.length === 0 ? (
                            <div className="empty-message">
                                Nenhum documento encontrado
                            </div>
                        ) : (
                            documents.map(doc => (
                                <div
                                    key={doc.id}
                                    className={`document-item ${selectedDocumentId === doc.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedDocumentId(doc.id)}
                                >
                                    <FileText size={18} />
                                    <div className="doc-info">
                                        <div className="doc-name">{doc.filename}</div>
                                        <div className="doc-meta">
                                            {doc.pageCount} páginas • {new Date(doc.uploadDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        className="generate-btn"
                        onClick={handleGenerateSummary}
                        disabled={!selectedDocumentId || isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="spinning" size={20} />
                                Gerando Resumo...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Gerar Resumo
                            </>
                        )}
                    </button>
                </div>

                {/* Right Panel: Summaries List & Viewer */}
                <div className="summaries-main">
                    {selectedSummary ? (
                        <div className="summary-viewer">
                            <div className="summary-header">
                                <button
                                    className="back-btn"
                                    onClick={() => setSelectedSummary(null)}
                                >
                                    ← Voltar
                                </button>
                                <h2>{selectedSummary.documentName}</h2>
                                <div className="summary-date">
                                    <Calendar size={16} />
                                    {new Date(selectedSummary.createdAt).toLocaleDateString('pt-PT', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>

                            <div className="summary-content">
                                {formatSummaryContent(selectedSummary.content)}
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="panel-title">Meus Resumos ({summaries.length})</h2>

                            {summaries.length === 0 ? (
                                <div className="empty-state">
                                    <BookOpen size={64} strokeWidth={1} />
                                    <h3>Nenhum resumo ainda</h3>
                                    <p>Selecione um documento à esquerda e gere o seu primeiro resumo!</p>
                                </div>
                            ) : (
                                <div className="summaries-grid">
                                    {summaries.map(summary => (
                                        <div
                                            key={summary.id}
                                            className="summary-card"
                                            onClick={() => setSelectedSummary(summary)}
                                        >
                                            <div className="card-icon">
                                                <FileText size={24} />
                                            </div>
                                            <h3>{summary.documentName}</h3>
                                            <p className="summary-preview">
                                                {summary.content.substring(0, 150)}...
                                            </p>
                                            <div className="card-footer">
                                                <span className="date">
                                                    <Calendar size={14} />
                                                    {new Date(summary.createdAt).toLocaleDateString()}
                                                </span>
                                                <button className="view-btn">
                                                    <Eye size={16} />
                                                    Ver Resumo
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
