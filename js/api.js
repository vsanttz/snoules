// js/api.js - Configuração da API (sem bloqueio de rotas)

const API_BASE_URL = 'http://localhost:3000/api';

// Função para fazer requisições à API
async function fazerRequisicao(endpoint, opcoes = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Configuração padrão
    const configPadrao = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    // Adicionar token se existir (OPCIONAL)
    const token = localStorage.getItem('token');
    if (token) {
        configPadrao.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Combinar opções
    const config = {
        ...configPadrao,
        ...opcoes,
        headers: {
            ...configPadrao.headers,
            ...(opcoes.headers || {})
        }
    };
    
    try {
        const resposta = await fetch(url, config);
        const dados = await resposta.json();
        
        // Não verificar autenticação automaticamente
        // Deixa a aplicação cliente decidir como tratar erros
        return dados;
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

// API de Autenticação
export const authAPI = {
    async login(email, senha) {
        return fazerRequisicao('/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        });
    },
    
    async cadastro(nome, email, senha, confirmarSenha) {
        return fazerRequisicao('/cadastro', {
            method: 'POST',
            body: JSON.stringify({ nome, email, senha, confirmarSenha })
        });
    },
    
    async verificarAutenticacao() {
        return fazerRequisicao('/verificar-auth');
    },
    
    logout() {
        // Apenas limpa os dados locais
        // O redirecionamento deve ser feito pela interface
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
    }
};

// API de Produtos (acesso público)
export const produtosAPI = {
    async buscarTodos() {
        return fazerRequisicao('/produtos');
    },
    
    async buscarPorId(id) {
        return fazerRequisicao(`/produtos/${id}`);
    }
};

// Utilitários
export function estaAutenticado() {
    // Apenas verifica se há token, não faz nada além disso
    return !!localStorage.getItem('token');
}

export function getUsuario() {
    const usuarioStr = localStorage.getItem('usuario');
    return usuarioStr ? JSON.parse(usuarioStr) : null;
}

export function getToken() {
    return localStorage.getItem('token');
}