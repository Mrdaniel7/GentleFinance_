/**
 * Investments Page Controller
 * Handles stock search, charts, and market data display
 */

// State
let currentSymbol = null;
let priceChart = null;
let watchlist = [];

// Initialize on page load
window.initInvestments = async () => {
    await loadWatchlist();
    initSearch();
    loadMarketIndices();
    loadTopMovers();
    renderWatchlist();

    // Chart range buttons
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (currentSymbol) {
                loadPriceChart(currentSymbol, btn.dataset.range);
            }
        });
    });

    // Back button listener
    document.getElementById('investments-backBtn')?.addEventListener('click', closeStockDetail);
};

function closeStockDetail() {
    document.getElementById('investments-stockDetailCard').style.display = 'none';
    document.getElementById('investments-topMoversCard').style.display = 'block';

    // Show indices & watchlist
    const indicesCard = document.getElementById('investments-indicesList')?.closest('.card');
    if (indicesCard) indicesCard.style.display = 'block';

    const watchlistCard = document.getElementById('investments-watchlist')?.closest('.card');
    if (watchlistCard) watchlistCard.style.display = 'block';

    // Clear chart
    if (priceChart) {
        priceChart.destroy();
        priceChart = null;
    }
    currentSymbol = null;

    // Reset buttons
    document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.chart-btn[data-range="1mo"]')?.classList.add('active');
}

async function loadWatchlist() {
    try {
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.log('Firebase not available, using local watchlist');
            const saved = localStorage.getItem('gf_watchlist');
            if (saved) watchlist = JSON.parse(saved);
            return;
        }
        const user = firebase.auth().currentUser;
        if (user && window.FirestoreService?.users) {
            const userData = await window.FirestoreService.users.get(user.uid);
            if (userData && userData.watchlist) {
                watchlist = userData.watchlist;
            }
        }
    } catch (e) {
        console.error('Error loading watchlist:', e);
    }
}

async function saveWatchlist() {
    try {
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.auth) {
            localStorage.setItem('gf_watchlist', JSON.stringify(watchlist));
            return;
        }
        const user = firebase.auth().currentUser;
        if (user && window.FirestoreService?.users) {
            await window.FirestoreService.users.update(user.uid, { watchlist });
        }
    } catch (e) {
        console.error('Error saving watchlist:', e);
    }
}

// ... (search code logic remains similar)

function toggleWatchlist(symbol) {
    const index = watchlist.indexOf(symbol);
    if (index === -1) {
        watchlist.push(symbol);
        showToast(`${symbol} añadido a seguimiento`);
    } else {
        watchlist.splice(index, 1);
        showToast(`${symbol} eliminado de seguimiento`);
    }
    saveWatchlist();
    renderWatchlist();
    updateWatchlistButton(symbol);
}

// =============================================================================
// SEARCH
// =============================================================================

function initSearch() {
    const searchInput = document.getElementById('investments-stockSearch');
    const searchResults = document.getElementById('investments-searchResults');
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
                const { results } = await GentleFinancesAPI.investments.search(query);
                renderSearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300);
    });

    // Close search on click outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

function renderSearchResults(results) {
    const container = document.getElementById('investments-searchResults');

    if (results.length === 0) {
        container.innerHTML = '<div class="search-result-item text-muted">No se encontraron resultados</div>';
        container.classList.add('active');
        return;
    }

    container.innerHTML = results.map(stock => `
        <div class="search-result-item" data-symbol="${stock.symbol}">
            <div class="flex justify-between">
                <div>
                    <strong>${stock.symbol}</strong>
                    <span class="text-muted">- ${stock.name}</span>
                </div>
                <span class="text-muted" style="font-size: var(--text-xs);">${stock.type}</span>
            </div>
        </div>
    `).join('');

    container.classList.add('active');

    // Add click handlers
    container.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            loadStock(item.dataset.symbol);
            container.classList.remove('active');
            document.getElementById('investments-stockSearch').value = '';
        });
    });
}

// =============================================================================
// STOCK DETAILS
// =============================================================================

