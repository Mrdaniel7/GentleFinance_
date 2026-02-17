/**
 * GentleFinances API Service - STANDALONE VERSION
 * Llamadas directas a APIs públicas sin necesidad de servidor backend
 * Funciona completamente en APK/PWA sin servidor
 * Updated: 2026-02-16T15:52:00
 */
console.log('✅ GentleFinances API loaded at ' + new Date().toISOString());

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// =============================================================================
// CRYPTO API (CoinGecko - permite CORS directo)
// =============================================================================

const CryptoAPI = {
    // Get top 100 cryptocurrencies
    getTop100: async (page = 1, perPage = 100) => {
        try {
            const response = await fetch(
                `${COINGECKO_API}/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=24h,7d`
            );
            const data = await response.json();

            return {
                coins: data.map(coin => ({
                    id: coin.id,
                    name: coin.name,
                    symbol: coin.symbol.toUpperCase(),
                    image: coin.image,
                    currentPrice: coin.current_price,
                    marketCap: coin.market_cap,
                    marketCapRank: coin.market_cap_rank,
                    priceChange24h: coin.price_change_percentage_24h,
                    priceChange7d: coin.price_change_percentage_7d_in_currency,
                    volume24h: coin.total_volume,
                    sparkline: coin.sparkline_in_7d?.price || []
                }))
            };
        } catch (error) {
            console.error('CoinGecko API error:', error);
            return { coins: [], error: 'Error al cargar datos de CoinGecko. Intenta de nuevo más tarde.' };
        }
    },

    // Get coin details
    getCoin: async (coinId) => {
        try {
            const response = await fetch(
                `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
            );
            const coin = await response.json();

            return {
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol.toUpperCase(),
                image: coin.image?.large,
                prices: { eur: coin.market_data?.current_price?.eur },
                marketCap: coin.market_data?.market_cap?.eur,
                volume24h: coin.market_data?.total_volume?.eur,
                priceChangePercent24h: coin.market_data?.price_change_percentage_24h,
                priceChangePercent7d: coin.market_data?.price_change_percentage_7d,
                priceChangePercent30d: coin.market_data?.price_change_percentage_30d,
                ath: {
                    eur: coin.market_data?.ath?.eur,
                    changePercent: coin.market_data?.ath_change_percentage?.eur
                },
                circulatingSupply: coin.market_data?.circulating_supply,
                maxSupply: coin.market_data?.max_supply
            };
        } catch (error) {
            console.error('CoinGecko coin error:', error);
            throw error;
        }
    },

    // Get coin price history
    getHistory: async (coinId, days = 30) => {
        try {
            const response = await fetch(
                `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=eur&days=${days}`
            );
            const data = await response.json();

            return {
                prices: data.prices.map(([timestamp, price]) => ({
                    date: new Date(timestamp).toISOString(),
                    price: price
                }))
            };
        } catch (error) {
            console.error('CoinGecko history error:', error);
            throw error;
        }
    },

    // Search coins
    search: async (query) => {
        try {
            const response = await fetch(`${COINGECKO_API}/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();

            return {
                results: data.coins.slice(0, 10).map(coin => ({
                    id: coin.id,
                    name: coin.name,
                    symbol: coin.symbol.toUpperCase(),
                    thumb: coin.thumb,
                    marketCapRank: coin.market_cap_rank
                }))
            };
        } catch (error) {
            console.error('CoinGecko search error:', error);
            return { results: [] };
        }
    },

    // Get trending coins
    getTrending: async () => {
        try {
            const response = await fetch(`${COINGECKO_API}/search/trending`);
            const data = await response.json();

            return {
                trending: data.coins.map(item => ({
                    id: item.item.id,
                    name: item.item.name,
                    symbol: item.item.symbol.toUpperCase(),
                    thumb: item.item.thumb,
                    marketCapRank: item.item.market_cap_rank
                }))
            };
        } catch (error) {
            console.error('CoinGecko trending error:', error);
            return { trending: [] };
        }
    },

    // Get global crypto market data
    getGlobal: async () => {
        try {
            const response = await fetch(`${COINGECKO_API}/global`);
            const data = await response.json();

            return {
                totalMarketCap: data.data.total_market_cap?.eur || 0,
                totalVolume24h: data.data.total_volume?.eur || 0,
                btcDominance: data.data.market_cap_percentage?.btc || 0,
                marketCapChange24h: data.data.market_cap_change_percentage_24h_usd || 0
            };
        } catch (error) {
            console.error('CoinGecko global error:', error);
            return {
                totalMarketCap: 2100000000000,
                totalVolume24h: 85000000000,
                btcDominance: 52.5,
                marketCapChange24h: 1.2
            };
        }
    }
};

// =============================================================================
// INVESTMENTS API - Finnhub Integration (Primary)
// =============================================================================

// API Key configurada - Alpha Vantage (Legacy/Backup)
const ALPHA_VANTAGE_CONFIG = {
    apiKey: localStorage.getItem('alphaVantageApiKey') || 'ZMBAFF37KT2ZU8J7',
    baseUrl: 'https://www.alphavantage.co/query'
};

// Finnhub API - 60 requests/min gratis (https://finnhub.io/)
// Documentación: https://finnhub.io/docs/api
const FINNHUB_CONFIG = {
    apiKey: localStorage.getItem('finnhubApiKey') || 'd62gn91r01qlugeq03s0d62gn91r01qlugeq03sg',
    baseUrl: 'https://finnhub.io/api/v1'
};

// Función para configurar API keys
window.setAlphaVantageKey = (key) => {
    localStorage.setItem('alphaVantageApiKey', key);
    ALPHA_VANTAGE_CONFIG.apiKey = key;
    console.log('✅ Alpha Vantage API key configurada');
};

window.setFinnhubKey = (key) => {
    localStorage.setItem('finnhubApiKey', key);
    FINNHUB_CONFIG.apiKey = key;
    console.log('✅ Finnhub API key configurada (60 req/min)');
};

const InvestmentsAPI = {
    // Check if using real API (Finnhub)
    isRealAPI: () => FINNHUB_CONFIG.apiKey !== 'demo',

    // Get quote for a symbol - Finnhub /quote endpoint
    getQuote: async (symbol) => {
        if (!InvestmentsAPI.isRealAPI()) {
            return InvestmentsAPI._getDemoQuote(symbol);
        }

        try {
            // Get quote from Finnhub
            const quoteUrl = `${FINNHUB_CONFIG.baseUrl}/quote?symbol=${symbol}&token=${FINNHUB_CONFIG.apiKey}`;
            // console.log('📈 Finnhub quote:', symbol);

            const quoteRes = await fetch(quoteUrl);
            const quote = await quoteRes.json();

            // Check for errors
            if (quote.error || (quote.c === 0 && quote.d === null)) {
                console.warn('📈 Finnhub quote failed/empty for:', symbol, quote.error || 'No data');
                return InvestmentsAPI._getDemoQuote(symbol);
            }

            // Get company profile for name (optional, cached ideally)
            let companyName = symbol;
            try {
                // Only fetch profile if we really need it to avoid rate limits on lists
                // For now, use symbol as name to save requests, unless it's a single detail view
                // const profileUrl = `${FINNHUB_CONFIG.baseUrl}/stock/profile2?symbol=${symbol}&token=${FINNHUB_CONFIG.apiKey}`;
                // const profileRes = await fetch(profileUrl);
                // const profile = await profileRes.json();
                // if (profile.name) companyName = profile.name;
            } catch (e) {
                // console.warn('📈 Profile fetch failed, using symbol');
            }

            return {
                symbol: symbol,
                name: companyName,
                price: quote.c,  // Current price
                change: quote.d, // Change
                changePercent: quote.dp, // Change percent
                high: quote.h,   // High of day
                low: quote.l,    // Low of day
                open: quote.o,   // Open
                previousClose: quote.pc, // Previous close
                currency: 'USD',
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('📈 Finnhub API error:', error);
            return InvestmentsAPI._getDemoQuote(symbol);
        }
    },

    // Demo quote fallback with REAL current prices (updated Feb 2025)
    _getDemoQuote: (symbol) => {
        const demoData = {
            'AAPL': { name: 'Apple Inc.', price: 227.63, change: -4.59, changePercent: -1.98, high: 232.64, low: 227.35 },
            'MSFT': { name: 'Microsoft Corp', price: 408.22, change: -6.89, changePercent: -1.66, high: 415.50, low: 407.30 },
            'GOOGL': { name: 'Alphabet Inc', price: 193.41, change: 5.58, changePercent: 2.97, high: 193.93, low: 187.29 },
            'NVDA': { name: 'NVIDIA Corp', price: 117.81, change: -16.31, changePercent: -8.67, high: 130.00, low: 116.00 },
            'TSLA': { name: 'Tesla Inc', price: 368.80, change: -10.22, changePercent: -2.70, high: 382.00, low: 365.00 },
            'AMZN': { name: 'Amazon.com', price: 232.05, change: 6.48, changePercent: 2.87, high: 232.73, low: 223.50 },
            'META': { name: 'Meta Platforms', price: 694.83, change: 14.46, changePercent: 2.13, high: 696.00, low: 676.04 }
        };
        const demo = demoData[symbol.toUpperCase()] || { name: symbol, price: 100, change: 0, changePercent: 0, high: 100, low: 100 };
        return {
            symbol: symbol.toUpperCase(),
            ...demo,
            currency: 'USD',
            isDemo: true,
            message: '⚠️ Datos demo - Configura Finnhub API: setFinnhubKey("tu_key")'
        };
    },

    // Get multiple quotes
    getQuotes: async (symbols) => {
        const quotes = await Promise.all(symbols.map(s => InvestmentsAPI.getQuote(s)));
        return quotes;
    },

    // Get historical data - Finnhub /stock/candle endpoint
    getHistory: async (symbol, range = '1mo') => {
        // console.log('📈 getHistory called:', symbol, range, 'isRealAPI:', InvestmentsAPI.isRealAPI());

        if (!InvestmentsAPI.isRealAPI()) {
            return InvestmentsAPI._getDemoHistory(symbol);
        }

        try {
            // Map range to Finnhub resolution and time window
            let resolution = 'D'; // Daily
            let from = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60; // 30 days ago
            const to = Math.floor(Date.now() / 1000);

            if (range === '1d' || range === '5d') {
                resolution = '60'; // 60 minutes
                const days = range === '1d' ? 1 : 5;
                from = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
            } else if (range === '1mo') {
                resolution = 'D';
                from = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
            } else if (range === '3mo') {
                resolution = 'D';
                from = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60;
            } else if (range === '1y') {
                resolution = 'W'; // Weekly
                from = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
            }

            const url = `${FINNHUB_CONFIG.baseUrl}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_CONFIG.apiKey}`;
            // console.log('📈 Fetching Finnhub Candle:', symbol, resolution);

            const response = await fetch(url);
            const data = await response.json();

            // Finnhub format: { c: [close], h: [high], l: [low], o: [open], s: "ok", t: [timestamp], v: [volume] }
            if (data.s !== 'ok' || !data.c || data.c.length === 0) {
                console.warn('📈 Finnhub history failed or empty, using demo:', data.s);
                return InvestmentsAPI._getDemoHistory(symbol);
            }

            const prices = data.t.map((timestamp, index) => ({
                date: new Date(timestamp * 1000),
                open: parseFloat(data.o[index]),
                high: parseFloat(data.h[index]),
                low: parseFloat(data.l[index]),
                close: parseFloat(data.c[index]),
                volume: parseInt(data.v[index])
            }));

            // console.log('📈 Parsed', prices.length, 'candles from Finnhub');
            return { prices, currency: 'USD' };

        } catch (error) {
            console.error('📈 History API error:', error);
            return InvestmentsAPI._getDemoHistory(symbol);
        }
    },

    _getDemoHistory: (symbol = 'UNKNOWN') => {
        // Precios base realistas por símbolo
        const basePrices = {
            'NVDA': 117, 'AAPL': 227, 'MSFT': 408, 'GOOGL': 193, 'TSLA': 368,
            'AMZN': 232, 'META': 694, 'SAN': 4.5, 'BBVA': 9.2, 'ITX': 42
        };
        const basePrice = basePrices[symbol.toUpperCase()] || 150;

        const prices = [];
        let price = basePrice * 0.95; // Empezar un poco más abajo

        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            // Variación realista: ~0.5% por día
            price *= (1 + (Math.random() - 0.48) * 0.015);
            prices.push({
                date,
                close: Math.round(price * 100) / 100,
                volume: Math.floor(Math.random() * 50000000) + 10000000
            });
        }

        // console.log('📈 Demo history for', symbol, '- base:', basePrice, '- range:', prices[0].close.toFixed(2), 'to', prices[prices.length-1].close.toFixed(2));
        return { prices, currency: 'USD', isDemo: true };
    },

    // Search stocks - Finnhub SYMBOL_SEARCH
    search: async (query) => {
        if (!InvestmentsAPI.isRealAPI()) {
            return InvestmentsAPI._getDemoSearch(query);
        }

        try {
            const url = `${FINNHUB_CONFIG.baseUrl}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_CONFIG.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.result) {
                return {
                    results: data.result
                        .filter(item => !item.symbol.includes('.')) // Filter weird extensions
                        .map(m => ({
                            symbol: m.symbol,
                            name: m.description,
                            type: m.type,
                            region: 'US', // Finnhub often defaults to US for main results
                            currency: 'USD'
                        })).slice(0, 10)
                };
            }
            return InvestmentsAPI._getDemoSearch(query);
        } catch (error) {
            return InvestmentsAPI._getDemoSearch(query);
        }
    },

    _getDemoSearch: (query) => {
        const knownStocks = [
            { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity' },
            { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity' },
            { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity' },
            { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity' },
            { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Equity' },
            { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Equity' },
            { symbol: 'SAN', name: 'Banco Santander', type: 'Equity' },
            { symbol: 'BBVA', name: 'BBVA', type: 'Equity' },
            { symbol: 'ITX', name: 'Inditex', type: 'Equity' }
        ];
        const q = query.toLowerCase();
        return {
            results: knownStocks.filter(s =>
                s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
            ).slice(0, 10)
        };
    },

    // Get top movers - Uses real API (Finnhub doesnt have free movers, simulating with major stocks)
    getMovers: async () => {
        if (InvestmentsAPI.isRealAPI()) {
            // Finnhub free doesn't have market status/movers easily.
            // We'll fetch a few major tech stocks to simulate "movers" based on real data
            const majors = ['NVDA', 'TSLA', 'META', 'AAPL', 'MSFT', 'AMZN', 'GOOGL'];
            const quotes = await InvestmentsAPI.getQuotes(majors);

            const sorted = quotes.sort((a, b) => b.changePercent - a.changePercent);

            return {
                gainers: sorted.filter(s => s.changePercent > 0).slice(0, 5),
                losers: sorted.filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
                isRealData: true
            };
        }

        // Demo fallback
        return {
            gainers: [
                { symbol: 'NVDA', name: 'NVIDIA Corp', price: 117.81, change: 4.21, changePercent: 3.45 },
                { symbol: 'TSLA', name: 'Tesla Inc', price: 368.50, change: 12.35, changePercent: 3.23 },
                { symbol: 'AMD', name: 'AMD Inc', price: 165.80, change: 7.20, changePercent: 4.54 },
                { symbol: 'AAPL', name: 'Apple Inc', price: 227.45, change: 6.78, changePercent: 2.71 },
                { symbol: 'MSFT', name: 'Microsoft', price: 408.12, change: 12.45, changePercent: 3.02 }
            ],
            losers: [
                { symbol: 'META', name: 'Meta Platforms', price: 694.20, change: -18.50, changePercent: -2.67 },
                { symbol: 'GOOGL', name: 'Alphabet', price: 193.30, change: -4.80, changePercent: -2.05 },
                { symbol: 'AMZN', name: 'Amazon', price: 232.90, change: -4.20, changePercent: -1.79 },
                { symbol: 'NFLX', name: 'Netflix', price: 625.40, change: -12.30, changePercent: -1.93 },
                { symbol: 'DIS', name: 'Disney', price: 112.50, change: -1.85, changePercent: -1.62 }
            ],
            isDemo: true,
            message: '⚠️ Demo - Usa setFinnhubKey("KEY") para datos reales'
        };
    },

    // Get market indices - Uses real quotes (ETFs as proxies)
    getIndices: async () => {
        // Using ETFs as proxies because free APIs don't support direct Indices (^GSPC, ^DJI, etc)
        const indexSymbols = [
            { symbol: 'SPY', name: 'S&P 500 (ETF)', currency: 'USD' },
            { symbol: 'DIA', name: 'Dow Jones (ETF)', currency: 'USD' },
            { symbol: 'QQQ', name: 'NASDAQ 100 (ETF)', currency: 'USD' },
            { symbol: 'EWP', name: 'IBEX 35 (ETF)', currency: 'USD' }
        ];

        if (InvestmentsAPI.isRealAPI()) {
            try {
                const quotes = await Promise.all(
                    indexSymbols.map(async idx => {
                        const q = await InvestmentsAPI.getQuote(idx.symbol);
                        // If quote fails (returns isDemo or user has no key), q.price might be from demo data
                        // We accept it, but typically getQuote(SPY) should work with specific key
                        return {
                            symbol: idx.symbol,
                            name: idx.name,
                            value: q.price,
                            change: q.change,
                            changePercent: q.changePercent,
                            currency: idx.currency,
                            isReal: !q.isDemo
                        };
                    })
                );
                return { indices: quotes.filter(q => q.value), isRealData: true };
            } catch (error) {
                console.error('Indices API error:', error);
            }
        }

        // Demo fallback
        return {
            indices: [
                { symbol: 'SPY', name: 'S&P 500 (ETF)', value: 523.45, change: 4.56, changePercent: 0.88, currency: 'USD' },
                { symbol: 'DIA', name: 'Dow Jones (ETF)', value: 391.28, change: 1.56, changePercent: 0.40, currency: 'USD' },
                { symbol: 'QQQ', name: 'NASDAQ 100 (ETF)', value: 448.72, change: 3.87, changePercent: 0.87, currency: 'USD' },
                { symbol: 'EWP', name: 'IBEX 35 (ETF)', value: 32.15, change: 0.28, changePercent: 0.88, currency: 'USD' }
            ],
            isDemo: true,
            message: '⚠️ Demo - Configura API key para datos en tiempo real'
        };
    },

    // Get fundamentals
    getFundamentals: async (symbol) => {
        if (!InvestmentsAPI.isRealAPI()) {
            return { symbol, error: 'Requiere API key', isDemo: true };
        }

        try {
            // Finnhub Company Profile 2
            const url = `${FINNHUB_CONFIG.baseUrl}/stock/profile2?symbol=${symbol}&token=${FINNHUB_CONFIG.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();

            // Finnhub Basic Financials (metric)
            const metricUrl = `${FINNHUB_CONFIG.baseUrl}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_CONFIG.apiKey}`;
            const metricRes = await fetch(metricUrl);
            const metricData = await metricRes.json();
            const metrics = metricData.metric || {};

            return {
                symbol: data.ticker,
                name: data.name,
                description: `${data.exchange} - ${data.finnhubIndustry}`, // Finnhub description is mainly plain text, better use industry
                sector: data.finnhubIndustry,
                industry: data.finnhubIndustry,
                marketCap: data.marketCapitalization * 1000000, // Finnhub returns in millions
                peRatio: metrics['peTTM'] || 0,
                eps: metrics['epsTTM'] || 0,
                dividendYield: metrics['dividendYieldIndicatedAnnual'] || 0,
                beta: metrics['beta'] || 0,
                week52High: metrics['52WeekHigh'] || 0,
                week52Low: metrics['52WeekLow'] || 0
            };
        } catch (error) {
            return { symbol, error: error.message };
        }
    }
};


// =============================================================================
// REAL ESTATE API (Datos INE actualizados)
// =============================================================================

const RealEstateAPI = {
    getPrices: async () => {
        const communities = [
            { id: 'madrid', name: 'Madrid', capital: 'Madrid', salePrice: 3842, rentPrice: 17.8, priceChange1y: 5.2, affordabilityIndex: 13.8 },
            { id: 'cataluna', name: 'Cataluña', capital: 'Barcelona', salePrice: 2987, rentPrice: 15.2, priceChange1y: 4.8, affordabilityIndex: 11.2 },
            { id: 'baleares', name: 'Islas Baleares', capital: 'Palma', salePrice: 3654, rentPrice: 16.5, priceChange1y: 6.1, affordabilityIndex: 12.5 },
            { id: 'pais-vasco', name: 'País Vasco', capital: 'Vitoria', salePrice: 2876, rentPrice: 13.4, priceChange1y: 3.2, affordabilityIndex: 9.8 },
            { id: 'andalucia', name: 'Andalucía', capital: 'Sevilla', salePrice: 1654, rentPrice: 9.8, priceChange1y: 4.5, affordabilityIndex: 6.8 },
            { id: 'valencia', name: 'C. Valenciana', capital: 'Valencia', salePrice: 1532, rentPrice: 10.2, priceChange1y: 5.8, affordabilityIndex: 7.8 },
            { id: 'canarias', name: 'Canarias', capital: 'Las Palmas', salePrice: 1876, rentPrice: 11.5, priceChange1y: 4.2, affordabilityIndex: 8.5 },
            { id: 'galicia', name: 'Galicia', capital: 'Santiago', salePrice: 1234, rentPrice: 7.2, priceChange1y: 2.1, affordabilityIndex: 5.8 },
            { id: 'castilla-leon', name: 'Castilla y León', capital: 'Valladolid', salePrice: 1087, rentPrice: 6.5, priceChange1y: 1.8, affordabilityIndex: 5.5 },
            { id: 'aragon', name: 'Aragón', capital: 'Zaragoza', salePrice: 1345, rentPrice: 8.1, priceChange1y: 2.5, affordabilityIndex: 6.4 },
            { id: 'asturias', name: 'Asturias', capital: 'Oviedo', salePrice: 1198, rentPrice: 7.0, priceChange1y: 1.2, affordabilityIndex: 7.5 },
            { id: 'murcia', name: 'Murcia', capital: 'Murcia', salePrice: 1123, rentPrice: 7.8, priceChange1y: 3.8, affordabilityIndex: 5.2 },
            { id: 'navarra', name: 'Navarra', capital: 'Pamplona', salePrice: 1654, rentPrice: 9.2, priceChange1y: 2.8, affordabilityIndex: 8.2 },
            { id: 'extremadura', name: 'Extremadura', capital: 'Mérida', salePrice: 876, rentPrice: 5.4, priceChange1y: 1.5, affordabilityIndex: 4.2 },
            { id: 'la-rioja', name: 'La Rioja', capital: 'Logroño', salePrice: 1234, rentPrice: 7.1, priceChange1y: 2.0, affordabilityIndex: 6.1 },
            { id: 'cantabria', name: 'Cantabria', capital: 'Santander', salePrice: 1456, rentPrice: 8.5, priceChange1y: 2.3, affordabilityIndex: 7.2 },
            { id: 'castilla-mancha', name: 'Castilla-La Mancha', capital: 'Toledo', salePrice: 912, rentPrice: 5.8, priceChange1y: 1.9, affordabilityIndex: 4.8 }
        ];

        // Calcular promedios nacionales
        const avgSale = communities.reduce((sum, c) => sum + c.salePrice, 0) / communities.length;
        const avgRent = communities.reduce((sum, c) => sum + c.rentPrice, 0) / communities.length;
        const avgChange = communities.reduce((sum, c) => sum + c.priceChange1y, 0) / communities.length;

        // Encontrar la más cara
        const mostExpensive = communities.reduce((max, c) => c.salePrice > max.salePrice ? c : max, communities[0]);

        return {
            communities,
            nationalAverage: {
                salePrice: Math.round(avgSale),
                rentPrice: parseFloat(avgRent.toFixed(1)),
                priceChange1y: parseFloat(avgChange.toFixed(1))
            },
            mostExpensive: { name: mostExpensive.name, price: mostExpensive.salePrice },
            lastUpdated: new Date().toISOString()
        };
    },

    getCommunity: async (id) => {
        const data = await RealEstateAPI.getPrices();
        return data.communities.find(c => c.id === id) || null;
    },

    getHistory: async () => ({
        history: [
            { year: '2015', avgPrice: 1456 },
            { year: '2016', avgPrice: 1512 },
            { year: '2017', avgPrice: 1598 },
            { year: '2018', avgPrice: 1654 },
            { year: '2019', avgPrice: 1687 },
            { year: '2020', avgPrice: 1598 },
            { year: '2021', avgPrice: 1687 },
            { year: '2022', avgPrice: 1754 },
            { year: '2023', avgPrice: 1812 },
            { year: '2024', avgPrice: 1876 },
            { year: '2025', avgPrice: 1945 }
        ]
    }),

    getAffordability: async () => ({
        ranking: [
            { community: 'Extremadura', yearsOfSalary: 4.2 },
            { community: 'Castilla-La Mancha', yearsOfSalary: 4.8 },
            { community: 'Murcia', yearsOfSalary: 5.2 },
            { community: 'Castilla y León', yearsOfSalary: 5.5 },
            { community: 'Galicia', yearsOfSalary: 5.8 },
            { community: 'La Rioja', yearsOfSalary: 6.1 },
            { community: 'Aragón', yearsOfSalary: 6.4 },
            { community: 'Andalucía', yearsOfSalary: 6.8 },
            { community: 'Cantabria', yearsOfSalary: 7.2 },
            { community: 'Asturias', yearsOfSalary: 7.5 },
            { community: 'C. Valenciana', yearsOfSalary: 7.8 },
            { community: 'Navarra', yearsOfSalary: 8.2 },
            { community: 'Canarias', yearsOfSalary: 8.5 },
            { community: 'País Vasco', yearsOfSalary: 9.8 },
            { community: 'Cataluña', yearsOfSalary: 11.2 },
            { community: 'Islas Baleares', yearsOfSalary: 12.5 },
            { community: 'Madrid', yearsOfSalary: 13.8 }
        ]
    })
};

// =============================================================================
// IMPORT API (Procesamiento local)
// =============================================================================

const ImportAPI = {
    parseFile: async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const fileName = file.name.toLowerCase();

                    let transactions = [];

                    if (fileName.endsWith('.csv')) {
                        transactions = parseCSV(content);
                    } else if (fileName.endsWith('.ofx') || fileName.endsWith('.qfx')) {
                        transactions = parseOFX(content);
                    } else if (fileName.endsWith('.qif')) {
                        transactions = parseQIF(content);
                    } else {
                        throw new Error('Formato no soportado. Use CSV, OFX o QIF.');
                    }

                    resolve({
                        success: true,
                        allTransactions: transactions,
                        fileName: file.name,
                        count: transactions.length
                    });
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file);
        });
    },

    // save method removed - deprecated in favor of direct Firestore saving from UI


    getGuides: async () => ({
        guides: [
            'BBVA', 'Santander', 'CaixaBank', 'Sabadell', 'Bankinter',
            'ING', 'Openbank', 'N26', 'Revolut', 'Trade Republic'
        ]
    })
};

