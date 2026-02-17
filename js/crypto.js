/**
 * Crypto Page Controller
 * Handles cryptocurrency data display, search, and charts
 */

const CryptoView = {
    coinChart: null,
    currentCoinId: null,

    init() {
        this.loadGlobalStats();
        this.loadTop100();
        this.loadTrending();
        this.initSearch();
        this.initChartControls();
    },

    // =============================================================================
    // GLOBAL STATS
    // =============================================================================

    async loadGlobalStats() {
        try {
            const data = await GentleFinancesAPI.crypto.getGlobal();

            const sym = window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€';
            document.getElementById('crypto-totalMarketCap').textContent = formatLargeNumber(data.totalMarketCap) + ' ' + sym;
            document.getElementById('crypto-totalVolume').textContent = formatLargeNumber(data.totalVolume24h) + ' ' + sym;
            document.getElementById('crypto-btcDominance').textContent = data.btcDominance.toFixed(1) + '%';

            const changeEl = document.getElementById('crypto-marketChange');
            changeEl.textContent = `${data.marketCapChange24h >= 0 ? '+' : ''}${data.marketCapChange24h?.toFixed(2)}%`;
            changeEl.className = `global-stat-value ${data.marketCapChange24h >= 0 ? 'text-positive' : 'text-negative'}`;

        } catch (error) {
            console.error('Error loading global stats:', error);
        }
    },

    // =============================================================================
    // TOP 100 TABLE
    // =============================================================================

    async loadTop100() {
        try {
            const { coins } = await GentleFinancesAPI.crypto.getTop100();

            const tbody = document.getElementById('crypto-tableBody');
            tbody.innerHTML = coins.map(coin => `
                <tr class="crypto-row" onclick="CryptoView.openCoinModal('${coin.id}')">
                    <td>${coin.marketCapRank}</td>
                    <td>
                        <div class="crypto-name">
                            <img src="${coin.image}" alt="${coin.name}" class="crypto-icon">
                            <div>
                                <div style="font-weight: var(--font-medium);">${coin.name}</div>
                                <div class="crypto-symbol">${coin.symbol}</div>
                            </div>
                        </div>
                    </td>
                    <td style="font-family: monospace;">${formatCurrency(coin.currentPrice)}</td>
                    <td class="${coin.priceChange24h >= 0 ? 'text-positive' : 'text-negative'}">
                        ${coin.priceChange24h >= 0 ? '+' : ''}${coin.priceChange24h?.toFixed(2)}%
                    </td>
                    <td class="${coin.priceChange7d >= 0 ? 'text-positive' : 'text-negative'}">
                        ${coin.priceChange7d >= 0 ? '+' : ''}${coin.priceChange7d?.toFixed(2)}%
                    </td>
                    <td>${formatLargeNumber(coin.marketCap)} ${window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€'}</td>
                    <td>
                        <canvas class="sparkline" id="spark-${coin.id}" width="100" height="30"></canvas>
                    </td>
                    <td class="text-right">
                        <button class="btn btn-icon btn-ghost" onclick="event.stopPropagation(); CryptoView.openInvestModal('${coin.id}')" title="Añadir a Portfolio">
                            <span style="font-size: 1.2rem; color: var(--gold-primary);">⊕</span>
                        </button>
                    </td>
                </tr>
            `).join('');

            // Draw sparklines
            coins.forEach(coin => {
                if (coin.sparkline && coin.sparkline.length > 0) {
                    this.drawSparkline(`spark-${coin.id}`, coin.sparkline, coin.priceChange7d >= 0);
                }
            });

        } catch (error) {
            console.error('Error loading top 100:', error);
            const tbody = document.getElementById('crypto-tableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-negative">Error al cargar datos</td></tr>';
        }
    },

    drawSparkline(canvasId, data, isPositive) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Normalize data
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        const points = data.map((value, index) => ({
            x: (index / (data.length - 1)) * width,
            y: height - ((value - min) / range) * (height - 4) - 2
        }));

        // Draw line
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.strokeStyle = isPositive ? '#4ade80' : '#f87171';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    },

    // =============================================================================
    // TRENDING
    // =============================================================================

    async loadTrending() {
        try {
            const { trending } = await GentleFinancesAPI.crypto.getTrending();

            document.getElementById('crypto-trendingList').innerHTML = trending.map((coin, index) => `
                <div class="trending-item" onclick="CryptoView.openCoinModal('${coin.id}')">
                    <span class="text-muted">${index + 1}</span>
                    <img src="${coin.thumb}" alt="${coin.name}" style="width: 24px; height: 24px; border-radius: 50%;">
                    <div style="flex: 1;">
                        <div style="font-weight: var(--font-medium);">${coin.name}</div>
                        <div class="crypto-symbol">${coin.symbol}</div>
                    </div>
                    ${coin.marketCapRank ? `<span class="text-muted">#${coin.marketCapRank}</span>` : ''}
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading trending:', error);
            const list = document.getElementById('crypto-trendingList');
            if (list) list.innerHTML = '<div class="text-muted text-center">Error al cargar</div>';
        }
    },

    // =============================================================================
    // SEARCH
    // =============================================================================

    initSearch() {
        const searchInput = document.getElementById('crypto-search');
        const searchResults = document.getElementById('crypto-searchResults');
        let debounceTimer;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

            if (query.length < 2) {
                searchResults.classList.remove('active');
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const { results } = await GentleFinancesAPI.crypto.search(query);
                    this.renderSearchResults(results);
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.remove('active');
            }
        });
    },

    renderSearchResults(results) {
        const container = document.getElementById('crypto-searchResults');

        if (results.length === 0) {
            container.innerHTML = '<div class="search-result-item text-muted">No se encontraron resultados</div>';
            container.classList.add('active');
            return;
        }

        container.innerHTML = results.map(coin => `
            <div class="search-result-item" data-id="${coin.id}">
                <div class="flex items-center gap-sm">
                    <img src="${coin.thumb}" alt="" style="width: 20px; height: 20px; border-radius: 50%;">
                    <strong>${coin.symbol}</strong>
                    <span class="text-muted">- ${coin.name}</span>
                </div>
            </div>
        `).join('');

        container.classList.add('active');

        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openCoinModal(item.dataset.id);
                container.classList.remove('active');
                document.getElementById('crypto-search').value = '';
            });
        });
    },

    // =============================================================================
    // COIN MODAL
    // =============================================================================

    async openCoinModal(coinId) {
        this.currentCoinId = coinId;
        const modal = document.getElementById('crypto-coinModal');

        try {
            const coin = await GentleFinancesAPI.crypto.getCoin(coinId);

            document.getElementById('crypto-modalCoinIcon').src = coin.image;
            document.getElementById('crypto-modalCoinName').textContent = coin.name;
            document.getElementById('crypto-modalCoinSymbol').textContent = coin.symbol;
            document.getElementById('crypto-modalPrice').textContent = formatCurrency(coin.prices.eur);

            const changeEl = document.getElementById('crypto-modalChange');
            changeEl.textContent = `${coin.priceChangePercent24h >= 0 ? '+' : ''}${coin.priceChangePercent24h?.toFixed(2)}%`;
            changeEl.className = coin.priceChangePercent24h >= 0 ? 'text-positive' : 'text-negative';

            // Stats
            document.getElementById('crypto-coinStats').innerHTML = `
                <div class="fundamental-item">
                    <div class="fundamental-label">Market Cap</div>
                    <div class="fundamental-value">${formatLargeNumber(coin.marketCap)} ${window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€'}</div>
                </div>
                <div class="fundamental-item">
                    <div class="fundamental-label">Volumen 24h</div>
                    <div class="fundamental-value">${formatLargeNumber(coin.volume24h)} ${window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€'}</div>
                </div>
                <div class="fundamental-item">
                    <div class="fundamental-label">Cambio 7d</div>
                    <div class="fundamental-value ${coin.priceChangePercent7d >= 0 ? 'text-positive' : 'text-negative'}">
                        ${coin.priceChangePercent7d?.toFixed(2)}%
                    </div>
                </div>
                <div class="fundamental-item">
                    <div class="fundamental-label">Cambio 30d</div>
                    <div class="fundamental-value ${coin.priceChangePercent30d >= 0 ? 'text-positive' : 'text-negative'}">
                        ${coin.priceChangePercent30d?.toFixed(2)}%
                    </div>
                </div>
                <div class="fundamental-item">
                    <div class="fundamental-label">ATH</div>
                    <div class="fundamental-value">${formatCurrency(coin.ath.eur)}</div>
                </div>
                <div class="fundamental-item">
                    <div class="fundamental-label">Desde ATH</div>
                    <div class="fundamental-value text-negative">${coin.ath.changePercent?.toFixed(1)}%</div>
                </div>
                <div class="fundamental-item">
                    <div class="fundamental-label">Supply Circulante</div>
                    <div class="fundamental-value">${formatLargeNumber(coin.circulatingSupply)}</div>
                </div>
                <div class="fundamental-item">
                    <div class="fundamental-label">Max Supply</div>
                    <div class="fundamental-value">${coin.maxSupply ? formatLargeNumber(coin.maxSupply) : '∞'}</div>
                </div>
            `;

            modal.classList.add('active');
            this.loadCoinChart(coinId, 7);

        } catch (error) {
            console.error('Error loading coin:', error);
            showToast('Error al cargar datos', 'error');
        }
    },

    closeModal() {
        document.getElementById('crypto-coinModal').classList.remove('active');
        this.currentCoinId = null;
    },

    initChartControls() {
        // Usar event delegation para que funcione aunque el modal no exista aún
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('chart-btn') && e.target.closest('#crypto-coinModal')) {
                const btn = e.target;
                const modal = document.getElementById('crypto-coinModal');
                modal.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (this.currentCoinId) {
                    this.loadCoinChart(this.currentCoinId, parseInt(btn.dataset.days));
                }
            }
        });

        // Close modal on background click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'crypto-coinModal') this.closeModal();
        });
    },

    async loadCoinChart(coinId, days) {
        try {
            const data = await GentleFinancesAPI.crypto.getHistory(coinId, days);

            const labels = data.prices.map(p => {
                const date = new Date(p.date);
                if (days <= 1) {
                    const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
                    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
                }
                const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
                return date.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
            });

            const prices = data.prices.map(p => p.price);

            if (this.coinChart) {
                this.coinChart.destroy();
            }

            const ctx = document.getElementById('crypto-coinChart').getContext('2d');
            const isPositive = prices[prices.length - 1] >= prices[0];

            this.coinChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        data: prices,
                        borderColor: isPositive ? '#4ade80' : '#f87171',
                        backgroundColor: (context) => {
                            const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
                            gradient.addColorStop(0, isPositive ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)');
                            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                            return gradient;
                        },
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(26, 26, 26, 0.95)',
                            titleColor: '#C5A058',
                            bodyColor: '#F0EDE5',
                            displayColors: false,
                            callbacks: {
                                label: (ctx) => formatCurrency(ctx.raw)
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(61, 61, 61, 0.3)' },
                            ticks: { color: '#7A7A7A', maxTicksLimit: 6 }
                        },
                        y: {
                            grid: { color: 'rgba(61, 61, 61, 0.3)' },
                            ticks: {
                                color: '#7A7A7A',
                                callback: (value) => formatCurrency(value)
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error loading chart:', error);
        }
    },



    openInvestModal(coinId) {
        this.currentCoinId = coinId;
        this.investInCrypto();
    },

    async investInCrypto() {
        if (!this.currentCoinId) {
            showToast('Selecciona una crypto primero', 'error');
            return;
        }

        try {
            const coin = await GentleFinancesAPI.crypto.getCoin(this.currentCoinId);

            // Usar modal personalizado en lugar de prompt()
            GFModal.showInvestModal({
                name: coin.name,
                symbol: coin.symbol.toUpperCase(),
                price: coin.prices.eur,
                currency: 'EUR',
                image: coin.image
            }, (result) => {
                // Callback cuando el usuario confirma
                const investment = PortfolioManager.addInvestment({
                    type: 'crypto',
                    symbol: coin.id,
                    name: coin.name,
                    quantity: result.quantity,
                    price: coin.prices.eur,
                    currency: 'EUR',
                    image: coin.image
                });

                const total = result.investedAmount;
                showToast(`✅ ${result.quantity.toFixed(6)} ${coin.symbol.toUpperCase()} (${Utils.formatCurrency(total)})`, 'success');
                this.closeModal();
            });

        } catch (error) {
            console.error('Error investing:', error);
            showToast('Error al añadir inversión', 'error');
        }
    }
};

window.investInCrypto = () => CryptoView.investInCrypto();
window.openCoinModal = (id) => CryptoView.openCoinModal(id);
window.closeModal = () => CryptoView.closeModal();

// =============================================================================
// UTILITIES
// =============================================================================

function formatCurrency(value) {
    if (value === null || value === undefined) return 'N/A';
    const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
    const curr = window.Settings?.preferences?.currency || 'EUR';

    if (value >= 1) {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: curr, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    } else if (value >= 0.01) {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: curr, minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
    } else {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: curr, minimumFractionDigits: 6, maximumFractionDigits: 8 }).format(value);
    }
}

function formatLargeNumber(value) {
    if (!value) return 'N/A';
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(2);
}

function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Export to window for Navigation.js to access
window.CryptoView = CryptoView;
