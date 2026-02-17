/**
 * GentleFinances - Spain Map Logic (Provinces)
 * Renderiza el mapa de España a nivel provincial domo SVG
 */

const SpainMap = {
    // Referencia al contenedor y SVG
    container: null,
    svg: null,
    tooltip: null,

    // Metadatos de provincias: ID -> { Nombre, Comunidad (ID en API) }
    // Asocia los IDs del SVG (ES-XX) con nombres legibles y su C.A. para datos
    provinces: {
        // ANDALUCÍA (andalucia)
        'ES-AL': { name: 'Almería', community: 'andalucia' },
        'ES-CA': { name: 'Cádiz', community: 'andalucia' },
        'ES-CO': { name: 'Córdoba', community: 'andalucia' },
        'ES-GR': { name: 'Granada', community: 'andalucia' },
        'ES-H': { name: 'Huelva', community: 'andalucia' },
        'ES-J': { name: 'Jaén', community: 'andalucia' },
        'ES-MA': { name: 'Málaga', community: 'andalucia' },
        'ES-SE': { name: 'Sevilla', community: 'andalucia' },

        // ARAGÓN (aragon)
        'ES-HU': { name: 'Huesca', community: 'aragon' },
        'ES-TE': { name: 'Teruel', community: 'aragon' },
        'ES-Z': { name: 'Zaragoza', community: 'aragon' },

        // ASTURIAS (asturias)
        'ES-O': { name: 'Asturias', community: 'asturias' },

        // BALEARES (baleares)
        'ES-PM': { name: 'Islas Baleares', community: 'baleares' },

        // CANARIAS (canarias)
        'ES-GC': { name: 'Las Palmas', community: 'canarias' },
        'ES-TF': { name: 'Santa Cruz de Tenerife', community: 'canarias' },

        // CANTABRIA (cantabria)
        'ES-S': { name: 'Cantabria', community: 'cantabria' },

        // CASTILLA LA MANCHA (castilla-mancha)
        'ES-AB': { name: 'Albacete', community: 'castilla-mancha' },
        'ES-CR': { name: 'Ciudad Real', community: 'castilla-mancha' },
        'ES-CU': { name: 'Cuenca', community: 'castilla-mancha' },
        'ES-GU': { name: 'Guadalajara', community: 'castilla-mancha' },
        'ES-TO': { name: 'Toledo', community: 'castilla-mancha' },

        // CASTILLA Y LEÓN (castilla-leon)
        'ES-AV': { name: 'Ávila', community: 'castilla-leon' },
        'ES-BU': { name: 'Burgos', community: 'castilla-leon' },
        'ES-LE': { name: 'León', community: 'castilla-leon' },
        'ES-P': { name: 'Palencia', community: 'castilla-leon' },
        'ES-SA': { name: 'Salamanca', community: 'castilla-leon' },
        'ES-SG': { name: 'Segovia', community: 'castilla-leon' },
        'ES-SO': { name: 'Soria', community: 'castilla-leon' },
        'ES-VA': { name: 'Valladolid', community: 'castilla-leon' },
        'ES-ZA': { name: 'Zamora', community: 'castilla-leon' },

        // CATALUÑA (cataluna)
        'ES-B': { name: 'Barcelona', community: 'cataluna' },
        'ES-GI': { name: 'Girona', community: 'cataluna' }, // Nota: SVG usa GI o GE? Revisar paths.js. Paths usa GI comúnmente o GE (Gerona). En mi paths puse ES-GI.
        'ES-L': { name: 'Lleida', community: 'cataluna' },
        'ES-T': { name: 'Tarragona', community: 'cataluna' },

        // COMUNIDAD VALENCIANA (valencia)
        'ES-A': { name: 'Alicante', community: 'valencia' },
        'ES-CS': { name: 'Castellón', community: 'valencia' },
        'ES-V': { name: 'Valencia', community: 'valencia' },

        // EXTREMADURA (extremadura)
        'ES-BA': { name: 'Badajoz', community: 'extremadura' },
        'ES-CC': { name: 'Cáceres', community: 'extremadura' },

        // GALICIA (galicia)
        'ES-C': { name: 'A Coruña', community: 'galicia' },
        'ES-LU': { name: 'Lugo', community: 'galicia' },
        'ES-OR': { name: 'Ourense', community: 'galicia' },
        'ES-PO': { name: 'Pontevedra', community: 'galicia' },

        // LA RIOJA (la-rioja)
        'ES-LO': { name: 'La Rioja', community: 'la-rioja' }, // SVG ID suele ser LO

        // MADRID (madrid)
        'ES-M': { name: 'Madrid', community: 'madrid' },

        // MURCIA (murcia)
        'ES-MU': { name: 'Murcia', community: 'murcia' },

        // NAVARRA (navarra)
        'ES-NA': { name: 'Navarra', community: 'navarra' },

        // PAÍS VASCO (pais-vasco)
        'ES-VI': { name: 'Álava', community: 'pais-vasco' },
        'ES-SS': { name: 'Gipuzkoa', community: 'pais-vasco' },
        'ES-BI': { name: 'Bizkaia', community: 'pais-vasco' },

        // CIUDADES AUTÓNOMAS
        'ES-CE': { name: 'Ceuta', community: 'andalucia' },
        'ES-ML': { name: 'Melilla', community: 'andalucia' }
    },

    init: function (containerId, priceData) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn('SpainMap: Container not found:', containerId);
            return;
        }

        this.renderMap();

        // Use provided data or load async
        if (priceData) {
            this.applyDataToMapDirect(priceData);
        } else {
            this.loadData();
        }

        // Handle resize if needed
        window.addEventListener('resize', () => {
            // SVG viewBox handles scaling automatically
        });
    },

    renderMap: function () {
        this.container.innerHTML = '';

        // Crear SVG
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        // ViewBox ajustado para centrar España Peninsular + Baleares. Canarias desplazada en el path original.
        // ViewBox: min-x, min-y, width, height
        svg.setAttribute("viewBox", "230 -20 500 550"); // Extra height for Canarias
        svg.style.width = "100%";
        svg.style.height = "auto";
        svg.style.maxHeight = "520px";
        svg.classList.add("spain-map-svg");

        // Crear tooltip
        if (!document.querySelector('.map-tooltip')) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'map-tooltip hidden';
            document.body.appendChild(this.tooltip);
        } else {
            this.tooltip = document.querySelector('.map-tooltip');
        }

        // Renderizar Paths desde window.SpainPaths
        const paths = window.SpainPaths || {};

        Object.keys(this.provinces).forEach(id => {
            const pathData = paths[id];
            if (pathData) {
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", pathData);
                path.setAttribute("id", id);
                path.setAttribute("class", "province-path");
                path.setAttribute("data-name", this.provinces[id].name);

                // Eventos
                path.addEventListener('mouseenter', (e) => this.handleHover(e, id));
                path.addEventListener('mouseleave', (e) => this.handleOut(e));
                path.addEventListener('mousemove', (e) => this.moveTooltip(e));
                path.addEventListener('click', () => this.handleClick(id));

                svg.appendChild(path);
            } else {
                console.warn(`Path not found for province: ${id}`);
            }
        });

        this.container.appendChild(svg);
        this.svg = svg;
    },

    loadData: async function () {
        if (!window.GentleFinancesAPI) return;

        try {
            const realEstateData = await window.GentleFinancesAPI.realEstate.getPrices();
            this.applyDataToMap(realEstateData);
        } catch (error) {
            console.error("Error loading real estate data:", error);
        }
    },

    applyDataToMap: function (data) {
        const communityMap = {};
        if (data.communities) {
            data.communities.forEach(c => communityMap[c.id] = c);
        }

        Object.keys(this.provinces).forEach(id => {
            const provinceMeta = this.provinces[id];
            const communityData = communityMap[provinceMeta.community];

            if (communityData) {
                const path = this.svg.querySelector(`#${id}`);
                if (path) {
                    // Simular precio provincia: Comunidad +/- 15% determinista
                    const variance = this.getDeterministicVariance(id);
                    const simulatedPrice = Math.round(communityData.salePrice * (1 + variance));

                    // Colorear
                    const color = this.getColorForPrice(simulatedPrice);
                    path.style.fill = color;

                    // Guardar datos
                    path.setAttribute('data-price', simulatedPrice);
                    path.setAttribute('data-rent', communityData.rentPrice);
                }
            }
        });
    },

    // Version that accepts direct priceData format from realestate.js
    // Format: { communityId: { salePrice, rentPrice, priceChange1y } }
    applyDataToMapDirect: function (priceData) {
        if (!this.svg) return;

        Object.keys(this.provinces).forEach(id => {
            const provinceMeta = this.provinces[id];
            const communityData = priceData[provinceMeta.community];

            if (communityData) {
                const path = this.svg.querySelector(`#${id}`);
                if (path) {
                    // Simular precio provincia: Comunidad +/- 15% determinista
                    const variance = this.getDeterministicVariance(id);
                    const simulatedPrice = Math.round(communityData.salePrice * (1 + variance));

                    // Colorear
                    const color = this.getColorForPrice(simulatedPrice);
                    path.style.fill = color;

                    // Guardar datos
                    path.setAttribute('data-price', simulatedPrice);
                    path.setAttribute('data-rent', communityData.rentPrice || 0);
                }
            }
        });
    },

    getDeterministicVariance: function (str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Retorna float entre -0.15 y +0.15
        return ((hash % 30) - 15) / 100;
    },

    getColorForPrice: function (price) {
        // Paleta dorada/ámbar acorde con estética GentleFinances
        if (price < 1000) return '#4a4637'; // Marrón oscuro (barato)
        if (price < 1500) return '#6b5c3e';
        if (price < 2000) return '#8c7a45';
        if (price < 2500) return '#ad984c';
        if (price < 3000) return '#c9a227'; // Dorado medio
        if (price < 3500) return '#e6b800';
        return '#ffd700'; // Dorado brillante (muy caro)
    },

    handleHover: function (e, id) {
        const target = e.target;
        target.style.opacity = '0.8';
        target.style.stroke = '#ffd700'; // Gold stroke on hover
        target.style.strokeWidth = '2';
        target.style.zIndex = '100'; // Bring to front visual trick (SVG order matters but stroke helps)

        const name = target.getAttribute('data-name');
        const price = target.getAttribute('data-price');

        this.tooltip.innerHTML = `
            <div style="font-weight:bold; margin-bottom:4px;">${name}</div>
            <div>Venta: <span style="color:#4ade80">${price ? price + ' ' + (window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€') + '/m²' : 'N/A'}</span></div>
        `;
        this.tooltip.classList.remove('hidden');
    },

    handleOut: function (e) {
        const target = e.target;
        target.style.opacity = '1';
        target.style.stroke = 'white';
        target.style.strokeWidth = '0.5';
        this.tooltip.classList.add('hidden');
    },

    moveTooltip: function (e) {
        // Evitar que el tooltip se salga de la pantalla
        const x = e.pageX + 15;
        const y = e.pageY + 15;
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
    },

    handleClick: function (id) {
        const province = this.provinces[id];
        const price = document.getElementById(id).getAttribute('data-price');
        // console.log(`Clicked ${province.name}: ${price}`);
        // Future: Open detail modal
    }
};

// CSS Injection
const mapStyles = document.createElement('style');
mapStyles.textContent = `
    .province-path {
        fill: #2d2d2d; /* Dark default matching app theme */
        stroke: rgba(255, 215, 0, 0.3); /* Subtle gold stroke */
        stroke-width: 0.5;
        transition: all 0.2s ease;
        cursor: pointer;
    }
    .map-tooltip {
        position: absolute;
        background: rgba(30, 41, 59, 0.95); /* Slate-900 transparent */
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        pointer-events: none;
        z-index: 9999;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
        min-width: 120px;
    }
    .map-tooltip.hidden {
        display: none;
    }
    /* Estilo para contenedor para asegurar centrado móvil */
    #spain-map-container {
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(255,255,255,0.02);
        border-radius: 12px;
        padding: 10px;
    }
`;
document.head.appendChild(mapStyles);

// Expose to window for realestate.js access
window.SpainMap = SpainMap;

console.log('✅ SpainMap loaded with', Object.keys(SpainMap.provinces).length, 'provinces');
