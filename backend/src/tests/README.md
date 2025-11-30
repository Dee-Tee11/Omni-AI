# 🧪 Tests Directory

Testes organizados por categoria para facilitar manutenção e execução.

## 📁 Estrutura

### `semantic/` - Testes de Semantic Chunking
Testes específicos para a funcionalidade de chunking semântico:
- `test-chunking-logic.ts` - Testa a lógica de chunking diretamente (sem PDF)
- `test-semantic-chunking.ts` - Teste end-to-end com criação de PDF

**Como executar:**
```bash
# Teste direto da lógica
npx tsx src/tests/semantic/test-chunking-logic.ts

# Teste com PDF
npx tsx src/tests/semantic/test-semantic-chunking.ts
```

---

### `integration/` - Testes de Integração
Testes que verificam o fluxo completo do sistema:
- `test-upload.ts` - Upload de PDF e processamento
- `test-query.ts` - Queries sobre documentos
- `test-retrieval.ts` - Recuperação de chunks do vector DB
- `test-gemini.ts` - Integração com Gemini API

**Como executar:**
```bash
# Upload de PDF
npx tsx src/tests/integration/test-upload.ts

# Query
npx tsx src/tests/integration/test-query.ts

# Retrieval
npx tsx src/tests/integration/test-retrieval.ts

# Gemini
npx tsx src/tests/integration/test-gemini.ts
```

---

### `debug/` - Scripts de Debug e Análise
Ferramentas para análise e depuração:
- `debug-semantic.ts` - Analisa scores de similaridade entre frases
- `debug-query.ts` - Debug de queries e resultados

**Como executar:**
```bash
# Análise de similaridade
npx tsx src/tests/debug/debug-semantic.ts

# Debug de queries
npx tsx src/tests/debug/debug-query.ts
```

---

### `utils/` - Utilitários de Manutenção
Scripts para manutenção do database:
- `cleanup-chunks.ts` - Limpa chunks do database
- `inspect-chunks.ts` - Inspeciona chunks armazenados
- `repair-chunks.ts` - Repara chunks com problemas

**Como executar:**
```bash
# Limpeza
npx tsx src/tests/utils/cleanup-chunks.ts

# Inspeção
npx tsx src/tests/utils/inspect-chunks.ts

# Reparação
npx tsx src/tests/utils/repair-chunks.ts
```

---

## 🎯 Fluxo de Teste Recomendado

### 1️⃣ Desenvolvimento de Features
```bash
# Testar semantic chunking isoladamente
npx tsx src/tests/semantic/test-chunking-logic.ts
```

### 2️⃣ Testes de Integração
```bash
# Upload → Query → Verificar resposta
npx tsx src/tests/integration/test-upload.ts
npx tsx src/tests/integration/test-query.ts
```

### 3️⃣ Debug quando necessário
```bash
# Analisar similaridades
npx tsx src/tests/debug/debug-semantic.ts
```

### 4️⃣ Manutenção
```bash
# Limpar database após testes
npx tsx src/tests/utils/cleanup-chunks.ts
```

---

## ⚙️ Configuração

Todos os testes usam as mesmas variáveis de ambiente do backend:
- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `COHERE_API_KEY`

Certifica-te que o `.env` está configurado corretamente no diretório `backend/`.
