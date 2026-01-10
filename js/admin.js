// js/admin.js - Painel Administrativo Snoules (VERSÃO COM SINCRONIZAÇÃO EM NUVEM)

// === SISTEMA DE SINCRONIZAÇÃO EM NUVEM ===
class CloudSync {
    constructor() {
        this.BIN_ID = '6906a7a9ae596e708f3dcc4a'; // SUBSTITUA PELO SEU BIN ID
        this.API_KEY = '$2a$10$ZlN7h6kE4uHgceHvMVttQOopSyj9DlLHHVnO0XccLBAokuO0HCF0q'; // SUBSTITUA PELA SUA API KEY
        this.BIN_URL = `https://api.jsonbin.io/v3/b/${this.BIN_ID}`;
    }

    // Buscar pedidos da nuvem
    async fetchOrders() {
        try {
            console.log('🌐 Buscando pedidos da nuvem...');
            const response = await fetch(this.BIN_URL, {
                method: 'GET',
                headers: {
                    'X-Master-Key': this.API_KEY
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Dados recebidos da nuvem:', data.record);
            return data.record || { orders: [], cancelledOrders: [] };
        } catch (error) {
            console.error('❌ Erro ao buscar pedidos da nuvem:', error);
            return { orders: [], cancelledOrders: [] };
        }
    }

    // Salvar pedidos na nuvem
    async saveOrders(orders, cancelledOrders) {
        try {
            console.log('🌐 Salvando pedidos na nuvem...');
            const data = {
                orders: orders,
                cancelledOrders: cancelledOrders,
                lastUpdate: new Date().toISOString()
            };

            const response = await fetch(this.BIN_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.API_KEY
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Pedidos salvos na nuvem:', result);
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar na nuvem:', error);
            return false;
        }
    }
}

class AdminPanel {
    constructor() {
        this.orders = [];
        this.cancelledOrders = [];
        this.filteredOrders = [];
        this.filteredCancelledOrders = [];
        this.currentOrder = null;
        this.orderToCancel = null;
        this.orderToDelete = null;
        this.currentPage = 1;
        this.cancelledPage = 1;
        this.ordersPerPage = 10;
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.currentCancelledSearch = '';
        this.currentTab = 'orders';
        this.cloudSync = new CloudSync();
        
        this.init();
    }

    init() {
        console.log('🚀 Inicializando Painel Admin Snoules...');
        
        // Verificar sessão básica
        if (!this.checkSession()) {
            return;
        }

        this.loadOrders();
        this.setupEventListeners();
        this.applyFilters();
        this.updateStats();
        this.updateTabCounts();
        this.startAutoRefresh();
        
        console.log('✅ Painel Admin inicializado com sucesso!');
    }

    checkSession() {
        const sessionToken = sessionStorage.getItem('snoules-admin-session');
        if (!sessionToken) {
            this.redirectToLogin();
            return false;
        }
        return true;
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    setupEventListeners() {
        // Fechar modais
        document.getElementById('closeModal')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('closeCancelModal')?.addEventListener('click', () => {
            this.closeCancelModal();
        });

        // Fechar modais ao clicar fora
        document.getElementById('orderModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });

        document.getElementById('cancelModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeCancelModal();
            }
        });

        // Tecla ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeCancelModal();
            }
        });

        // Filtros
        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.currentPage = 1;
            this.applyFilters();
        });

        document.getElementById('searchOrders')?.addEventListener('input', (e) => {
            this.currentSearch = e.target.value.toLowerCase();
            this.currentPage = 1;
            this.applyFilters();
        });

        document.getElementById('searchCancelledOrders')?.addEventListener('input', (e) => {
            this.currentCancelledSearch = e.target.value.toLowerCase();
            this.cancelledPage = 1;
            this.renderCancelledOrders();
        });

