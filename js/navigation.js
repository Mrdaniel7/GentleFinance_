/**
 * Sistema de Navegación SPA
 * Maneja el cambio de vistas y estado activo de la UI.
 */
const Navigation = {
    currentPage: 'dashboard',

    /**
     * Inicializar navegación
     */
    init() {
        console.log('🧭 Navigation module initialized');

        // Manejar botón atrás/adelante del navegador
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.page) {
                this.navigateTo(event.state.page, false);
            } else {
                // Fallback a hash o dashboard
                const hash = window.location.hash.substring(1);
                this.navigateTo(hash || 'dashboard', false);
            }
        });

        // Cargar página inicial
        const initialPage = window.location.hash.substring(1) || 'dashboard';
        this.navigateTo(initialPage, false, true); // Don't push state on initial load to avoid duplicate entry
    },

    /**
     * Navegar a una sección
     * @param {string} pageId - ID de la página (sin 'view-')
     * @param {boolean} pushState - Si se debe guardar en el historial
     * @param {boolean} isInitial - Si es la carga inicial
     */
    navigateTo(pageId, pushState = true, isInitial = false) {
        if (!pageId) return;

        // Normalizar pageId, quitar '#' si existe
        if (pageId.startsWith('#')) pageId = pageId.substring(1);

        const viewId = `view-${pageId}`;
        const view = document.getElementById(viewId);

        if (!view) {
            console.warn(`View not found: ${viewId}`);
            // Fallback to dashboard if view doesn't exist
            if (pageId !== 'dashboard') {
                this.navigateTo('dashboard', false);
            }
            return;
        }

        // 1. Ocultar todas las vistas
        document.querySelectorAll('.view-section').forEach(el => {
            el.style.display = 'none';
            el.classList.remove('active');
        });

        // 2. Mostrar vista actual
        view.style.display = 'block';
        // Pequeño timeout para permitir que display:block surta efecto antes de añadir clase de animación
        setTimeout(() => view.classList.add('active'), 10);

        // 3. Actualizar Sidebar (Desktop)
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
            // Check dataset or href logic
            const href = item.getAttribute('onclick');
            if (href && href.includes(`'${pageId}'`)) {
                item.classList.add('active');
            }
        });

        // 4. Actualizar Drawer (Mobile)
        // Similar logic for mobile

        // 5. Scroll to top
        window.scrollTo(0, 0);

        // 6. Actualizar Historial
        if (pushState) {
            history.pushState({ page: pageId }, '', `#${pageId}`);
        }

        // 7. Actualizar estado global
        this.currentPage = pageId;
        if (window.GentleFinances && window.GentleFinances.state) {
            window.GentleFinances.state.currentPage = pageId;
        }

        // 8. Inicializar módulo específico si es necesario
        this.initPageModule(pageId);

        // 9. Disparar evento para componentes externos (bottom nav, etc.)
        window.dispatchEvent(new CustomEvent('pageChanged', { detail: { page: pageId } }));

        // 10. Actualizar bottom nav
        document.querySelectorAll('.bottom-nav .nav-item').forEach(b => {
            const bp = b.getAttribute('data-page');
            if (bp) b.classList.toggle('active', bp === pageId);
        });

        // 11. Actualizar mobile drawer items
        document.querySelectorAll('.mobile-drawer-item').forEach(item => {
            const dp = item.getAttribute('data-page');
            if (dp) item.classList.toggle('active', dp === pageId);
        });

        console.log(`Navigated to: ${pageId}`);
    },

    /**
     * Inicializar lógica específica de la página
     */
    initPageModule(pageId) {
        console.log(`Initializing module for: ${pageId}`);
        switch (pageId) {
            case 'dashboard':
                if (window.Dashboard && window.Dashboard.init) window.Dashboard.init();
                break;
            case 'transactions':
                if (window.Transactions && window.Transactions.render) window.Transactions.render();
                break;
            case 'budget':
                if (window.Budget && window.Budget.init) window.Budget.init();
                break;
            case 'goals':
                if (window.Goals && window.Goals.init) window.Goals.init();
                break;
            case 'investments':
                if (window.initInvestments) window.initInvestments();
                break;
            case 'crypto':
                if (window.CryptoView && window.CryptoView.init) window.CryptoView.init();
                break;
            case 'realestate':
                if (window.RealEstateView && window.RealEstateView.init) window.RealEstateView.init();
                break;
            case 'subscriptions':
                if (window.Subscriptions && window.Subscriptions.init) window.Subscriptions.init();
                break;
            case 'portfolio':
                if (window.PortfolioManager && window.PortfolioManager.init) window.PortfolioManager.init();
                break;
            case 'import':
                if (window.Import && window.Import.init) window.Import.init();
                break;
            case 'reports':
                if (window.Reports && window.Reports.init) window.Reports.init();
                break;
            case 'settings':
                if (window.Settings && window.Settings.init) window.Settings.init();
                break;
        }
    }
};

// Global Helpers
window.openMobileDrawer = function () {
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (drawer) drawer.classList.add('active');
    if (overlay) overlay.classList.add('active');
};

window.closeMobileDrawer = function () {
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (drawer) drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
};

window.toggleMobileSubmenu = function (id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = el.style.display === 'block' ? 'none' : 'block';
    }
};

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Delay init slightly to allow other components (like Sidebar) to mount
    setTimeout(() => {
        Navigation.init();
    }, 50);

    // Vincular botón de menú móvil si existe y no tiene evento inline
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (menuBtn) {
        menuBtn.onclick = window.openMobileDrawer;
    }
});

// Exponer globalmente
window.Navigation = Navigation;
