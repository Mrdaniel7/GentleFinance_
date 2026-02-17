/**
 * Controlador de Transacciones
 * Maneja la búsqueda, filtrado, CRUD y exportación de transacciones
 */

const Transactions = {
    transactions: [],
    filteredTransactions: [],
    currentPage: 1,
    itemsPerPage: 50,
    unsubscribe: null,

    // Inicialización
    init() {
        this.bindEvents();
        this.setupRealtimeListener();
        console.log('💰 Transactions module initialized');
    },

    // Configurar suscripción a Firestore
    setupRealtimeListener() {
        if (window.FirestoreService?.transactions) {
            this.unsubscribe = window.FirestoreService.transactions.subscribe((transactions) => {
                this.transactions = transactions;

                // Mapear campos para compatibilidad UI
                this.transactions = this.transactions.map(t => ({
                    ...t,
                    // Asegurar que la fecha sea objeto fecha para comparación
                    dateObj: t.date?.toDate ? t.date.toDate() : new Date(t.date || Date.now()),
                    // Icono fallback
                    icon: t.icon || this.getCategoryIcon(t.categoryId || t.category)
                }));

                // Actualizar estado global
                if (window.GentleFinances) {
                    window.GentleFinances.state.transactions = this.transactions;
                }

                this.applyFilters();

                // Refresh Dashboard if active or needed
                if (window.Dashboard && typeof window.Dashboard.loadWidgets === 'function') {
                    // Slight delay to ensure state is propagated if needed, though here it is direct.
                    window.Dashboard.loadWidgets();
                }
            });
        }
    },

    getCategoryIcon(category) {
        const icons = {
            food: '🍽️',
            transport: '🚗',
            entertainment: '🎬',
            bills: '📄',
            shopping: '🛍️',
            health: '🏥',
            subscriptions: '📺',
            income: '💼'
        };
        return icons[category] || '💰';
    },

    // Bind de eventos
    bindEvents() {
        // Búsqueda
        const searchInput = document.getElementById('allTransactionSearch');
        if (searchInput) {
            let debounce;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounce);
                debounce = setTimeout(() => this.applyFilters(), 300);
            });
        }

        // Filtro de categoría
        const categoryFilter = document.getElementById('allTransactionCategoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
    },

    // Aplicar filtros
    applyFilters() {
        const searchTerm = document.getElementById('allTransactionSearch')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('allTransactionCategoryFilter')?.value || '';

        this.filteredTransactions = this.transactions.filter(tx => {
            // Filtro de búsqueda
            const matchSearch = !searchTerm ||
                tx.description?.toLowerCase().includes(searchTerm) ||
                tx.merchantName?.toLowerCase().includes(searchTerm) ||
                tx.notes?.toLowerCase().includes(searchTerm);

            // Filtro de categoría
            let matchCategory = true;
            if (categoryFilter) {
                const cat = tx.categoryId || tx.category;
                matchCategory = cat === categoryFilter;
            }

            return matchSearch && matchCategory;
        });

        this.currentPage = 1;
        this.render();
    },

    // Renderizar lista
    render() {
        const container = document.getElementById('allTransactionsList');
        if (!container) return;

        if (this.filteredTransactions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: var(--space-xl); color: var(--text-muted);">
                    <div style="font-size: 2rem; margin-bottom: var(--space-md);">🔍</div>
                    <p>No se encontraron transacciones</p>
                </div>
            `;
            return;
        }

        // Agrupar por fecha
        const grouped = this.groupByDate(this.filteredTransactions);

        container.innerHTML = Object.entries(grouped).map(([date, txs]) => `
            <div class="date-group">
                <div style="padding: var(--space-sm) var(--space-md); background: var(--bg-tertiary); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-muted);">
                    ${this.formatDateHeader(date)}
                </div>
                ${txs.map(tx => this.renderTransaction(tx)).join('')}
            </div>
        `).join('');

        // Actualizar resumen
        this.updateSummary();
    },

    // Agrupar transacciones por fecha
    groupByDate(transactions) {
        return transactions.reduce((groups, tx) => {
            // Manejar fechas de Firestore o strings
            const d = tx.dateObj || new Date(tx.date);
            const dateStr = d.toISOString().split('T')[0];

            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(tx);
            return groups;
        }, {});
    },

    // Renderizar una transacción
    renderTransaction(tx) {
        const isIncome = tx.amount > 0;

        // Determine file indicator
        let fileIcon = '';
        if (tx.files && tx.files.length > 0) {
            const count = tx.files.length;
            const openUrl = tx.files[0].url;
            // Show clip + count if multiple, else just clip
            const label = count > 1 ? `📎 ${count}` : '📎';
            fileIcon = `<span class="file-indicator" title="Ver archivos" onclick="event.stopPropagation(); window.GentleFinances.openEditTransactionModal({id: '${tx.id}', ...window.GentleFinances.state.transactions.find(t=>t.id==='${tx.id}')})">${label}</span>`;
        } else if (tx.fileUrl) {
            fileIcon = `<span class="file-indicator" title="Ver archivo adjunto" onclick="event.stopPropagation(); window.open('${tx.fileUrl}', '_blank')">📎</span>`;
        }

        return `
            <div class="transaction-item" onclick="Transactions.showDetail('${tx.id}')">
                <div class="transaction-icon">${tx.icon || '💰'}</div>
                <div class="transaction-details">
                    <div class="transaction-merchant">
                        ${this.escapeHtml(tx.merchantName || tx.description)}
                        ${fileIcon}
                    </div>
                    <div class="transaction-category">${this.getCategoryName(tx.categoryId || tx.category)}</div>
                </div>
                <div>
                    <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                        ${isIncome ? '+' : '-'}${Utils.formatCurrency(Math.abs(tx.amount))}
                    </div>
                    <div class="transaction-date">${this.formatTime(tx.date)}</div>
                </div>
            </div>
        `;
    },

    // Actualizar resumen
    updateSummary() {
        const income = this.filteredTransactions
            .filter(tx => tx.amount > 0)
            .reduce((sum, tx) => sum + tx.amount, 0);

        const expenses = this.filteredTransactions
            .filter(tx => tx.amount < 0)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

        const net = income - expenses;

        // Actualizar UI
        const incomeEl = document.getElementById('summary-income');
        if (incomeEl) {
            incomeEl.textContent = `+${Utils.formatCurrency(income)}`;
        }

        const expensesEl = document.getElementById('summary-expenses');
        if (expensesEl) {
            expensesEl.textContent = `-${Utils.formatCurrency(expenses)}`;
        }

        const netEl = document.getElementById('summary-net');
        if (netEl) {
            const sign = net >= 0 ? '+' : '-';
            netEl.textContent = `${sign}${Utils.formatCurrency(Math.abs(net))}`;

            // Color logic
            if (net >= 0) {
                netEl.classList.remove('text-negative');
                netEl.classList.add('gold');
            } else {
                netEl.classList.remove('gold');
                netEl.classList.add('text-negative');
            }
        }
    },

    // Mostrar detalle (Edición)
    showDetail(id) {
        const tx = this.transactions.find(t => t.id === id);
        if (!tx) return;

        if (window.GentleFinances) {
            window.GentleFinances.openEditTransactionModal(tx);
        }
    },

    // Exportar a CSV
    downloadCSV() {
        const headers = ['Fecha', 'Descripción', 'Categoría', 'Importe', 'Notas'];
        const rows = this.filteredTransactions.map(tx => [
            tx.dateObj?.toISOString().split('T')[0] || tx.date,
            tx.description || tx.merchantName,
            tx.categoryId || tx.category,
            tx.amount.toFixed(2),
            tx.notes || ''
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `transacciones_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        URL.revokeObjectURL(url);
    },

    // Utilidades
    formatDateHeader(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
        const todayStr = { es: 'Hoy', en: 'Today', de: 'Heute' };
        const yesterdayStr = { es: 'Ayer', en: 'Yesterday', de: 'Gestern' };
        const lang = window.I18n?.currentLang || 'es';
        if (date.toDateString() === today.toDateString()) return todayStr[lang] || 'Hoy';
        if (date.toDateString() === yesterday.toDateString()) return yesterdayStr[lang] || 'Ayer';

        return date.toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    },

    formatTime(dateInput) {
        const date = dateInput && dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
        const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
        return date.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
    },

    getCategoryName(category) {
        const names = {
            'alimentacion': 'Alimentación',
            'food': 'Alimentación',
            'transporte': 'Transporte',
            'transport': 'Transporte',
            'ocio': 'Ocio',
            'entertainment': 'Ocio',
            'hogar': 'Hogar',
            'bills': 'Facturas',
            'suscripciones': 'Suscripciones',
            'subscriptions': 'Suscripciones',
            'nomina': 'Ingresos',
            'income': 'Ingresos',
            'salud': 'Salud',
            'health': 'Salud',
            'compras': 'Compras',
            'shopping': 'Compras'
        };
        return names[category] || category || 'Sin categoría';
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Make available globally
window.Transactions = Transactions;