const GentleFinancesAPI = {
    investments: InvestmentsAPI,
    crypto: CryptoAPI,
    realEstate: RealEstateAPI,
    import: ImportAPI,

    // Legacy support
    transactions: null, // Removed in favor of FirestoreService
    reports: null,      // Removed in favor of FirestoreService

    // Utility
    setAuthToken: (token) => localStorage.setItem('gf_auth_token', token),
    clearAuthToken: () => localStorage.removeItem('gf_auth_token'),
    isAuthenticated: () => !!localStorage.getItem('gf_auth_token')
};

window.GentleFinancesAPI = GentleFinancesAPI;

console.log('✅ GentleFinances API (Standalone) cargada - Sin necesidad de servidor');

// =============================================================================
// PARSERS (CSV, OFX, QIF)
// =============================================================================

function parseCSV(content) {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    let separator = ',';
    let headers = [];
    let headerRowIdx = -1;

    // Palabras clave para identificación de columnas
    // NOTA: 'saldo' eliminado de amount para evitar coger "Saldo disponible" en lugar de "Importe"
    const KEYWORDS = {
        date: ['fecha', 'date', 'día', 'f. operación', 'f. valor', 'fecha valor', 'f.oper', 'f. contable', 'f.operac', 'f.liquidación'],
        amount: ['importe', 'amount', 'cantidad', 'valor', 'movimiento', 'cuota', 'cargo', 'abono', 'total', 'quantité', 'sum'],
        desc: ['concepto', 'concepto del movimiento', 'desc', 'detalle', 'referencia', 'observaciones', 'beneficiario', 'descripción', 'description', 'comentario']
    };

    console.log('🔍 Analizando CSV - Primeras líneas...');

    // 1. Encontrar la fila de cabecera (escaneamos las primeras 10 líneas)
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i];

        // Probar separadores comunes
        const testSeps = [';', ',', '\t'];
        let bestSep = ',';
        let maxFound = -1;

        testSeps.forEach(sep => {
            const cols = line.toLowerCase().split(sep).map(c => c.trim().replace(/"/g, ''));
            const foundCount = cols.filter(col =>
                KEYWORDS.date.some(k => col.includes(k)) ||
                KEYWORDS.amount.some(k => col.includes(k)) ||
                KEYWORDS.desc.some(k => col.includes(k))
            ).length;

            if (foundCount > maxFound) {
                maxFound = foundCount;
                bestSep = sep;
            }
        });

        const currentHeaders = line.toLowerCase().split(bestSep).map(c => c.trim().replace(/"/g, ''));
        const hasDate = currentHeaders.some(h => KEYWORDS.date.some(k => h === k || h.includes(k)));
        const hasAmount = currentHeaders.some(h => KEYWORDS.amount.some(k => h === k || h.includes(k)));

        if (hasDate && hasAmount) {
            headerRowIdx = i;
            separator = bestSep;
            headers = currentHeaders;
            console.log(`✅ Cabecera encontrada en línea ${i} con separador "${separator}":`, headers);
            break;
        } else if (i === 0) {
            console.log(`ℹ️ Línea 0 no parece cabecera (hasDate: ${hasDate}, hasAmount: ${hasAmount}). Headers:`, currentHeaders);
        }
    }

    if (headerRowIdx === -1) {
        // Fallback: intentar con la primera línea si no se encontraron coincidencias claras
        separator = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
        headers = lines[0].toLowerCase().split(separator).map(h => h.trim().replace(/"/g, ''));
        headerRowIdx = 0;
    }

    // 2. Identificar índices de columnas con prioridad
    const findIdx = (keywords) => {
        // Emparejamiento exacto primero
        let idx = headers.findIndex(h => keywords.some(k => h === k));
        if (idx !== -1) return idx;
        // Emparejamiento por inclusión
        return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const dateIdx = findIdx(KEYWORDS.date);
    const amountIdx = findIdx(KEYWORDS.amount);
    const descIdx = findIdx(KEYWORDS.desc);

    if (dateIdx === -1 || amountIdx === -1) {
        console.error('❌ Error de mapeo CSV. No se encontró Fecha o Importe en:', headers);
        throw new Error('No se pudieron identificar las columnas críticas (Fecha o Importe). Por favor, revisa el formato del CSV.');
    }

    const transactions = [];

    // 3. Procesar datos a partir de la fila siguiente a la cabecera
    for (let i = headerRowIdx + 1; i < lines.length; i++) {
        let row = lines[i].split(separator);

        // Limpiar comillas y espacios
        row = row.map(cell => cell ? cell.trim().replace(/^"|"$/g, '') : '');

        if (row.length <= Math.max(dateIdx, amountIdx)) continue;

        const dateStr = row[dateIdx];
        let amountStr = row[amountIdx];
        const descStr = descIdx !== -1 ? row[descIdx] : 'Fila importada';

        if (!dateStr || !amountStr) continue;

        // Parsear Importe (maneja formatos 1.234,56 y 1,234.56 y sufijos EUR/USD/GBP)
        let amount = 0;
        try {
            // Eliminar símbolos de moneda, sufijos de divisa (EUR, USD, GBP...) y espacios
            let cleanAmount = amountStr
                .replace(/[€$£\s]/g, '')
                .replace(/[A-Z]{3}$/i, '') // quita sufijos como EUR, USD, GBP
                .trim();

            if (cleanAmount.includes(',') && cleanAmount.includes('.')) {
                if (cleanAmount.lastIndexOf(',') > cleanAmount.lastIndexOf('.')) {
                    cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.'); // EU format: 1.234,56
                } else {
                    cleanAmount = cleanAmount.replace(/,/g, ''); // US format: 1,234.56
                }
            } else if (cleanAmount.includes(',')) {
                cleanAmount = cleanAmount.replace(',', '.'); // EU decimal: 18,35 → 18.35
            }
            amount = parseFloat(cleanAmount);
        } catch (e) {
            continue;
        }

        // Parsear Fecha (DD/MM/YYYY, YYYY-MM-DD, etc)
        let dateObj = null;
        try {
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    // Si el año es de 4 dígitos y está al final (DD/MM/YYYY)
                    if (parts[2].length === 4) {
                        dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    } else if (parts[0].length === 4) { // YYYY/MM/DD
                        dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    }
                }
            }

            if (!dateObj || isNaN(dateObj)) {
                dateObj = new Date(dateStr);
            }
        } catch (e) {
            continue;
        }

        if (dateObj && !isNaN(dateObj) && !isNaN(amount)) {
            transactions.push({
                date: dateObj,
                amount: amount,
                description: descStr,
                category: 'General'
            });
        }
    }

    return transactions;
}

function parseOFX(content) {
    const transactions = [];
    const regex = /<STMTTRN>[\s\S]*?<TRNTYPE>(.*?)[\s\S]*?<DTPOSTED>(.*?)[\s\S]*?<TRNAMT>(.*?)[\s\S]*?<FITID>(.*?)[\s\S]*?<NAME>(.*?)[\s\S]*?<\/STMTTRN>/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        const type = match[1].trim();
        const dateStr = match[2].trim(); // YYYYMMDDHHMMSS
        const amountStr = match[3].trim();
        // const id = match[4].trim();
        const name = match[5].trim();

        // Parse Date
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const dateObj = new Date(`${year}-${month}-${day}`);

        // Parse Amount
        const amount = parseFloat(amountStr.replace(',', '.')); // OFX usually uses . but safely handle ,

        if (dateObj && !isNaN(dateObj) && !isNaN(amount)) {
            transactions.push({
                date: dateObj,
                amount: amount,
                description: name,
                category: 'General'
            });
        }
    }
    return transactions;
}

function parseQIF(content) {
    const transactions = [];
    const blocks = content.split('^');

    for (const block of blocks) {
        const lines = block.split(/\r?\n/);
        let date = null;
        let amount = 0;
        let desc = '';

        for (const line of lines) {
            const type = line.charAt(0);
            const value = line.substring(1);

            if (type === 'D') {
                // Date
                date = new Date(value); // QIF dates vary wildly, relying on auto-parse for now
            } else if (type === 'T') {
                // Amount
                amount = parseFloat(value.replace(',', ''));
            } else if (type === 'P' || type === 'M') {
                // Payee / Memo
                desc = value;
            }
        }

        if (date && !isNaN(date) && amount !== 0) {
            transactions.push({
                date: date,
                amount: amount,
                description: desc,
                category: 'General'
            });
        }
    }
    return transactions;
}
// Activate LocalStorage fallback if Firebase SDK hasn't loaded
// On file:// protocol, Firebase ESM modules cannot load (CORS), so activate immediately
// On http(s)://, Firebase module may still be loading (deferred), but api.js runs first
// The firebase-sdk.js will override these if it loads successfully
if (!window.FirestoreService) {
    console.warn('⚠️ Firebase SDK no detectado. Activando modo LocalStorage (Offline).');

    class LocalCollection {
        constructor(name) {
            this.name = name;
            this.listeners = [];
        }

        _getData() {
            return JSON.parse(localStorage.getItem(`gf_${this.name}`) || '[]');
        }

        _saveData(data) {
            localStorage.setItem(`gf_${this.name}`, JSON.stringify(data));
            this._notifyListeners(data);
        }

        _notifyListeners(data) {
            this.listeners.forEach(cb => cb(data));
        }

        subscribe(callback) {
            this.listeners.push(callback);
            callback(this._getData());
            return () => {
                this.listeners = this.listeners.filter(cb => cb !== callback);
            };
        }

        async getAll() {
            return this._getData();
        }

        async create(item) {
            const data = this._getData();
            const newItem = { ...item, id: Utils.generateId() };

            // Handle Dates
            if (newItem.date && typeof newItem.date === 'string') {
                newItem.dateObj = new Date(newItem.date);
            } else if (newItem.date instanceof Date) {
                newItem.dateObj = newItem.date;
            }

            data.push(newItem);
            this._saveData(data);
            return newItem;
        }

        async update(id, updates) {
            const data = this._getData();
            const index = data.findIndex(item => item.id === id);
            if (index !== -1) {
                // Merge updates
                data[index] = { ...data[index], ...updates };

                // Re-process date if updated
                if (updates.date) {
                    data[index].dateObj = new Date(updates.date);
                }

                this._saveData(data);
                return data[index];
            }
            throw new Error('Document not found');
        }

        async delete(id) {
            const data = this._getData();
            const newData = data.filter(item => item.id !== id);
            this._saveData(newData);
        }
    }

    // Mock Services
    window.FirestoreService = {
        transactions: Object.assign(new LocalCollection('transactions'), {
            async deleteAll() {
                localStorage.removeItem('gf_transactions');
            }
        }),
        accounts: new LocalCollection('accounts'),
        budgets: new LocalCollection('budgets'),
        goals: new LocalCollection('goals'),
        debts: new LocalCollection('debts'),
        subscriptions: new LocalCollection('subscriptions'),
        users: {
            async create(userId, data) { localStorage.setItem(`gf_user_${userId}`, JSON.stringify(data)); },
            async get(userId) { return JSON.parse(localStorage.getItem(`gf_user_${userId}`) || 'null'); },
            async update(userId, data) {
                const existing = JSON.parse(localStorage.getItem(`gf_user_${userId}`) || '{}');
                localStorage.setItem(`gf_user_${userId}`, JSON.stringify({ ...existing, ...data }));
            }
        },
        settings: {
            async getKey(userId) { return localStorage.getItem(`gf_masterkey_${userId}`) || null; },
            async saveKey(userId, key) { localStorage.setItem(`gf_masterkey_${userId}`, key); }
        },
        portfolio: {
            async get() { return JSON.parse(localStorage.getItem('gf_portfolio') || '{"investments":[]}'); },
            async save(data) { localStorage.setItem('gf_portfolio', JSON.stringify(data)); }
        },
        sessions: {
            async create(userId, data) {
                const sessions = JSON.parse(localStorage.getItem('gf_sessions') || '[]');
                sessions.push({ ...data, userId });
                localStorage.setItem('gf_sessions', JSON.stringify(sessions));
            },
            async list(userId) {
                const sessions = JSON.parse(localStorage.getItem('gf_sessions') || '[]');
                return sessions.filter(s => s.userId === userId);
            },
            async delete(userId, sessionId) {
                let sessions = JSON.parse(localStorage.getItem('gf_sessions') || '[]');
                sessions = sessions.filter(s => !(s.userId === userId && s.id === sessionId));
                localStorage.setItem('gf_sessions', JSON.stringify(sessions));
            },
            async revoke(userId, sessionId) {
                return this.delete(userId, sessionId);
            },
            async deleteAll(userId) {
                let sessions = JSON.parse(localStorage.getItem('gf_sessions') || '[]');
                sessions = sessions.filter(s => s.userId !== userId);
                localStorage.setItem('gf_sessions', JSON.stringify(sessions));
            },
            async update(userId, sessionId) {
                // No-op for local mode
            }
        },
        security: {
            async get(userId) { return JSON.parse(localStorage.getItem(`gf_security_${userId}`) || 'null'); },
            async save(userId, data) { localStorage.setItem(`gf_security_${userId}`, JSON.stringify(data)); }
        }
    };

    // Mock Auth
    window.AuthService = {
        currentUser: {
            uid: 'local-user',
            email: 'offline@gentlefinances.app',
            displayName: 'Usuario Local',
            emailVerified: true
        },
        onAuthChange: (callback) => {
            // Auto-login dummy user for local mode
            setTimeout(() => {
                callback({
                    uid: 'local-user',
                    email: 'offline@gentlefinances.app',
                    displayName: 'Usuario Local',
                    emailVerified: true
                });
            }, 500);
            return () => { }; // Unsubscribe mock
        },
        checkRedirectResult: async () => ({ success: true }),
        login: async () => ({ uid: 'local-user' }),
        register: async () => ({ uid: 'local-user' }),
        logout: async () => { window.location.reload(); },
        loginWithGoogle: async () => ({ uid: 'local-user' })
    };

    console.log('✅ Sistema LocalStorage activado correctamente.');
}

