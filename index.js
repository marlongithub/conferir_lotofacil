import { exibirResultados } from './htmlresultado.js';

async function conferir() {
    try {
        const jogadosUrl = "http://127.0.0.1:8081/jogados.txt"; // URL do arquivo jogados.txt no Live Server
        const jogos = await lerArquivo(jogadosUrl);
        
        if (jogos === null) {
            throw new Error('Erro ao carregar o arquivo jogados.txt');
        }
        let ultimoConcurso = await obterUltimoConcurso();
        
        let resultadosConferencias = [];
        let concursosFaltantes = [];
        
        for (let i = 0; i < jogos.length; i++) {
            const jogo = jogos[i];
            
            for (let concurso of jogo.concursos) {
                try {
                    const resultado = await obterConcurso(concurso);
                    if (concurso > ultimoConcurso.numero) {
                        ultimoConcurso.numero = concurso;
                    }
                    
                    for (let j = 0; j < jogo.numerosJogados.length; j++) {
                        const numerosJogados = jogo.numerosJogados[j];
                        const conferencia = verificarJogos(numerosJogados, resultado, i + 1, j + 1);
                        resultadosConferencias.push(conferencia);
                    }
                } catch (error) {
                    concursosFaltantes.push(concurso);
                }
            }
        }
        
        exibirResultados(resultadosConferencias, concursosFaltantes, ultimoConcurso.numero);
        document.getElementById('resultado').innerHTML += `<div class="card alert-info-custom my-4">
            <div class="card-body">
                <h5 class="card-title"><i class="fas fa-info-circle"></i> Informação</h5>
                <p class="card-text">Último concurso disponível: ${ultimoConcurso.numero}</p>
            </div>
        </div>`;
    } catch (error) {
        document.getElementById('resultado').innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${error.message}</div>`;
    }
}

async function lerArquivo(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erro ao buscar o arquivo');
        }
        const texto = await response.text();
        return processarTextoJogos(texto);
    } catch (error) {
        console.error("Erro ao ler o arquivo:", error);
        return null;
    }
}

function processarTextoJogos(texto) {
    try {
        const jogos = [];
        const regexJogo = /jogo\d+:\{\s*concursos:\s*\{([\d,\s]*)\}((?:\s*numeros_jogados\d*:\s*\{(?:[\d,\s]*)\},?)*)\s*\}/g;
        const regexNumeros = /numeros_jogados\d*:\s*\{([\d,\s]*)\}/g;
        let match;
        while ((match = regexJogo.exec(texto)) !== null) {
            const concursos = match[1].split(',').map(Number);
            const numerosJogados = [];
            let numerosMatch;
            while ((numerosMatch = regexNumeros.exec(match[2])) !== null) {
                numerosJogados.push(numerosMatch[1].split(',').map(Number));
            }
            jogos.push({ concursos, numerosJogados });
        }
        return jogos;
    } catch (error) {
        throw new Error('Erro ao processar o texto do arquivo');
    }
}

async function obterUltimoConcurso() {
    try {
        const response = await fetch('https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest');
        if (!response.ok) {
            throw new Error('Erro ao obter o último concurso');
        }
        const data = await response.json();
        return {
            numero: data.concurso,
            dezenas: data.dezenas
        };
    } catch (error) {
        throw new Error('Erro ao obter o último concurso');
    }
}

async function obterConcurso(concurso) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(`https://api.guidi.dev.br/loteria/lotofacil/${concurso}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const resultado = await response.json();
        if (!resultado.listaDezenas || resultado.listaDezenas.length === 0) {
            throw new Error();
        }

        return {
            concurso: resultado.numero,
            dezenas: resultado.listaDezenas
        };
    } catch {
        try {
            const fallbackResponse = await fetch(`https://loteriascaixa-api.herokuapp.com/api/lotofacil/${concurso}`);
            if (!fallbackResponse.ok) {
                throw new Error(`Erro ao obter o concurso ${concurso}`);
            }
            const fallbackResultado = await fallbackResponse.json();
            return {
                concurso: fallbackResultado.concurso,
                dezenas: fallbackResultado.dezenas
            };
        } catch (fallbackError) {
            throw new Error(`Erro ao obter o concurso ${concurso} nas duas APIs`);
        }
    }
}

function verificarJogos(numerosJogos, resultadoConcurso, jogoIndex, sequencial) {
    const dezenasOrdenadas = resultadoConcurso.dezenas.map(Number).sort((a, b) => a - b);
    const acertos = dezenasOrdenadas.filter(numero => numerosJogos.includes(numero));
    const ganhou = acertos.length >= 11 ? `Ganhou em jogo ${jogoIndex} no sequencial ${sequencial}` : 'Não ganhou!';
    const estrelas = gerarEstrelas(acertos.length);
    return {
        concurso: resultadoConcurso.concurso,
        dezenasOrdenadas,
        acertos,
        ganhou,
        estrelas
    };
}

function gerarEstrelas(numeroDeAcertos) {
    const numeroDeEstrelas = Math.max(0, numeroDeAcertos - 10);
    let estrelasHtml = '';
    for (let i = 0; i < numeroDeEstrelas; i++) {
        estrelasHtml += '<i class="fas fa-star"></i> ';
    }
    return estrelasHtml.trim();
}

window.conferir = conferir;

window.onload = async () => {
    try {
        const ultimoConcurso = await obterUltimoConcurso();
        document.getElementById('resultado').innerText = `Último concurso disponível: ${ultimoConcurso.numero}`;
    } catch (error) {
        document.getElementById('resultado').innerText = `Erro: ${error.message}`;
    }
};
