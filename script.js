// VARIÁVEIS GLOBAIS
const canvas = document.getElementById('canvasPreview');
const ctx = canvas.getContext('2d');

const configGeral = {
    caminhoImagem: 'assets/template.png',
    caminhoFonte: 'assets/fonte.ttf',
    nomeFonte: 'MinhaFonteCustom'
};

let imagemTemplate = new Image();
let itemSelecionado = 'nome'; // Padrão inicial

// Controla quais campos estão ativos
let camposAtivos = {
    nome: true,
    cargo: true,
    tel: true,
    email: true
};

// 1. INICIALIZAÇÃO
async function iniciarSistema() {
    // Carrega Fonte
    const font = new FontFace(configGeral.nomeFonte, `url(${configGeral.caminhoFonte})`);
    try {
        await font.load();
        document.fonts.add(font);
    } catch (err) {
        console.error("Erro fonte:", err);
    }

    // Carrega Imagem
    imagemTemplate.src = configGeral.caminhoImagem;
    imagemTemplate.onload = () => {
        desenhar(); // Primeira renderização
    };
}

// 2. FUNÇÃO QUE DESENHA TUDO
function desenhar() {
    if (!imagemTemplate.complete) return;

    // A. Reseta o Canvas
    canvas.width = imagemTemplate.width;
    canvas.height = imagemTemplate.height;
    ctx.drawImage(imagemTemplate, 0, 0);

    // B. Desenha cada item baseado nos INPUTS HTML
    desenharItem('nome');
    desenharItem('cargo');
    desenharItem('tel');
    desenharItem('email');
}

// Função auxiliar para desenhar um item específico lendo seus inputs
function desenharItem(tipo) {
    // Se o campo não está ativo, não desenha
    if (!camposAtivos[tipo]) return;

    const texto = document.getElementById(`texto-${tipo}`).value;
    const x = parseInt(document.getElementById(`x-${tipo}`).value) || 0;
    const y = parseInt(document.getElementById(`y-${tipo}`).value) || 0;
    const size = document.getElementById(`size-${tipo}`).value;
    const color = document.getElementById(`color-${tipo}`).value;

    ctx.fillStyle = color;
    ctx.font = `${size}px "${configGeral.nomeFonte}"`;
    ctx.fillText(texto, x, y);

    // Destaque visual: Desenha uma bolinha onde está o item SE ele estiver selecionado
    if (itemSelecionado === tipo) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        // Desenha uma linha abaixo do texto apenas para indicar seleção (opcional)
        const larguraTexto = ctx.measureText(texto).width;
        ctx.strokeRect(x, y - parseInt(size), larguraTexto, parseInt(size) * 1.2);
    }
}

// 3. INTERATIVIDADE (O MÁGICO "CLICK TO MOVE")
canvas.addEventListener('mousedown', function(e) {
    // Calcula posição correta do clique considerando o tamanho na tela
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Atualiza os inputs do item selecionado
    document.getElementById(`x-${itemSelecionado}`).value = Math.round(clickX);
    document.getElementById(`y-${itemSelecionado}`).value = Math.round(clickY);

    // Redesenha para mostrar a mudança
    desenhar();
});

// 4. SELEÇÃO DE GRUPOS (Mudar qual item estamos editando)
window.ativarEdicao = function(tipo) {
    itemSelecionado = tipo;
    
    // Atualiza visualmente o sidebar
    document.querySelectorAll('.control-group').forEach(el => el.classList.remove('active-group'));
    document.getElementById(`group-${tipo}`).classList.add('active-group');
    
    // Marca o radio button correto
    document.getElementById(`radio-${tipo}`).checked = true;

    // Redesenha para mostrar a caixa de seleção vermelha
    desenhar();
}

// Toggle para ativar/desativar um campo
window.toggleCampo = function(tipo) {
    camposAtivos[tipo] = !camposAtivos[tipo];
    
    // Atualiza o checkbox
    document.getElementById(`ativo-${tipo}`).checked = camposAtivos[tipo];
    
    // Redesenha
    desenhar();
    console.log(`Campo ${tipo}: ${camposAtivos[tipo] ? 'Ativado' : 'Desativado'}`);
}

