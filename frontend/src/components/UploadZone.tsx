import React, { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadDocument, type Document } from '../services/api';
import './UploadZone.css';

interface UploadZoneProps {
    onUploadSuccess?: (document: Document) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUploadSuccess }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFile = async (file: File) => {
        if (file.type !== 'application/pdf') {
            setError('Apenas arquivos PDF são aceitos');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setError('Arquivo muito grande (máx: 50MB)');
            return;
        }

        setError(null);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const document = await uploadDocument(file);

            clearInterval(progressInterval);
            setUploadProgress(100);
            setUploadedFile(file.name);

            setTimeout(() => {
                setIsUploading(false);
                setUploadedFile(null);
                setUploadProgress(0);
                onUploadSuccess?.(document);
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao fazer upload');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            await processFile(file);
        }
    }, []);

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await processFile(file);
        }
    };

    return (
        <div className="upload-zone-container">
            <motion.div
                className={`upload-zone glass ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                animate={{
                    scale: isDragging ? 1.02 : 1,
                    borderColor: isDragging ? 'var(--color-accent-primary)' : 'var(--glass-border)'
                }}
                transition={{ duration: 0.2 }}
            >
                <input
                    type="file"
                    id="file-input"
                    accept=".pdf"
                    onChange={handleFileInput}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                />

                <AnimatePresence mode="wait">
                    {isUploading ? (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="upload-content"
                        >
                            {uploadProgress === 100 ? (
                                <>
                                    <CheckCircle2 size={64} className="upload-icon success" />
                                    <h3>Upload Concluído!</h3>
                                    <p>{uploadedFile}</p>
                                </>
                            ) : (
                                <>
                                    <Loader2 size={64} className="upload-icon spinning" />
                                    <h3>Processando PDF...</h3>
                                    <div className="progress-bar">
                                        <motion.div
                                            className="progress-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${uploadProgress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    <p>{uploadProgress}%</p>
                                </>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="upload-content"
                        >
                            <Upload size={64} className="upload-icon" />
                            <h3>Arraste seu PDF aqui</h3>
                            <p>ou clique para selecionar</p>
                            <label htmlFor="file-input" className="btn btn-primary">
                                <FileText size={20} />
                                Escolher Arquivo
                            </label>
                            <span className="upload-hint">PDF · Máx 50MB</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="error-message"
                    >
                        <X size={20} />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};
