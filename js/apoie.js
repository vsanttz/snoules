// js/apoie.js
class SupportPage {
    constructor() {
        this.tabs = document.querySelectorAll('.support-tab');
        this.contents = document.querySelectorAll('.support-content');
        this.buttons = document.querySelectorAll('.support-button');
        
        this.init();
    }
    
    init() {
        this.setupTabs();
        this.setupSupportButtons();
        this.setupPageAnimations();
        this.setupScrollIndicator();
    }
    
    setupScrollIndicator() {
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            scrollIndicator.addEventListener('click', () => {
                // Calcula a posição da próxima seção (mission-section)
                const missionSection = document.querySelector('.mission-section');
                if (missionSection) {
                    const missionSectionTop = missionSection.offsetTop - 80; // Offset para visualização melhor
                    
                    window.scrollTo({
                        top: missionSectionTop,
                        behavior: 'smooth'
                    });
                } else {
                    // Fallback: scroll para uma altura específica
                    window.scrollTo({
                        top: window.innerHeight,
                        behavior: 'smooth'
                    });
                }
            });
            
            // Adiciona efeito de fade out quando o usuário scrolla
            window.addEventListener('scroll', () => {
                const scrollPosition = window.scrollY;
                if (scrollPosition > 100) {
                    scrollIndicator.style.opacity = '0';
                    scrollIndicator.style.pointerEvents = 'none';
                } else {
                    scrollIndicator.style.opacity = '1';
                    scrollIndicator.style.pointerEvents = 'auto';
                }
            });
        }
    }
    
    setupTabs() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                this.switchTab(tabId, tab);
            });
        });
    }
    
    switchTab(tabId, activeTab) {
        // Remove a classe active de todas as abas e conteúdos
        this.tabs.forEach(t => t.classList.remove('active'));
        this.contents.forEach(c => c.classList.remove('active'));
        
        // Adiciona a classe active à aba e conteúdo selecionados
        activeTab.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }
    
    setupSupportButtons() {
        this.buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleSupportClick(e);
            });
        });
    }
    
    handleSupportClick(e) {
        const button = e.target;
        const card = button.closest('.support-card');
        
        // Animação de clique
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
        
        // Mostra mensagem "EM BREVE" na tela
        this.showSoonMessage(card);
    }
    
    showSoonMessage(card) {
        // Cria elemento para a mensagem
        const message = document.createElement('div');
        message.textContent = 'EM BREVE';
        message.classList.add('soon-message');
        
        // Adiciona a mensagem ao body
        document.body.appendChild(message);
        
        // Remove a mensagem após a animação
        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        }, 2000);
    }
    
    setupPageAnimations() {
        // Inicializa animações de entrada para elementos específicos da página
        const fadeElements = document.querySelectorAll('.mission-card, .support-card, .testimonial-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        
        fadeElements.forEach(element => observer.observe(element));
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    new SupportPage();
});