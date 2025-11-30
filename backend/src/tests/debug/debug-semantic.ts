import { cohereService } from '../services/cohereService.js';
import fs from 'fs';

async function debugSemantic() {
    console.log('🔍 Debugging Semantic Chunking Similarities...');

    const text = `
    A História da Computação
    
    A história da computação começou muito antes do desenvolvimento do computador moderno. O ábaco, inventado na Babilónia por volta de 2400 a.C., foi a primeira ferramenta conhecida para cálculos.
    No século XIX, Charles Babbage desenhou a Máquina Analítica, que é considerada o primeiro computador mecânico programável. Ada Lovelace escreveu o primeiro algoritmo para esta máquina.
    Na década de 1940, surgiram os primeiros computadores eletrónicos, como o ENIAC e o Colossus, usados durante a Segunda Guerra Mundial.
    A invenção do transístor em 1947 revolucionou a eletrónica, permitindo computadores menores e mais rápidos.
    Os circuitos integrados e os microprocessadores permitiram a criação dos computadores pessoais na década de 1970.
    A internet, desenvolvida inicialmente como ARPANET, conectou o mundo e permitiu a era da informação.
    Hoje, a inteligência artificial e a computação quântica prometem novas revoluções.
    
    Biologia Marinha e Oceanografia
    
    A biologia marinha é o estudo científico dos organismos no oceano. Dado que na biologia muitos filos, famílias e géneros têm algumas espécies que vivem no mar e outras que vivem em terra, a biologia marinha classifica as espécies com base no ambiente e não na taxonomia.
    Os oceanos cobrem cerca de 71% da superfície da Terra e contêm 97% da água do planeta. A profundidade média é de cerca de 4000 metros.
    A Fossa das Marianas é o local mais profundo dos oceanos, atingindo cerca de 11000 metros de profundidade.
    O fitoplâncton é a base da cadeia alimentar oceânica e produz cerca de 50% do oxigénio da Terra.
    Os recifes de coral são ecossistemas vibrantes e diversos, muitas vezes chamados de "florestas tropicais do mar".
    A baleia azul é o maior animal que já existiu, atingindo até 30 metros de comprimento.
    As correntes oceânicas regulam o clima global, transportando calor do equador para os polos.
    A poluição marinha, incluindo plásticos e derramamentos de óleo, ameaça a vida nos oceanos.
    `;

    // 1. Split by sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const sentenceTexts = sentences.map(s => s.trim()).filter(s => s.length > 0);

    console.log(`Found ${sentenceTexts.length} sentences.`);

    // 2. Generate embeddings
    console.log('Generating embeddings...');
    const embeddings = await cohereService.embed(sentenceTexts);

    // 3. Calculate similarities
    const similarities: number[] = [];
    for (let i = 0; i < embeddings.length - 1; i++) {
        const sim = cosineSimilarity(embeddings[i], embeddings[i + 1]);
        similarities.push(sim);
    }

    // 4. Print analysis to file
    const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    const threshold = Math.max(0.7, avgSim * 0.85);

    let output = `📊 Analysis:\n`;
    output += `Average Similarity: ${avgSim.toFixed(4)}\n`;
    output += `Calculated Threshold: ${threshold.toFixed(4)}\n`;
    output += `\nDetailed Similarities:\n`;

    similarities.forEach((sim, i) => {
        const s1 = sentenceTexts[i].substring(0, 30) + '...';
        const s2 = sentenceTexts[i + 1].substring(0, 30) + '...';
        const isBreak = sim < threshold && sim < avgSim * 0.9;

        output += `[${i}] ${sim.toFixed(4)} ${isBreak ? '🔴 BREAK' : '🟢'} | "${s1}" <-> "${s2}"\n`;
    });

    fs.writeFileSync('debug-output.txt', output);
    console.log('Output written to debug-output.txt');
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

debugSemantic();
