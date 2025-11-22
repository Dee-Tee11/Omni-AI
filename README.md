# Omni-AI - Sistema de Estudos com RAG e Flashcards

Sistema completo para estudantes que permite upload de PDFs, perguntas baseadas em RAG (Retrieval Augmented Generation), e geração automática de flashcards para revisão.

## 🚀 Tecnologias

### Backend
- **Node.js + TypeScript + Express**: API RESTful
- **pdf-parse + pdf-lib**: Processamento de PDFs (texto e imagens)
- **ChromaDB**: Vector database local para embeddings
- **Xenova Transformers**: Embeddings locais (all-MiniLM-L6-v2)
- **Groq SDK**: LLM para RAG e geração de flashcards (llama-3.3-70b)

### Frontend
- **React + TypeScript + Vite**: Interface moderna
- **React Router**: Navegação
- **Framer Motion**: Animações premium
- **Lucide React**: Ícones modernos
- **Axios**: Cliente HTTP

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Groq API Key ([obter aqui](https://console.groq.com))

## 🛠️ Instalação

### 1. Clone o repositório
```bash
cd Omni-AI
```

### 2. Configure o Backend

```bash
cd backend
npm install
```

Crie um arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```

Edite o `.env` e adicione sua Groq API Key:
```env
PORT=3000
GROQ_API_KEY=sua_api_key_aqui
CHROMA_PATH=./chroma_db
UPLOADS_PATH=./uploads
```

### 3. Configure o Frontend

```bash
cd ../frontend
npm install
```

## 🎯 Como Usar

### Iniciar o Backend
```bash
cd backend
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

### Iniciar o Frontend
Em outro terminal:
```bash
cd frontend
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📚 Funcionalidades

### 1. Upload de PDFs
- Drag & drop ou seleção de arquivo
- Extração automática de texto e imagens
- Divisão em chunks para processamento RAG
- Armazenamento em vector database

### 2. Chat RAG (Perguntas e Respostas)
- Faça perguntas sobre o conteúdo dos PDFs
- Respostas baseadas exclusivamente no conteúdo enviado
- Citações de fontes com número de página
- Interface premium estilo ChatGPT

### 3. Flashcards Automáticos
- Geração automática de flashcards a partir do texto
- Animação 3D de flip
- Sistema de revisão (Fácil/Médio/Difícil)
- Progress tracking

## 🎨 Design

- **Tema Dark Premium**: Cores vibrantes (#667eea, #764ba2)
- **Glassmorphism**: Efeitos de vidro fosco
- **Animações Suaves**: Micro-interações com Framer Motion
- **Tipografia**: Inter + Outfit (Google Fonts)
- **Responsivo**: Funciona em desktop, tablet e mobile

## 📁 Estrutura do Projeto

```
Omni-AI/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Express server
│   │   ├── services/
│   │   │   ├── pdfService.ts      # Processamento de PDF
│   │   │   ├── vectorService.ts   # ChromaDB + embeddings
│   │   │   ├── ragService.ts      # Sistema RAG
│   │   │   └── flashcardService.ts # Geração de flashcards
│   │   └── types/
│   │       └── index.ts       # TypeScript interfaces
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard.tsx        # Página principal
    │   │   ├── UploadZone.tsx       # Upload de PDFs
    │   │   ├── ChatInterface.tsx    # Interface RAG
    │   │   └── FlashcardViewer.tsx  # Visualizador de flashcards
    │   ├── services/
    │   │   └── api.ts           # Cliente HTTP
    │   ├── App.tsx              # Router principal
    │   ├── main.tsx             # Entry point
    │   └── index.css            # Design system
    └── package.json
```

## 🔧 API Endpoints

### Documentos
- `POST /api/upload` - Upload de PDF
- `GET /api/documents` - Listar documentos
- `GET /api/documents/:id` - Obter documento
- `DELETE /api/documents/:id` - Deletar documento

### RAG
- `POST /api/query` - Fazer pergunta
  ```json
  {
    "question": "...",
    "documentIds": ["..."], // opcional
    "topK": 5 // opcional
  }
  ```

### Flashcards
- `POST /api/flashcards/generate` - Gerar flashcards
  ```json
  {
    "documentId": "...",
    "count": 10, // opcional
    "includeImages": false // opcional
  }
  ```

- `POST /api/flashcards/:id/review` - Revisar flashcard
  ```json
  {
    "difficulty": "easy|medium|hard"
  }
  ```

### Estatísticas
- `GET /api/stats` - Obter estatísticas do sistema

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

MIT

---

Desenvolvido com ❤️ usando Groq, ChromaDB e React
