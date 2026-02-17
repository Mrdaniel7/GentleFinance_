/**
 * GentleFinances Sidebar Component
 * Componente reutilizable que genera la sidebar idéntica en todas las páginas
 */

const GFSidebar = {
    // Detectar página actual basándose en la URL
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');

        // Mapeo de archivos a data-page
        const pageMap = {
            'index': 'dashboard',
            'transactions': 'transactions',
            'budgets': 'budget',
            'budget': 'budget',
            'goals': 'goals',
            'subscriptions': 'subscriptions',
            'portfolio': 'portfolio',
            'investments': 'investments',
            'crypto': 'crypto',
            'realestate': 'realestate',
            'import': 'import',
            'reports': 'reports',
            'settings': 'settings',
            'security': 'security',
            'help': 'help'
        };

        return pageMap[filename] || 'dashboard';
    },

    // Determinar si estamos en carpeta pages o raíz
    getBasePath() {
        const path = window.location.pathname;
        return path.includes('/pages/') ? '../' : '';
    },

    // Generar HTML de la sidebar
    generateHTML() {
        const currentPage = this.getCurrentPage();
        const base = this.getBasePath();
        const pagesPath = base ? '' : 'pages/';

        const items = [
            // Principal
            { page: 'dashboard', href: `${base}index.html`, icon: 'home', label: 'Resumen' },
            { page: 'transactions', href: `${base}${pagesPath}transactions.html`, icon: 'list', label: 'Transacciones' },
            { page: 'goals', href: `${base}${pagesPath}goals.html`, icon: 'target', label: 'Metas' },
            { page: 'subscriptions', href: `${base}${pagesPath}subscriptions.html`, icon: 'calendar', label: 'Suscripciones' },

            // Portfolio con submenu
            { page: 'portfolio', href: `${base}${pagesPath}portfolio.html`, icon: 'briefcase', label: 'Mi Portfolio', hasSubmenu: true },


            // Separator + Herramientas
            { type: 'separator', label: 'Herramientas' },
            { page: 'import', href: `${base}${pagesPath}import.html`, icon: 'upload', label: 'Importar' },
            { page: 'reports', href: `${base}${pagesPath}reports.html`, icon: 'chart', label: 'Informes' },

            // Separator + Config
            { type: 'separator' },
            { page: 'settings', href: `${base}${pagesPath}settings.html`, icon: 'settings', label: 'Configuración' },
            { page: 'security', href: `${base}${pagesPath}security.html`, icon: 'lock', label: 'Seguridad' },
            { page: 'help', href: `${base}${pagesPath}help.html`, icon: 'help', label: 'Ayuda' }
        ];

        let html = `
            <a href="${base}index.html" class="sidebar-logo">
                <img src="${base}assets/logo.svg" alt="GentleFinances" class="sidebar-logo-icon">
                <span class="sidebar-logo-text">GentleFinances</span>
            </a>
            <nav class="sidebar-nav" aria-label="Navegación principal">
        `;

        items.forEach(item => {
            if (item.type === 'separator') {
                html += `
                    <div style="margin: var(--space-md) 0; border-top: 1px solid var(--border-subtle);"></div>
                    ${item.label ? `<div class="text-muted" style="font-size: var(--text-xs); padding: var(--space-sm); text-transform: uppercase; letter-spacing: 0.1em;">${item.label}</div>` : ''}
                `;
            } else {
                const isActive = currentPage === item.page;
                const activeClass = isActive ? ' active' : '';

                if (item.hasSubmenu) {
                    html += `
                    <a href="#" onclick="GFSidebar.toggleSubmenu('${item.page}'); return false;" class="sidebar-item${activeClass}" data-page="${item.page}">
                        ${this.getIcon(item.icon)}
                        <span>${item.label}</span>
                        <span class="sidebar-arrow">▾</span>
                    </a>
                `;

                } else {
                    html += `
                    <a href="#" onclick="Navigation.navigateTo('${item.page}'); return false;" class="sidebar-item${activeClass}" data-page="${item.page}">
                        ${this.getIcon(item.icon)}
                        <span>${item.label}</span>
                    </a>
                `;
                }

                // Submenu del portfolio
                if (item.hasSubmenu && item.page === 'portfolio') {
                    const isPortfolioSection = ['portfolio', 'investments', 'crypto', 'realestate'].includes(currentPage);
                    html += `
                    <div class="sidebar-submenu${isPortfolioSection ? ' expanded' : ''}" id="portfolioSubmenu">
                            <a href="#" onclick="Navigation.navigateTo('portfolio'); return false;" class="sidebar-subitem" data-filter="portfolio">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><polyline points="17,9 12,14 9,11 6,14"/></svg>
                                Resumen
                            </a>
                            <a href="#" onclick="Navigation.navigateTo('investments'); return false;" class="sidebar-subitem" data-filter="stocks">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>
                                Inversiones
                            </a>
                            <a href="#" onclick="Navigation.navigateTo('crypto'); return false;" class="sidebar-subitem" data-filter="crypto">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.5 8h5.5a2 2 0 110 4h-5.5"/><path d="M9 12h5a2 2 0 110 4H9"/></svg>
                                Cripto
                            </a>
                            <a href="#" onclick="Navigation.navigateTo('realestate'); return false;" class="sidebar-subitem" data-filter="realestate">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
                                Inmobiliaria
                            </a>
                        </div>
                    `;
                }
            }
        });

        html += `
            </nav>
            <div class="sidebar-footer">
                <div class="card" style="padding: var(--space-md);">
                    <div class="text-muted" style="font-size: var(--text-xs);">ÚLTIMA SINCRONIZACIÓN</div>
                    <div class="text-secondary" style="font-size: var(--text-sm);" id="lastSync">Hace 5 minutos</div>
                </div>
            </div>
        `;

        return html;
    },

    // Obtener icono SVG
    getIcon(name) {
        const icons = {
            home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>',
            list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>',
            grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
            target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
            calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
            briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>',
            trending: '<polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/>',
            bitcoin: '<circle cx="12" cy="12" r="10"/><path d="M9.5 8h5.5a2 2 0 110 4h-5.5"/><path d="M9 12h5a2 2 0 110 4H9"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/>',
            building: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>',
            upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>',
            chart: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
            users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
            settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>',
            lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
            help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
        };

        return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${icons[name] || ''}</svg>`;
    },

    // Inyectar sidebar en la página
    inject() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.innerHTML = this.generateHTML();
        }
    },

    // Toggle submenu para elementos con submenú
    toggleSubmenu(page) {
        if (page === 'portfolio') {
            const submenu = document.getElementById('portfolioSubmenu');
            const arrow = document.querySelector('[data-page="portfolio"] .sidebar-arrow');
            if (submenu) {
                submenu.classList.toggle('expanded');
                if (arrow) {
                    arrow.style.transform = submenu.classList.contains('expanded') ? 'rotate(180deg)' : '';
                }
            }
        }
    }
};

// Auto-inyectar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    GFSidebar.inject();
});

// Export global
window.GFSidebar = GFSidebar;

console.log('✅ Sidebar Component cargado');
