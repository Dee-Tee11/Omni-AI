import { pdfService } from '../services/pdfService.js';
import { supabase } from '../lib/supabase.js';
import { PDFDocument } from 'pdf-lib';

async function testSemanticChunking() {
    console.log('🧪 Testing Semantic Chunking...');

    // 1. Create a PDF with two distinct topics
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

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

    page.drawText(text, { size: 10, lineHeight: 12 });
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const dummyFile = {
        fieldname: 'pdf',
        originalname: 'semantic-test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: buffer,
        size: buffer.length,
        destination: '',
        filename: '',
        path: '',
        stream: null as any
    };

    const userId = 'test-verifier-' + Date.now();
    console.log(`Uploading as User: ${userId}`);

    try {
        // 2. Upload
        console.log('Uploading document...');
        const doc = await pdfService.processUpload(dummyFile, userId);
        console.log('Upload successful! Document ID:', doc.id);

        // 3. Fetch chunks to verify semantic splitting
        const { data: chunks, error } = await supabase
            .from('document_chunks')
            .select('*')
            .eq('document_id', doc.id);

        if (error) {
            console.error('Error fetching chunks:', error);
            return;
        }

        console.log(`\n📊 Created ${chunks.length} chunks.`);

        chunks.forEach((chunk, index) => {
            console.log(`\n--- Chunk ${index + 1} ---`);
            console.log(chunk.content);
            console.log('-------------------');
        });

        // 4. Verify if topics were separated (heuristic check)
        const chunk1 = chunks[0]?.content || '';
        const chunk2 = chunks[1]?.content || '';

        const hasComputacao = chunk1.includes('Computação') || chunk1.includes('Babbage');
        const hasBiologia = chunk2.includes('Biologia') || chunk2.includes('Marinha');

        if (chunks.length >= 2 && hasComputacao && hasBiologia) {
            console.log('\n✅ SUCCESS: Semantic chunking separated topics correctly!');
        } else if (chunks.length === 1) {
            console.log('\n⚠️ WARNING: Created only 1 chunk. Text might be too short for splitting or threshold too high.');
        } else {
            console.log('\n❓ CHECK MANUALLY: Chunks created but topic separation needs verification.');
        }

    } catch (error: any) {
        console.error('Test failed:', error);
    }
}

testSemanticChunking();
