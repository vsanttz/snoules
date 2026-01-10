// js/login.js
// NOTA: A verificação de autenticação obrigatória foi REMOVIDA
// Usuários podem acessar login/cadastro livremente

document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página de login
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const termsModal = document.getElementById('termsModal');
    
    // Inicializar conforme a página
    if (loginForm) initLoginPage();
    if (registerForm) initRegisterPage();
    initCommonElements();
});

function initLoginPage() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const togglePasswordBtn = document.getElementById('toggleLoginPassword');
    const forgotPasswordBtn = document.getElementById('forgotPassword');
    const loginBtn = document.getElementById('loginButton');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginButtonText = document.getElementById('loginButtonText');

    // Mostrar/esconder senha
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        this.innerHTML = type === 'password' ? 
            '<i class="fas fa-eye"></i>' : 
            '<i class="fas fa-eye-slash"></i>';
    });

    // Validação em tempo real
    emailInput.addEventListener('input', function() {
        validateEmail(this);
    });

    // Submit do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateLoginForm()) return;
        
        // Desabilitar botão e mostrar spinner
        loginBtn.disabled = true;
        loginButtonText.textContent = 'ENTRANDO...';
        loginSpinner.classList.remove('hidden');
        
        try {
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            // Aqui você substituirá pelo seu endpoint real
            // Exemplo com fetch:
            // const response = await fetch('https://seu-backend.com/api/login', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ email, password })
            // });
            // const data = await response.json();
            
            // Usando o serviço mock por enquanto
            // const response = await authService.login(email, password);
            // showMessage('loginSuccessMessage', 'success');
            
            // Para demonstração, simulando login bem-sucedido
            setTimeout(() => {
                // Simular login
                localStorage.setItem('token', 'demo-token-' + Date.now());
                localStorage.setItem('usuario', JSON.stringify({
                    nome: email.split('@')[0],
                    email: email
                }));
                
                showMessage('loginSuccessMessage', 'success');
                
                // Redirecionar após login bem-sucedido (OPCIONAL)
                setTimeout(() => {
                    window.location.href = 'loja.html';
                }, 1500);
            }, 1000);
            
        } catch (error) {
            showMessage('loginErrorMessage', 'error', error.message || 'Erro ao fazer login');
        } finally {
            // Reabilitar botão
            loginBtn.disabled = false;
            loginButtonText.textContent = 'ENTRAR';
            loginSpinner.classList.add('hidden');
        }
    });

    // Modal de recuperação de senha
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('forgotPasswordModal').classList.add('active');
        });
    }
}

function initRegisterPage() {
    const form = document.getElementById('registerForm');
    const passwordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('passwordStrengthText');
    const requirements = {
        length: document.getElementById('reqLength'),
        upper: document.getElementById('reqUpper'),
        lower: document.getElementById('reqLower'),
        number: document.getElementById('reqNumber'),
        special: document.getElementById('reqSpecial')
    };
    
    // Validar senha em tempo real
    passwordInput.addEventListener('input', function() {
        const validation = validationUtils.validatePassword(this.value);
        
        // Atualizar barra de força
        strengthBar.className = 'strength-fill ' + validation.strength;
        strengthText.textContent = getStrengthText(validation.strength);
        
        // Atualizar requisitos
        Object.keys(requirements).forEach(key => {
            if (validation.requirements[key]) {
                requirements[key].classList.add('valid');
            } else {
                requirements[key].classList.remove('valid');
            }
        });
        
        // Validar confirmação
        validatePasswordMatch();
    });
    
    // Validar confirmação de senha
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    
    // Toggle password visibility
    ['toggleRegisterPassword', 'toggleConfirmPassword'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', function() {
                const targetId = this.id.replace('toggle', '').replace('Password', '');
                const targetInput = document.getElementById(targetId + 'Password');
                if (targetInput) {
                    const type = targetInput.type === 'password' ? 'text' : 'password';
                    targetInput.type = type;
                    this.innerHTML = type === 'password' ? 
                        '<i class="fas fa-eye"></i>' : 
                        '<i class="fas fa-eye-slash"></i>';
                }
            });
        }
    });
    
    // Validar formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateRegisterForm()) return;
        
        const registerBtn = document.getElementById('registerButton');
        const registerSpinner = document.getElementById('registerSpinner');
        const registerButtonText = document.getElementById('registerButtonText');
        
        // Desabilitar botão
        registerBtn.disabled = true;
        registerButtonText.textContent = 'CRIANDO CONTA...';
        registerSpinner.classList.remove('hidden');
        
        try {
            const userData = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                email: document.getElementById('registerEmail').value.trim(),
                phone: validationUtils.formatPhone(document.getElementById('phone').value),
                password: passwordInput.value,
                newsletter: document.getElementById('newsletter').checked
            };
            
            // Aqui você substituirá pelo seu endpoint real
            // const response = await fetch('https://seu-backend.com/api/register', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(userData)
            // });
            
            // Para demonstração, simulando cadastro bem-sucedido
            setTimeout(() => {
                // Simular cadastro
                localStorage.setItem('token', 'demo-token-' + Date.now());
                localStorage.setItem('usuario', JSON.stringify({
                    nome: userData.firstName + ' ' + userData.lastName,
                    email: userData.email
                }));
                
                showMessage('registerSuccessMessage', 'success');
                
                // Redirecionar após cadastro (OPCIONAL)
                setTimeout(() => {
                    window.location.href = 'loja.html';
                }, 2000);
                
            }, 1000);
            
        } catch (error) {
            showMessage('registerErrorMessage', 'error', error.message || 'Erro ao criar conta');
        } finally {
            registerBtn.disabled = false;
            registerButtonText.textContent = 'CRIAR CONTA';
            registerSpinner.classList.add('hidden');
        }
    });
    
    // Links dos termos
    document.querySelectorAll('.terms-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('termsModal').classList.add('active');
        });
    });
}