// 5. EVENTOS PARA ATUALIZAÇÃO EM TEMPO REAL
// Qualquer input que mudar, redesenha o canvas
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', desenhar);
});

// 6. DOWNLOAD COM MÚLTIPLOS FORMATOS
window.baixarAssinatura = function() {
    const link = document.createElement('a');
    const nomeArquivo = document.getElementById('texto-nome').value.replace(/\s+/g, '_').toLowerCase();
    const formato = document.getElementById('formato-exportacao').value;
    
    // Renderiza uma ultima vez SEM a caixa vermelha de seleção
    const tempItem = itemSelecionado;
    itemSelecionado = null; // Tira seleção
    desenhar(); 
    
    let dataUrl, mimeType, extensao;
    
    // Define MIME type e extensão baseado no formato escolhido
    switch(formato) {
        case 'jpg':
            mimeType = 'image/jpeg';
            extensao = 'jpg';
            dataUrl = canvas.toDataURL('image/jpeg', 0.95); // 95% qualidade
            break;
        case 'webp':
            mimeType = 'image/webp';
            extensao = 'webp';
            dataUrl = canvas.toDataURL('image/webp', 0.95);
            break;
        case 'bmp':
            mimeType = 'image/bmp';
            extensao = 'bmp';
            dataUrl = canvas.toDataURL('image/bmp');
            break;
        case 'gif':
            // GIF requer uma biblioteca externa, então convertemos para PNG
            console.warn('GIF exportação pode não ser totalmente suportado no navegador. Usando PNG como alternativa.');
            mimeType = 'image/gif';
            extensao = 'gif';
            dataUrl = canvas.toDataURL('image/gif');
            break;
        case 'png':
        default:
            mimeType = 'image/png';
            extensao = 'png';
            dataUrl = canvas.toDataURL('image/png');
            break;
    }
    
    link.download = `assinatura_${nomeArquivo}.${extensao}`;
    link.href = dataUrl;
    link.click();

    // Restaura seleção
    itemSelecionado = tempItem;
    desenhar();
}
// ==========================================
// 7A. CARREGAMENTO DINÂMICO DE LAYOUT (NOVO)
// ==========================================
document.getElementById('upload-layout').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Verifica se é um arquivo de imagem válido
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida (PNG, JPG, WebP, BMP)!');
        return;
    }

    try {
        // 1. Lê o arquivo como uma URL de dados
        const reader = new FileReader();
        
        reader.onload = function(event) {
            // 2. Cria uma nova imagem com os dados do arquivo
            imagemTemplate = new Image();
            imagemTemplate.src = event.target.result;
            
            // 3. Quando a imagem carregar, redesenha o canvas
            imagemTemplate.onload = () => {
                console.log('Novo layout carregado: ' + file.name);
                desenhar();
            };
            
            imagemTemplate.onerror = () => {
                alert('Erro ao carregar a imagem. Tente outro arquivo.');
            };
        };
        
        reader.readAsDataURL(file);
        
    } catch (err) {
        console.error('Erro ao carregar layout:', err);
        alert('Erro ao carregar o arquivo de imagem. Tente outro.');
    }
});
// ==========================================
// 7. CARREGAMENTO DINÂMICO DE FONTE (NOVO)
// ==========================================
document.getElementById('upload-fonte').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Verifica se é um arquivo de fonte válido
    if (!file.name.match(/\.(ttf|otf)$/)) {
        alert('Por favor, selecione um arquivo .ttf ou .otf válido!');
        return;
    }

    try {
        // 1. Lê o arquivo como um ArrayBuffer (dados brutos)
        const buffer = await file.arrayBuffer();
        
        // 2. Cria a nova fonte na memória
        // O nome 'FonteUsuario' será o novo identificador
        const novaFonte = new FontFace('FonteUsuario', buffer);
        
        // 3. Espera carregar e adiciona ao documento
        await novaFonte.load();
        document.fonts.add(novaFonte);

        // 4. Atualiza a configuração global para usar o nome dessa nova fonte
        configGeral.nomeFonte = 'FonteUsuario';

        // 5. Redesenha tudo com a nova letra
        console.log('Nova fonte carregada: ' + file.name);
        desenhar();

    } catch (err) {
        console.error('Erro ao carregar fonte:', err);
        alert('Erro ao carregar o arquivo de fonte. Tente outro.');
    }
});
// ==========================================
// 8. SISTEMA DE LUPA (ZOOM PRECISO)
// ==========================================
const lupa = document.getElementById('canvasLupa');
const ctxLupa = lupa.getContext('2d');

