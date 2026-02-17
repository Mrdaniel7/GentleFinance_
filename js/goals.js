/**
 * Goals Module
 * Gestión de metas de ahorro y deudas
 */
const Goals = {
    state: {
        goals: [],
        debts: [],
        selectedIcon: '✈️'
    },

    init() {
        console.log('🎯 Goals module initialized');
        this.loadData();
    },

    async loadData() {
        try {
            if (window.FirestoreService && window.AuthService?.getCurrentUser()) {
                // Load from Firestore
                this.state.goals = await window.FirestoreService.goals.getAll() || [];
                this.state.debts = await window.FirestoreService.debts.getAll() || [];
            } else {
                // Fallback local
                this.state.goals = [];
                this.state.debts = [];
            }
            this.render();
        } catch (error) {
            console.error('Error loading goals:', error);
            this.render();
        }
    },

    // --- RENDER ---

    render() {
        const container = document.getElementById('view-goals');
        if (!container || container.style.display === 'none') return;

        this.renderGoals();
        this.renderSummary();
        this.renderDebts();
    },

    renderSummary() {
        const totalSaved = this.state.goals.reduce((sum, g) => sum + (parseFloat(g.current) || 0), 0);
        const totalTarget = this.state.goals.reduce((sum, g) => sum + (parseFloat(g.target) || 0), 0);
        const avgProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

        document.getElementById('totalSaved').textContent = Utils.formatCurrency(totalSaved);
        document.getElementById('totalTarget').textContent = Utils.formatCurrency(totalTarget);
        document.getElementById('avgProgress').textContent = `${Math.round(avgProgress)}%`;
    },

    getCircularProgress(percent, radius = 30, color = 'var(--gold-primary)') {
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;

        return `
        <div style="position: relative; width: ${radius * 2}px; height: ${radius * 2}px; display: flex; align-items: center; justify-content: center;">
            <svg width="${radius * 2}" height="${radius * 2}" style="transform: rotate(-90deg);">
                <circle cx="${radius}" cy="${radius}" r="${radius - 4}" stroke="var(--bg-tertiary)" stroke-width="6" fill="transparent" />
                <circle cx="${radius}" cy="${radius}" r="${radius - 4}" stroke="${color}" stroke-width="6" fill="transparent"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" 
                    style="transition: stroke-dashoffset 1s ease;" />
            </svg>
            <span style="position: absolute; font-size: 0.8rem; font-weight: bold; color: ${color};">${Math.round(percent)}%</span>
        </div>
        `;
    },

    renderGoals() {
        const grid = document.getElementById('goalsGrid');
        if (!grid) return;
        grid.innerHTML = '';

        if (this.state.goals.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-xl text-muted">
                    <div style="font-size: 3rem; margin-bottom: var(--space-md);">🎯</div>
                    <p>No tienes metas activas. ¡Crea una para empezar a ahorrar!</p>
                </div>
            `;
            return;
        }

        this.state.goals.forEach(goal => {
            const current = parseFloat(goal.current) || 0;
            const target = parseFloat(goal.target) || 1;
            const percent = Math.min(100, (current / target) * 100);

            const card = document.createElement('div');
            card.className = 'card';
            // Force square aspect ratio, column layout, and fixed width
            card.style.cssText = `
                aspect-ratio: 1 / 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: var(--space-md);
                width: 100%;
                max-width: 275px; /* Increased by 10% from 250px */
                /* margin: 0 auto; Removed to align left */
            `;

            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-sm">
                        <div style="font-size: 2rem;">${goal.icon || '🎯'}</div>
                        <div>
                            <h3 class="font-bold" style="font-size: 1.1rem; line-height: 1.2;">${goal.name}</h3>
                            <div class="text-xs text-muted">${goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'Sin fecha'}</div>
                        </div>
                    </div>
                    <div class="flex gap-xs">
                        <button class="btn btn-ghost btn-icon btn-sm" onclick="Goals.editGoal('${goal.id}')">✏️</button>
                        <button class="btn btn-ghost btn-icon btn-sm" style="color:red;" onclick="Goals.deleteGoal('${goal.id}')">🗑️</button>
                    </div>
                </div>
                
                <div class="flex items-center gap-md justify-center flex-1">
                    ${this.getCircularProgress(percent, 40, 'var(--gold-primary)')}
                    <div>
                        <div class="flex flex-col text-sm">
                            <span class="text-gold font-bold text-lg">${Utils.formatCurrency(current)}</span>
                            <span class="text-muted text-xs">${Utils.formatCurrency(target)}</span>
                            <span class="text-xs text-muted mt-xs">Ahorrado</span>
                        </div>
                    </div>
                </div>

                <div class="text-center mt-sm">
                    <button class="btn btn-sm btn-primary w-full" onclick="Goals.openContributeModal('${goal.id}')">+ Añadir Fondos</button>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    renderDebts() {
        const list = document.getElementById('debtList');
        if (!list) return;

        if (this.state.debts.length === 0) {
            list.innerHTML = `
                 <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: var(--space-md);">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                <p>No tienes deudas configuradas</p>
                <button class="btn btn-ghost" style="margin-top: var(--space-sm);" onclick="Goals.addDebt()">Añadir deuda</button>
            `;
            return;
        }

        let html = '<div class="grid grid-auto-fit gap-md" style="--min-col-width: 250px;">';
        this.state.debts.forEach(debt => {
            const current = parseFloat(debt.current) || 0;
            const total = parseFloat(debt.total) || 1;
            const percent = Math.min(100, (current / total) * 100);

            html += `
                <div class="card p-md flex flex-col justify-between">
                    <div class="flex justify-between items-start mb-sm">
                        <div>
                            <div class="font-bold text-lg">${debt.name}</div>
                            <div class="text-sm text-danger">${Utils.formatCurrency(total)} @ ${debt.rate}%</div>
                        </div>
                        <button class="btn btn-xs btn-ghost text-muted" onclick="Goals.deleteDebt('${debt.id}')">×</button>
                    </div>
                    
                    <div class="flex items-center gap-md mt-sm">
                         ${this.getCircularProgress(percent, 30, 'var(--negative)')}
                         <div class="flex-1">
                            <div class="text-xs text-muted">Progreso Pago</div>
                            <div class="text-sm font-medium">${Utils.formatCurrency(current)} pagados</div>
                         </div>
                    </div>
                </div>
            `;
        });
        html += '</div><div class="text-center mt-lg"><button class="btn btn-secondary" onclick="Goals.addDebt()">+ Añadir Deuda</button></div>';
        list.innerHTML = html;
    },

    // --- ACTIONS ---

    add() {
        this.openModal('addGoalModal');
        document.getElementById('goalForm').reset();
        document.getElementById('goalId').value = '';
        this.selectedIcon = '✈️'; // reset icon
        this.updateIconSelection();
    },

    editGoal(id) {
        const goal = this.state.goals.find(g => g.id === id);
        if (!goal) return;

        this.openModal('addGoalModal');
        document.getElementById('goalId').value = goal.id;
        document.getElementById('goalName').value = goal.name;
        document.getElementById('goalTarget').value = goal.target;
        document.getElementById('goalSaved').value = goal.current;
        document.getElementById('goalDeadline').value = goal.deadline || '';
        this.selectedIcon = goal.icon || '✈️';
        this.updateIconSelection();
    },

    selectIcon(btn) {
        this.selectedIcon = btn.dataset.icon;
        this.updateIconSelection();
    },

    updateIconSelection() {
        document.querySelectorAll('#goalIconSelector button').forEach(b => {
            if (b.dataset.icon === this.selectedIcon) b.classList.add('active');
            else b.classList.remove('active');
        });
    },

    async saveGoal() {
        const id = document.getElementById('goalId').value;
        const name = document.getElementById('goalName').value;
        const target = parseFloat(document.getElementById('goalTarget').value);
        const current = parseFloat(document.getElementById('goalSaved').value);
        const deadline = document.getElementById('goalDeadline').value;

        if (!name || isNaN(target)) return;

        const goalData = {
            name,
            target,
            current,
            deadline,
            icon: this.selectedIcon,
            createdAt: new Date().toISOString()
        };

        try {
            const currentUser = window.AuthService?.getCurrentUser();
            if (window.FirestoreService && currentUser) {
                if (id) {
                    await window.FirestoreService.goals.update(id, goalData);
                    // Update local state temporarily
                    const index = this.state.goals.findIndex(g => g.id === id);
                    if (index !== -1) this.state.goals[index] = { ...this.state.goals[index], ...goalData };
                } else {
                    // Update user ID reference
                    goalData.userId = currentUser.uid;
                    const newId = await window.FirestoreService.goals.create(goalData);
                    this.state.goals.push({ id: newId, ...goalData });
                }
            } else {
                // STRICT MODE: NO LOCAL FALLBACK
                throw new Error("No hay conexión con Firebase o usuario no autenticado.");
            }

            this.closeModal('addGoalModal');
            this.render();
        } catch (e) {
            console.error("Error saving goal", e);
            alert("Error al guardar: " + e.message);
        }
    },

    deleteGoal(id) {
        if (window.Safety) {
            window.Safety.confirm(
                'Eliminar Meta',
                '¿Estás seguro de que quieres eliminar esta meta? Esta acción no se puede deshacer.',
                async () => {
                    await this._performDelete(id);
                },
                'simple'
            );
        } else {
            if (confirm('¿Borrar esta meta?')) {
                this._performDelete(id);
            }
        }
    },
    async _performDelete(id) {
        try {
            const currentUser = window.AuthService?.getCurrentUser();

            if (window.FirestoreService && currentUser) {
                try {
                    await window.FirestoreService.goals.delete(id);
                } catch (err) {
                    console.warn("⚠️ Firestore delete failed (likely local-only or already deleted):", err);
                    // If permission denied or not found, we assume it's safe to remove locally to keep UI in sync
                }
            }

            this.state.goals = this.state.goals.filter(g => g.id !== id);

            // ALWAYS update localStorage to ensure phantom/local-only goals are removed
            // even if we are online. This acts as a cache update.
            localStorage.setItem('gf_goals', JSON.stringify(this.state.goals));

            this.render();
            if (window.GentleFinances) window.GentleFinances.showToast('Meta eliminada', 'gold');
        } catch (e) {
            console.error('❌ Error deleting goal:', e);
            alert("Error al borrar: " + e.message);
        }
    },

    openContributeModal(id) {
        document.getElementById('contributeGoalId').value = id;
        document.getElementById('contributeAmount').value = '';
        this.openModal('contributeModal');
    },

    async saveContribution() {
        const id = document.getElementById('contributeGoalId').value;
        const amount = parseFloat(document.getElementById('contributeAmount').value);
        if (!id || isNaN(amount)) return;

        const goal = this.state.goals.find(g => g.id === id);
        if (goal) {
            const newCurrent = (parseFloat(goal.current) || 0) + amount;

            try {
                if (window.FirestoreService && window.AuthService?.getCurrentUser()) {
                    await window.FirestoreService.goals.update(id, { current: newCurrent });
                }

                // Update local state
                goal.current = newCurrent;

                if (!window.FirestoreService || !window.AuthService?.getCurrentUser()) {
                    localStorage.setItem('gf_goals', JSON.stringify(this.state.goals));
                }

                this.closeModal('contributeModal');
                this.render();
                if (window.GentleFinances) window.GentleFinances.showToast('¡Contribución añadida!', 'gold');

            } catch (e) {
                console.error(e);
                alert("Error al guardar contribución");
            }
        }
    },

    // --- DEBTS ---

    addDebt() {
        this.openModal('addDebtModal');
        document.getElementById('debtForm').reset();
    },

    async saveDebt() {
        const name = document.getElementById('debtName').value;
        const total = parseFloat(document.getElementById('debtTotal').value);
        const rate = parseFloat(document.getElementById('debtRate').value);
        const minPayment = parseFloat(document.getElementById('debtMinPayment').value);
        const current = parseFloat(document.getElementById('debtPaid').value) || 0;

        if (!name || isNaN(total)) return;

        const debtData = {
            name, total, rate, minPayment, current,
            createdAt: new Date().toISOString()
        };

        try {
            const currentUser = window.AuthService?.getCurrentUser();
            if (window.FirestoreService && currentUser) {
                // Update user ID reference
                debtData.userId = currentUser.uid;
                const newId = await window.FirestoreService.debts.create(debtData);
                this.state.debts.push({ id: newId, ...debtData });
            } else {
                // STRICT MODE
                throw new Error("No hay conexión con Firebase o usuario no autenticado.");
            }

            this.closeModal('addDebtModal');
            this.render();
        } catch (e) {
            console.error(e);
            alert("Error al guardar deuda");
        }
    },

    async deleteDebt(id) {
        if (!confirm('¿Borrar esta deuda?')) return;

        try {
            if (window.FirestoreService && window.AuthService?.getCurrentUser()) {
                await window.FirestoreService.debts.delete(id);
            }

            this.state.debts = this.state.debts.filter(d => d.id !== id);
            if (!window.FirestoreService || !window.AuthService?.getCurrentUser()) {
                localStorage.setItem('gf_debts', JSON.stringify(this.state.debts));
            }

            this.render();
        } catch (e) {
            console.error(e);
            alert("Error al borrar deuda");
        }
    },

    showDebtSimulator() {
        // Simple alert for now
        alert('Simulador de Bola de Nieve: Próximamente. Tus deudas están guardadas.');
    },


    // --- HELPERS ---

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
        }
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    }
};

window.Goals = Goals;
