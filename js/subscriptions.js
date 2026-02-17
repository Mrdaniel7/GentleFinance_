/**
 * Controlador de Suscripciones Recurrentes
 * Gestiona pagos recurrentes con detección automática
 */

const Subscriptions = {
    subscriptions: [],

    // Inicialización
    async init() {
        this.setupModalListeners();

        try {
            await this.loadData();
        } catch (error) {
            // Ignorar error de "No autenticado" inicial solo en init
            // El listener de Auth en app.js cargará los datos cuando esté listo
            if (error.message !== 'No autenticado') {
                console.log('Subscriptions: Waiting for auth to load data...');
            }
        }

        this.render();
    },

    // Configurar listeners del modal
    setupModalListeners() {
        const form = document.getElementById('subscriptionForm');
        const deleteBtn = document.getElementById('deleteSubscriptionBtn');
        const closeBtns = document.querySelectorAll('#subscriptionModal .modal-close');

        if (form) {
            form.removeEventListener('submit', this.handleSave); // Prevenir duplicados
            this.handleSave = this.save.bind(this);
            form.addEventListener('submit', this.handleSave);
        }

        if (deleteBtn) {
            deleteBtn.onclick = () => this.delete();
        }

        closeBtns.forEach(btn => {
            btn.onclick = () => this.closeModal();
        });

        // Cerrar al hacer clic fuera
        const modal = document.getElementById('subscriptionModal');
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) this.closeModal();
            };
        }
    },

    // Cargar datos de Firebase
    async loadData() {
        try {
            if (window.FirestoreService?.subscriptions) {
                this.subscriptions = await window.FirestoreService.subscriptions.getAll();
            }
        } catch (error) {
            if (error.message === 'No autenticado') {
                console.log('Subscriptions: Waiting for auth...');
            } else {
                console.error('Error loading subscriptions:', error);
                this.showToast('Error al cargar suscripciones', 'error');
            }
            this.subscriptions = [];
        }
    },

    // Renderizar vista
    render() {
        this.renderSubscriptions();
        this.renderUpcoming();
        this.updateSummary();
    },

    // Renderizar lista de suscripciones
    renderSubscriptions() {
        const container = document.getElementById('subs-subscriptionList');
        if (!container) return;

        if (this.subscriptions.length === 0) {
            container.innerHTML = `<div class="text-center p-xl text-muted">
                <div style="font-size: 3rem; margin-bottom: var(--space-md);">📅</div>
                <p>No tienes suscripciones activas</p>
            </div>`;
            return;
        }

        container.innerHTML = this.subscriptions.map(sub => `
            <div class="card flex items-center justify-between p-md mb-sm" 
                 onclick="Subscriptions.edit('${sub.id}')" 
                 style="cursor: pointer; transition: transform 0.2s; border: 1px solid var(--border-subtle);">
                
                <div class="flex items-center gap-md">
                    <div style="font-size: 2.5rem; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                        ${sub.logo || '📅'}
                    </div>
                    <div>
                        <div class="font-bold text-lg mb-xs">${sub.name}</div>
                        <div class="flex items-center gap-sm text-sm text-muted">
                            <span class="status-indicator ${sub.status === 'active' ? 'bg-positive' : 'bg-muted'}" 
                                  style="width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
                            <span>${sub.status === 'active' ? 'Activa' : sub.status === 'paused' ? 'Pausada' : 'Cancelada'}</span>
                            <span>•</span>
                            <span>Próximo: ${this.formatDate(sub.nextPayment)}</span>
                        </div>
                    </div>
                </div>

                <div class="text-right">
                    <div class="font-bold text-xl text-gold">${Utils.formatCurrency(sub.amount)}</div>
                    <div class="text-xs text-muted uppercase tracking-wider">${this.getFrequencyLabel(sub.frequency)}</div>
                </div>
            </div>
        `).join('');
    },

    // Renderizar próximos pagos
    renderUpcoming() {
        const container = document.getElementById('subs-upcomingList');
        if (!container) return;

        const upcoming = this.subscriptions
            .filter(s => s.status === 'active')
            .sort((a, b) => new Date(a.nextPayment) - new Date(b.nextPayment))
            .slice(0, 5);

        if (upcoming.length === 0) {
            container.innerHTML = '<div class="text-muted small">No hay pagos próximos</div>';
            return;
        }

        container.innerHTML = upcoming.map(sub => {
            const date = new Date(sub.nextPayment);
            return `
                <div class="upcoming-item">
                    <div class="upcoming-date">
                        <div class="upcoming-day">${date.getDate()}</div>
                        <div class="upcoming-month">${date.toLocaleDateString(window.Utils?._getLocale ? Utils._getLocale() : 'es-ES', { month: 'short' })}</div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: var(--font-medium);">${sub.name}</div>
                    </div>
                    <div style="font-family: var(--font-mono, monospace);">${Utils.formatCurrency(parseFloat(sub.amount))}</div>
                </div>
            `;
        }).join('');
    },

    // Actualizar resumen
    updateSummary() {
        const activeSubs = this.subscriptions.filter(s => s.status === 'active');

        // Calcular total mensual
        const monthlyTotal = activeSubs.reduce((sum, sub) => {
            const amount = parseFloat(sub.amount);
            if (sub.frequency === 'monthly') return sum + amount;
            if (sub.frequency === 'yearly') return sum + (amount / 12);
            if (sub.frequency === 'weekly') return sum + (amount * 4.33);
            return sum;
        }, 0);

        const yearlyTotal = monthlyTotal * 12;

        // Próximo pago
        const nextSub = activeSubs
            .sort((a, b) => new Date(a.nextPayment) - new Date(b.nextPayment))[0];

        const monthlyEl = document.getElementById('subs-monthlyTotal');
        if (monthlyEl) monthlyEl.textContent = Utils.formatCurrency(monthlyTotal);

        const yearlyEl = document.getElementById('subs-yearlyTotal');
        if (yearlyEl) yearlyEl.textContent = Utils.formatCurrency(yearlyTotal);

        const countEl = document.getElementById('subs-activeCount');
        if (countEl) countEl.textContent = activeSubs.length;

        const nextEl = document.getElementById('subs-nextPayment');
        if (nextEl) {
            if (nextSub) {
                const nextDate = new Date(nextSub.nextPayment);
                nextEl.textContent = nextDate.toLocaleDateString(window.Utils?._getLocale ? Utils._getLocale() : 'es-ES', { day: 'numeric', month: 'short' });
            } else {
                nextEl.textContent = '-';
            }
        }
    },

    // Abrir modal para añadir
    add() {
        const form = document.getElementById('subscriptionForm');
        if (form) form.reset();

        document.getElementById('subId').value = '';
        document.getElementById('subModalTitle').textContent = 'Nueva Suscripción';
        document.getElementById('deleteSubscriptionBtn').style.display = 'none';
        document.getElementById('subStatus').value = 'active'; // Default

        this.openModal();
    },

    // Abrir modal para editar
    edit(id) {
        const sub = this.subscriptions.find(s => s.id === id);
        if (!sub) return;

        document.getElementById('subId').value = sub.id;
        document.getElementById('subName').value = sub.name;
        document.getElementById('subAmount').value = sub.amount;
        document.getElementById('subFrequency').value = sub.frequency;
        document.getElementById('subStatus').value = sub.status || 'active';

        document.getElementById('subModalTitle').textContent = 'Editar Suscripción';
        document.getElementById('deleteSubscriptionBtn').style.display = 'block';

        this.openModal();
    },

    // Guardar (Crear o Actualizar)
    async save(e) {
        e.preventDefault();

        const id = document.getElementById('subId').value;
        const name = document.getElementById('subName').value;
        const amount = parseFloat(document.getElementById('subAmount').value) || 0;
        const frequency = document.getElementById('subFrequency').value;
        const status = document.getElementById('subStatus').value;

        if (!name || amount <= 0) {
            this.showToast('Por favor rellena todos los campos', 'error');
            return;
        }

        // Icono aleatorio si es nuevo
        const icons = ['📺', '🎵', '🎮', '📦', '☁️', '📱', '💻', '📚'];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];

        try {
            if (id) {
                // UPDATE
                const sub = this.subscriptions.find(s => s.id === id);
                if (sub) {
                    const updates = {
                        name,
                        amount,
                        frequency,
                        status,
                        // Recalcular nextPayment si cambia frecuencia (simplificado: hoy + periodo)
                    };

                    await window.FirestoreService.subscriptions.update(id, updates);

                    // Actualizar local
                    Object.assign(sub, updates);
                    this.showToast('Suscripción actualizada');
                }
            } else {
                // CREATE
                const newSub = {
                    name,
                    logo: randomIcon,
                    category: 'other',
                    amount,
                    frequency,
                    nextPayment: new Date().toISOString().split('T')[0], // Hoy simplificado
                    status,
                    color: 'default'
                };

                const newId = await window.FirestoreService.subscriptions.create(newSub);
                this.subscriptions.push({ ...newSub, id: newId });
                this.showToast('Suscripción creada');
            }

            this.closeModal();
            this.render();

        } catch (error) {
            console.error('Error saving subscription:', error);
            this.showToast('Error al guardar', 'error');
        }
    },

    // Eliminar suscripción
    async delete() {
        const id = document.getElementById('subId').value;
        if (!id) return;

        Safety.confirm(
            'Eliminar Suscripción',
            'Se dejará de rastrear esta suscripción. No se eliminarán los pagos pasados.',
            async () => {
                try {
                    await window.FirestoreService.subscriptions.delete(id);
                    this.subscriptions = this.subscriptions.filter(s => s.id !== id);
                    this.showToast('Suscripción eliminada');
                    this.closeModal();
                    this.render();
                } catch (error) {
                    console.error('Error deleting subscription:', error);
                    this.showToast('Error al eliminar', 'error');
                }
            },
            'simple'
        );
    },

    // Helpers Modal
    openModal() {
        const modal = document.getElementById('subscriptionModal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);

            // Focus
            setTimeout(() => {
                const input = document.getElementById('subName');
                if (input) input.focus();
            }, 100);
        }
    },

    closeModal() {
        const modal = document.getElementById('subscriptionModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    },

    // Obtener label de frecuencia
    getFrequencyLabel(freq) {
        const labels = {
            weekly: '/semana',
            monthly: '/mes',
            yearly: '/año'
        };
        return labels[freq] || '/mes';
    },

    // Formatear fecha
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
        return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    },

    // Toast
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};


window.Subscriptions = Subscriptions;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.Subscriptions) {
        window.Subscriptions.init();
    }
});


