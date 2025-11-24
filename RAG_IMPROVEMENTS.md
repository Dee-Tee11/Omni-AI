# 🎯 Guia de Melhorias do Sistema RAG (ChatInterface)

## ✅ Melhorias Implementadas

### 1. **Aumento do Contexto Recuperado**
- **Antes**: `topK = 5` chunks
- **Agora**: `topK = 8` chunks
- **Benefício**: Mais informação contextual para respostas mais completas

### 2. **Reranking de Chunks**
```typescript
const rerankedChunks = relevantChunks
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, Math.min(topK, relevantChunks.length));
```
- **Benefício**: Garante que os chunks mais relevantes sejam priorizados

### 3. **Contexto Enriquecido**
- Adicionado separadores visuais
- Incluído % de relevância de cada fonte
- Melhor formatação para o modelo LLM entender

### 4. **Prompt do Sistema Melhorado**
**Melhorias principais:**
- ✅ Instruções mais claras e estruturadas
- ✅ Exemplos de boas respostas
- ✅ Diretrizes de formatação markdown
- ✅ Regras explícitas sobre citação de fontes
- ✅ Lista de comportamentos a evitar

### 5. **Parâmetros da API Otimizados**
- **Temperature**: `0.3` → `0.2` (respostas mais factuais e consistentes)
- **Max Tokens**: `1500` → `2000` (respostas mais completas)
- **Top P**: Adicionado `0.9` (nucleus sampling para melhor qualidade)

---

## 📊 Resultados Esperados

### Antes
- Respostas mais curtas e genéricas
- Pouca citação de fontes
- Formatação básica

### Depois
- ✅ Respostas mais detalhadas e estruturadas
- ✅ Citação consistente de fontes
- ✅ Formatação markdown rica (headings, listas, negrito)
- ✅ Maior precisão factual (temperature mais baixa)
- ✅ Melhor contexto (mais chunks relevantes)

---

## 🚀 Melhorias Adicionais Sugeridas

### 1. **Query Expansion** (Expansão de Pergunta)
Expandir a pergunta do usuário para capturar mais contexto relevante.

```typescript
async expandQuery(question: string): Promise<string[]> {
    // Gera variações da pergunta para melhor recuperação
    const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [{
            role: 'system',
            content: 'Gere 2-3 reformulações da pergunta mantendo o significado.'
        }, {
            role: 'user',
            content: question
        }],
        temperature: 0.7,
        max_tokens: 200
    });
    // Parse e retorna variações
}
```

### 2. **Hybrid Search** (Busca Híbrida)
Combinar busca semântica (embeddings) com busca léxica (palavras-chave BM25).

**Benefício**: Captura tanto conceitos similares quanto matches exatos de termos.

### 3. **Chunk Overlap** (Sobreposição de Chunks)
Ao processar PDFs, criar chunks com sobreposição de ~50 palavras.

```typescript
// No pdfService.ts
const chunkSize = 800; // palavras
const overlap = 100;   // palavras de sobreposição
```

**Benefício**: Evita perder contexto importante que fica "cortado" nas bordas dos chunks.

### 4. **Metadata Filtering** (Filtros de Metadados)
Adicionar filtros por:
- Data do documento
- Tipo de conteúdo
- Tópico/categoria
- Nível de dificuldade

### 5. **Conversation Memory** (Memória de Conversação)
Manter histórico da conversa para perguntas de follow-up:

```typescript
interface ConversationContext {
    messages: Message[];
    lastQuery: string;
    relevantChunks: Chunk[];
}
```

### 6. **Question Classification** (Classificação de Perguntas)
Identificar o tipo de pergunta e ajustar a estratégia:
- **Factual**: "O que é X?"
- **Comparação**: "Qual a diferença entre X e Y?"
- **Explicação**: "Como funciona X?"
- **Análise**: "Por que X acontece?"

### 7. **Answer Validation** (Validação de Resposta)
Verificar se a resposta gerada está realmente baseada no contexto:

```typescript
async validateAnswer(question: string, answer: string, context: string): Promise<boolean> {
    // Usa LLM para verificar se a resposta é fiel ao contexto
}
```

### 8. **Dynamic topK** (topK Dinâmico)
Ajustar quantidade de chunks baseado na complexidade da pergunta:
- Pergunta simples: 3-5 chunks
- Pergunta complexa: 8-12 chunks

### 9. **Source Quality Scoring** (Pontuação de Qualidade)
Dar peso maior a chunks que:
- Têm maior densidade de informação
- Contêm definições ou conceitos-chave
- Estão em seções importantes do documento (introdução, conclusão)

### 10. **User Feedback Loop** (Ciclo de Feedback)
Permitir usuário avaliar respostas (👍 / 👎) para melhorar ao longo do tempo.

---

## 📈 Métricas para Monitorar

1. **Similarity Score Médio** das fontes retornadas
2. **Tempo de resposta** (latência)
3. **Satisfação do usuário** (se implementar feedback)
4. **Taxa de "não encontrei informação"**
5. **Comprimento médio das respostas**

---

## 🔧 Configurações Recomendadas por Caso de Uso

### Para Respostas Curtas e Diretas
```typescript
temperature: 0.1
max_tokens: 500
topK: 3-5
```

### Para Explicações Detalhadas
```typescript
temperature: 0.2-0.3
max_tokens: 2000-3000
topK: 8-12
```

### Para Brainstorming/Criatividade
```typescript
temperature: 0.7-0.9
max_tokens: 1500
topK: 5-7
```

---

## 🎓 Dicas de Uso para o Aluno

### ✅ Boas Perguntas
- "Explique o conceito de fotossíntese mencionado no documento"
- "Quais são os principais pontos sobre a Segunda Guerra Mundial?"
- "Resuma a teoria da relatividade presente no texto"

### ❌ Perguntas que Podem Ter Resultados Limitados
- "O que você acha sobre X?" (opinião)
- "Compare X com Y" (se Y não está nos documentos)
- Perguntas muito genéricas sem contexto

---

## 📝 Notas Técnicas

### Vector Database
- **ChromaDB** é usado para armazenar embeddings
- **Modelo de Embedding**: deve ser consistente
- **Dimensionalidade**: depende do modelo usado

### LLM (Groq)
- **Modelo atual**: `llama-3.3-70b-versatile`
- **Contexto máximo**: ~70k tokens
- **Custo**: verificar limites de API

### Processamento de PDF
- **Chunk size ideal**: 500-1000 palavras
- **Overlap recomendado**: 10-20% do chunk size
- **Metadados importantes**: página, seção, data

---

## 🔄 Próximos Passos

1. ✅ **Implementado**: Melhorias no prompt e parâmetros
2. 🔄 **Recomendado**: Implementar chunk overlap
3. 🔄 **Futuro**: Hybrid search (semântica + léxica)
4. 🔄 **Futuro**: Conversation memory
5. 🔄 **Futuro**: User feedback loop
