# 🎯 Guia de Melhorias do Sistema RAG (ChatInterface)

## 🏗️ Stack Tecnológica Atual

- **LLM**: Google Gemini 2.5 Pro
- **Vector Database**: Supabase pgvector
- **Embeddings**: Cohere `embed-multilingual-v3.0`
- **Backend**: Node.js + Express + TypeScript
**Implementação atual**:
```typescript
// vectorService.ts
const { data: matchDocuments, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.3,  // Base threshold
    match_count: topK,
    filter_user_id: userId
});

// Filter by document_id if specified
if (documentIds && documentIds.length > 0) {
    results = results.filter((doc: any) =>
        documentIds.includes(doc.document_id)
    );
}
```

**Próximo nível (opcional)**:
- Implementar threshold dinâmico baseado no best score
- Adicionar percentile-based filtering

---

### **2️⃣ ALTA PRIORIDADE: Chunk Overlap**

**Problema**: Contexto importante é "cortado" nas bordas dos chunks.

**Solução**:
```typescript
// pdfService.ts - createPageChunks
const TARGET_CHUNK_SIZE = 800; // palavras
const OVERLAP = 150; // ~20% overlap

for (let i = 0; i < words.length; i += (TARGET_CHUNK_SIZE - OVERLAP)) {
    const chunkWords = words.slice(i, i + TARGET_CHUNK_SIZE);
    // ... criar chunk
}
```

**Benefício**:
- ✅ Melhor continuidade contextual
- ✅ Menos informação perdida entre chunks
- ✅ Respostas mais completas

---

### **3️⃣ MÉDIA PRIORIDADE: Reranking com Cohere**

Usar Cohere Rerank API para melhorar ordem dos chunks:

```typescript
import { CohereClient } from 'cohere-ai';

async rerankChunks(query: string, chunks: Chunk[]): Promise<Chunk[]> {
    const reranked = await cohere.rerank({
        model: 'rerank-multilingual-v3.0',
        query: query,
        documents: chunks.map(c => c.content),
        top_n: 5
    });
    
    return reranked.results.map(r => chunks[r.index]);
}
```

**Benefício**:
- ✅ Ordem mais relevante dos chunks
- ✅ Melhor contexto para o LLM
- ✅ Respostas mais precisas

---

### **4️⃣ MÉDIA PRIORIDADE: Query Expansion**

Gerar variações da pergunta para melhor retrieval:

```typescript
async expandQuery(question: string): Promise<string[]> {
    const result = await geminiService.generateContent({
        prompt: `Gere 2 reformulações desta pergunta mantendo o significado:
        
        Pergunta: ${question}
        
        Reformulações (uma por linha):`,
        temperature: 0.7,
        maxTokens: 150
    });
    
    const variations = result.split('\n').filter(v => v.trim());
    return [question, ...variations];
}
```

**Benefício**:
- ✅ Captura mais chunks relevantes
- ✅ Melhor para perguntas complexas
- ✅ Mais robusto a formulações diferentes

---

### **5️⃣ BAIXA PRIORIDADE: Hybrid Search**

Combinar busca vetorial (semântica) com busca léxica (BM25):

**Benefício**:
- ✅ Captura matches exatos de termos técnicos
- ✅ Melhor para nomes próprios e acrônimos
- ✅ Mais completo que busca vetorial sozinha

**Nota**: Requer integração com PostgreSQL full-text search ou Elasticsearch.

---

## 📊 Configurações Atuais vs. Recomendadas

### Atual
```typescript
// vectorService.ts
match_threshold: 0.3
match_count: topK (5)

// ragService.ts
topK: 5 chunks

// geminiService.ts
model: 'gemini-2.5-pro'
temperature: padrão (~0.7)
```

### Recomendado para Estudo
```typescript
// vectorService.ts
match_threshold: 0.2 (inicial, depois adaptativo)
match_count: topK * 3 (15 candidatos)

// ragService.ts
topK: 8 chunks (mais contexto)

// geminiService.ts
model: 'gemini-2.5-pro'
temperature: 0.3 (mais factual)
maxTokens: 2000 (respostas completas)
topP: 0.9
```

---

## 🔧 Melhorias de Chunking

### Tamanho Atual
```typescript
TARGET_CHUNK_SIZE = 1000 caracteres (aproximado)
OVERLAP = 0
```

### Recomendado
```typescript
TARGET_CHUNK_SIZE = 800 palavras (~4000 caracteres)
OVERLAP = 150 palavras (~750 caracteres, 20%)
```

**Justificativa**:
- Chunks baseados em palavras são mais consistentes
- Overlap garante continuidade contextual
- 800 palavras é o sweet spot para embeddings

---

## 🎓 Prompt Engineering

### Prompt Atual (Básico)
```
Você é um assistente de estudos.
Responda com base no contexto.
Se não souber, diga que não sabe.
Cite as fontes.
```

### Prompt Melhorado (Sugerido)
```typescript
const systemPrompt = `Você é um assistente de estudos especializado e preciso.

INSTRUÇÕES:
1. Use APENAS informações do contexto fornecido
2. Se a resposta não estiver no contexto, diga explicitamente
3. Cite SEMPRE as fontes (Página X, Y, Z)
4. Estruture respostas com markdown:
   - Use ## para títulos de seção
   - Use **negrito** para conceitos-chave
   - Use listas numeradas para sequências
   - Use listas com bullets para itens relacionados