function initCommonElements() {
    // Fechar modais
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // Fechar modal clicando fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Validação de email em inputs de recuperação
    const recoveryEmailInput = document.getElementById('recoveryEmail');
    if (recoveryEmailInput) {
        recoveryEmailInput.addEventListener('input', function() {
            validateEmail(this, 'recoveryEmailError');
        });
    }
    
    // Enviar recuperação de senha
    const sendRecoveryBtn = document.getElementById('sendRecoveryButton');
    if (sendRecoveryBtn) {
        sendRecoveryBtn.addEventListener('click', async function() {
            const emailInput = document.getElementById('recoveryEmail');
            const emailError = document.getElementById('recoveryEmailError');
            
            if (!validationUtils.validateEmail(emailInput.value.trim())) {
                emailError.textContent = 'Por favor, insira um email válido';
                return;
            }
            
            this.disabled = true;
            this.textContent = 'ENVIANDO...';
            
            try {
                // Simular envio de recuperação
                await new Promise(resolve => setTimeout(resolve, 1500));
                alert('Instruções de recuperação enviadas para seu email!');
                document.getElementById('forgotPasswordModal').classList.remove('active');
                emailInput.value = '';
            } catch (error) {
                alert('Erro ao enviar instruções: ' + error.message);
            } finally {
                this.disabled = false;
                this.textContent = 'ENVIAR INSTRUÇÕES';
            }
        });
    }
}

// Funções de validação
function validateLoginForm() {
    let isValid = true;
    const email = document.getElementById('loginEmail');
    const password = document.getElementById('loginPassword');
    
    // Validar email
    if (!validationUtils.validateEmail(email.value.trim())) {
        showError('loginEmailError', 'Por favor, insira um email válido');
        isValid = false;
    } else {
        clearError('loginEmailError');
    }
    
    // Validar senha
    if (password.value.length < 6) {
        showError('loginPasswordError', 'A senha deve ter pelo menos 6 caracteres');
        isValid = false;
    } else {
        clearError('loginPasswordError');
    }
    
    return isValid;
}

function validateRegisterForm() {
    let isValid = true;
    
    // Validar nomes
    ['firstName', 'lastName'].forEach(id => {
        const input = document.getElementById(id);
        const errorId = id + 'Error';
        
        if (!validationUtils.validateName(input.value)) {
            showError(errorId, 'Por favor, insira um nome válido (mínimo 2 caracteres)');
            isValid = false;
        } else {
            clearError(errorId);
        }
    });
    
    // Validar email
    const emailInput = document.getElementById('registerEmail');
    if (!validationUtils.validateEmail(emailInput.value.trim())) {
        showError('registerEmailError', 'Por favor, insira um email válido');
        isValid = false;
    } else {
        clearError('registerEmailError');
    }
    
    // Validar telefone
    const phoneInput = document.getElementById('phone');
    if (!validationUtils.validatePhone(phoneInput.value)) {
        showError('phoneError', 'Por favor, insira um telefone válido (ex: (11) 99999-9999)');
        isValid = false;
    } else {
        clearError('phoneError');
    }
    
    // Validar senha
    const passwordValidation = validationUtils.validatePassword(
        document.getElementById('registerPassword').value
    );
    if (!passwordValidation.valid) {
        showError('registerPasswordError', 'A senha não atende aos requisitos mínimos');
        isValid = false;
    } else {
        clearError('registerPasswordError');
    }
    
    // Validar confirmação
    if (!validatePasswordMatch()) {
        isValid = false;
    }
    
    // Validar termos
    const termsCheckbox = document.getElementById('terms');
    if (!termsCheckbox.checked) {
        showError('termsError', 'Você deve aceitar os termos para continuar');
        isValid = false;
    } else {
        clearError('termsError');
    }
    
    return isValid;
}

function validateEmail(input, errorId = null) {
    const email = input.value.trim();
    const errorElement = errorId ? 
        document.getElementById(errorId) : 
        document.getElementById(input.id + 'Error');
    
    if (!errorElement) return true;
    
    if (!validationUtils.validateEmail(email)) {
        showError(errorElement.id, 'Por favor, insira um email válido');
        return false;
    } else {
        clearError(errorElement.id);
        return true;
    }
}

function validatePasswordMatch() {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorElement = document.getElementById('confirmPasswordError');
    
    if (password !== confirmPassword) {
        showError('confirmPasswordError', 'As senhas não coincidem');
        return false;
    } else {
        clearError('confirmPasswordError');
        return true;
    }
}

// Funções auxiliares
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function clearError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
        element.style.display = 'none';
    }
}

function showMessage(elementId, type, customMessage = null) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Esconder outras mensagens
    document.querySelectorAll('.message').forEach(msg => {
        if (msg.id !== elementId) msg.classList.add('hidden');
    });
    
    // Mostrar mensagem
    element.classList.remove('hidden');
    
    if (customMessage) {
        const textElement = element.querySelector('span');
        if (textElement) textElement.textContent = customMessage;
    }
    
    // Auto-esconder mensagens de sucesso
    if (type === 'success') {
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }
}

function getStrengthText(strength) {
    const texts = {
        weak: 'Senha fraca',
        fair: 'Senha razoável',
        good: 'Senha boa',
        strong: 'Senha forte'
    };
    return texts[strength] || 'Força da senha';
}

// NOTA IMPORTANTE: A verificação de autenticação obrigatória foi REMOVIDA
// Usuários podem acessar login/cadastro livremente, mesmo se já estiverem logados