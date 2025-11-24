import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Brain, Trophy, Plus, Trash2, ChevronRight, Sparkles } from 'lucide-react';
import {
    getAllClasses, getClass, createClass, deleteClass,
    addDocumentToClass, getDocuments, generateFlashcards, generateQuiz,
    saveFlashcardSet, saveQuizSet, deleteFlashcardSet, deleteQuizSet,
    type Class, type ClassWithContent, type Document
} from '../services/api';
import './MyClasses.css';

const MyClasses: React.FC = () => {
    const navigate = useNavigate();
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
            const data = await getAllClasses();
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
            const classData = await getClass(classId);
            setSelectedClass(classData);
        } catch (error) {
            console.error('Error loading class:', error);
        }
    };

    const handleCreateClass = async () => {
        if (!newClassName.trim()) return;

        try {
            await createClass({
                name: newClassName,
                description: newClassDescription,
                color: newClassColor,
            });
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
            await deleteClass(classId);
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
            await addDocumentToClass(selectedClass.id, selectedDocId);
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

            const savedSet = await saveFlashcardSet({
                classId: selectedClass.id,
                documentId: documentId,
                name: `Flashcards - ${doc?.filename || 'Documento'}`,
                flashcards: flashcardSet.flashcards.map(f => ({
                    id: f.id,
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

            const savedSet = await saveQuizSet({
                classId: selectedClass.id,
                documentId: documentId,
                name: `Quiz - ${doc?.filename || 'Documento'}`,
                questions: quizSet.questions.map(q => ({
                    id: q.id,
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
            await deleteFlashcardSet(setId);
            handleSelectClass(selectedClass.id);
        } catch (error) {
            console.error('Error deleting flashcard set:', error);
            alert('Erro ao excluir flashcards');
        }
    };

    const handleDeleteQuizSet = async (setId: string) => {
        if (!selectedClass || !confirm('Tem certeza que deseja excluir este quiz?')) return;

        try {
            await deleteQuizSet(setId);
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
            <div className="classes-header">
                <h1><BookOpen size={32} /> Minhas Aulas</h1>
                <button className="btn-create" onClick={() => setShowCreateModal(true)}>
                    <Plus size={20} /> Nova Aula
                </button>
            </div>

            <div className="classes-layout">
                <div className="classes-sidebar">
                    {classes.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhuma aula criada ainda</p>
                            <button onClick={() => setShowCreateModal(true)}>
                                Criar primeira aula
                            </button>
                        </div>
                    ) : (
                        <div className="classes-list">
                            {classes.map((cls) => (
                                <div
                                    key={cls.id}
                                    className={`class-card ${selectedClass?.id === cls.id ? 'active' : ''}`}
                                    onClick={() => handleSelectClass(cls.id)}
                                >
                                    <div className="class-color" style={{ backgroundColor: cls.color }} />
                                    <div className="class-info">
                                        <h3>{cls.name}</h3>
                                        {cls.description && <p>{cls.description}</p>}
                                        <div className="class-stats">
                                            <span><FileText size={14} /> {cls.documentIds.length}</span>
                                            <span><Brain size={14} /> {cls.flashcardSetIds.length}</span>
                                            <span><Trophy size={14} /> {cls.quizSetIds.length}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn-delete-small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClass(cls.id);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="class-content">
                    {selectedClass ? (
                        <>
                            <div className="content-header">
                                <div>
                                    <h2>{selectedClass.name}</h2>
                                    {selectedClass.description && <p>{selectedClass.description}</p>}
                                </div>
                            </div>

                            <div className="content-sections">
                                <div className="content-section">
                                    <div className="section-header">
                                        <h3><FileText size={20} /> Documentos ({selectedClass.documentIds.length})</h3>
                                        <button className="btn-add-small" onClick={() => setShowAddDocModal(true)}>
                                            <Plus size={16} /> Adicionar
                                        </button>
                                    </div>
                                    {selectedClass.documentIds.length === 0 ? (
                                        <p className="empty-message">Nenhum documento adicionado</p>
                                    ) : (
                                        <div className="items-list">
                                            {selectedClass.documentIds.map((docId) => (
                                                <div key={docId} className="item-card-doc">
                                                    <FileText size={18} />
                                                    <span className="doc-name">{getDocumentName(docId)}</span>
                                                    <div className="doc-actions">
                                                        <button
                                                            className="btn-generate"
                                                            onClick={() => handleGenerateFlashcards(docId)}
                                                            disabled={generating}
                                                        >
                                                            <Brain size={14} /> Flashcards
                                                        </button>
                                                        <button
                                                            className="btn-generate"
                                                            onClick={() => handleGenerateQuiz(docId)}
                                                            disabled={generating}
                                                        >
                                                            <Trophy size={14} /> Quiz
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="content-section">
                                    <h3><Brain size={20} /> Flashcards ({selectedClass.flashcardSets.length})</h3>
                                    {selectedClass.flashcardSets.length === 0 ? (
                                        <p className="empty-message">Nenhum conjunto de flashcards criado</p>
                                    ) : (
                                        <div className="items-list">
                                            {selectedClass.flashcardSets.map((set) => (
                                                <div
                                                    key={set.id}
                                                    className="item-card"
                                                    onClick={() => navigate(`/flashcards?setId=${set.id}`)}
                                                >
                                                    <Brain size={18} />
                                                    <div className="item-info">
                                                        <strong>{set.name}</strong>
                                                        <small>{set.flashcards.length} cards</small>
                                                    </div>
                                                    <div className="item-actions">
                                                        <button
                                                            className="btn-delete-small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteFlashcardSet(set.id);
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="content-section">
                                    <h3><Trophy size={20} /> Quizzes ({selectedClass.quizSets.length})</h3>
                                    {selectedClass.quizSets.length === 0 ? (
                                        <p className="empty-message">Nenhum quiz criado</p>
                                    ) : (
                                        <div className="items-list">
                                            {selectedClass.quizSets.map((set) => (
                                                <div
                                                    key={set.id}
                                                    className="item-card"
                                                    onClick={() => navigate(`/quiz?setId=${set.id}`)}
                                                >
                                                    <Trophy size={18} />
                                                    <div className="item-info">
                                                        <strong>{set.name}</strong>
                                                        <small>
                                                            {set.questions.length} questões
                                                            {set.bestScore && ` • Melhor: ${set.bestScore}%`}
                                                        </small>
                                                    </div>
                                                    <div className="item-actions">
                                                        <button
                                                            className="btn-delete-small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteQuizSet(set.id);
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-selection">
                            <BookOpen size={64} />
                            <p>Selecione uma aula para ver o conteúdo</p>
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

            {generating && (
                <div className="generating-overlay">
                    <div className="generating-spinner">
                        <Sparkles size={48} className="spin" />
                        <p>Gerando conteúdo...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyClasses;
