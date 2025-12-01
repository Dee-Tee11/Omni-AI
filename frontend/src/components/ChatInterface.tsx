import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Home, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askQuestion, type QueryResponse } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import './ChatInterface.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: QueryResponse['sources'];
}

interface ChatInterfaceProps {
  documentId?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ documentId: propDocumentId }) => {
  const [searchParams] = useSearchParams();
  const documentId = propDocumentId || searchParams.get('doc');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process inline markdown (bold, italic, code)
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

  // Format markdown content into structured JSX
  const formatMarkdownContent = (content: string) => {
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
          <h2 key={`h2-${i}`} className="chat-heading" dangerouslySetInnerHTML={processInlineMarkdown(line.substring(2))} />
        );
        i++;
        continue;
      }

      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="chat-subheading" dangerouslySetInnerHTML={processInlineMarkdown(line.substring(3))} />
        );
        i++;
        continue;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={`h4-${i}`} className="chat-subheading-small" dangerouslySetInnerHTML={processInlineMarkdown(line.substring(4))} />
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
          <ul key={`ul-${i}`} className="chat-list">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={processInlineMarkdown(item)} />
            ))}
          </ul>
        );
        continue;
      }

      // Check for numbered list
      if (line.match(/^\d+[\.\-\)]\s*/)) {
        const listItems: string[] = [];
        while (i < lines.length && lines[i].trim().match(/^\d+[\.\-\)]\s*/)) {
          const text = lines[i].trim().replace(/^\d+[\.\-\)]\s*/, '');
          listItems.push(text);
          i++;
        }
        elements.push(
          <ol key={`ol-${i}`} className="chat-list">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={processInlineMarkdown(item)} />
            ))}
          </ol>
        );
        continue;
      }

      // Regular paragraph
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
          <p key={`p-${i}`} className="chat-paragraph" dangerouslySetInnerHTML={processInlineMarkdown(paragraph)} />
        );
      }
    }

    return elements;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askQuestion(
        userMessage.content,
        documentId ? [documentId] : undefined
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Erro: ${error.response?.data?.error || error.message}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header glass">
        <div>
          <h1 className="gradient-text">Assistente de Estudos</h1>
          <p>Faça perguntas sobre seus documentos</p>
        </div>
        <Link to="/" className="btn btn-secondary">
          <Home size={20} />
          Dashboard
        </Link>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <Bot size={64} style={{ opacity: 0.5 }} />
            <h2>Olá! Como posso ajudar?</h2>
            <p>Faça perguntas sobre o conteúdo dos seus documentos PDF</p>
            <div className="suggestions">
              <button
                onClick={() => setInput('Resuma os principais conceitos do documento')}
                className="suggestion-chip"
              >
                Resumir documento
              </button>
              <button
                onClick={() => setInput('Quais são os pontos mais importantes?')}
                className="suggestion-chip"
              >
                Pontos importantes
              </button>
              <button
                onClick={() => setInput('Explique o tema principal')}
                className="suggestion-chip"
              >
                Tema principal
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} formatMarkdown={formatMarkdownContent} />
            ))}
          </AnimatePresence>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="message assistant"
          >
            <div className="message-avatar">
              <Bot size={24} />
            </div>
            <div className="message-content">
              <Loader2 className="spinning" size={20} />
              <span>Pensando...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form glass">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua pergunta..."
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="btn btn-primary send-btn"
        >
          <Send size={20} />
        </button>
      </form>

    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  formatMarkdown: (content: string) => JSX.Element[];
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, formatMarkdown }) => (
  <motion.div
    className={`message ${message.role}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
  >
    <div className="message-avatar">
      {message.role === 'user' ? <User size={24} /> : <Bot size={24} />}
    </div>
    <div className="message-content">
      {message.role === 'assistant' ? (
        <div className="formatted-content">{formatMarkdown(message.content)}</div>
      ) : (
        <div>{message.content}</div>
      )}
      {message.sources && message.sources.length > 0 && (
        <div className="sources">
          <div className="sources-title">
            <BookOpen size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Fontes consultadas
          </div>
          {message.sources.slice(0, 3).map((source) => (
            <div key={source.chunkId} className="source-item">
              📄 Página {source.pageNumber} · Similaridade: {(source.similarity * 100).toFixed(0)}%
            </div>
          ))}
        </div>
      )}
    </div>
  </motion.div>
);
