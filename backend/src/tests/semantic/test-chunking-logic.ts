import { pdfService } from '../services/pdfService.js';

async function testChunkingLogic() {
    console.log('🧪 Testing Semantic Chunking Logic Directly...');

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

    try {
        const chunks = await pdfService.createPageChunks(text, 'test-doc-id', 1, 0);

        console.log(`\n✅ Generated ${chunks.length} chunks.`);

        chunks.forEach((chunk, i) => {
            console.log(`\n[Chunk ${i}] (Length: ${chunk.content.length})`);
            console.log(chunk.content.substring(0, 100) + '...');
        });

        if (chunks.length > 1) {
            console.log('\n✅ SUCCESS: Semantic chunking split the text!');
        } else {
            console.log('\n⚠️ WARNING: Only 1 chunk created. Threshold might be too high.');
        }

    } catch (error) {
        console.error('❌ Error testing chunking logic:', error);
    }
}

testChunkingLogic();
