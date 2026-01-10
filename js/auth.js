// js/auth.js - Gerenciamento de autenticação (OPCIONAL)

import { authAPI, produtosAPI } from './api.js';

// Gerenciar formulário de login
export function inicializarLogin() {
    const formLogin = document.getElementById('form-login');
    
    if (!formLogin) return;
    
    formLogin.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const botaoSubmit = formLogin.querySelector('button[type="submit"]');
        const mensagemErro = document.getElementById('mensagem-erro');
        
        // Resetar estado
        if (mensagemErro) {
            mensagemErro.textContent = '';
            mensagemErro.classList.add('hidden');
        }
        
        // Mostrar loading
        botaoSubmit.disabled = true;
        botaoSubmit.innerHTML = '<span class="spinner"></span> Entrando...';
        
        try {
            const resposta = await authAPI.login(email, senha);
            
            if (resposta.sucesso) {
                // Salvar token e usuário
                localStorage.setItem('token', resposta.token);
                localStorage.setItem('usuario', JSON.stringify(resposta.usuario));
                
                // Mostrar mensagem de sucesso
                mostrarNotificacao('Login realizado com sucesso!', 'success');
                
                // Atualizar interface
                atualizarInterfaceUsuario();
                
                // Redirecionar para loja após 1 segundo (OPCIONAL)
                setTimeout(() => {
                    window.location.href = 'loja.html';
                }, 1000);
            }
            
        } catch (error) {
            // Mostrar erro
            if (mensagemErro) {
                mensagemErro.textContent = error.message || 'Email ou senha incorretos';
                mensagemErro.classList.remove('hidden');
            }
            
            botaoSubmit.disabled = false;
            botaoSubmit.textContent = 'Entrar';
        }
    });
}

// Gerenciar formulário de cadastro
export function inicializarCadastro() {
    const formCadastro = document.getElementById('form-cadastro');
    
    if (!formCadastro) return;
    
    // Validação de senha em tempo real
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmar-senha');
    
    if (senhaInput && confirmarSenhaInput) {
        confirmarSenhaInput.addEventListener('input', () => {
            validarSenhasIguais();
        });
    }
    
    formCadastro.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;
        const botaoSubmit = formCadastro.querySelector('button[type="submit"]');
        const mensagemErro = document.getElementById('mensagem-erro');
        
        // Resetar estado
        if (mensagemErro) {
            mensagemErro.textContent = '';
            mensagemErro.classList.add('hidden');
        }
        
        // Validações básicas
        if (senha !== confirmarSenha) {
            if (mensagemErro) {
                mensagemErro.textContent = 'As senhas não coincidem';
                mensagemErro.classList.remove('hidden');
            }
            return;
        }
        
        if (senha.length < 6) {
            if (mensagemErro) {
                mensagemErro.textContent = 'A senha deve ter no mínimo 6 caracteres';
                mensagemErro.classList.remove('hidden');
            }
            return;
        }
        
        // Mostrar loading
        botaoSubmit.disabled = true;
        botaoSubmit.innerHTML = '<span class="spinner"></span> Criando conta...';
        
        try {
            const resposta = await authAPI.cadastro(nome, email, senha, confirmarSenha);
            
            if (resposta.sucesso) {
                // Salvar token e usuário
                localStorage.setItem('token', resposta.token);
                localStorage.setItem('usuario', JSON.stringify(resposta.usuario));
                
                // Mostrar mensagem de sucesso
                mostrarNotificacao('Conta criada com sucesso!', 'success');
                
                // Atualizar interface
                atualizarInterfaceUsuario();
                
                // Redirecionar para loja após 1.5 segundos (OPCIONAL)
                setTimeout(() => {
                    window.location.href = 'loja.html';
                }, 1500);
            }
            
        } catch (error) {
            // Mostrar erro
            if (mensagemErro) {
                mensagemErro.textContent = error.message || 'Erro ao criar conta';
                mensagemErro.classList.remove('hidden');
            }
            
            botaoSubmit.disabled = false;
            botaoSubmit.textContent = 'Criar Conta';
        }
    });
}

// Validar se senhas são iguais
function validarSenhasIguais() {
    const senha = document.getElementById('senha');
    const confirmarSenha = document.getElementById('confirmar-senha');
    const erroConfirmacao = document.getElementById('erro-confirmar-senha');
    
    if (!senha || !confirmarSenha || !erroConfirmacao) return;
    
    if (confirmarSenha.value && senha.value !== confirmarSenha.value) {
        erroConfirmacao.textContent = 'As senhas não coincidem';
        erroConfirmacao.classList.remove('hidden');
    } else {
        erroConfirmacao.textContent = '';
        erroConfirmacao.classList.add('hidden');
    }
}

// Verificar autenticação (APENAS verifica, NÃO redireciona)
export function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');
    
    // Retorna true se estiver autenticado, false se não
    // NÃO REDIRECIONA MAIS
    return !!token;
}

// Atualizar interface com informações do usuário
export function atualizarInterfaceUsuario() {
    const usuario = getUsuario();
    
    // Atualizar menu de usuário
    const menuUsuario = document.getElementById('menu-usuario');
    const linkLogin = document.getElementById('link-login');
    const linkLogout = document.getElementById('link-logout');
    const nomeUsuario = document.getElementById('nome-usuario');
    
    if (usuario) {
        // Usuário logado
        if (linkLogin) linkLogin.style.display = 'none';
        if (linkLogout) linkLogout.style.display = 'inline';
        if (nomeUsuario) nomeUsuario.textContent = usuario.nome || 'Usuário';
        if (menuUsuario) menuUsuario.style.display = 'flex';
    } else {
        // Usuário não logado - MOSTRAR opção de login
        if (linkLogin) linkLogin.style.display = 'inline';
        if (linkLogout) linkLogout.style.display = 'none';
        if (nomeUsuario) nomeUsuario.textContent = '';
        if (menuUsuario) menuUsuario.style.display = 'none';
    }
}

// Configurar logout
export function configurarLogout() {
    const botaoLogout = document.getElementById('link-logout');
    
    if (botaoLogout) {
        botaoLogout.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (confirm('Tem certeza que deseja sair?')) {
                authAPI.logout();
                atualizarInterfaceUsuario();
                mostrarNotificacao('Logout realizado com sucesso!', 'success');
                
                // Redirecionar para página inicial (OPCIONAL)
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        });
    }
}

// Função auxiliar para mostrar notificações
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Criar elemento de notificação
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
    
    // Animar entrada
    setTimeout(() => {
        notificacao.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notificacao.style.transform = 'translateX(150%)';
        setTimeout(() => {
            document.body.removeChild(notificacao);
        }, 400);
    }, 3000);
}

// Exportar utilitários
export { getUsuario } from './api.js';