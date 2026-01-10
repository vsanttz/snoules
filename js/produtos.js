// js/produtos.js - Gerenciamento de produtos

import { produtosAPI } from './api.js';

export async function carregarProdutos() {
    try {
        const resposta = await produtosAPI.buscarTodos();
        
        if (resposta.sucesso && resposta.produtos) {
            return resposta.produtos;
        }
        
        return [];
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        return [];
    }
}

export function renderizarProdutos(produtos, containerId = 'products-grid') {
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    // Limpar container
    container.innerHTML = '';
    
    if (produtos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhum produto disponível no momento.</p>
            </div>
        `;
        return;
    }
    
    // Renderizar cada produto
    produtos.forEach(produto => {
        const produtoElement = criarElementoProduto(produto);
        container.appendChild(produtoElement);
    });
}

function criarElementoProduto(produto) {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
        <div class="product-image">
            <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
        </div>
        <h3 class="product-title">${produto.nome}</h3>
        <div class="product-price">R$ ${produto.preco.toFixed(2)}</div>
        <p class="product-description">${produto.descricao}</p>
        <div class="product-actions">
            <button class="view-details" data-id="${produto.id}">Ver Detalhes</button>
            <button class="add-to-cart" data-id="${produto.id}">Adicionar ao Carrinho</button>
        </div>
    `;
    
    return div;
}

// Inicializar funcionalidades de produtos
export function inicializarProdutos() {
    // Carregar produtos quando a página carregar
    document.addEventListener('DOMContentLoaded', async () => {
        const produtos = await carregarProdutos();
        renderizarProdutos(produtos);
        
        // Configurar eventos dos botões
        configurarEventosProdutos();
    });
}

function configurarEventosProdutos() {
    // Event delegation para os botões
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-details')) {
            const id = e.target.dataset.id;
            abrirModalProduto(id);
        }
        
        if (e.target.classList.contains('add-to-cart')) {
            const id = e.target.dataset.id;
            adicionarAoCarrinho(id);
        }
    });
}

async function abrirModalProduto(id) {
    try {
        const resposta = await produtosAPI.buscarPorId(id);
        
        if (resposta.sucesso && resposta.produto) {
            const produto = resposta.produto;
            
            // Criar modal de detalhes
            const modalHTML = `
                <div class="modal active" id="produto-modal">
                    <div class="modal-content">
                        <button class="close-modal">&times;</button>
                        <div class="modal-body">
                            <div class="modal-image">
                                <img src="${produto.imagem}" alt="${produto.nome}">
                            </div>
                            <div class="modal-details">
                                <h2 class="modal-title">${produto.nome}</h2>
                                <div class="modal-price">R$ ${produto.preco.toFixed(2)}</div>
                                <p class="modal-description">${produto.descricao}</p>
                                <div class="modal-features">
                                    <h3 class="features-title">Categoria</h3>
                                    <p>${produto.categoria}</p>
                                </div>
                                <div class="modal-actions">
                                    <button class="add-to-cart-modal" data-id="${produto.id}">Adicionar ao Carrinho</button>
                                    <button class="btn-secondary close-modal">Fechar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Adicionar modal ao documento
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);
            
            // Configurar eventos do modal
            configurarEventosModal();
        }
    } catch (error) {
        console.error('Erro ao abrir modal:', error);
        alert('Erro ao carregar detalhes do produto');
    }
}

function configurarEventosModal() {
    const modal = document.getElementById('produto-modal');
    const closeButtons = modal.querySelectorAll('.close-modal');
    const addToCartButton = modal.querySelector('.add-to-cart-modal');
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.remove();
        });
    });
    
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            const id = addToCartButton.dataset.id;
            adicionarAoCarrinho(id);
            modal.remove();
        });
    }
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function adicionarAoCarrinho(id) {
    // Implementar lógica do carrinho
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    
    // Verificar se produto já está no carrinho
    const produtoExistente = carrinho.find(item => item.id == id);
    
    if (produtoExistente) {
        produtoExistente.quantidade += 1;
    } else {
        carrinho.push({
            id: id,
            quantidade: 1,
            dataAdicao: new Date().toISOString()
        });
    }
    
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    
    // Atualizar contador do carrinho
    atualizarContadorCarrinho();
    
    // Mostrar notificação
    mostrarNotificacao('Produto adicionado ao carrinho!', 'success');
}

function atualizarContadorCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    
    const contadorCarrinho = document.getElementById('cart-count');
    if (contadorCarrinho) {
        contadorCarrinho.textContent = totalItens;
        contadorCarrinho.style.display = totalItens > 0 ? 'flex' : 'none';
    }
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Mesma função do auth.js, pode ser movida para um arquivo utils.js
    const notificacao = document.createElement('div');
    notificacao.className = `notification ${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        background: ${tipo === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        transform: translateX(150%);
        transition: transform 0.4s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notificacao.style.transform = 'translateX(150%)';
        setTimeout(() => {
            document.body.removeChild(notificacao);
        }, 400);
    }, 3000);
}

// Inicializar contador do carrinho
document.addEventListener('DOMContentLoaded', () => {
    atualizarContadorCarrinho();
});