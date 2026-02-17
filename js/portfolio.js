/**
 * Portfolio Manager
 * Handles logic for Investments (Stocks, Crypto, Real Estate)
 * Integrates with Firestore for persistence
 */

const PortfolioManager = {
    investments: [],

    // Initialize: Load data from Firestore
    async init() {
        console.log('💼 Initializing Portfolio Manager...');
        try {
            if (!window.FirestoreService?.portfolio?.get) {
                console.warn('💼 FirestoreService.portfolio not available, using empty data.');
                this.investments = [];
                this.isInitialized = true;
                this.updateUI();
                return;
            }
            const data = await window.FirestoreService.portfolio.get();
            if (data && data.investments) {
                this.investments = data.investments;
            } else {
                this.investments = [];
            }
            console.log(`💼 Loaded ${this.investments.length} investments`);
            this.updateUI();
        } catch (error) {
            console.error('Error initializing portfolio:', error);
        }
    },

    // Add a new investment
    async addInvestment(investment) {
        // Validation
        if (!investment.type || !investment.quantity || !investment.price) {
            console.error('Invalid investment data', investment);
            return;
        }

        // Add timestamp and ID
        const newInvestment = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            ...investment
        };

        this.investments.push(newInvestment);

        // Save to Firestore
        await this.save();

        // Update UI
        this.updateUI();

        // Trigger Dashboard Refresh if available
        if (window.GentleFinances && window.GentleFinances.refreshDashboard) {
            window.GentleFinances.refreshDashboard();
        }

        return newInvestment;
    },

    // Remove an investment
    async removeInvestment(id) {
        this.investments = this.investments.filter(item => item.id !== id);
        await this.save();
        this.updateUI();

        if (window.GentleFinances && window.GentleFinances.refreshDashboard) {
            window.GentleFinances.refreshDashboard();
        }
    },

    // Save current state to Firestore
    async save() {
        try {
            await window.FirestoreService.portfolio.save({
                investments: this.investments,
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error saving portfolio:', error);
            if (window.showToast) window.showToast('Error al guardar portfolio', 'error');
        }
    },

    // Calculate Total Value (Current Price * Quantity)
    // Note: In a real app, we would fetch real-time prices here.
    // For now, we use the purchase price or update it manually.
    getTotalValue() {
        return this.investments.reduce((total, item) => {
            const currentPrice = parseFloat(item.currentPrice) || parseFloat(item.price) || 0;
            return total + (currentPrice * (parseFloat(item.quantity) || 0));
        }, 0);
    },

    // Get investments by type
    getByType(type) {
        return this.investments.filter(item => item.type === type);
    },

    // Update UI elements related to Portfolio
    updateUI() {
        this.renderSummary();
        this.renderPositions();
        this.renderOverviewChart();

        // Also update dashboard list if it exists
        const dashboardList = document.getElementById('portfolio-assetsList');
        if (dashboardList) {
            this.renderList(dashboardList);
        }
    },

    renderSummary() {
        const totalInvested = this.investments.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // For now, assuming current value = invested value until we have real-time price updates
        // In a real app, successful API calls would update 'currentPrice' in the investment objects
        const currentValue = this.investments.reduce((sum, item) => {
            const price = item.currentPrice || item.price; // Fallback to buy price
            return sum + (price * item.quantity);
        }, 0);

        const totalProfit = currentValue - totalInvested;
        const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

        // Elements
        const elValue = document.getElementById('portfolio-totalValue');
        const elInvested = document.getElementById('portfolio-totalInvested');
        const elProfit = document.getElementById('portfolio-totalProfit');
        const elChange = document.getElementById('portfolio-totalChange');

        if (elValue) elValue.textContent = Utils.formatCurrency(currentValue);
        if (elInvested) elInvested.textContent = Utils.formatCurrency(totalInvested);

        if (elProfit) {
            elProfit.textContent = `${totalProfit >= 0 ? '+' : ''}${Utils.formatCurrency(totalProfit)}`;
            elProfit.className = `font-semibold ${totalProfit >= 0 ? 'text-positive' : 'text-negative'}`;
        }

        if (elChange) {
            elChange.innerHTML = `
                <span class="${totalProfit >= 0 ? 'text-positive' : 'text-negative'}">
                    ${totalProfit >= 0 ? '▲' : '▼'} ${Math.abs(profitPercent).toFixed(2)}%
                </span>
                <span class="text-muted text-sm ml-xs">Global</span>
            `;
        }
    },

    renderPositions() {
        const grid = document.getElementById('portfolio-positionsGrid');
        const emptyState = document.getElementById('portfolio-emptyState');

        if (!grid || !emptyState) return;

        if (this.investments.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        grid.innerHTML = this.investments.map(item => {
            const currentPrice = item.currentPrice || item.price;
            const totalVal = currentPrice * item.quantity;
            const profit = (currentPrice - item.price) * item.quantity;
            const profitP = item.price > 0 ? (profit / (item.price * item.quantity)) * 100 : 0;

            return `
            <div class="card p-md">
                <div class="flex justify-between items-start mb-md">
                    <div class="flex items-center gap-sm">
                        <div class="text-2xl">${this.getIconForType(item.type)}</div>
                        <div>
                            <div class="font-bold">${item.name}</div>
                            <div class="text-xs text-muted upper">${item.type} • ${item.symbol}</div>
                        </div>
                    </div>
                    <button class="btn btn-icon btn-ghost btn-sm text-negative" 
                        onclick="PortfolioManager.removeInvestment('${item.id}')">✕</button>
                </div>
                
                <div class="flex justify-between items-end">
                    <div>
                        <div class="text-xs text-muted">Cantidad</div>
                        <div class="font-mono">${item.quantity}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-lg">${Utils.formatCurrency(totalVal)}</div>
                        <div class="text-xs ${profit >= 0 ? 'text-positive' : 'text-negative'}">
                            ${profit >= 0 ? '+' : ''}${profitP.toFixed(2)}%
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    },

    renderOverviewChart() {
        const ctx = document.getElementById('portfolio-distributionChart');
        if (!ctx) return;

        // Prepare data
        const totals = {
            stocks: 0,
            crypto: 0,
            realestate: 0,
            index: 0
        };

        this.investments.forEach(item => {
            const val = (item.currentPrice || item.price) * item.quantity;
            let type = item.type;
            if (type === 'stock') type = 'stocks'; // Normalize
            if (totals[type] !== undefined) totals[type] += val;
        });

        // Check if Chart exists
        if (window.portfolioChart instanceof Chart) {
            window.portfolioChart.destroy();
        }

        const dataValues = [totals.stocks, totals.crypto, totals.realestate, totals.index];
        const totalVal = dataValues.reduce((a, b) => a + b, 0);

        if (totalVal === 0) {
            // Empty chart
            if (window.Chart) {
                window.portfolioChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Sin datos'],
                        datasets: [{ data: [1], backgroundColor: ['#333'] }]
                    },
                    options: { cutout: '70%', plugins: { legend: { display: false } } }
                });
            }
            return;
        }

        if (window.Chart) {
            window.portfolioChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Acciones', 'Crypto', 'Inmobiliario', 'Índices'],
                    datasets: [{
                        data: dataValues,
                        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#6366f1'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#888' } }
                    }
                }
            });
        }
    },

    renderList(container) {
        if (this.investments.length === 0) {
            container.innerHTML = '<div class="text-muted text-center p-4">No tienes inversiones aún</div>';
            return;
        }

        container.innerHTML = this.investments.map(item => `
            <div class="transaction-item">
                <div class="transaction-icon">
                    ${this.getIconForType(item.type)}
                </div>
                <div class="transaction-details">
                    <div class="transaction-merchant">${item.name}</div>
                    <div class="transaction-category">${item.quantity} ${item.symbol || 'Unidades'}</div>
                </div>
                <div class="transaction-amount income">
                    ${Utils.formatCurrency((item.currentPrice || item.price) * item.quantity)}
                </div>
                <button class="btn btn-icon btn-ghost btn-sm" onclick="PortfolioManager.removeInvestment('${item.id}')" style="margin-left: 8px;">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `).join('');
    },

    getIconForType(type) {
        switch (type) {
            case 'crypto': return '₿';
            case 'stock': return '📈';
            case 'realestate': return '🏠';
            case 'index': return '📊';
            default: return '💰';
        }
    }
};

// Make globally available
window.PortfolioManager = PortfolioManager;
window.Portfolio = PortfolioManager;