FORMATAÇÃO DE FONTES:
- No final da resposta, inclua: "📚 Fontes: Páginas X, Y, Z"

EVITE:
❌ Inventar informação não presente no contexto
❌ Usar conhecimento geral não relacionado ao documento
❌ Respostas genéricas sem evidência

EXEMPLO DE BOA RESPOSTA:
## Conceito Principal
**Fotossíntese** é o processo pelo qual plantas convertem luz em energia...

### Etapas
1. Absorção de luz
2. Conversão química
3. Produção de glicose

📚 Fontes: Páginas 12, 14, 15`;
```

---

## 📈 Métricas para Monitorar

1. **Average Similarity Score**: Média dos scores de similaridade dos chunks retornados
2. **Response Time**: Tempo total da query (embedding + retrieval + geração)
3. **Chunks Used**: Quantos chunks foram efetivamente usados
4. **"No Context" Rate**: % de vezes que retorna "não encontrei informação"
5. **Response Length**: Tamanho médio das respostas

### Dashboard Sugerido
```typescript
// Adicionar logging em ragService.ts
console.log({
    query: question,
    chunks_retrieved: relevantChunks.length,
    avg_similarity: avgSimilarity,
    response_time: responseTime,
    model: 'gemini-2.5-pro'
});
```

---

## 🔄 Roadmap de Implementação

### Fase 1: Quick Wins ✅ CONCLUÍDA
- [x] ✅ Fix document_id bug
- [x] ✅ Ajustar threshold para 0.3
- [x] ✅ Atualizar para gemini-2.5-pro
- [x] ✅ Implementar threshold adaptativo (base)
- [x] ✅ Implementar semantic chunking
- [x] ✅ Melhorar prompt do sistema
- [x] ✅ Adicionar parâmetros de temperatura/topP
- [x] ✅ Organizar testes em estrutura de diretórios

### Fase 2: Qualidade Base (Próximo)
- [ ] Testar qualidade end-to-end das respostas
- [ ] Implementar chunk overlap (se necessário)
- [ ] Fine-tune threshold dinâmico
- [ ] Adicionar métricas de qualidade

### Fase 3: Features Avançadas (1-2 semanas)
- [ ] Query expansion
- [ ] Cohere reranking
- [ ] Hybrid search (se necessário)
- [ ] Conversation memory

### Fase 4: Otimização (ongoing)
- [ ] A/B testing de configurações
- [ ] Métricas e dashboards
- [ ] User feedback loop

---

## 💡 Dicas de Uso para Estudantes

### ✅ Perguntas Efetivas
- "Explique [conceito] mencionado no documento"
- "Quais são os pontos principais sobre [tema]?"
- "Resuma a seção sobre [tópico]"
- "Como funciona [processo] segundo o documento?"

### ❌ Perguntas com Limitações
- "O que você acha sobre X?" (requer opinião)
- "Compare X com Y" (se Y não está nos docs)
- Perguntas genéricas sem contexto específico
- Perguntas sobre conteúdo não presente nos documentos

---

## 🐛 Debugging

### Se as respostas estão ruins:

1. **Verificar chunks retornados**:
```typescript
console.log('Chunks:', relevantChunks.map(c => ({
    page: c.pageNumber,
    similarity: c.similarity,
    preview: c.content.slice(0, 100)
})));
```

2. **Verificar threshold**:
- Muito alto (>0.5): poucos chunks
- Muito baixo (<0.2): muitos chunks irrelevantes

3. **Verificar embedding**:
- Usar Cohere `embed-multilingual-v3.0` para português
- Validar que o mesmo modelo é usado para indexar e buscar

4. **Verificar prompt**:
- LLM recebendo contexto suficiente?
- Instruções claras o bastante?

---

## 📚 Recursos Úteis

- [Cohere Rerank Docs](https://docs.cohere.com/docs/reranking)
- [Supabase pgvector Guide](https://supabase.com/docs/guides/ai/vector-columns)
- [Gemini API Docs](https://ai.google.dev/docs)
- [RAG Best Practices](https://www.pinecone.io/learn/rag-best-practices/)

---

---

## 🆕 Últimas Implementações (30/11/2025)

### Semantic Chunking
- **Arquivo**: `pdfService.ts`
- **Método**: Sentence-level embeddings com cosine similarity
- **Teste**: `src/tests/semantic/test-chunking-logic.ts` ✅ Passing
- **Threshold**: Dual (relative drop 15% OR absolute < 0.65)

### Enhanced Prompting
- **Arquivo**: `geminiService.ts`
- **Features**: Markdown formatting, source citation, factual responses
- **Params**: temp=0.3, topP=0.9, topK=40

### Test Infrastructure
- **Estrutura**: `tests/{semantic,integration,debug,utils}/`
- **Docs**: Comprehensive README.md com instruções

### Clerk Integration
- **Status**: ✅ JWT template configurado
- **Feature**: Salvar quizzes/flashcards funcionando

---

**Última atualização**: 30/11/2025 - Semantic Chunking & Enhanced Prompting implementados
