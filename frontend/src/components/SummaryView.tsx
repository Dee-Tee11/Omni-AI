import React, { useState, useEffect } from 'react';
import { FileText, RotateCcw, Loader2 } from 'lucide-react';
import './SummaryView.css';

interface SummaryViewProps {
    documentId: string;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ documentId }) => {
    const [summary, setSummary] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSummary();
    }, [documentId]);

    const loadSummary = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // TODO: Implement API call to generate summary
            // For now, using mock data
            await new Promise(resolve => setTimeout(resolve, 1500));

            const mockSummary = `
## Principais Conceitos

**Sistema de Gestão de Base de Dados (SGBD)**

Um SGBD é uma aplicação ou programa informático que gere o acesso e a manipulação de dados armazenados numa base de dados.

### Características Principais:

- **Servem múltiplas aplicações**: Os dados podem ser partilhados por diferentes aplicações
- **Gestão centralizada**: Sistema de gestão centralizado de dados
- **Segurança**: Controlo de acesso e permissões
- **Integridade**: Garantia de consistência dos dados
- **Recuperação**: Mecanismos de backup e restore

### Tipos de SGBD:

1. **Relacionais**: Baseados em tabelas (SQL)
2. **NoSQL**: Documentos, chave-valor, grafos
3. **Em memória**: Para alta performance
4. **Distribuídos**: Para grande escala

### Aplicações Práticas:

Os sistemas de gestão de bases de dados são utilizados em praticamente todas as aplicações modernas, desde websites simples até sistemas empresariais complexos.
      `.trim();

            setSummary(mockSummary);
        } catch (err: any) {
            setError('Erro ao gerar resumo');
            console.error('Error loading summary:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="summary-view loading">
                <div className="card-header">
                    <div className="card-icon green">
                        <FileText size={20} />
                    </div>
                    <h3 className="card-title">Resumo</h3>
                </div>
                <div className="loading-content">
                    <Loader2 className="spinning" size={32} />
                    <p>Gerando resumo...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="summary-view error">
                <div className="card-header">
                    <div className="card-icon green">
                        <FileText size={20} />
                    </div>
                    <h3 className="card-title">Resumo</h3>
                </div>
                <div className="error-content">
                    <p>{error}</p>
                    <button className="retry-btn" onClick={loadSummary}>
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="summary-view">
            <div className="card-header">
                <div className="card-icon green">
                    <FileText size={20} />
                </div>
                <h3 className="card-title">Resumo do Documento</h3>
                <button
                    className="reload-btn"
                    onClick={loadSummary}
                    title="Regenerar Resumo"
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            <div className="summary-content">
                <div className="summary-text">
                    {summary.split('\n').map((line, index) => {
                        // Handle markdown-style formatting
                        if (line.startsWith('## ')) {
                            return <h2 key={index} className="summary-h2">{line.replace('## ', '')}</h2>;
                        }
                        if (line.startsWith('### ')) {
                            return <h3 key={index} className="summary-h3">{line.replace('### ', '')}</h3>;
                        }
                        if (line.startsWith('**') && line.endsWith('**')) {
                            return <p key={index} className="summary-bold">{line.replace(/\*\*/g, '')}</p>;
                        }
                        if (line.startsWith('- ')) {
                            return <li key={index} className="summary-li">{line.replace('- ', '')}</li>;
                        }
                        if (line.match(/^\d+\./)) {
                            return <li key={index} className="summary-li numbered">{line}</li>;
                        }
                        if (line.trim() === '') {
                            return <div key={index} className="summary-spacer" />;
                        }
                        return <p key={index} className="summary-p">{line}</p>;
                    })}
                </div>
            </div>
        </div>
    );
};