        // Navegação por tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.showTab(tabName);
            });
        });

        // Navegação lateral
        document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
            item.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.showTab(tabName);
            });
        });

        // Botões de logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('headerLogoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Botão de refresh
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refreshData();
        });
    }

    logout() {
        if (confirm('Tem certeza que deseja sair do Painel Administrativo?')) {
            sessionStorage.removeItem('snoules-admin-session');
            this.redirectToLogin();
        }
    }

    refreshData() {
        this.loadOrders();
        this.applyFilters();
        this.updateStats();
        this.updateTabCounts();
        this.showNotification('Dados atualizados com sucesso!');
    }

    async loadOrders() {
        console.log('📥 Carregando pedidos...');
        
        try {
            const cloudData = await this.cloudSync.fetchOrders();
            this.orders = cloudData.orders || [];
            this.cancelledOrders = cloudData.cancelledOrders || [];
            
            console.log(`✅ ${this.orders.length} pedidos ativos carregados da nuvem`);
            console.log(`✅ ${this.cancelledOrders.length} pedidos cancelados carregados da nuvem`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar da nuvem, usando localStorage:', error);
            this.loadFromLocalStorage();
        }
    }

    async saveOrders() {
        try {
            const cloudSuccess = await this.cloudSync.saveOrders(this.orders, this.cancelledOrders);
            
            if (cloudSuccess) {
                console.log('💾 Pedidos salvos na nuvem');
            } else {
                this.saveToLocalStorage();
                console.log('💾 Pedidos salvos no localStorage (fallback)');
            }
        } catch (error) {
            console.error('❌ Erro ao salvar pedidos:', error);
            this.saveToLocalStorage();
        }
    }

    // Métodos de fallback
    loadFromLocalStorage() {
        try {
            const savedOrders = localStorage.getItem('snoules-orders');
            const savedCancelledOrders = localStorage.getItem('snoules-cancelled-orders');
            
            this.orders = savedOrders ? JSON.parse(savedOrders) : [];
            this.cancelledOrders = savedCancelledOrders ? JSON.parse(savedCancelledOrders) : [];
            
            console.log(`📦 ${this.orders.length} pedidos carregados do localStorage`);
            console.log(`📦 ${this.cancelledOrders.length} cancelados carregados do localStorage`);
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
            this.orders = [];
            this.cancelledOrders = [];
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('snoules-orders', JSON.stringify(this.orders));
            localStorage.setItem('snoules-cancelled-orders', JSON.stringify(this.cancelledOrders));
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    }

    showTab(tabName) {
        this.currentTab = tabName;
        
        // Atualizar botões das abas
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        
        // Ativar aba atual
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`)?.classList.add('active');
        document.querySelector(`.nav-item[data-tab="${tabName}"]`)?.classList.add('active');
        document.getElementById(`${tabName}Tab`)?.classList.add('active');
        
        if (tabName === 'orders') {
            this.applyFilters();
        } else if (tabName === 'cancelled') {
            this.renderCancelledOrders();
        }
    }

    updateTabCounts() {
        const activeCount = document.getElementById('activeOrdersCount');
        const cancelledCount = document.getElementById('cancelledOrdersCount');
        
        if (activeCount) activeCount.textContent = this.orders.length;
        if (cancelledCount) cancelledCount.textContent = this.cancelledOrders.length;
    }

    applyFilters() {
        // Aplicar filtro de status
        if (this.currentFilter === 'all') {
            this.filteredOrders = [...this.orders];
        } else {
            this.filteredOrders = this.orders.filter(order => order.status === this.currentFilter);
        }
        
        // Aplicar busca
        if (this.currentSearch) {
            this.filteredOrders = this.filteredOrders.filter(order => {
                const searchTerm = this.currentSearch.toLowerCase();
                return (
                    order.id?.toLowerCase().includes(searchTerm) ||
                    (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm)) ||
                    order.customer?.fullName?.toLowerCase().includes(searchTerm) ||
                    order.customer?.email?.toLowerCase().includes(searchTerm) ||
                    order.customer?.phone?.toLowerCase().includes(searchTerm)
                );
            });
        }
        
        // Ordenar por data (mais recente primeiro)
        this.filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        this.renderOrders();
        this.renderPagination();
    }

    renderOrders() {
        const ordersTableBody = document.getElementById('ordersTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (!ordersTableBody || !emptyState) return;
        
        if (this.filteredOrders.length === 0) {
            ordersTableBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        const startIndex = (this.currentPage - 1) * this.ordersPerPage;
        const endIndex = startIndex + this.ordersPerPage;
        const currentOrders = this.filteredOrders.slice(startIndex, endIndex);
        
        ordersTableBody.innerHTML = currentOrders.map(order => `
            <tr>
                <td class="order-id">#${order.orderNumber || order.id.substring(0, 8)}</td>
                <td class="customer-info">
                    <div class="customer-name">${order.customer?.fullName || 'Cliente não informado'}</div>
                    <div class="customer-contact">${order.customer?.email || 'Email não informado'}</div>
                </td>
                <td class="order-value">R$ ${order.total ? order.total.toFixed(2) : '0.00'}</td>
                <td class="order-date mobile-hidden">${this.formatDate(order.createdAt)}</td>
                <td class="order-status">
                    <span class="status-badge status-${order.status}">
                        ${this.getStatusText(order.status)}
                    </span>
                </td>
                <td class="order-actions">
                    <button class="action-btn view" onclick="admin.viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i> Detalhes
                    </button>
                    ${order.status !== 'cancelled' && order.status !== 'delivered' ? `
                        <button class="action-btn cancel" onclick="admin.showCancelConfirmation('${order.id}')">
                            <i class="fas fa-ban"></i> Cancelar
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
        console.log(`🔄 ${currentOrders.length} pedidos renderizados na tabela`);
    }

    renderPagination() {
        const paginationInfo = document.getElementById('paginationInfo');
        const paginationControls = document.getElementById('paginationControls');
        
        if (!paginationInfo || !paginationControls) return;
        
        const totalPages = Math.ceil(this.filteredOrders.length / this.ordersPerPage);
        
        const startItem = (this.currentPage - 1) * this.ordersPerPage + 1;
        const endItem = Math.min(this.currentPage * this.ordersPerPage, this.filteredOrders.length);
        
        paginationInfo.textContent = `Mostrando ${startItem}-${endItem} de ${this.filteredOrders.length} pedidos`;
        
        let paginationHTML = '';
        
        // Botão anterior
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                onclick="admin.changePage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Botões de página
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                paginationHTML += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="admin.changePage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                paginationHTML += `<span class="pagination-btn" style="border: none; cursor: default;">...</span>`;
            }
        }
        
        // Botão próximo
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                onclick="admin.changePage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        paginationControls.innerHTML = paginationHTML;
    }

    changePage(page) {
        this.currentPage = page;
        this.renderOrders();
    }

    showCancelConfirmation(orderId) {
        const order = this.orders.find(order => order.id === orderId);
        
        if (!order) {
            this.showNotification('Pedido não encontrado!', true);
            return;
        }

        this.orderToCancel = order;
        const cancelModalBody = document.getElementById('cancelModalBody');
        
        if (cancelModalBody) {
            cancelModalBody.innerHTML = `
                <div class="form-group">
                    <div class="cancel-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Confirmar Cancelamento</h3>
                        <p>Você está prestes a cancelar o pedido:</p>
                    </div>
                    
                    <div class="order-summary">
                        <div><strong>Pedido:</strong> #${order.orderNumber || order.id}</div>
                        <div><strong>Cliente:</strong> ${order.customer?.fullName || 'Não informado'}</div>
                        <div><strong>Valor:</strong> R$ ${order.total?.toFixed(2) || '0.00'}</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Motivo do Cancelamento (opcional)</label>
                        <textarea class="form-textarea" id="cancelReason" placeholder="Descreva o motivo do cancelamento..." rows="3"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            Para confirmar, digite <strong>"cancelar"</strong> no campo abaixo:
                        </label>
                        <input type="text" class="form-input" id="cancelConfirmation" placeholder="Digite 'cancelar' para confirmar">
                        <small class="form-hint">Esta ação não pode ser desfeita</small>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="admin.closeCancelModal()">
                        <i class="fas fa-times"></i> Manter Pedido
                    </button>
                    <button class="btn btn-danger" id="confirmCancelBtn" disabled onclick="admin.confirmCancelOrder()">
                        <i class="fas fa-ban"></i> Confirmar Cancelamento
                    </button>
                </div>
            `;

            // Habilitar/desabilitar botão de confirmação baseado no texto digitado
            const confirmInput = document.getElementById('cancelConfirmation');
            const confirmBtn = document.getElementById('confirmCancelBtn');
            
            confirmInput?.addEventListener('input', (e) => {
                const isConfirmed = e.target.value.toLowerCase() === 'cancelar';
                confirmBtn.disabled = !isConfirmed;
                
                if (isConfirmed) {
                    confirmBtn.style.background = 'var(--error-color)';
                } else {
                    confirmBtn.style.background = 'var(--accent-gray)';
                }
            });

            this.openCancelModal();
        }
    }

    confirmCancelOrder() {
        if (!this.orderToCancel) {
            this.showNotification('Nenhum pedido selecionado para cancelamento!', true);
            return;
        }

        const orderIndex = this.orders.findIndex(order => order.id === this.orderToCancel.id);
        
        if (orderIndex === -1) {
            this.showNotification('Pedido não encontrado!', true);
            return;
        }

        const cancelReason = document.getElementById('cancelReason')?.value || 'Cancelado pelo administrador';
        const order = this.orders[orderIndex];

        // Realizar cancelamento
        order.status = 'cancelled';
        order.cancelledAt = new Date().toISOString();
        order.cancelledBy = 'admin';
        order.cancelReason = cancelReason;
        
        // Mover para lista de cancelados
        this.cancelledOrders.unshift(order);
        this.orders.splice(orderIndex, 1);
        
        this.saveOrders();
        this.applyFilters();
        this.updateStats();
        this.updateTabCounts();
        this.closeCancelModal();
        
        this.showNotification('Pedido cancelado com sucesso!');
        this.orderToCancel = null;
    }

    // Método para mostrar confirmação de exclusão
    showDeleteConfirmation(orderId, isCancelled = false) {
        const order = isCancelled 
            ? this.cancelledOrders.find(order => order.id === orderId)
            : this.orders.find(order => order.id === orderId);
        
        if (!order) {
            this.showNotification('Pedido não encontrado!', true);
            return;
        }

        this.orderToDelete = { order, isCancelled };
        const cancelModalBody = document.getElementById('cancelModalBody');
        
        if (cancelModalBody) {
            cancelModalBody.innerHTML = `
                <div class="form-group">
                    <div class="delete-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Confirmar Exclusão Permanente</h3>
                        <p>Você está prestes a excluir permanentemente o pedido:</p>
                    </div>
                    
                    <div class="order-summary">
                        <div><strong>Pedido:</strong> #${order.orderNumber || order.id}</div>
                        <div><strong>Cliente:</strong> ${order.customer?.fullName || 'Não informado'}</div>
                        <div><strong>Valor:</strong> R$ ${order.total?.toFixed(2) || '0.00'}</div>
                        <div><strong>Status:</strong> ${this.getStatusText(order.status)}</div>
                    </div>
                     
                    <div class="form-group">
                        <label class="form-label">
                            Para confirmar, digite <strong>"deletar"</strong> no campo abaixo:
                        </label>
                        <input type="text" class="form-input" id="deleteConfirmation" placeholder="Digite 'deletar' para confirmar">
                        <small class="form-hint">ESTA AÇÃO NÃO PODE SER DESFEITA - O pedido será permanentemente removido do sistema</small>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="admin.closeCancelModal()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn btn-delete" id="confirmDeleteBtn" disabled onclick="admin.confirmDeleteOrder()">
                        <i class="fas fa-trash"></i> Excluir Permanentemente
                    </button>
                </div>
            `;

            // Habilitar/desabilitar botão de confirmação
            const confirmInput = document.getElementById('deleteConfirmation');
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            
            confirmInput?.addEventListener('input', (e) => {
                const isConfirmed = e.target.value.toLowerCase() === 'deletar';
                confirmBtn.disabled = !isConfirmed;
                
                if (isConfirmed) {
                    confirmBtn.style.background = '#ff4444';
                } else {
                    confirmBtn.style.background = 'var(--accent-gray)';
                }
            });

            this.openCancelModal();
        }
    }

    // Método para confirmar a exclusão
    confirmDeleteOrder() {
        if (!this.orderToDelete) {
            this.showNotification('Nenhum pedido selecionado para exclusão!', true);
            return;
        }

        const { order, isCancelled } = this.orderToDelete;
        const deleteReason = document.getElementById('deleteReason')?.value || 'Excluído pelo administrador';

        if (isCancelled) {
            // Remover dos pedidos cancelados
            const cancelledIndex = this.cancelledOrders.findIndex(o => o.id === order.id);
            if (cancelledIndex !== -1) {
                this.cancelledOrders.splice(cancelledIndex, 1);
            }
        } else {
            // Remover dos pedidos ativos
            const activeIndex = this.orders.findIndex(o => o.id === order.id);
            if (activeIndex !== -1) {
                this.orders.splice(activeIndex, 1);
            }
        }

        // Salvar alterações
        this.saveOrders();
        
        // Atualizar a interface
        if (isCancelled) {
            this.renderCancelledOrders();
        } else {
            this.applyFilters();
        }
        
        this.updateStats();
        this.updateTabCounts();
        this.closeCancelModal();
        
        this.showNotification('Pedido excluído permanentemente!');
        this.orderToDelete = null;
        
        // Log para auditoria
        console.log(`🗑️ Pedido ${order.id} excluído. Motivo: ${deleteReason}`);
    }

    viewOrder(orderId, isCancelled = false) {
        console.log('👀 Visualizando pedido:', orderId);
        
        let order;
        if (isCancelled) {
            order = this.cancelledOrders.find(o => o.id === orderId);
        } else {
            order = this.orders.find(o => o.id === orderId);
        }
        
        if (!order) {
            console.error('❌ Pedido não encontrado:', orderId);
            this.showNotification('Pedido não encontrado!', true);
            return;
        }

        this.currentOrder = order;

        const modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.innerHTML = this.getOrderDetailsHTML(order);
            
            // Configurar event listeners após o conteúdo ser carregado
            setTimeout(() => {
                this.setupModalEventListeners(order);
            }, 100);
            
            this.openModal();
        }
    }

    getOrderDetailsHTML(order) {
        const subtotal = order.subtotal || (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);
        const shipping = order.shipping || 0;
        const total = order.total || (subtotal + shipping);

        // Mostrar motivo do cancelamento se existir
        const cancelInfo = order.cancelReason ? `
            <div class="form-group">
                <label class="form-label">Motivo do Cancelamento</label>
                <textarea class="form-textarea" readonly>${order.cancelReason}</textarea>
            </div>
        ` : '';

        return `
            <div class="form-group">
                <label class="form-label">Informações do Pedido</label>
                <div class="form-row">
                    <div>
                        <input type="text" class="form-input" value="${order.orderNumber || order.id}" readonly>
                        <small class="form-label">Número do Pedido</small>
                    </div>
                    <div>
                        <input type="text" class="form-input" value="${this.formatDate(order.createdAt)}" readonly>
                        <small class="form-label">Data do Pedido</small>
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Informações do Cliente</label>
                <div class="form-row">
                    <div>
                        <input type="text" class="form-input" value="${order.customer?.fullName || 'Não informado'}" readonly>
                        <small class="form-label">Nome Completo</small>
                    </div>
                    <div>
                        <input type="text" class="form-input" value="${order.customer?.email || 'Não informado'}" readonly>
                        <small class="form-label">Email</small>
                    </div>
                </div>
                <div class="form-row">
                    <div>
                        <input type="text" class="form-input" value="${order.customer?.phone || 'Não informado'}" readonly>
                        <small class="form-label">Telefone</small>
                    </div>
                    <div>
                        <input type="text" class="form-input" value="${order.paymentMethod || 'Não informado'}" readonly>
                        <small class="form-label">Método de Pagamento</small>
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Endereço de Entrega</label>
                <div class="form-row">
                    <div style="grid-column: 1 / -1;">
                        <input type="text" class="form-input" value="${order.customer?.address || 'Não informado'}" readonly>
                        <small class="form-label">Endereço</small>
                    </div>
                </div>
                <div class="form-row">
                    <div>
                        <input type="text" class="form-input" value="${order.customer?.addressNumber || 'Não informado'}" readonly>
                        <small class="form-label">Número</small>
                    </div>
                    <div>
                        <input type="text" class="form-input" value="${order.customer?.addressComplement || 'Não informado'}" readonly>
                        <small class="form-label">Complemento</small>
                    </div>
                </div>
                <div class="form-row">
                    <div>
                        <input type="text" class="form-input" value="${order.customer?.city || 'Não informado'}" readonly>
                        <small class="form-label">Cidade</small>
                    </div>
                    <div>
                        <input type="text" class="form-input" value="${order.customer?.zipCode || 'Não informado'}" readonly>
                        <small class="form-label">CEP</small>
                    </div>
                </div>
            </div>

            <div class="order-items">
                <label class="form-label">Itens do Pedido</label>
                ${order.items ? order.items.map(item => `
                    <div class="order-item">
                        <div>
                            <strong>${item.title || 'Produto sem nome'}</strong>
                            <div>Quantidade: ${item.quantity} × R$ ${(item.price || 0).toFixed(2)}</div>
                        </div>
                        <div>R$ ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</div>
                    </div>
                `).join('') : '<div class="empty-state">Nenhum item encontrado</div>'}
                
                <div class="order-total">
                    <div>Subtotal: R$ ${subtotal.toFixed(2)}</div>
                    <div>Frete: R$ ${shipping.toFixed(2)}</div>
                    <div style="margin-top: 10px; font-size: 1.2rem;">Total: R$ ${total.toFixed(2)}</div>
                </div>
            </div>

            ${order.status === 'cancelled' ? cancelInfo : ''}

            <div class="form-group">
                <label class="form-label">Status do Pedido</label>
                <select class="form-select" id="statusSelect" ${order.status === 'cancelled' ? 'disabled' : ''}>
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Processando</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Enviado</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Entregue</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Informações de Envio</label>
                <textarea class="form-textarea" id="shippingInfo" placeholder="Código de rastreamento, observações..." ${order.status === 'cancelled' ? 'readonly' : ''}>${order.shippingInfo || ''}</textarea>
            </div>

            <div class="modal-actions">
                <button class="btn btn-secondary" id="closeDetailsBtn">
                    <i class="fas fa-times"></i> Fechar
                </button>
                ${order.status !== 'cancelled' ? `
                    <button class="btn btn-primary" id="saveChangesBtn">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                ` : `
                    <!-- Botão deletar apenas para pedidos cancelados no modal -->
                    <button class="btn btn-delete" onclick="admin.showDeleteConfirmation('${order.id}', true)">
                        <i class="fas fa-trash"></i> Excluir Pedido
                    </button>
                `}
            </div>
        `;
    }

    setupModalEventListeners(order) {
        console.log('🔧 Configurando event listeners do modal...');
        
        // Botão Fechar
        const closeBtn = document.getElementById('closeDetailsBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Botão Salvar Alterações
        const saveBtn = document.getElementById('saveChangesBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.updateOrder(order.id);
            });
        }

        console.log('✅ Event listeners do modal configurados');
    }

    updateOrder(orderId) {
        console.log('💾 Atualizando pedido:', orderId);
        
        if (!this.currentOrder) {
            this.showNotification('Nenhum pedido selecionado!', true);
            return;
        }

        const statusSelect = document.getElementById('statusSelect');
        const shippingInfo = document.getElementById('shippingInfo');

        if (!statusSelect || !shippingInfo) {
            this.showNotification('Erro ao encontrar campos do formulário!', true);
            return;
        }

        // Encontrar o pedido na lista correta
        let orderIndex = this.orders.findIndex(order => order.id === this.currentOrder.id);
        let order = this.orders[orderIndex];
        
        if (!order) {
            // Tentar encontrar nos cancelados
            orderIndex = this.cancelledOrders.findIndex(order => order.id === this.currentOrder.id);
            order = this.cancelledOrders[orderIndex];
        }

        if (!order) {
            this.showNotification('Pedido não encontrado!', true);
            return;
        }

        // Atualizar o pedido
        const previousStatus = order.status;
        order.status = statusSelect.value;
        order.shippingInfo = shippingInfo.value;
        order.updatedAt = new Date().toISOString();

        // Se mudou para cancelado, mover para lista de cancelados
        if (statusSelect.value === 'cancelled' && previousStatus !== 'cancelled') {
            order.cancelledAt = new Date().toISOString();
            order.cancelledBy = 'admin';
            order.cancelReason = 'Cancelado via edição de status';
            this.cancelledOrders.unshift(order);
            this.orders = this.orders.filter(o => o.id !== order.id);
        }
        
        // Se mudou de cancelado para outro status, mover de volta para ativos
        if (previousStatus === 'cancelled' && statusSelect.value !== 'cancelled') {
            this.orders.unshift(order);
            this.cancelledOrders = this.cancelledOrders.filter(o => o.id !== order.id);
            delete order.cancelledAt;
            delete order.cancelledBy;
            delete order.cancelReason;
        }

        this.saveOrders();
        this.applyFilters();
        this.updateStats();
        this.updateTabCounts();
        
        this.showNotification('Pedido atualizado com sucesso!');
        this.closeModal();
    }

    renderCancelledOrders() {
        const cancelledTableBody = document.getElementById('cancelledOrdersTableBody');
        const emptyCancelledState = document.getElementById('emptyCancelledState');
        
        if (!cancelledTableBody || !emptyCancelledState) return;
        
        let filteredCancelled = this.cancelledOrders;
        
        if (this.currentCancelledSearch) {
            filteredCancelled = filteredCancelled.filter(order => {
                const searchTerm = this.currentCancelledSearch.toLowerCase();
                return (
                    order.id?.toLowerCase().includes(searchTerm) ||
                    (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm)) ||
                    order.customer?.fullName?.toLowerCase().includes(searchTerm) ||
                    order.customer?.email?.toLowerCase().includes(searchTerm)
                );
            });
        }
        
        filteredCancelled.sort((a, b) => new Date(b.cancelledAt || b.createdAt) - new Date(a.cancelledAt || a.createdAt));
        
        if (filteredCancelled.length === 0) {
            cancelledTableBody.innerHTML = '';
            emptyCancelledState.style.display = 'block';
            this.renderCancelledPagination(0);
            return;
        }
        
        emptyCancelledState.style.display = 'none';
        
        const startIndex = (this.cancelledPage - 1) * this.ordersPerPage;
        const endIndex = startIndex + this.ordersPerPage;
        const currentOrders = filteredCancelled.slice(startIndex, endIndex);
        
        cancelledTableBody.innerHTML = currentOrders.map(order => `
            <tr>
                <td class="order-id">#${order.orderNumber || order.id.substring(0, 8)}</td>
                <td class="customer-info">
                    <div class="customer-name">${order.customer?.fullName || 'Cliente não informado'}</div>
                    <div class="customer-contact">${order.customer?.email || 'Email não informado'}</div>
                </td>
                <td class="order-value">R$ ${order.total ? order.total.toFixed(2) : '0.00'}</td>
                <td class="order-date mobile-hidden">${this.formatDate(order.createdAt)}</td>
                <td class="order-date mobile-hidden">${this.formatDate(order.cancelledAt)}</td>
                <td class="order-status">
                    <span class="status-badge status-cancelled">
                        Cancelado
                    </span>
                </td>
                <td class="order-actions">
                    <button class="action-btn view" onclick="admin.viewOrder('${order.id}', true)">
                        <i class="fas fa-eye"></i> Detalhes
                    </button>
                    <!-- BOTÃO DELETE MANTIDO APENAS NOS CANCELADOS -->
                    <button class="action-btn delete" onclick="admin.showDeleteConfirmation('${order.id}', true)">
                        <i class="fas fa-trash"></i> Deletar
                    </button>
                </td>
            </tr>
        `).join('');
        
        this.renderCancelledPagination(filteredCancelled.length);
    }

    renderCancelledPagination(totalOrders) {
        const paginationInfo = document.getElementById('cancelledPaginationInfo');
        const paginationControls = document.getElementById('cancelledPaginationControls');
        
        if (!paginationInfo || !paginationControls) return;
        
        const totalPages = Math.ceil(totalOrders / this.ordersPerPage);
        
        const startItem = (this.cancelledPage - 1) * this.ordersPerPage + 1;
        const endItem = Math.min(this.cancelledPage * this.ordersPerPage, totalOrders);
        
        paginationInfo.textContent = `Mostrando ${startItem}-${endItem} de ${totalOrders} pedidos`;
        
        let paginationHTML = '';
        
        paginationHTML += `
            <button class="pagination-btn" ${this.cancelledPage === 1 ? 'disabled' : ''} 
                onclick="admin.changeCancelledPage(${this.cancelledPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.cancelledPage - 1 && i <= this.cancelledPage + 1)) {
                paginationHTML += `
                    <button class="pagination-btn ${i === this.cancelledPage ? 'active' : ''}" 
                        onclick="admin.changeCancelledPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.cancelledPage - 2 || i === this.cancelledPage + 2) {
                paginationHTML += `<span class="pagination-btn" style="border: none; cursor: default;">...</span>`;
            }
        }
        
        paginationHTML += `
            <button class="pagination-btn" ${this.cancelledPage === totalPages ? 'disabled' : ''} 
                onclick="admin.changeCancelledPage(${this.cancelledPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        paginationControls.innerHTML = paginationHTML;
    }

    changeCancelledPage(page) {
        this.cancelledPage = page;
        this.renderCancelledOrders();
    }

    updateStats() {
        const stats = {
            pending: this.orders.filter(order => order.status === 'pending').length,
            shipped: this.orders.filter(order => order.status === 'shipped').length,
            delivered: this.orders.filter(order => order.status === 'delivered').length
        };

        const pendingCount = document.getElementById('pendingCount');
        const shippedCount = document.getElementById('shippedCount');
        const deliveredCount = document.getElementById('deliveredCount');

        if (pendingCount) pendingCount.textContent = stats.pending;
        if (shippedCount) shippedCount.textContent = stats.shipped;
        if (deliveredCount) deliveredCount.textContent = stats.delivered;

        console.log('📊 Estatísticas atualizadas:', stats);
    }

    openModal() {
        const orderModal = document.getElementById('orderModal');
        if (orderModal) {
            orderModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const orderModal = document.getElementById('orderModal');
        if (orderModal) {
            orderModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        this.currentOrder = null;
    }

    openCancelModal() {
        const cancelModal = document.getElementById('cancelModal');
        if (cancelModal) {
            cancelModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeCancelModal() {
        const cancelModal = document.getElementById('cancelModal');
        if (cancelModal) {
            cancelModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        this.orderToCancel = null;
        this.orderToDelete = null;
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Processando',
            'shipped': 'Enviado',
            'delivered': 'Entregue',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        try {
            if (!dateString) return 'Data não informada';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Data inválida';
            return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch (e) {
            return 'Data inválida';
        }
    }

    showNotification(message, isError = false) {
        // Remover notificações anteriores
        const existingNotifications = document.querySelectorAll('.admin-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = 'admin-notification';
        if (isError) {
            notification.classList.add('error');
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isError ? 'var(--error-color)' : 'var(--success-color)'};
            color: var(--text-primary);
            padding: 16px 24px;
            border-radius: 8px;
            z-index: 10000;
            transform: translateX(150%);
            transition: transform 0.4s ease;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animação de entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover após 4 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(150%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 400);
        }, 4000);
    }

    startAutoRefresh() {
        // Atualizar automaticamente a cada 10 segundos
        setInterval(() => {
            const previousCount = this.orders.length;
            const previousCancelledCount = this.cancelledOrders.length;
            this.loadOrders();
            
            if (this.orders.length !== previousCount || this.cancelledOrders.length !== previousCancelledCount) {
                this.applyFilters();
                this.updateStats();
                this.updateTabCounts();
                console.log('🔄 Dados atualizados automaticamente');
            }
        }, 10000);
    }

    // DEBUG: Método para verificar dados no console
    debugOrders() {
        console.log('🐛 DEBUG - Pedidos no localStorage:');
        const orders = JSON.parse(localStorage.getItem('snoules-orders') || '[]');
        const cancelledOrders = JSON.parse(localStorage.getItem('snoules-cancelled-orders') || '[]');
        console.log('Número de pedidos ativos:', orders.length);
        console.log('Número de pedidos cancelados:', cancelledOrders.length);
        
        console.log('📋 Pedidos Ativos:');
        orders.forEach((order, index) => {
            console.log(`Pedido ${index + 1}:`, {
                id: order.id,
                customer: order.customer?.fullName,
                addressNumber: order.customer?.addressNumber,
                addressComplement: order.customer?.addressComplement,
                total: order.total,
                status: order.status,
                items: order.items?.length || 0
            });
        });
        
        console.log('📋 Pedidos Cancelados:');
        cancelledOrders.forEach((order, index) => {
            console.log(`Pedido Cancelado ${index + 1}:`, {
                id: order.id,
                customer: order.customer?.fullName,
                addressNumber: order.customer?.addressNumber,
                addressComplement: order.customer?.addressComplement,
                total: order.total,
                status: order.status,
                items: order.items?.length || 0
            });
        });
        
        return { orders, cancelledOrders };
    }

    // Método para deletar todos os pedidos (CUIDADO!)
    deleteAllOrders() {
        if (confirm('🚨 ATENÇÃO: Isso irá excluir TODOS os pedidos (ativos e cancelados) permanentemente. Esta ação não pode ser desfeita!\n\nTem certeza que deseja continuar?')) {
            const confirmation = prompt('⚠️ CONFIRMAÇÃO FINAL: Digite "DELETAR TUDO" para confirmar a exclusão de todos os pedidos:');
            if (confirmation === 'DELETAR TUDO') {
                this.orders = [];
                this.cancelledOrders = [];
                this.saveOrders();
                this.applyFilters();
                this.updateStats();
                this.updateTabCounts();
                this.showNotification('Todos os pedidos foram excluídos permanentemente!');
            } else {
                this.showNotification('Exclusão cancelada.', true);
            }
        }
    }
}

// Inicializar o painel admin quando o DOM estiver carregado
let admin;
document.addEventListener('DOMContentLoaded', function() {
    admin = new AdminPanel();
});

// Exportar para uso global
window.admin = admin;

// Adicionar comando de debug no console
window.debugOrders = () => admin.debugOrders();
window.deleteAllOrders = () => admin.deleteAllOrders();

console.log('🚀 Painel Admin Snoules carregado!');
console.log('💡 Use debugOrders() no console para verificar os dados');
console.log('⚠️ Use deleteAllOrders() no console para excluir TODOS os pedidos (CUIDADO!)');