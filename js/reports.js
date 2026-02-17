/**
 * Controlador de Informes Financieros
 * Refactorizado para máxima robustez y manejo de estados vacíos.
 */

const Reports = {
    // Estado interno
    period: 'month',
    charts: {},
    initialized: false,
    loading: false,

    // Contenedor de datos centralizado
    data: {
        transactions: [],
        holdings: [],
        categories: [],
        merchants: [],
        trend: { labels: [], income: [], expenses: [] },
        daily: [],
        dailyLabels: [],
        wealthDistribution: [],
        totalLiquid: 0
    },

    // --- INICIALIZACIÓN ---

    async init() {
        if (this.initialized) {
            console.log('📊 Reports: Already initialized, reloading data...');
            await this.loadData();
            return;
        }

        console.log('📊 Reports: Initializing...');

        // 1. Configurar Listeners de UI
        this.setupListeners();

        // 2. Cargar Datos
        await this.loadData();

        this.initialized = true;
    },

    setupListeners() {
        // Botones de período
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.onclick = (e) => {
                // UI Toggle
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Set Period
                const period = e.target.textContent.toLowerCase().includes('sem') ? 'week' :
                    e.target.textContent.toLowerCase().includes('mes') ? 'month' :
                        e.target.textContent.toLowerCase().includes('año') ? 'year' : 'month';
                this.setPeriod(period);
            };
        });

        // Resize Listener para redibujar gráficos
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (document.getElementById('view-reports').offsetParent !== null) {
                    this.renderCharts();
                }
            }, 300);
        });
    },

    // --- CARGA DE DATOS ---

    async loadData() {
        this.loading = true;
        console.log('📊 Reports: Starting Data Load...');

        try {
            // Carga paralela de fuentes de datos
            const [txResult, portfolioResult] = await Promise.allSettled([
                // 1. Transactions
                window.FirestoreService?.transactions ?
                    window.FirestoreService.transactions.getAll() : Promise.resolve([]),

                // 2. Portfolio (Init + Get Investments)
                (async () => {
                    if (window.PortfolioManager && !window.PortfolioManager.isInitialized) {
                        try { await window.PortfolioManager.init(); } catch (e) { console.warn('Portfolio init error', e); }
                    }
                    return window.PortfolioManager?.investments ||
                        [];
                })()
            ]);

            // Procesar resultados
            const transactions = txResult.status === 'fulfilled' ? txResult.value : [];
            const holdings = portfolioResult.status === 'fulfilled' ? portfolioResult.value : [];

            console.log(`📊 Reports: Loaded ${transactions.length} transactions and ${holdings.length} holdings.`);

            // Guardar datos crudos
            this.data.transactions = transactions;
            this.data.holdings = holdings;

            // Procesar datos para gráficos
            this.processData();

        } catch (error) {
            console.error('💥 Reports: Critical Error loading data:', error);
        } finally {
            this.loading = false;
            // SIEMPRE intentar renderizar
            this.renderCharts();
        }
    },

    setPeriod(period) {
        console.log(`📊 Reports: Switching period to ${period}`);
        this.period = period;
        // Reprocesar datos con nuevo filtro de fecha
        this.processData();
        this.renderCharts();
        this.showToast(`Vista: ${this.getPeriodLabel(period)}`);
    },

    // --- PROCESAMIENTO DE DATOS ---

    processData() {
        const { transactions, holdings } = this.data;

        // 1. Calcular Totales Globales (No dependen del período)
        this.data.totalLiquid = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        // 2. Filtrar transacciones por período seleccionado
        const filteredTx = this.filterTransactionsByPeriod(transactions, this.period);

        // 3. Procesar Tendencias e Ingresos/Gastos (Datos filtrados)
        this.processTrends(filteredTx);
        this.processCategories(filteredTx);
        this.processPayerAnalysis(filteredTx); // Top Merchants

        // 4. Procesar Patrimonio (Datos globales/actuales)
        this.processWealth(holdings, this.data.totalLiquid);

        console.log('📊 Reports: Data processing complete.', this.data);
    },

    filterTransactionsByPeriod(transactions, period) {
        if (!transactions || transactions.length === 0) return [];

        const now = new Date();
        const cutoff = new Date();

        switch (period) {
            case 'week': cutoff.setDate(now.getDate() - 7); break;
            case 'month': cutoff.setDate(now.getDate() - 30); break;
            case 'quarter': cutoff.setMonth(now.getMonth() - 3); break;
            case 'year': cutoff.setFullYear(now.getFullYear() - 1); break;
            default: cutoff.setDate(now.getDate() - 30); // Default month
        }

        return transactions.filter(t => {
            const d = t.dateObj || (t.date?.toDate ? t.date.toDate() : new Date(t.date));
            return d >= cutoff;
        });
    },

    processTrends(transactions) {
        // Inicializar estructura
        let income = 0, expenses = 0;

        // Calcular sumas totales del período
        transactions.forEach(t => {
            if (t.amount > 0) income += t.amount;
            else expenses += Math.abs(t.amount);
        });

        // Actualizar UI de KPIs
        this.updateKPIs(income, expenses);

        // Generar datos para gráficos de evolución (Trend & Daily)
        // ... Lógica simplificada de agrupación ...

        // 1. Agrupación Dinámica
        const isDaily = this.period === 'week' || this.period === 'month';
        const groups = {};
        const labels = [];
        const dataIncome = [];
        const dataExpense = [];

        if (isDaily) {
            // Últimos X días
            const days = this.period === 'week' ? 7 : 30;
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toLocaleDateString(window.Utils?._getLocale ? Utils._getLocale() : 'es-ES', { day: 'numeric', month: 'short' });
                labels.push(key);
                groups[key] = { inc: 0, exp: 0 };
            }

            transactions.forEach(t => {
                const d = t.dateObj || (t.date?.toDate ? t.date.toDate() : new Date(t.date));
                const key = d.toLocaleDateString(window.Utils?._getLocale ? Utils._getLocale() : 'es-ES', { day: 'numeric', month: 'short' });
                if (groups[key]) {
                    if (t.amount > 0) groups[key].inc += t.amount;
                    else groups[key].exp += Math.abs(t.amount);
                }
            });
        } else {
            // Últimos 12 meses
            for (let i = 11; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const key = d.toLocaleDateString(window.Utils?._getLocale ? Utils._getLocale() : 'es-ES', { month: 'short' });
                labels.push(key);
                groups[key] = { inc: 0, exp: 0 };
            }

            transactions.forEach(t => {
                const d = t.dateObj || (t.date?.toDate ? t.date.toDate() : new Date(t.date));
                const key = d.toLocaleDateString(window.Utils?._getLocale ? Utils._getLocale() : 'es-ES', { month: 'short' });
                if (groups[key]) {
                    if (t.amount > 0) groups[key].inc += t.amount;
                    else groups[key].exp += Math.abs(t.amount);
                }
            });
        }

        // Flatten
        labels.forEach(l => {
            dataIncome.push(groups[l]?.inc || 0);
            dataExpense.push(groups[l]?.exp || 0);
        });

        this.data.trend = { labels, income: dataIncome, expenses: dataExpense };

        // Daily Spend Bar Chart (Only Expenses)
        this.data.dailyLabels = labels; // Reusar etiquetas
        this.data.daily = dataExpense;  // Reusar gastos
    },

    processCategories(transactions) {
        const catMap = {};
        transactions.forEach(t => {
            if (t.amount < 0) { // Solo gastos
                const cat = t.category || 'Otros';
                catMap[cat] = (catMap[cat] || 0) + Math.abs(t.amount);
            }
        });

        this.data.categories = Object.entries(catMap)
            .map(([name, amount]) => ({
                name: this.getCategoryName(name),
                amount,
                color: this.getCategoryColor(name)
            }))
            .sort((a, b) => b.amount - a.amount);
    },

    processPayerAnalysis(transactions) {
        const merchMap = {};
        transactions.forEach(t => {
            if (t.amount < 0) {
                const name = t.description || t.merchantName || 'Desconocido';
                merchMap[name] = (merchMap[name] || 0) + Math.abs(t.amount);
            }
        });

        this.data.merchants = Object.entries(merchMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    },

    processWealth(holdings, liquidCash) {
        // 1. Distribución (Donut)
        const distribution = {
            'Ahorros': liquidCash > 0 ? liquidCash : 0, // Nunca negativo en distribución
            'Inversiones': 0,
            'Cripto': 0,
            'Inmuebles': 0
        };

        holdings.forEach(h => {
            const val = (parseFloat(h.quantity) || 0) * (parseFloat(h.currentPrice || h.price) || 0);
            const type = (h.type || h.assetType || '').toLowerCase();

            if (type === 'crypto') distribution['Cripto'] += val;
            else if (type.includes('real') || type.includes('inmueble')) distribution['Inmuebles'] += val;
            else distribution['Inversiones'] += val;
        });

        this.data.wealthDistribution = Object.entries(distribution)
            .map(([name, amount]) => ({
                name,
                amount,
                color: this.getAssetColor(name)
            }));

        // 2. Evolución (Line) - Simulación simple basada en el trend histórico de transacciones
        // Idealmente tendríamos snapshots históricos de patrimonio, pero usaremos el cashflow para aproximar.
    },

    // --- RENDERIZADO (ATÓMICO Y ROBUSTO) ---

    renderCharts() {
        console.log('📊 Reports: Rendering Charts...');

        // Wrap in animation frame to ensure DOM is ready
        requestAnimationFrame(() => {
            this.renderCategoryChart();
            this.renderTrendChart();
            this.renderDailyChart();
            this.renderWealthDistributionChart();
            this.renderWealthEvolutionChart();

            // HTML lists
            this.renderTopMerchants();
            this.renderCategoryBreakdown();
        });
    },

    // 1. Gastos por Categoría
    renderCategoryChart() {
        const ctx = this.getContext('reports-categoryChart');
        if (!ctx) return;

        const data = this.data.categories;
        const hasData = data && data.length > 0;

        this.createChart(ctx, 'category', {
            type: 'doughnut',
            data: {
                labels: hasData ? data.map(d => d.name) : ['Sin Gastos'],
                datasets: [{
                    data: hasData ? data.map(d => d.amount) : [1],
                    backgroundColor: hasData ? data.map(d => d.color) : ['#333333'],
                    borderWidth: 0
                }]
            },
            options: { cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#888' } } } }
        });
    },

    // 2. Tendencia Ingresos vs Gastos
    renderTrendChart() {
        const ctx = this.getContext('reports-trendChart');
        if (!ctx) return;

        const { labels, income, expenses } = this.data.trend;
        const hasData = labels.length > 0 && (income.some(v => v > 0) || expenses.some(v => v > 0));

        this.createChart(ctx, 'trend', {
            type: 'line',
            data: {
                labels: hasData ? labels : ['Sin datos'],
                datasets: [
                    {
                        label: 'Ingresos',
                        data: hasData ? income : [0],
                        borderColor: '#4ade80',
                        backgroundColor: 'rgba(74, 222, 128, 0.1)',
                        fill: true, tension: 0.4
                    },
                    {
                        label: 'Gastos',
                        data: hasData ? expenses : [0],
                        borderColor: '#f87171',
                        backgroundColor: 'rgba(248, 113, 113, 0.1)',
                        fill: true, tension: 0.4
                    }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: '#888' } } }, scales: { x: { grid: { color: '#333' } }, y: { grid: { color: '#333' } } } }
        });
    },

    // 3. Gasto Diario (Barras)
    renderDailyChart() {
        const ctx = this.getContext('reports-dailyChart');
        if (!ctx) return;

        const { dailyLabels, daily } = this.data;
        const hasData = daily.some(v => v > 0);

        this.createChart(ctx, 'daily', {
            type: 'bar',
            data: {
                labels: hasData ? dailyLabels : ['Sin gastos'],
                datasets: [{
                    label: 'Gasto Diario',
                    data: hasData ? daily : [0],
                    backgroundColor: '#f87171',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: '#333' } } } }
        });
    },

    // 4. Distribución Patrimonio
    renderWealthDistributionChart() {
        const ctx = this.getContext('reports-wealthDistributionChart');
        if (!ctx) return;

        const data = this.data.wealthDistribution;
        const hasData = data.some(d => d.amount > 0);
        const filtered = data.filter(d => d.amount > 0);

        this.createChart(ctx, 'wealthDist', {
            type: 'doughnut',
            data: {
                labels: hasData ? filtered.map(d => d.name) : ['Sin Saldo'],
                datasets: [{
                    data: hasData ? filtered.map(d => d.amount) : [1],
                    backgroundColor: hasData ? filtered.map(d => d.color) : ['#333'],
                    borderWidth: 0
                }]
            },
            options: { cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#888' } } } }
        });
    },

    // 5. Evolución Patrimonio
    renderWealthEvolutionChart() {
        // Intentar ambos IDs por compatibilidad
        const ctx = document.getElementById('reports-assetGrowthChart')?.getContext('2d') ||
            document.getElementById('reports-wealthEvolutionChart')?.getContext('2d');
        if (!ctx) return;

        // Generar línea simulada si no hay histórico real
        // Empezamos en totalLiquid actual
        const currentTotal = this.data.totalLiquid + this.data.wealthDistribution
            .filter(d => d.name !== 'Ahorros') // Sumar inversiones
            .reduce((sum, d) => sum + d.amount, 0);

        // Simulamos una linea plana o leve variación si no hay histórico complejo
        const labels = ['6m', '5m', '4m', '3m', '2m', 'Actual'];
        const data = Array(6).fill(currentTotal);
        // Si tenemos trend de ingresos, podríamos ondularla, pero flat es seguro para v1

        this.charts.wealthEvo = this.destroyChart(this.charts.wealthEvo);
        this.charts.wealthEvo = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Patrimonio Total',
                    data,
                    borderColor: '#C5A058',
                    backgroundColor: 'rgba(197, 160, 88, 0.1)',
                    fill: true, tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: '#333' } }, y: { grid: { color: '#333' } } } }
        });
    },

    // --- HELPER RENDERING ---

    getContext(id) {
        const el = document.getElementById(id);
        if (!el) { console.warn(`Canvas not found: ${id}`); return null; }
        return el.getContext('2d');
    },

    createChart(ctx, key, config) {
        // Destroy old
        if (this.charts[key]) {
            this.charts[key].destroy();
        }
        // Create new
        try {
            this.charts[key] = new Chart(ctx, config);
        } catch (e) {
            console.error(`Error creating chart ${key}:`, e);
        }
    },

    destroyChart(chart) {
        if (chart && typeof chart.destroy === 'function') chart.destroy();
        return null;
    },

    renderTopMerchants() {
        const container = document.getElementById('reports-topMerchants');
        if (!container) return;

        const data = this.data.merchants;
        if (data.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">Sin datos recientes</div>';
            return;
        }

        container.innerHTML = data.map(m => `
            <div class="flex justify-between items-center p-sm bg-surface rounded">
                <div class="font-medium">${m.name}</div>
                <div class="font-mono text-gold">${Utils.formatCurrency(m.amount)}</div>
            </div>
        `).join('');
    },

    renderCategoryBreakdown() {
        const container = document.getElementById('reports-categoryBreakdown');
        if (!container) return;

        const data = this.data.categories;
        if (data.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">Sin gastos</div>';
            return;
        }

        container.innerHTML = data.map(c => `
             <div class="flex justify-between items-center p-sm border-b border-white-5">
                <div class="flex items-center gap-2">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${c.color}"></div>
                    <span>${c.name}</span>
                </div>
                <div class="font-mono">${Utils.formatCurrency(c.amount)}</div>
            </div>
        `).join('');
    },

    updateKPIs(income, expenses) {
        const savings = income - expenses;
        const rate = income > 0 ? (savings / income) * 100 : 0;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        setVal('reports-totalIncome', `+${Utils.formatCurrency(income)}`);
        setVal('reports-totalExpenses', `-${Utils.formatCurrency(expenses)}`);
        setVal('reports-netSavings', `${savings >= 0 ? '+' : '-'}${Utils.formatCurrency(Math.abs(savings))}`);
        setVal('reports-savingsRate', `${rate.toFixed(0)}%`);
    },

    // --- HELPERS UTILS ---

    getCategoryName(id) {
        const map = { food: 'Alimentación', housing: 'Vivienda', transport: 'Transporte', bills: 'Facturas', entertainment: 'Ocio', shopping: 'Compras', health: 'Salud' };
        return map[id.toLowerCase()] || id;
    },

    getCategoryColor(id) {
        const colors = { food: '#4ade80', housing: '#C5A058', transport: '#60a5fa', bills: '#fb923c', entertainment: '#f472b6', shopping: '#a78bfa', health: '#f87171' };
        return colors[id.toLowerCase()] || '#94a3b8';
    },

    getAssetColor(name) {
        const colors = { 'Ahorros': '#4ade80', 'Inversiones': '#C5A058', 'Cripto': '#818cf8', 'Inmuebles': '#fb923c' };
        return colors[name] || '#94a3b8';
    },

    getPeriodLabel(p) {
        const labels = { week: 'Última Semana', month: 'Último Mes', quarter: 'Último Trimestre', year: 'Último Año' };
        return labels[p] || p;
    },

    showToast(msg) {
        if (window.showToast) window.showToast(msg);
        else console.log('Toast:', msg);
    },

    // --- EXPORTACIÓN ---
    openExportModal() { document.getElementById('exportReportModal')?.classList.add('active'); },
    closeExportModal() { document.getElementById('exportReportModal')?.classList.remove('active'); },

    async exportData() {
        console.log('📊 Reports: Exporting data...');

        // Cargar datos si es necesario
        if (!this.data.transactions || this.data.transactions.length === 0) {
            this.showToast('Cargando datos para exportar...');
            await this.loadData();
        }

        // Leer opciones del modal
        const selectedSections = Array.from(
            document.querySelectorAll('#exportReportForm input[name="section"]:checked')
        ).map(cb => cb.value);

        const format = document.querySelector('#exportReportForm input[name="format"]:checked')?.value || 'csv';

        const periodSelect = document.getElementById('exportTimeRange') || document.getElementById('exportPeriod');
        const exportPeriod = periodSelect ? this._mapExportPeriod(periodSelect.value) : this.period;

        if (selectedSections.length === 0) {
            this.showToast('Selecciona al menos una sección');
            return;
        }

        const transactions = this.filterTransactionsByPeriod(this.data.transactions, exportPeriod);
        const holdings = this.data.holdings || [];
        const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
        const curr = window.Settings?.preferences?.currency || 'EUR';
        const fmtMoney = (v) => window.Utils?.formatCurrency ? Utils.formatCurrency(v) : `${(v || 0).toFixed(2)} €`;

        if (format === 'csv') {
            this._exportCSV(selectedSections, transactions, holdings, exportPeriod, locale, fmtMoney);
        } else {
            this._exportPDF(selectedSections, transactions, holdings, exportPeriod, locale, fmtMoney, curr);
        }

        this.closeExportModal();
        this.showToast(`✅ Informe ${format.toUpperCase()} exportado correctamente`);
    },

    // ========== CSV EXPORT ==========
    _exportCSV(sections, transactions, holdings, period, locale, fmtMoney) {
        const BOM = '\uFEFF';
        let csv = BOM;
        const date = new Date().toLocaleDateString(locale);

        // --- Resumen de Patrimonio ---
        if (sections.includes('wealth')) {
            const income = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
            const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
            const totalInvested = holdings.reduce((s, h) => s + ((parseFloat(h.quantity) || 0) * (parseFloat(h.currentPrice || h.price) || 0)), 0);

            csv += `"=== RESUMEN DE PATRIMONIO (${date}) ==="\n`;
            csv += `"Concepto","Importe"\n`;
            csv += `"Total Ingresos",${income.toFixed(2)}\n`;
            csv += `"Total Gastos",${(-expenses).toFixed(2)}\n`;
            csv += `"Balance Neto",${(income - expenses).toFixed(2)}\n`;
            csv += `"Tasa de Ahorro","${income > 0 ? ((income - expenses) / income * 100).toFixed(0) + '%' : '0%'}"\n`;
            csv += `"Total Invertido",${totalInvested.toFixed(2)}\n`;
            csv += `"Total Transacciones",${transactions.length}\n`;
            csv += `\n`;
        }

        // --- Inversiones ---
        if (sections.includes('investments')) {
            const stocks = holdings.filter(h => {
                const t = (h.type || h.assetType || '').toLowerCase();
                return t !== 'crypto' && !t.includes('real') && !t.includes('inmueble');
            });

            csv += `"=== DETALLE DE INVERSIONES ==="\n`;
            csv += `"Nombre","Símbolo","Cantidad","Precio Compra","Precio Actual","Valor Total"\n`;

            if (stocks.length > 0) {
                stocks.forEach(h => {
                    const name = (h.name || h.symbol || 'Desconocido').replace(/"/g, "'");
                    const qty = parseFloat(h.quantity) || 0;
                    const price = parseFloat(h.price) || 0;
                    const current = parseFloat(h.currentPrice || h.price) || 0;
                    csv += `"${name}","${h.symbol || ''}",${qty.toFixed(4)},${price.toFixed(2)},${current.toFixed(2)},${(qty * current).toFixed(2)}\n`;
                });
            } else {
                csv += `"Sin inversiones registradas","","","","",""\n`;
            }
            csv += `\n`;
        }

        // --- Cripto ---
        if (sections.includes('crypto')) {
            const cryptos = holdings.filter(h => (h.type || h.assetType || '').toLowerCase() === 'crypto');

            csv += `"=== CARTERA DE CRIPTOMONEDAS ==="\n`;
            csv += `"Nombre","Símbolo","Cantidad","Precio Compra","Precio Actual","Valor Total"\n`;

            if (cryptos.length > 0) {
                cryptos.forEach(h => {
                    const name = (h.name || h.symbol || 'Desconocido').replace(/"/g, "'");
                    const qty = parseFloat(h.quantity) || 0;
                    const price = parseFloat(h.price) || 0;
                    const current = parseFloat(h.currentPrice || h.price) || 0;
                    csv += `"${name}","${h.symbol || ''}",${qty.toFixed(6)},${price.toFixed(2)},${current.toFixed(2)},${(qty * current).toFixed(2)}\n`;
                });
            } else {
                csv += `"Sin criptomonedas registradas","","","","",""\n`;
            }
            csv += `\n`;
        }

        // --- Inmuebles ---
        if (sections.includes('realestate')) {
            const props = holdings.filter(h => {
                const t = (h.type || h.assetType || '').toLowerCase();
                return t.includes('real') || t.includes('inmueble');
            });

            csv += `"=== ACTIVOS INMOBILIARIOS ==="\n`;
            csv += `"Nombre","Ubicación","Valor Estimado","Fecha Adquisición"\n`;

            if (props.length > 0) {
                props.forEach(h => {
                    const name = (h.name || 'Propiedad').replace(/"/g, "'");
                    const location = (h.location || h.region || '').replace(/"/g, "'");
                    const value = (parseFloat(h.quantity) || 1) * (parseFloat(h.currentPrice || h.price) || 0);
                    csv += `"${name}","${location}",${value.toFixed(2)},"${h.startDate || h.createdAt || ''}"\n`;
                });
            } else {
                csv += `"Sin propiedades registradas","","",""\n`;
            }
            csv += `\n`;
        }

        // --- Transacciones ---
        if (sections.includes('transactions')) {
            csv += `"=== HISTORIAL DE TRANSACCIONES ==="\n`;
            csv += `"Fecha","Concepto","Categoría","Importe","Tipo"\n`;

            if (transactions.length > 0) {
                transactions.forEach(t => {
                    const d = new Date(t.date?.toDate ? t.date.toDate() : t.date).toLocaleDateString(locale);
                    const concept = (t.description || t.merchantName || 'Sin concepto').replace(/,/g, ' ').replace(/"/g, "'");
                    const category = this.getCategoryName(t.category || 'other');
                    const amount = parseFloat(t.amount).toFixed(2);
                    const type = t.amount >= 0 ? 'Ingreso' : 'Gasto';
                    csv += `"${d}","${concept}","${category}",${amount},"${type}"\n`;
                });
            } else {
                csv += `"Sin transacciones en este período","","","",""\n`;
            }
        }

        this._downloadFile(csv, `informe_gentlefinances_${period}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
    },

    // ========== PDF EXPORT ==========
    _exportPDF(sections, transactions, holdings, period, locale, fmtMoney, curr) {
        const date = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
        const periodLabel = this.getPeriodLabel(period);

        let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Informe GentleFinances</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 30px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #C5A058; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 4px; }
    .header .subtitle { color: #666; font-size: 14px; }
    .header .date { color: #999; font-size: 12px; margin-top: 8px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 18px; color: #C5A058; border-bottom: 1px solid #e0d5c0; padding-bottom: 8px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
    th { background: #f8f5f0; color: #666; font-weight: 600; text-align: left; padding: 10px 12px; border-bottom: 2px solid #e0d5c0; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) td { background: #fafaf8; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
    .summary-card { background: #f8f5f0; border-radius: 8px; padding: 16px; text-align: center; }
    .summary-card .value { font-size: 20px; font-weight: 700; color: #1a1a1a; }
    .summary-card .label { font-size: 12px; color: #888; margin-top: 4px; }
    .positive { color: #22c55e; }
    .negative { color: #ef4444; }
    .gold { color: #C5A058; }
    .text-right { text-align: right; }
    .text-muted { color: #999; }
    .empty { color: #999; font-style: italic; padding: 20px; text-align: center; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #aaa; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
</style></head><body>`;

        // Header
        html += `<div class="header">
            <h1>Informe Financiero</h1>
            <div class="subtitle">GentleFinances &mdash; ${periodLabel}</div>
            <div class="date">Generado el ${date}</div>
        </div>`;

        html += `<div class="no-print" style="text-align: center; margin-bottom: 24px;">
            <button onclick="window.print()" style="background: #C5A058; color: #fff; border: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; cursor: pointer; font-weight: 600;">
                Imprimir / Guardar como PDF
            </button>
        </div>`;

        const income = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
        const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
        const balance = income - expenses;

        // --- Resumen ---
        if (sections.includes('wealth')) {
            const totalInvested = holdings.reduce((s, h) => s + ((parseFloat(h.quantity) || 0) * (parseFloat(h.currentPrice || h.price) || 0)), 0);
            const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(0) : 0;

            html += `<div class="section"><h2>Resumen de Patrimonio</h2>
                <div class="summary-grid">
                    <div class="summary-card"><div class="value positive">+${fmtMoney(income)}</div><div class="label">Ingresos</div></div>
                    <div class="summary-card"><div class="value negative">-${fmtMoney(expenses)}</div><div class="label">Gastos</div></div>
                    <div class="summary-card"><div class="value gold">${balance >= 0 ? '+' : ''}${fmtMoney(Math.abs(balance))}</div><div class="label">Balance Neto</div></div>
                    <div class="summary-card"><div class="value">${savingsRate}%</div><div class="label">Tasa de Ahorro</div></div>
                </div>
                <table><tr><th>Concepto</th><th class="text-right">Importe</th></tr>
                    <tr><td>Total en Inversiones</td><td class="text-right">${fmtMoney(totalInvested)}</td></tr>
                    <tr><td>Transacciones en el período</td><td class="text-right">${transactions.length}</td></tr>
                </table></div>`;
        }

        // --- Inversiones ---
        if (sections.includes('investments')) {
            const stocks = holdings.filter(h => {
                const t = (h.type || h.assetType || '').toLowerCase();
                return t !== 'crypto' && !t.includes('real') && !t.includes('inmueble');
            });

            html += `<div class="section"><h2>Detalle de Inversiones</h2>`;
            if (stocks.length > 0) {
                let totalVal = 0;
                html += `<table><tr><th>Nombre</th><th>Símbolo</th><th class="text-right">Cantidad</th><th class="text-right">Precio</th><th class="text-right">Valor</th></tr>`;
                stocks.forEach(h => {
                    const qty = parseFloat(h.quantity) || 0;
                    const current = parseFloat(h.currentPrice || h.price) || 0;
                    const val = qty * current;
                    totalVal += val;
                    html += `<tr><td>${h.name || h.symbol}</td><td>${h.symbol || ''}</td><td class="text-right">${qty.toFixed(4)}</td><td class="text-right">${fmtMoney(current)}</td><td class="text-right">${fmtMoney(val)}</td></tr>`;
                });
                html += `<tr style="font-weight: 700; border-top: 2px solid #e0d5c0;"><td colspan="4">Total</td><td class="text-right">${fmtMoney(totalVal)}</td></tr></table>`;
            } else {
                html += `<div class="empty">No hay inversiones registradas</div>`;
            }
            html += `</div>`;
        }

        // --- Cripto ---
        if (sections.includes('crypto')) {
            const cryptos = holdings.filter(h => (h.type || h.assetType || '').toLowerCase() === 'crypto');

            html += `<div class="section"><h2>Cartera de Criptomonedas</h2>`;
            if (cryptos.length > 0) {
                let totalVal = 0;
                html += `<table><tr><th>Nombre</th><th>Símbolo</th><th class="text-right">Cantidad</th><th class="text-right">Precio</th><th class="text-right">Valor</th></tr>`;
                cryptos.forEach(h => {
                    const qty = parseFloat(h.quantity) || 0;
                    const current = parseFloat(h.currentPrice || h.price) || 0;
                    const val = qty * current;
                    totalVal += val;
                    html += `<tr><td>${h.name || h.symbol}</td><td>${(h.symbol || '').toUpperCase()}</td><td class="text-right">${qty.toFixed(6)}</td><td class="text-right">${fmtMoney(current)}</td><td class="text-right">${fmtMoney(val)}</td></tr>`;
                });
                html += `<tr style="font-weight: 700; border-top: 2px solid #e0d5c0;"><td colspan="4">Total</td><td class="text-right">${fmtMoney(totalVal)}</td></tr></table>`;
            } else {
                html += `<div class="empty">No hay criptomonedas registradas</div>`;
            }
            html += `</div>`;
        }

        // --- Inmuebles ---
        if (sections.includes('realestate')) {
            const props = holdings.filter(h => {
                const t = (h.type || h.assetType || '').toLowerCase();
                return t.includes('real') || t.includes('inmueble');
            });

            html += `<div class="section"><h2>Activos Inmobiliarios</h2>`;
            if (props.length > 0) {
                let totalVal = 0;
                html += `<table><tr><th>Propiedad</th><th>Ubicación</th><th class="text-right">Valor Estimado</th></tr>`;
                props.forEach(h => {
                    const val = (parseFloat(h.quantity) || 1) * (parseFloat(h.currentPrice || h.price) || 0);
                    totalVal += val;
                    html += `<tr><td>${h.name || 'Propiedad'}</td><td>${h.location || h.region || '-'}</td><td class="text-right">${fmtMoney(val)}</td></tr>`;
                });
                html += `<tr style="font-weight: 700; border-top: 2px solid #e0d5c0;"><td colspan="2">Total</td><td class="text-right">${fmtMoney(totalVal)}</td></tr></table>`;
            } else {
                html += `<div class="empty">No hay propiedades registradas</div>`;
            }
            html += `</div>`;
        }

        // --- Transacciones ---
        if (sections.includes('transactions')) {
            html += `<div class="section"><h2>Historial de Transacciones</h2>`;
            if (transactions.length > 0) {
                html += `<table><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th class="text-right">Importe</th></tr>`;
                transactions.slice(0, 500).forEach(t => {
                    const d = new Date(t.date?.toDate ? t.date.toDate() : t.date).toLocaleDateString(locale);
                    const concept = t.description || t.merchantName || 'Sin concepto';
                    const category = this.getCategoryName(t.category || 'other');
                    const amount = parseFloat(t.amount) || 0;
                    const cls = amount >= 0 ? 'positive' : 'negative';
                    html += `<tr><td>${d}</td><td>${concept}</td><td>${category}</td><td class="text-right ${cls}">${fmtMoney(Math.abs(amount))}</td></tr>`;
                });
                if (transactions.length > 500) {
                    html += `<tr><td colspan="4" class="text-muted">... y ${transactions.length - 500} transacciones más</td></tr>`;
                }
                html += `</table>`;
            } else {
                html += `<div class="empty">No hay transacciones en este período</div>`;
            }
            html += `</div>`;
        }

        // Footer
        html += `<div class="footer">GentleFinances &mdash; Informe generado automáticamente &mdash; ${date}</div>`;
        html += `</body></html>`;

        // Abrir en nueva ventana para imprimir/guardar como PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        } else {
            // Fallback: descargar como HTML
            this._downloadFile(html, `informe_gentlefinances_${period}_${new Date().toISOString().slice(0, 10)}.html`, 'text/html;charset=utf-8;');
        }
    },

    _downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // Mapear valores del select del modal a períodos internos
    _mapExportPeriod(val) {
        const map = { 'all': 'year', 'month': 'month', 'quarter': 'quarter', 'half': 'quarter', 'year': 'year' };
        return map[val] || this.period;
    }
};

window.Reports = Reports;
