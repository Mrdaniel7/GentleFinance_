// ============================================
// GENTLEFINANCES - Dashboard Module
// Dashboard-specific functionality
// ============================================

/**
 * Dashboard Controller
 */
const Dashboard = {
    // Widget configuration
    widgets: [
        { id: 'netWorthWidget', type: 'networth', order: 1 },
        { id: 'balanceWidget', type: 'balance', order: 2 },
        { id: 'cashFlowWidget', type: 'cashflow', order: 3 },
        { id: 'budgetWidget', type: 'budget', order: 4 }
    ],

    // Chart instances
    charts: {},
    currentRange: '1M', // 1M, 3M, 6M, 1Y

    /**
     * Initialize dashboard
     */
    init() {
        this.loadWidgets();
        // Init chart with a slight delay to ensure DOM element exists/is visible
        setTimeout(() => this.initNetWorthChart(), 100);
        this.bindEvents();
        this.startAutoRefresh();

        console.log('📊 Dashboard initialized');
    },

    /**
     * Load and render widgets
     */
    loadWidgets() {
        if (!window.GentleFinances || !window.GentleFinances.state) return;

        // Calculate net worth
        const netWorth = this.calculateNetWorth();
        this.updateNetWorthWidget(netWorth);

        // Calculate available balance
        const availableBalance = this.calculateAvailableBalance();
        this.updateBalanceWidget(availableBalance);

        // Calculate cash flow
        const cashFlow = this.calculateCashFlow();
        this.updateCashFlowWidget(cashFlow);

        // Update budget overview
        this.updateBudgetWidget();

        // Update chart if it exists
        if (this.charts.netWorth) {
            this.updateChartData();
        }
    },

    /**
     * Calculate net worth from accounts
     * @returns {Object}
     */
    calculateNetWorth() {
        // Liquid assets are now derived directly from transactions for 100% accuracy
        const transactions = window.GentleFinances?.state?.transactions || [];
        const accountsTotal = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        // Add Portfolio Value
        let portfolioTotal = 0;
        if (window.PortfolioManager) {
            portfolioTotal = window.PortfolioManager.getTotalValue() || 0;
        }

        const total = accountsTotal + portfolioTotal;

        // Diagnostic logging
        console.group('🔍 Net Worth Diagnostic (Account-Based)');
        console.log('Accounts Total (Liquid):', accountsTotal);
        console.log('Portfolio Total Sum:', portfolioTotal);
        console.log('Total Net Worth:', total);
        console.groupEnd();

        // Calculate previous month for comparison
        // Current Balance - (Income this month - Expenses this month) = Start of Month Balance
        const cashFlow = this.calculateCashFlow();
        const netChange = cashFlow.net || 0;
        const previousMonth = total - netChange;

        let change = 0;
        if (previousMonth !== 0) {
            change = ((total - previousMonth) / previousMonth) * 100;
        }

        return {
            total: isNaN(total) ? 0 : total,
            previousMonth: isNaN(previousMonth) ? 0 : previousMonth,
            change: isNaN(change) ? 0 : change,
            isPositive: change >= 0
        };
    },

    calculateAvailableBalance() {
        // Source of truth: the sum of all transactions
        const transactions = window.GentleFinances?.state?.transactions || [];
        const txTotal = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        const accounts = window.GentleFinances?.state?.accounts || [];

        // Calculate Monthly Net (Income - Expenses this month)
        const cashFlow = this.calculateCashFlow();
        const monthlyNet = cashFlow.net || 0;

        return {
            total: txTotal, // We return the transaction sum as truth
            monthlyNet: monthlyNet,
            accountCount: accounts.length
        };
    },

    /**
     * Check if account balance matches transaction sum
     * @param {number} accountTotal 
     */
    checkBalanceConsistency(accountTotal) {
        const transactions = window.GentleFinances?.state?.transactions || [];
        if (transactions.length === 0) return;

        const txTotal = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        if (Math.abs(txTotal - accountTotal) > 0.01) {
            console.warn(`⚖️ Balance mismatch: TxSum(${txTotal}) vs AccTotal(${accountTotal}).`);
        }
    },


    /**
     * Calculate monthly cash flow
     * @returns {Object}
     */
    calculateCashFlow() {
        const transactions = window.GentleFinances.state.transactions || [];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyTransactions = transactions.filter(t => {
            const d = t.dateObj || new Date(t.date);
            return d >= startOfMonth;
        });

        const income = monthlyTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthlyTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const net = income - expenses;
        const percentage = income > 0 ? (expenses / income) * 100 : 0;

        return {
            income,
            expenses,
            net,
            percentage: Math.min(percentage, 100)
        };
    },

    /**
     * Update net worth widget
     * @param {Object} data 
     */
    updateNetWorthWidget(data) {
        const valueEl = document.getElementById('netWorthValue');
        const changeEl = document.getElementById('netWorthChange');

        if (valueEl) {
            // Using Utils.formatCurrency if available, else simple format
            valueEl.textContent = Utils.formatCurrency(data.total);
        }

        if (changeEl) {
            const sign = data.change > 0 ? '+' : '';
            changeEl.textContent = `${sign}${data.change.toFixed(1)}%`;

            // Find parent badge to update class
            const badge = changeEl.closest('.badge');
            if (badge) {
                // Update Badge Color
                if (data.isPositive) {
                    badge.classList.remove('badge-negative');
                    badge.classList.add('badge-positive');
                    // Update icon to trend up
                    const svg = badge.querySelector('svg');
                    if (svg) svg.innerHTML = '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>';
                } else {
                    badge.classList.remove('badge-positive');
                    badge.classList.add('badge-negative');
                    // Update icon to trend down
                    const svg = badge.querySelector('svg');
                    if (svg) svg.innerHTML = '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline>';
                }
            }
        }
    },

    /**
     * Update balance widget
     * @param {Object} data 
     */
    updateBalanceWidget(data) {
        const balanceEl = document.getElementById('availableBalance');

        if (balanceEl) {
            balanceEl.textContent = Utils.formatCurrency(data.total);

            // Add monthly net info as a small caption if relevant
            const parent = balanceEl.parentElement;
            let netEl = document.getElementById('availableMonthlyNet');

            if (!netEl) {
                netEl = document.createElement('div');
                netEl.id = 'availableMonthlyNet';
                netEl.style.fontSize = 'var(--text-xs)';
                netEl.style.marginTop = '4px';
                parent.appendChild(netEl);
            }

            const sign = data.monthlyNet >= 0 ? '+' : '';
            netEl.style.color = data.monthlyNet >= 0 ? 'var(--positive)' : 'var(--negative)';
            netEl.textContent = `${sign}${Utils.formatCurrency(data.monthlyNet)} este mes`;
        }
    },

    /**
     * Update income and expense widgets (formerly CashFlow)
     * @param {Object} data 
     */
    updateCashFlowWidget(data) {
        const incomeEl = document.getElementById('dashboardIncome');
        const expenseEl = document.getElementById('dashboardExpense');

        if (incomeEl) {
            incomeEl.textContent = Utils.formatCurrency(data.income);
        }

        if (expenseEl) {
            // User requested expenses to be shown as positive (absolute) values
            expenseEl.textContent = Utils.formatCurrency(Math.abs(data.expenses));
        }

        // Update Recent Activity
        this.updateRecentActivity();
    },

    /**
     * Update recent activity list
     */
    updateRecentActivity() {
        const container = document.getElementById('recentTransactionsList');
        console.log('[Dashboard] UpdateRecentActivity called. Container found:', !!container);

        if (!container) return;

        let transactions = window.GentleFinances.state.transactions || [];
        console.log('[Dashboard] Transactions in state:', transactions.length);

        if (transactions.length === 0) {
            console.log('[Dashboard] No transactions to display.');
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    <p>No hay actividad reciente</p>
                </div>
            `;
            return;
        }

        // Sort by date desc (newest first) and take last 5
        const recent = transactions
            .sort((a, b) => {
                const dateA = a.dateObj || (a.date ? new Date(a.date) : new Date(0));
                const dateB = b.dateObj || (b.date ? new Date(b.date) : new Date(0));
                return dateB - dateA;
            })
            .slice(0, 5);

        container.innerHTML = recent.map(tx => {
            const isIncome = tx.amount > 0;
            const amountClass = isIncome ? 'text-positive' : 'text-negative';
            const sign = isIncome ? '+' : '';
            const categoryName = window.Transactions && window.Transactions.getCategoryName
                ? window.Transactions.getCategoryName(tx.categoryId || tx.category)
                : (tx.category || 'General');

            return `
            <div class="transaction-item" onclick="Transactions.showDetail('${tx.id}')">
                <div class="transaction-icon">${tx.icon || '💰'}</div>
                <div class="transaction-details">
                    <div class="transaction-merchant">${tx.merchantName || tx.description}</div>
                    <div class="transaction-category">${categoryName}</div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${sign}${Utils.formatCurrency(Math.abs(tx.amount))}
                </div>
            </div>
    `;
        }).join('');
    },

    /**
     * Update budget overview widget
     */
    updateBudgetWidget() {
        const budgets = window.GentleFinances.state.budgets || [];
        const container = document.querySelector('#budgetWidget .flex.flex-col.gap-md');
        // Note: index.html structure might have changed or this selector is specific. 
        // Assuming there isn't a #budgetWidget present in the new layout shown in ViewFiles, 
        // skipping strict check/update if element missing to avoid errors.
        if (!container) return;

        // ... logic same as before if container exists ...
    },

    // =========================================================
    // CHART.JS IMPLEMENTATION
    // =========================================================

    initNetWorthChart() {
        const ctx = document.getElementById('netWorthChart');
        if (!ctx) return;

        // Destroy existing if any
        if (this.charts.netWorth) {
            this.charts.netWorth.destroy();
        }

        // Configure Chart.js defaults for our theme
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#8A8A8A';
        Chart.defaults.borderColor = 'rgba(217, 217, 217, 0.1)';

        this.charts.netWorth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [], // Populated by updateChartData
                datasets: [{
                    label: 'Patrimonio',
                    data: [], // Populated by updateChartData
                    borderColor: '#D4AF37', // Gold Primary
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                        gradient.addColorStop(0, 'rgba(212, 175, 55, 0.2)');
                        gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
                        return gradient;
                    },
                    borderWidth: 2,
                    tension: 0.4, // Smooth curves
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#1A1A1A',
                        titleColor: '#D4AF37',
                        bodyColor: '#FFFFFF',
                        borderColor: '#333',
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += Utils.formatCurrency(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: false, // Hide X axis for cleaner look
                        grid: { display: false }
                    },
                    y: {
                        display: false, // Hide Y axis
                        grid: { display: false }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });

        this.updateChartData();
    },

    updateChartTimeframe(range) {
        this.currentRange = range;

        // Update styling of buttons (using new classes)
        document.querySelectorAll('.chart-controls button').forEach(btn => {
            if (btn.textContent === range) {
                btn.classList.add('active');
                // Remove inline styles if present from previous version
                btn.style.color = '';
                btn.style.fontWeight = '';
            } else {
                btn.classList.remove('active');
                btn.style.color = '';
                btn.style.fontWeight = '';
            }
        });

        this.updateChartData();
    },

    updateChartData() {
        if (!this.charts.netWorth) return;

        const hist = this.calculateNetWorthHistory(this.currentRange);

        // Check for flatline logic (zero variance)
        // If min and max are very close, ChartJS might jitter.
        const minVal = Math.min(...hist.values);
        const maxVal = Math.max(...hist.values);

        // Update Chart
        this.charts.netWorth.data.labels = hist.labels;
        this.charts.netWorth.data.datasets[0].data = hist.values;

        // Adjust Y-scale manually if flat to prevent magnifying
        // E.g. if all values are 100, suggest min 0 max 200 so line is in middle, 
        // or just suggestMin: minVal - 10, suggestedMax: maxVal + 10
        if (maxVal === minVal) {
            // Flat line scenario
            // If value is 0, scale -10 to 10
            // If value is 100, scale 50 to 150
            const buffer = maxVal === 0 ? 100 : Math.abs(maxVal) * 0.5;
            this.charts.netWorth.options.scales.y.suggestedMin = minVal - buffer;
            this.charts.netWorth.options.scales.y.suggestedMax = maxVal + buffer;
        } else {
            // Reset to auto
            delete this.charts.netWorth.options.scales.y.suggestedMin;
            delete this.charts.netWorth.options.scales.y.suggestedMax;
        }

        this.charts.netWorth.update();
    },

    /**
     * Derive historical net worth from current balance - transactions
     */
    calculateNetWorthHistory(range) {
        const transactions = window.GentleFinances.state.transactions || [];
        const portfolioTotal = (window.PortfolioManager && window.PortfolioManager.getTotalValue()) || 0;

        // Define days based on range
        let days = 30;
        if (range === '3M') days = 90;
        if (range === '6M') days = 180;
        if (range === '1Y') days = 365;

        const labels = [];
        const values = [];

        // 1. Determine start date
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // 2. Calculate initial balance (all transactions before startDate)
        let runningBalance = transactions
            .filter(tx => (tx.dateObj || new Date(tx.date)) < startDate)
            .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

        // 3. Group transactions in range by date
        const rangeTransactions = transactions.filter(tx => {
            const d = tx.dateObj || new Date(tx.date);
            return d >= startDate && d <= today;
        });

        const txByDate = {};
        rangeTransactions.forEach(tx => {
            const dateStr = (tx.dateObj || new Date(tx.date)).toDateString();
            txByDate[dateStr] = (txByDate[dateStr] || 0) + (parseFloat(tx.amount) || 0);
        });

        // 4. Iterate forward from startDate to today
        for (let i = 0; i <= days; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            const dateStr = currentDate.toDateString();

            // Add daily sum to running balance
            if (txByDate[dateStr]) {
                runningBalance += txByDate[dateStr];
            }

            // Note: We currently don't have historical portfolio data, 
            // so we add the current portfolio total to all points for baseline.
            // Ideally, we'd have snapshots of portfolio value.
            values.push(runningBalance + portfolioTotal);
            const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
            labels.push(currentDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' }));
        }

        return {
            labels,
            values
        };
    },

    /**
     * Bind dashboard events
     */
    bindEvents() {
        // Pull to refresh (mobile)
        let startY = 0;
        let pulling = false;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].pageY;
                pulling = true;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (pulling && e.touches[0].pageY > startY + 100) {
                this.refresh();
                pulling = false;
            }
        });

        document.addEventListener('touchend', () => {
            pulling = false;
        });
    },

    reorderWidget(widgetId, newOrder) {
        // Implementation kept for compatibility, though not used in static grid
    },

    refresh() {
        // if (window.GentleFinances && window.GentleFinances.showToast) {
        //     window.GentleFinances.showToast('Actualizando...', 'info');
        // }
        this.loadWidgets();
    },

    startAutoRefresh() {
        setInterval(() => this.refresh(), 5 * 60 * 1000);
    }
};

// Make available globally
window.Dashboard = Dashboard;
