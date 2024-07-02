export function exibirResultados(resultadosConferencias, concursosFaltantes, ultimoConcurso) {
    let html = '';
    resultadosConferencias.forEach((resultado, index) => {
        html += `<div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">Concurso ${resultado.concurso}</h5>
                        <p class="card-text">Dezenas: ${resultado.dezenasOrdenadas.join(", ")}</p>
                        <p class="card-text">Acertos: ${resultado.acertos.length}. ${resultado.ganhou}</p>
                        <p class="card-text stars">&nbsp;&nbsp; ${resultado.estrelas}</p>
                    </div>
                 </div>`;
        if (index < resultadosConferencias.length - 1) {
            html += '<hr>';
        }
    });
    if (concursosFaltantes.length > 0) {
        html += `<div class="card alert-custom my-4">
                    <div class="card-body">
                        <h5 class="card-title"><i class="fas fa-exclamation-triangle"></i> Atenção</h5>
                        <p class="card-text">Os seguintes concursos não constam na API ou são maiores que o último concurso disponível:</p>
                        <p class="card-text">${concursosFaltantes.join(", ")}</p>
                    </div>
                 </div>`;
    }
    html += `<div class="card alert-info-custom my-4">
                <div class="card-body">
                    <h5 class="card-title"><i class="fas fa-info-circle"></i> Informação</h5>
                    <p class="card-text">Último concurso disponível: ${ultimoConcurso}</p>
                </div>
             </div>`;
    document.getElementById('resultado').innerHTML = html;
}