async function loadStock(symbol) {
    currentSymbol = symbol;

    try {
        // Show loading state
        const detailCard = document.getElementById('investments-stockDetailCard');
        if (detailCard) detailCard.style.display = 'block';

        // Hide other main sections
        document.getElementById('investments-topMoversCard').style.display = 'none';

        const indicesCard = document.getElementById('investments-indicesList')?.closest('.card');
        if (indicesCard) indicesCard.style.display = 'none';

        const watchlistCard = document.getElementById('investments-watchlist')?.closest('.card');
        if (watchlistCard) watchlistCard.style.display = 'none';

        // Load quote and fundamentals
        const [quote, fundamentals] = await Promise.all([
            GentleFinancesAPI.investments.getQuote(symbol),
            GentleFinancesAPI.investments.getFundamentals(symbol).catch(() => null)
        ]);

        // Check if price data is available
        if (quote.price === null || quote.error) {
            document.getElementById('investments-stockName').textContent = quote.name || symbol;
            document.getElementById('investments-stockSymbol').textContent = symbol;
            document.getElementById('investments-stockPrice').textContent = 'N/A';
            document.getElementById('investments-stockChangeText').textContent = quote.error || 'Sin datos';
            document.getElementById('investments-stockChange').className = 'stock-change';

            // Clear fundamentals
            const fundGrid = document.getElementById('investments-fundamentalsGrid');
            if (fundGrid) {
                fundGrid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: var(--space-lg);">
                        <div class="empty-state-icon">📉</div>
                        <p class="text-muted">Datos de bolsa no disponibles</p>
                        <p class="text-muted" style="font-size: var(--text-xs);">Se requiere API key o servidor backend</p>
                    </div>
                `;
            }

            // Clear chart
            const chartContainer = document.getElementById('investments-priceChart');
            if (chartContainer) {
                const ctx = chartContainer.getContext('2d');
                if (priceChart) priceChart.destroy();
                ctx.clearRect(0, 0, chartContainer.width, chartContainer.height);
            }
            return;
        }

        // Update UI with real data
        document.getElementById('investments-stockName').textContent = quote.name || symbol;
        document.getElementById('investments-stockSymbol').textContent = `${quote.exchange || ''}: ${quote.symbol}`.trim();
        document.getElementById('investments-stockPrice').textContent = formatCurrency(quote.price, quote.currency);

        const changeText = `${quote.change >= 0 ? '+' : ''}${quote.change?.toFixed(2) || '0.00'} (${quote.changePercent?.toFixed(2) || '0.00'}%)`;
        document.getElementById('investments-stockChangeText').textContent = changeText;

        const changeEl = document.getElementById('investments-stockChange');
        changeEl.className = `stock-change ${quote.change >= 0 ? 'positive' : 'negative'}`;

        // Load fundamentals
        if (fundamentals && !fundamentals.error) {
            renderFundamentals(fundamentals, quote);
        }

        // Load chart
        loadPriceChart(symbol, '1mo');

    } catch (error) {
        console.error('Error loading stock:', error);
        showToast('Error al cargar datos de ' + symbol, 'error');
    }
}

function renderFundamentals(data, quote) {
    const items = [
        { label: 'Cap. Mercado', value: formatLargeNumber(data.marketCap || quote.marketCap) },
        { label: 'P/E Ratio', value: data.trailingPE?.toFixed(2) || 'N/A' },
        { label: 'EPS', value: data.profitMargin ? `${(data.profitMargin * 100).toFixed(1)}%` : 'N/A' },
        { label: 'Dividendo', value: data.dividendYield ? `${(data.dividendYield * 100).toFixed(2)}%` : 'N/A' },
        { label: 'Máx. 52 sem', value: formatCurrency(quote.fiftyTwoWeekHigh, quote.currency) },
        { label: 'Mín. 52 sem', value: formatCurrency(quote.fiftyTwoWeekLow, quote.currency) },
        { label: 'Volumen', value: formatLargeNumber(quote.volume) },
        { label: 'Beta', value: data.beta?.toFixed(2) || 'N/A' }
    ];

    document.getElementById('investments-fundamentalsGrid').innerHTML = items.map(item => `
        <div class="fundamental-item">
            <div class="fundamental-label">${item.label}</div>
            <div class="fundamental-value">${item.value}</div>
        </div>
    `).join('');
}

// =============================================================================
// PRICE CHART
// =============================================================================

async function loadPriceChart(symbol, range) {
    try {
        console.log('📊 Loading chart for:', symbol, 'range:', range);
        const data = await GentleFinancesAPI.investments.getHistory(symbol, range);
        console.log('📊 Chart data received:', data);

        // Validar datos
        if (!data || !data.prices || data.prices.length === 0) {
            console.error('📊 No chart data available');
            return;
        }

        // Prepare data for chart
        const labels = data.prices.map(p => {
            const date = new Date(p.date);
            if (range === '1d' || range === '5d') {
                const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
                return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
            }
            const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
            return date.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
        });

        const prices = data.prices.map(p => p.close);
        console.log('📊 Prices:', prices.slice(0, 5), '... total:', prices.length);

        // Validar que hay precios válidos
        if (prices.every(p => p === 0 || isNaN(p))) {
            console.error('📊 All prices are zero or NaN');
            return;
        }

        // Destroy previous chart
        if (priceChart) {
            priceChart.destroy();
        }

        // Create chart
        const canvas = document.getElementById('investments-priceChart');
        if (!canvas) {
            console.error('📊 Canvas not found');
            return;
        }
        const ctx = canvas.getContext('2d');
        const isPositive = prices[prices.length - 1] >= prices[0];

        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: prices,
                    borderColor: isPositive ? '#4ade80' : '#f87171',
                    backgroundColor: (context) => {
                        const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 350);
                        gradient.addColorStop(0, isPositive ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)');
                        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
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
                        borderColor: '#3D3D3D',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (ctx) => formatCurrency(ctx.raw, data.currency)
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(61, 61, 61, 0.3)' },
                        ticks: { color: '#7A7A7A', maxTicksLimit: 8 }
                    },
                    y: {
                        grid: { color: 'rgba(61, 61, 61, 0.3)' },
                        ticks: {
                            color: '#7A7A7A',
                            callback: (value) => formatCurrency(value, data.currency)
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

    } catch (error) {
        console.error('Error loading chart:', error);
    }
}

// =============================================================================
// MARKET INDICES
// =============================================================================

async function loadMarketIndices() {
    try {
        const { indices, message } = await GentleFinancesAPI.investments.getIndices();

        const container = document.getElementById('investments-indicesList');
        if (!container) return;

        if (!indices || indices.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: var(--space-lg); text-align: center;">
                    <div class="empty-state-icon">📊</div>
                    <p class="text-muted">${message || 'Datos de índices no disponibles'}</p>
                    <p class="text-muted" style="font-size: var(--text-xs);">Se requiere API key para datos en tiempo real</p>
                </div>
            `;
            return;
        }

        container.innerHTML = indices.map(idx => `
            <div class="index-item">
                <div>
                    <div style="font-weight: var(--font-medium);">${idx.name}</div>
                    <div class="text-muted" style="font-size: var(--text-xs);">${idx.symbol}</div>
                </div>
                <div style="text-align: right;">
                    <div>${formatNumber(idx.value)}</div>
                    <div class="${idx.change >= 0 ? 'text-positive' : 'text-negative'}" style="font-size: var(--text-sm);">
                        ${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent?.toFixed(2)}%
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading indices:', error);
        document.getElementById('investments-indicesList').innerHTML = '<div class="text-muted">Error al cargar índices</div>';
    }
}

// =============================================================================
// TOP MOVERS
// =============================================================================

async function loadTopMovers() {
    try {
        const data = await GentleFinancesAPI.investments.getMovers();

        const gainersEl = document.getElementById('investments-topGainers');
        const losersEl = document.getElementById('investments-topLosers');

        const emptyMessage = `
            <div class="empty-state" style="padding: var(--space-md); text-align: center;">
                <p class="text-muted" style="font-size: var(--text-sm);">
                    ${data.message || 'Sin datos disponibles'}
                </p>
            </div>
        `;

        if (gainersEl) {
            if (!data.gainers || data.gainers.length === 0) {
                gainersEl.innerHTML = emptyMessage;
            } else {
                gainersEl.innerHTML = data.gainers.slice(0, 5).map(stock => `
                    <div class="watchlist-item" onclick="loadStock('${stock.symbol}')">
                        <div>
                            <div style="font-weight: var(--font-medium);">${stock.symbol}</div>
                            <div class="text-muted" style="font-size: var(--text-xs);">${formatCurrency(stock.price, stock.currency)}</div>
                        </div>
                        <div class="text-positive">+${stock.changePercent?.toFixed(2)}%</div>
                    </div>
                `).join('');
            }
        }

        if (losersEl) {
            if (!data.losers || data.losers.length === 0) {
                losersEl.innerHTML = emptyMessage;
            } else {
                losersEl.innerHTML = data.losers.slice(0, 5).map(stock => `
                    <div class="watchlist-item" onclick="loadStock('${stock.symbol}')">
                        <div>
                            <div style="font-weight: var(--font-medium);">${stock.symbol}</div>
                            <div class="text-muted" style="font-size: var(--text-xs);">${formatCurrency(stock.price, stock.currency)}</div>
                        </div>
                        <div class="text-negative">${stock.changePercent?.toFixed(2)}%</div>
                    </div>
                `).join('');
            }
        }

    } catch (error) {
        console.error('Error loading movers:', error);
    }
}

// =============================================================================
// WATCHLIST
// =============================================================================

function renderWatchlist() {
    const container = document.getElementById('investments-watchlist');

    if (watchlist.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⭐</div>
                <p>Busca y añade activos a tu watchlist</p>
            </div>
        `;
        return;
    }

    container.innerHTML = watchlist.map(symbol => `
        <div class="watchlist-item" onclick="loadStock('${symbol}')">
            <span style="font-weight: var(--font-medium);">${symbol}</span>
            <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); removeFromWatchlist('${symbol}')">✕</button>
        </div>
    `).join('');
}

function addToWatchlist(symbol) {
    if (!watchlist.includes(symbol)) {
        watchlist.push(symbol);
        localStorage.setItem('gf_watchlist', JSON.stringify(watchlist));
        renderWatchlist();
        showToast(`${symbol} añadido a watchlist`);
    }
}

function removeFromWatchlist(symbol) {
    watchlist = watchlist.filter(s => s !== symbol);
    localStorage.setItem('gf_watchlist', JSON.stringify(watchlist));
    renderWatchlist();
}

// =============================================================================
// UTILITIES
// =============================================================================

function formatCurrency(value, currency) {
    if (value === null || value === undefined) return 'N/A';
    return Utils.formatCurrency(value, currency);
}

function formatNumber(value) {
    if (value === null || value === undefined) return 'N/A';
    const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
    return value.toLocaleString(locale, { maximumFractionDigits: 2 });
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
    const container = document.getElementById('toastContainer') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// =============================================================================
// PORTFOLIO INTEGRATION
// =============================================================================

async function investInStock() {
    if (!currentSymbol) {
        showToast('Selecciona una acción primero', 'error');
        return;
    }

    try {
        const quote = await GentleFinancesAPI.investments.getQuote(currentSymbol);
        const isIndex = currentSymbol.startsWith('^');

        // Usar modal personalizado en lugar de prompt()
        GFModal.showInvestModal({
            name: quote.name || currentSymbol,
            symbol: currentSymbol,
            price: quote.price,
            currency: quote.currency || 'EUR',
            icon: isIndex ? '📊' : '📈'
        }, (result) => {
            const investment = PortfolioManager.addInvestment({
                type: isIndex ? 'index' : 'stock',
                symbol: currentSymbol,
                name: quote.name || currentSymbol,
                quantity: result.quantity,
                price: quote.price,
                currency: quote.currency || 'EUR'
            });

            const total = result.investedAmount;
            showToast(`✅ Añadido ${result.quantity.toFixed(2)}x ${currentSymbol} (${formatCurrency(total, quote.currency)}) a tu portfolio`, 'success');
        });

    } catch (error) {
        console.error('Error investing:', error);
        showToast('Error al añadir inversión', 'error');
    }
}
