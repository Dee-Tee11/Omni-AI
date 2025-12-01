import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Brain, Trophy, Plus, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '../lib/supabase';
import { supabaseClassService } from '../services/supabaseClassService';
import { supabaseFlashcardService } from '../services/supabaseFlashcardService';
import { supabaseQuizService } from '../services/supabaseQuizService';
import {
    getDocuments, generateFlashcards, generateQuiz,
    type Class, type ClassWithContent, type Document
} from '../services/api';
import './MyClasses.css';

const MyClasses: React.FC = () => {
    const navigate = useNavigate();
    const { getToken, userId } = useAuth();

    // Helper to get authenticated client
    const getClient = async () => {
        return await createClerkSupabaseClient(getToken);
    };

    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassWithContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddDocModal, setShowAddDocModal] = useState(false);
    const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string>('');
    const [generating, setGenerating] = useState(false);

    const [newClassName, setNewClassName] = useState('');
    const [newClassDescription, setNewClassDescription] = useState('');
    const [newClassColor, setNewClassColor] = useState('#10b981');

    useEffect(() => {
        loadClasses();
        loadDocuments();
    }, []);

    const loadClasses = async () => {
        try {
            setLoading(true);
            const client = await getClient();
            const data = await supabaseClassService.getAllClasses(client);
            setClasses(data);
        } catch (error) {
            console.error('Error loading classes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDocuments = async () => {
        try {
            const docs = await getDocuments();
            setAvailableDocuments(docs);
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    };

    const handleSelectClass = async (classId: string) => {
        try {
            const client = await getClient();
            const classData = await supabaseClassService.getClass(client, classId);
            setSelectedClass(classData);
        } catch (error) {
            console.error('Error loading class:', error);
        }
    };

    const handleCreateClass = async () => {
        if (!newClassName.trim() || !userId) return;

        try {
            const client = await getClient();
            await supabaseClassService.createClass(client, {
                name: newClassName,
                description: newClassDescription,
                color: newClassColor,
            }, userId);
            setNewClassName('');
            setNewClassDescription('');
            setNewClassColor('#10b981');
            setShowCreateModal(false);
            loadClasses();
        } catch (error) {
            console.error('Error creating class:', error);
        }
    };

    const handleDeleteClass = async (classId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta aula?')) return;

        try {
            const client = await getClient();
            await supabaseClassService.deleteClass(client, classId);
            if (selectedClass?.id === classId) {
                setSelectedClass(null);
            }
            loadClasses();
        } catch (error) {
            console.error('Error deleting class:', error);
        }
    };

    const handleAddDocument = async () => {
        if (!selectedClass || !selectedDocId) return;

        try {
            const client = await getClient();
            await supabaseClassService.addDocumentToClass(client, selectedClass.id, selectedDocId);
            setShowAddDocModal(false);
            setSelectedDocId('');
            handleSelectClass(selectedClass.id);
            loadClasses();
        } catch (error) {
            console.error('Error adding document:', error);
            alert('Erro ao adicionar documento');
        }
    };

    const handleGenerateFlashcards = async (documentId: string) => {
        if (!selectedClass) return;

        try {
            setGenerating(true);
            const doc = availableDocuments.find(d => d.id === documentId);

            const flashcardSet = await generateFlashcards(documentId, 10);

            const client = await getClient();
            const savedSet = await supabaseFlashcardService.saveFlashcardSet(client, {
                classId: selectedClass.id,
                documentId: documentId,
                name: `Flashcards - ${doc?.filename || 'Documento'}`,
                flashcards: flashcardSet.flashcards.map(f => ({
                    front: f.question,
                    back: f.answer,
                }))
            });

            // alert('Flashcards gerados e guardados com sucesso!');
            navigate(`/flashcards?setId=${savedSet.id}`);
        } catch (error) {
            console.error('Error generating flashcards:', error);
            alert('Erro ao gerar flashcards');
            setGenerating(false);
        }
    };

    const handleGenerateQuiz = async (documentId: string) => {
        if (!selectedClass) return;

        try {
            setGenerating(true);
            const doc = availableDocuments.find(d => d.id === documentId);

            const quizSet = await generateQuiz(documentId, 10, 'mixed');

            const client = await getClient();
            const savedSet = await supabaseQuizService.saveQuizSet(client, {
                classId: selectedClass.id,
                documentId: documentId,
                name: `Quiz - ${doc?.filename || 'Documento'}`,
                questions: quizSet.questions.map(q => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctIndex,
                    explanation: q.explanation,
                }))
            });

            // alert('Quiz gerado e guardado com sucesso!');
            navigate(`/quiz?setId=${savedSet.id}`);
        } catch (error) {
            console.error('Error generating quiz:', error);
            alert('Erro ao gerar quiz');
            setGenerating(false);
        }
    };

    const handleDeleteFlashcardSet = async (setId: string) => {
        if (!selectedClass || !confirm('Tem certeza que deseja excluir este conjunto de flashcards?')) return;

        try {
            const client = await getClient();
            await supabaseFlashcardService.deleteFlashcardSet(client, setId);
            handleSelectClass(selectedClass.id);
        } catch (error) {
            console.error('Error deleting flashcard set:', error);
            alert('Erro ao excluir flashcards');
        }
    };

    const handleDeleteQuizSet = async (setId: string) => {
        if (!selectedClass || !confirm('Tem certeza que deseja excluir este quiz?')) return;

        try {
            const client = await getClient();
            await supabaseQuizService.deleteQuizSet(client, setId);
            handleSelectClass(selectedClass.id);
        } catch (error) {
            console.error('Error deleting quiz set:', error);
            alert('Erro ao excluir quiz');
        }
    };

    const colors = [
        '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
        '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'
    ];

    const getDocumentName = (docId: string) => {
        const doc = availableDocuments.find(d => d.id === docId);
        return doc?.filename || `Documento ${docId.slice(0, 8)}`;
    };

    if (loading) {
        return (
            <div className="my-classes-container">
                <div className="loading">Carregando aulas...</div>
            </div>
        );
    }

    return (
        <div className="my-classes-container">
            {/* Header Section */}
            <div className="classes-header">
                <div className="title-group">
                    <div className="title">
                        <BookOpen size={32} strokeWidth={2.5} />
                        <h1>Minhas Aulas</h1>
                    </div>
                    <p className="subtitle">Gerencie suas aulas e conteúdos de estudo</p>
                </div>
                <button className="btn-create" onClick={() => setShowCreateModal(true)}>
                    <Plus size={20} /> Nova Aula
                </button>
            </div>

            <div className="content-grid">
                {/* Left Panel: Classes List */}
                <div className="classes-panel">
                    <h2 className="panel-title">Aulas Disponíveis</h2>

                    <div className="classes-list">
                        {classes.length === 0 ? (
                            <div className="text-gray-400 text-center py-4">
                                Nenhuma aula encontrada
                            </div>
                        ) : (
                            classes.map((cls) => (
                                <div
                                    key={cls.id}
                                    className={`class-item ${selectedClass?.id === cls.id ? 'selected' : ''}`}
                                    onClick={() => handleSelectClass(cls.id)}
                                >
                                    <div className="class-color-indicator" style={{ backgroundColor: cls.color }} />
                                    <div className="class-info-compact">
                                        <div className="class-name">{cls.name}</div>
                                        <div className="class-stats-compact">
                                            <span><FileText size={12} /> {cls.documentIds.length}</span>
                                            <span><Brain size={12} /> {cls.flashcardSetIds.length}</span>
                                            <span><Trophy size={12} /> {cls.quizSetIds.length}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn-delete-icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClass(cls.id);
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Main Area */}
                <div className="main-area">
                    {generating && (
                        <div className="loading-overlay">
                            <Loader2 className="spinning" size={48} />
                            <h3 className="text-xl font-bold text-gray-800">Gerando conteúdo...</h3>
                            <p className="text-gray-500">Aguarde um momento</p>
                        </div>
                    )}

                    {selectedClass ? (
                        <div className="class-details-container">
                            {/* Header removed as per user request to show content immediately */}

                            <div className="content-sections-grid">
                                {/* Documents Section */}
                                <div className="content-section-card">
                                    <div className="section-header">
                                        <h3><FileText size={20} /> Documentos ({selectedClass.documentIds.length})</h3>
                                        <button className="btn-add-small" onClick={() => setShowAddDocModal(true)}>
                                            <Plus size={16} /> Adicionar
                                        </button>
                                    </div>
                                    <div className="items-list-scroll">
                                        {selectedClass.documentIds.length === 0 ? (
                                            <p className="empty-message">Nenhum documento</p>
                                        ) : (
                                            selectedClass.documentIds.map((docId) => (
                                                <div key={docId} className="item-card-doc">
                                                    <div className="doc-info">
                                                        <FileText size={18} />
                                                        <span className="doc-name">{getDocumentName(docId)}</span>
                                                    </div>
                                                    <div className="doc-actions">
                                                        <button
                                                            className="btn-action"
                                                            onClick={() => handleGenerateFlashcards(docId)}
                                                            disabled={generating}
                                                            title="Gerar Flashcards"
                                                        >
                                                            <Brain size={14} />
                                                        </button>
                                                        <button
                                                            className="btn-action"
                                                            onClick={() => handleGenerateQuiz(docId)}
                                                            disabled={generating}
                                                            title="Gerar Quiz"
                                                        >
                                                            <Trophy size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Flashcards Section */}
                                <div className="content-section-card">
                                    <h3><Brain size={20} /> Flashcards ({selectedClass.flashcardSets.length})</h3>
                                    <div className="items-list-scroll">
                                        {selectedClass.flashcardSets.length === 0 ? (
                                            <p className="empty-message">Nenhum flashcard</p>
                                        ) : (
                                            selectedClass.flashcardSets.map((set) => (
                                                <div
                                                    key={set.id}
                                                    className="item-card"
                                                    onClick={() => navigate(`/flashcards?setId=${set.id}`)}
                                                >
                                                    <div className="item-icon"><Brain size={18} /></div>
                                                    <div className="item-info">
                                                        <strong>{set.name}</strong>
                                                        <small>{set.flashcards.length} cards</small>
                                                    </div>
                                                    <button
                                                        className="btn-delete-icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteFlashcardSet(set.id);
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Quizzes Section */}
                                <div className="content-section-card">
                                    <h3><Trophy size={20} /> Quizzes ({selectedClass.quizSets.length})</h3>
                                    <div className="items-list-scroll">
                                        {selectedClass.quizSets.length === 0 ? (
                                            <p className="empty-message">Nenhum quiz</p>
                                        ) : (
                                            selectedClass.quizSets.map((set) => (
                                                <div
                                                    key={set.id}
                                                    className="item-card"
                                                    onClick={() => navigate(`/quiz?setId=${set.id}`)}
                                                >
                                                    <div className="item-icon"><Trophy size={18} /></div>
                                                    <div className="item-info">
                                                        <strong>{set.name}</strong>
                                                        <small>{set.questions.length} questões</small>
                                                    </div>
                                                    <button
                                                        className="btn-delete-icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteQuizSet(set.id);
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-selection-state">
                            <BookOpen size={80} strokeWidth={1} className="empty-icon" />
                            <h2 className="empty-title">Selecione uma aula</h2>
                            <p className="empty-desc">
                                Escolha uma aula da lista à esquerda para ver seus documentos, flashcards e quizzes.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Nova Aula</h2>
                        <div className="form-group">
                            <label>Nome da Aula *</label>
                            <input
                                type="text"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="Ex: Matemática, História..."
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>Descrição (opcional)</label>
                            <textarea
                                value={newClassDescription}
                                onChange={(e) => setNewClassDescription(e.target.value)}
                                placeholder="Adicione uma descrição..."
                                rows={3}
                            />
                        </div>
                        <div className="form-group">
                            <label>Cor</label>
                            <div className="color-picker">
                                {colors.map((color) => (
                                    <button
                                        key={color}
                                        className={`color-option ${newClassColor === color ? 'selected' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewClassColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                                Cancelar
                            </button>
                            <button className="btn-confirm" onClick={handleCreateClass} disabled={!newClassName.trim()}>
                                Criar Aula
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAddDocModal && (
                <div className="modal-overlay" onClick={() => setShowAddDocModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Adicionar Documento</h2>
                        <div className="form-group">
                            <label>Selecione um documento</label>
                            <select
                                value={selectedDocId}
                                onChange={(e) => setSelectedDocId(e.target.value)}
                                className="doc-select"
                            >
                                <option value="">-- Escolha um documento --</option>
                                {availableDocuments
                                    .filter(doc => !selectedClass?.documentIds.includes(doc.id))
                                    .map(doc => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.filename} ({doc.pageCount} páginas)
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowAddDocModal(false)}>
                                Cancelar
                            </button>
                            <button
                                className="btn-confirm"
                                onClick={handleAddDocument}
                                disabled={!selectedDocId}
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyClasses;
