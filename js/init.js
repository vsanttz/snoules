// js/init.js - Inicialização segura sem autenticação obrigatória

// Importar funcionalidades de autenticação (se usarem módulos ES6)
// import { atualizarInterfaceUsuario, configurarLogout } from './auth.js';
// import { inicializarLogin, inicializarCadastro } from './auth.js';

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Site inicializado (modo público)');
    
    // Função para verificar se usuário está autenticado
    function verificarAutenticacao() {
        return !!localStorage.getItem('token');
    }
    
    // Função para obter dados do usuário
    function getUsuario() {
        const usuarioStr = localStorage.getItem('usuario');
        return usuarioStr ? JSON.parse(usuarioStr) : null;
    }
    
    // Atualizar interface do usuário (se estiver logado)
    function atualizarInterfaceUsuario() {
        const usuario = getUsuario();
        
        // Atualizar menu de usuário
        const menuUsuario = document.getElementById('menu-usuario');
        const linkLogin = document.getElementById('link-login');
        const linkLogout = document.getElementById('link-logout');
        const nomeUsuario = document.getElementById('nome-usuario');
        
        if (usuario && verificarAutenticacao()) {
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
    function configurarLogout() {
        const botaoLogout = document.getElementById('link-logout');
        
        if (botaoLogout) {
            botaoLogout.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (confirm('Tem certeza que deseja sair?')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('usuario');
                    atualizarInterfaceUsuario();
                    
                    // Mostrar notificação
                    mostrarNotificacao('Logout realizado com sucesso!', 'success');
                    
                    // Redirecionar para página inicial (OPCIONAL)
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            });
        }
    }
    
    // Função para mostrar notificações
    function mostrarNotificacao(mensagem, tipo = 'info') {
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
    
    // Executar inicializações
    try {
        // Atualizar interface do usuário
        atualizarInterfaceUsuario();
        
        // Configurar logout
        configurarLogout();
        
        // Inicializar CommonUtils se existir
        if (typeof CommonUtils !== 'undefined') {
            CommonUtils.init();
        }
        
        // Inicializar AppState (carrinho) se existir
        if (typeof AppState !== 'undefined') {
            AppState.init();
        }
        
        // Inicializar funcionalidades específicas da loja
        if (typeof UI !== 'undefined') {
            UI.init();
        }
        
        console.log('✅ Site inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
    }
});

// Se estiver usando módulos ES6, você pode descomentar os imports acima
// e remover as funções duplicadas