// Configuração da Lupa
const ZOOM_LEVEL = 0.6; // Quantas vezes aumenta (2x, 3x...)
const TAMANHO_LUPA = 150; // Tamanho em pixels (largura/altura)

// Configura resolução interna da lupa
lupa.width = TAMANHO_LUPA;
lupa.height = TAMANHO_LUPA;

// 1. Mostrar lupa ao entrar no canvas
canvas.addEventListener('mouseenter', () => {
    lupa.style.display = 'block';
});

// 2. Esconder lupa ao sair
canvas.addEventListener('mouseleave', () => {
    lupa.style.display = 'none';
});

// 3. Mover e Desenhar a Lupa
canvas.addEventListener('mousemove', function(e) {
    // A. Calcular posição do mouse relativa ao canvas
    const rect = canvas.getBoundingClientRect();
    const xMouse = e.clientX - rect.left;
    const yMouse = e.clientY - rect.top;

    // B. Mover a lupa visualmente (CSS) para seguir o mouse
    // O offset de +20px serve para a lupa não ficar exatamente embaixo do cursor
    lupa.style.left = (xMouse + 20) + 'px';
    lupa.style.top = (yMouse + 20) + 'px';

    // C. Matemática do Zoom (Cálculo de Proporção)
    // Precisamos saber a relação entre o tamanho visual (CSS) e o tamanho real (Pixels da imagem)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Converte coordenada da tela para coordenada real da imagem
    const xReal = xMouse * scaleX;
    const yReal = yMouse * scaleY;

    // D. Desenhar o Zoom
    // Limpa a lupa antiga
    ctxLupa.clearRect(0, 0, TAMANHO_LUPA, TAMANHO_LUPA);
    
    // Fundo branco na lupa (para transparências)
    ctxLupa.fillStyle = "white";
    ctxLupa.fillRect(0, 0, TAMANHO_LUPA, TAMANHO_LUPA);

    // O comando mágico: drawImage com 9 parâmetros (Recorte)
    // Sintaxe: ctx.drawImage(imagem, xCorte, yCorte, wCorte, hCorte, xDest, yDest, wDest, hDest);
    ctxLupa.drawImage(
        canvas,                              // Fonte (o próprio canvas principal)
        xReal - (TAMANHO_LUPA / 2 / ZOOM_LEVEL), // Onde começa o corte X
        yReal - (TAMANHO_LUPA / 2 / ZOOM_LEVEL), // Onde começa o corte Y
        TAMANHO_LUPA / ZOOM_LEVEL,           // Largura do pedaço a cortar
        TAMANHO_LUPA / ZOOM_LEVEL,           // Altura do pedaço a cortar
        0, 0,                                // Desenha em 0,0 na lupa
        TAMANHO_LUPA,                        // Estica para encher a lupa (Zoom)
        TAMANHO_LUPA
    );
    
    // Opcional: Desenha uma mira (cruz) no centro da lupa para precisão máxima
    ctxLupa.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctxLupa.lineWidth = 1;
    ctxLupa.beginPath();
    ctxLupa.moveTo(TAMANHO_LUPA/2, 0);
    ctxLupa.lineTo(TAMANHO_LUPA/2, TAMANHO_LUPA);
    ctxLupa.moveTo(0, TAMANHO_LUPA/2);
    ctxLupa.lineTo(TAMANHO_LUPA, TAMANHO_LUPA/2);
    ctxLupa.stroke();
});
// Inicia
window.onload = iniciarSistema;