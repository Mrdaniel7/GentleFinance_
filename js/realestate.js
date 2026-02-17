/**
 * Controlador de Mercado Inmobiliario España
 * Muestra precios por comunidad autónoma con datos del INE
 */

const RealEstateView = {
    historyChart: null,
    communityData: [],

    init() {
        this.loadPrices();
        this.loadHistory();
        this.initSortTabs();
    },

    // =============================================================================
    // DATOS DE PRECIOS
    // =============================================================================

    async loadPrices() {
        try {
            const data = await GentleFinancesAPI.realEstate.getPrices();
            this.communityData = data.communities;

            // Estadísticas nacionales
            document.getElementById('realestate-avgSalePrice').textContent =
                Utils.formatCurrency(data.nationalAverage.salePrice);
            document.getElementById('realestate-avgRentPrice').textContent =
                Utils.formatCurrency(data.nationalAverage.rentPrice);
            document.getElementById('realestate-priceChange').textContent =
                (data.nationalAverage.priceChange1y >= 0 ? '+' : '') +
                data.nationalAverage.priceChange1y.toFixed(1) + '%';
            document.getElementById('realestate-mostExpensive').textContent = data.mostExpensive.name;

            // Aplicar color al cambio
            const changeEl = document.getElementById('realestate-priceChange');
            changeEl.style.color = data.nationalAverage.priceChange1y >= 0
                ? 'var(--positive-light)'
                : 'var(--negative-light)';

            // Renderizar tabla
            this.renderCommunityTable(this.communityData);

            // Rankings
            this.renderRankings(this.communityData);

            // Inicializar mapa de España
            this.initSpainMap(this.communityData);

        } catch (error) {
            console.error('Error cargando precios:', error);
            showToast('Error al cargar datos inmobiliarios', 'error');
        }
    },

    renderCommunityTable(communities, sortBy = 'price') {
        const sorted = [...communities].sort((a, b) => {
            switch (sortBy) {
                case 'price': return b.salePrice - a.salePrice;
                case 'change': return b.priceChange1y - a.priceChange1y;
                case 'name': return a.name.localeCompare(b.name);
                default: return 0;
            }
        });

        const maxPrice = Math.max(...communities.map(c => c.salePrice));

        const tbody = document.getElementById('realestate-tableBody');
        if (tbody) {
            tbody.innerHTML = sorted.map(community => `
                <tr onclick="RealEstateView.showCommunityDetail('${community.id}')" data-community="${community.id}">
                    <td>
                        <div style="font-weight: var(--font-medium);">${community.name}</div>
                        <div class="text-muted" style="font-size: var(--text-xs);">${community.capital}</div>
                    </td>
                    <td style="font-family: var(--font-mono, monospace);">
                        ${Utils.formatCurrency(community.salePrice)}
                    </td>
                    <td style="font-family: var(--font-mono, monospace);">
                        ${Utils.formatCurrency(community.rentPrice)}
                    </td>
                    <td>
                        <span class="change-badge ${community.priceChange1y >= 0 ? 'positive' : 'negative'}">
                            ${community.priceChange1y >= 0 ? '↑' : '↓'} ${Math.abs(community.priceChange1y).toFixed(1)}%
                        </span>
                    </td>
                    <td>
                        <div class="price-bar">
                            <div class="price-bar-fill" style="width: ${(community.salePrice / maxPrice * 100).toFixed(0)}%"></div>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    },

    renderRankings(communities) {
        // Más caras
        const expensive = [...communities]
            .sort((a, b) => b.salePrice - a.salePrice)
            .slice(0, 5);

        document.getElementById('realestate-topExpensive').innerHTML = expensive.map((c, i) => `
            <div class="ranking-item">
                <div class="flex items-center">
                    <span class="ranking-position">${i + 1}</span>
                    <div>
                        <div style="font-weight: var(--font-medium);">${c.name}</div>
                        <div class="text-muted" style="font-size: var(--text-xs);">
                            ${formatNumber(c.salePrice)} ${window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€'}/m²
                        </div>
                    </div>
                </div>
                <span class="change-badge ${c.priceChange1y >= 0 ? 'positive' : 'negative'}">
                    ${c.priceChange1y >= 0 ? '+' : ''}${c.priceChange1y.toFixed(1)}%
                </span>
            </div>
        `).join('');

        // Más asequibles (por índice de accesibilidad)
        const affordable = [...communities]
            .sort((a, b) => a.affordabilityIndex - b.affordabilityIndex)
            .slice(0, 5);

        document.getElementById('realestate-topAffordable').innerHTML = affordable.map((c, i) => `
            <div class="ranking-item">
                <div class="flex items-center">
                    <span class="ranking-position">${i + 1}</span>
                    <div>
                        <div style="font-weight: var(--font-medium);">${c.name}</div>
                        <div class="text-muted" style="font-size: var(--text-xs);">
                            ${formatNumber(c.salePrice)} ${window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€'}/m²
                        </div>
                    </div>
                </div>
                <span class="text-muted" style="font-size: var(--text-sm);">
                    ${c.affordabilityIndex} años
                </span>
            </div>
        `).join('');
    },

    // =============================================================================
    // GRÁFICO HISTÓRICO
    // =============================================================================

    async loadHistory() {
        try {
            const data = await GentleFinancesAPI.realEstate.getHistory();

            const canvas = document.getElementById('realestate-historyChart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            // Destruir gráfico anterior si existe (fix bug "Canvas already in use")
            if (this.historyChart) {
                this.historyChart.destroy();
                this.historyChart = null;
            }

            this.historyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.history.map(h => h.year),
                    datasets: [{
                        label: `Precio Medio (${window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€'}/m²)`,
                        data: data.history.map(h => h.avgPrice),
                        borderColor: '#C5A058',
                        backgroundColor: 'rgba(197, 160, 88, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#C5A058'
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
                            callbacks: {
                                label: (ctx) => `${Utils.formatCurrency(ctx.raw)}/m²`
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(61, 61, 61, 0.3)' },
                            ticks: { color: '#7A7A7A' }
                        },
                        y: {
                            grid: { color: 'rgba(61, 61, 61, 0.3)' },
                            ticks: {
                                color: '#7A7A7A',
                                callback: (value) => Utils.formatCurrency(value)
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error cargando histórico:', error);
        }
    },

    // =============================================================================
    // ORDENACIÓN
    // =============================================================================

    initSortTabs() {
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderCommunityTable(this.communityData, tab.dataset.sort);
            });
        });
    },

    // =============================================================================
    // DETALLE DE COMUNIDAD
    // =============================================================================

    showCommunityDetail(communityId) {
        const community = this.communityData.find(c => c.id === communityId);
        if (!community) return;

        showToast(
            `${community.name}: ${formatNumber(community.salePrice)} ${window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€'}/m² venta, ${community.rentPrice.toFixed(1)} ${window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€'}/m² alquiler`,
            'info'
        );
    },



    // =============================================================================
    // MAPA DE ESPAÑA
    // =============================================================================

    initSpainMap(communities) {
        const priceData = {};
        communities.forEach(c => {
            priceData[c.id] = {
                salePrice: c.salePrice,
                rentPrice: c.rentPrice,
                priceChange1y: c.priceChange1y
            };
        });

        // Inicializar mapa
        if (window.SpainMap) {
            SpainMap.init('realestate-mapContainer', priceData);
        }
    },

    // =============================================================================
    // PORTFOLIO INTEGRATION
    // =============================================================================

    openInvestRealEstate() {
        const communityOptions = this.communityData.map(c =>
            `<option value="${c.id}" data-price="${c.salePrice}">${c.name} - ${formatNumber(c.salePrice)} ${window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€'}/m²</option>`
        ).join('');

        const bodyHTML = `
            <div class="gf-input-group">
                <label class="gf-input-label">Comunidad Autónoma</label>
                <select class="gf-input" id="realEstateRegion">
                    <option value="">Selecciona una comunidad</option>
                    ${communityOptions}
                </select>
            </div>

            <div class="gf-input-group">
                <label class="gf-input-label">Metros Cuadrados (m²)</label>
                <input type="number" class="gf-input" id="realEstateSize" placeholder="80" min="1">
            </div>

            <div class="gf-input-group">
                <label class="gf-input-label">Tipo de Propiedad</label>
                <select class="gf-input" id="realEstateType">
                    <option value="piso">Piso</option>
                    <option value="casa">Casa</option>
                    <option value="local">Local Comercial</option>
                    <option value="terreno">Terreno</option>
                </select>
            </div>

            <div class="gf-calculation" id="realEstateCalc">
                <div class="gf-calculation-label">Valor Estimado</div>
                <div class="gf-calculation-value" id="realEstateValue">${Utils.formatCurrency(0)}</div>
            </div>
        `;

        const footerHTML = `
            <button class="btn btn-ghost" onclick="GFModal.close()">Cancelar</button>
            <button class="btn btn-primary" id="confirmRealEstateBtn">Añadir al Portfolio</button>
        `;

        GFModal.show('🏠 Añadir Propiedad Ficticia', bodyHTML, footerHTML);

        // Event listeners para cálculo dinámico
        const regionSelect = document.getElementById('realEstateRegion');
        const sizeInput = document.getElementById('realEstateSize');
        const valueDiv = document.getElementById('realEstateValue');

        const updateValue = () => {
            const selectedOption = regionSelect.options[regionSelect.selectedIndex];
            const pricePerM2 = parseFloat(selectedOption.dataset.price) || 0;
            const size = parseFloat(sizeInput.value) || 0;
            const total = pricePerM2 * size;
            valueDiv.textContent = Utils.formatCurrency(total);
        };

        regionSelect.addEventListener('change', updateValue);
        sizeInput.addEventListener('input', updateValue);

        // Confirmar
        document.getElementById('confirmRealEstateBtn').addEventListener('click', () => {
            const regionId = regionSelect.value;
            const size = parseFloat(sizeInput.value);
            const type = document.getElementById('realEstateType').value;

            if (!regionId || !size || size <= 0) {
                showToast('Completa todos los campos', 'error');
                return;
            }

            const community = this.communityData.find(c => c.id === regionId);
            const totalValue = community.salePrice * size;

            PortfolioManager.addInvestment({
                type: 'realestate',
                symbol: regionId,
                name: `${type.charAt(0).toUpperCase() + type.slice(1)} en ${community.name}`,
                quantity: size,
                price: community.salePrice,
                currency: 'EUR',
                metadata: {
                    propertyType: type,
                    region: community.name,
                    pricePerM2: community.salePrice
                }
            });

            showToast(`✅ ${type} ${size}m² - ${community.name} (${Utils.formatCurrency(totalValue)})`, 'success');
            GFModal.close();
        });
    }
};

window.openInvestRealEstate = () => RealEstateView.openInvestRealEstate();
window.RealEstateView = RealEstateView;

// =============================================================================
// UTILIDADES
// =============================================================================

function formatNumber(value) {
    const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
    return value.toLocaleString(locale);
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
    setTimeout(() => toast.remove(), 4000);
}
