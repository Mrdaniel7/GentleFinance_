/**
 * Controlador de Presupuestos
 * Implementa el método Zero-Based Budgeting con plantillas
 */

const Budget = {
    currentMonth: new Date(),
    categories: [],
    income: 2850,

    // Inicialización
    async init() {
        await this.loadData();
        this.render();
        this.renderChart();
        console.log('📊 Budget module initialized');
    },

    // Cargar datos de Firebase
    async loadData() {
        if (window.FirestoreService?.budgets) {
            try {
                // Por defecto carga todos o los del mes actual si se filtrara
                const budgets = await window.FirestoreService.budgets.getAll();

                // Mapear si es necesario para ajustar estructura visual
                this.categories = budgets.map(b => ({
                    id: b.id,
                    categoryId: b.categoryId,
                    name: b.name || this.getCategoryName(b.categoryId),
                    icon: b.icon || this.getCategoryIcon(b.categoryId),
                    budgeted: b.budgeted || 0,
                    spent: b.spent || 0,
                    color: b.color || '#3B82F6' // Fallback color
                }));

                if (window.GentleFinances) {
                    window.GentleFinances.state.budgets = this.categories;
                }
            } catch (error) {
                console.error('Error loading budgets:', error);
            }
        }
    },

    getCategoryName(id) {
        // Fallback simple naming map
        const names = { food: 'Alimentación', transport: 'Transporte', entertainment: 'Ocio', bills: 'Facturas' };
        return names[id] || id;
    },

    getCategoryIcon(id) {
        const icons = { food: '🍽️', transport: '🚗', entertainment: '🎬', bills: '📄' };
        return icons[id] || '💰';
    },

    // Renderizar vista
    render() {
        this.updateMonthDisplay();
        this.renderCategories();
        this.updateSummary();
    },

    // Actualizar mes mostrado
    updateMonthDisplay() {
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        document.getElementById('currentMonth').textContent =
            `${monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
    },

    // Navegación de meses
    prevMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.render();
        this.showToast('Cargando presupuesto del mes anterior...');
    },

    nextMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.render();
        this.showToast('Cargando presupuesto del mes siguiente...');
    },

    // Renderizar lista de categorías
    renderCategories() {
        const container = document.getElementById('budget-categoryList');

        container.innerHTML = this.categories.map(cat => {
            const percent = cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0;
            const status = percent >= 100 ? 'over' : percent >= 80 ? 'near' : 'under';

            return `
                <div class="category-item" onclick="Budget.editCategory('${cat.id}')">
                    <div class="category-icon">${cat.icon}</div>
                    <div class="category-info">
                        <div class="category-name">${cat.name}</div>
                        <div class="category-progress-bar">
                            <div class="category-progress-fill ${status}" style="width: ${Math.min(percent, 100)}%"></div>
                        </div>
                    </div>
                    <div class="category-amounts">
                        <div class="category-spent">${Utils.formatCurrency(cat.spent)}</div>
                        <div class="category-budget">de ${Utils.formatCurrency(cat.budgeted)}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Actualizar resumen
    updateSummary() {
        const totalBudgeted = this.categories.reduce((sum, c) => sum + c.budgeted, 0);
        const totalSpent = this.categories.reduce((sum, c) => sum + c.spent, 0);
        const available = this.income - totalBudgeted;

        document.getElementById('budget-totalIncome').textContent = Utils.formatCurrency(this.income);
        document.getElementById('budget-totalBudgeted').textContent = Utils.formatCurrency(totalBudgeted);
        document.getElementById('budget-totalSpent').textContent = Utils.formatCurrency(totalSpent);

        const availableEl = document.getElementById('budget-available');
        availableEl.textContent = Utils.formatCurrency(Math.abs(available));
        availableEl.style.color = available >= 0 ? 'var(--positive-light)' : 'var(--negative-light)';
        if (available < 0) availableEl.textContent = '-' + availableEl.textContent;
    },

    // Renderizar gráfico circular
    renderChart() {
        const ctx = document.getElementById('budget-spendingChart')?.getContext('2d');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.categories.map(c => c.name),
                datasets: [{
                    data: this.categories.map(c => c.budgeted),
                    backgroundColor: this.categories.map(c => c.color),
                    borderColor: 'transparent',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#7A7A7A',
                            padding: 10,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 26, 0.95)',
                        titleColor: '#C5A058',
                        bodyColor: '#F0EDE5',
                        callbacks: {
                            label: (ctx) => Utils.formatCurrency(ctx.raw)
                        }
                    }
                }
            }
        });
    },

    // Editar categoría (placeholder)
    editCategory(id) {
        const cat = this.categories.find(c => c.id === id);
        if (!cat) return;

        const newBudget = prompt(`Presupuesto para ${cat.name}:`, cat.budgeted);
        if (newBudget !== null) {
            const val = parseFloat(newBudget) || 0;
            cat.budgeted = val;

            // Persist to Firestore
            if (window.FirestoreService?.budgets) {
                window.FirestoreService.budgets.update(cat.id, { budgeted: val })
                    .then(() => this.showToast(`Presupuesto de ${cat.name} actualizado`))
                    .catch(e => console.error('Error saving budget:', e));
            } else {
                this.showToast(`Presupuesto actualizado (Local)`, 'warning');
            }
            this.render();
        }
    },

    // Añadir categoría
    addCategory() {
        const name = prompt('Nombre de la nueva categoría:');
        if (!name) return;

        const budget = parseFloat(prompt('Presupuesto mensual:', '100')) || 100;

        const newCategory = {
            name: name,
            icon: '📂',
            budgeted: budget,
            spent: 0,
            color: '#94a3b8',
            categoryId: name.toLowerCase().replace(/\s+/g, '_') // Generate ID
        };

        // Persist to Firestore
        if (window.FirestoreService?.budgets) {
            window.FirestoreService.budgets.create(newCategory)
                .then(id => {
                    newCategory.id = id;
                    this.categories.push(newCategory);
                    this.render();
                    this.showToast(`Categoría "${name}" creada`);
                })
                .catch(e => {
                    console.error('Error creating budget:', e);
                    this.showToast('Error al guardar categoría', 'error');
                });
        } else {
            // Fallback (Visual only)
            newCategory.id = Date.now().toString();
            this.categories.push(newCategory);
            this.render();
            this.showToast(`Categoría "${name}" creada (Solo Local)`, 'warning');
        }
    },

    // Aplicar plantilla
    applyTemplate(template) {
        const income = this.income;

        switch (template) {
            case '50-30-20':
                this.categories = [
                    { id: '1', name: 'Necesidades', icon: '🏠', budgeted: income * 0.5, spent: 0, color: '#C5A058' },
                    { id: '2', name: 'Deseos', icon: '🎁', budgeted: income * 0.3, spent: 0, color: '#f472b6' },
                    { id: '3', name: 'Ahorro', icon: '💰', budgeted: income * 0.2, spent: 0, color: '#4ade80' }
                ];
                break;
            case '70-20-10':
                this.categories = [
                    { id: '1', name: 'Gastos', icon: '💳', budgeted: income * 0.7, spent: 0, color: '#C5A058' },
                    { id: '2', name: 'Ahorro', icon: '💰', budgeted: income * 0.2, spent: 0, color: '#4ade80' },
                    { id: '3', name: 'Deuda', icon: '📉', budgeted: income * 0.1, spent: 0, color: '#f87171' }
                ];
                break;
            case '80-20':
                this.categories = [
                    { id: '1', name: 'Gastos', icon: '💳', budgeted: income * 0.8, spent: 0, color: '#C5A058' },
                    { id: '2', name: 'Ahorro', icon: '💰', budgeted: income * 0.2, spent: 0, color: '#4ade80' }
                ];
                break;
        }

        this.render();
        this.renderChart();
        this.showToast(`Plantilla ${template} aplicada`);
    },

    // Mostrar plantillas
    showTemplates() {
        this.showToast('Selecciona una plantilla del panel derecho');
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

// Auto-inicializar
// DOMContentLoaded listener removed for SPA compatibility
