import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Home, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askQuestion, type QueryResponse } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';

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

      <style>{`
        .chat-container {
          max-width: 1000px;
          margin: 0 auto;
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          gap: 1.5rem;
        }

        .chat-header {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header h1 {
          font-size: 2rem;
          margin: 0;
        }

        .chat-header p {
          color: var(--color-text-secondary);
          margin: 0.25rem 0 0;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 0 0.5rem;
        }

        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          text-align: center;
        }

        .chat-empty h2 {
          margin: 0;
        }

        .chat-empty p {
          color: var(--color-text-secondary);
          margin: 0;
        }

        .suggestions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        .suggestion-chip {
          padding: 0.625rem 1.25rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 999px;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 0.875rem;
        }

        .suggestion-chip:hover {
          background: var(--color-bg-tertiary);
          border-color: var(--color-accent-primary);
          color: var(--color-text-primary);
        }

        .message {
          display: flex;
          gap: 1rem;
          animation: fadeIn 0.3s ease-out;
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message.user .message-avatar {
          background: var(--color-accent-gradient);
        }

        .message.assistant .message-avatar {
          background: var(--color-bg-tertiary);
          color: var(--color-accent-primary);
        }

        .message-content {
          flex: 1;
          padding: 1rem 1.25rem;
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          line-height: 1.6;
        }

        .message.user .message-content {
          background: var(--color-bg-tertiary);
        }

        .message.assistant .message-content {
          border: 1px solid var(--glass-border);
        }

        /* Markdown Formatting Styles */
        .formatted-content {
          line-height: 1.8;
          color: #374151;
        }

        .chat-heading {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin: 1.5rem 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #10b981;
          line-height: 1.4;
        }

        .chat-heading:first-child {
          margin-top: 0;
        }

        .chat-subheading {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 1.25rem 0 0.75rem 0;
          line-height: 1.4;
        }

        .chat-subheading-small {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.4;
        }

        .chat-paragraph {
          font-size: 1rem;
          line-height: 1.8;
          color: #4b5563;
          margin: 0 0 1rem 0;
        }

        .chat-list {
          margin: 0.75rem 0 1rem 1.5rem;
          padding-left: 0.5rem;
        }

        .chat-list li {
          font-size: 1rem;
          line-height: 1.8;
          color: #4b5563;
          margin-bottom: 0.5rem;
          padding-left: 0.25rem;
        }

        .chat-list li::marker {
          color: #10b981;
          font-weight: 700;
        }

        /* Inline Markdown Styles */
        .formatted-content strong {
          font-weight: 700;
          color: #1f2937;
        }

        .formatted-content em {
          font-style: italic;
          color: #374151;
        }

        .formatted-content code {
          background-color: #f3f4f6;
          color: #dc2626;
          padding: 0.15rem 0.35rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.9em;
        }

        .sources {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--glass-border);
        }

        .sources-title {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.5rem;
        }

        .source-item {
          font-size: 0.8125rem;
          color: var(--color-text-tertiary);
          padding: 0.5rem;
          background: var(--glass-bg);
          border-radius: var(--radius-sm);
          margin-top: 0.5rem;
        }

        .chat-input-form {
          padding: 1rem;
          display: flex;
          gap: 0.75rem;
        }

        .chat-input-form input {
          flex: 1;
        }

        .send-btn {
          padding: 0.75rem 1.25rem;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .chat-container {
            padding: 1rem;
          }

          .chat-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .chat-heading {
            font-size: 1.25rem;
          }

          .chat-paragraph {
            font-size: 0.95rem;
          }
        }
      `}</style>
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
          {message.sources.slice(0, 3).map((source, idx) => (
            <div key={source.chunkId} className="source-item">
              📄 Página {source.pageNumber} · Similaridade: {(source.similarity * 100).toFixed(0)}%
            </div>
          ))}
        </div>
      )}
    </div>
  </motion.div>
);
