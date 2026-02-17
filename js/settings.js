/**
 * Controlador de Configuración
 * Gestiona preferencias de usuario y ajustes
 */

const Settings = {
    preferences: {
        darkMode: true,
        currency: 'EUR',
        currencySymbol: '€',
        dateFormat: 'DD/MM/YYYY',
        notifications: true,
        budgetAlerts: true,
        weeklyReport: false,
        pin: false,
        biometric: false
    },

    currencySymbols: {
        'EUR': '€',
        'USD': '$',
        'GBP': '£'
    },

    // Inicialización
    init() {
        this.loadPreferences();
        this.applyTheme();
        this.updateUI();
        this.loadUserProfile();
    },

    // Cargar perfil del usuario
    // Cargar perfil del usuario
    // Cargar perfil del usuario
    async loadUserProfile() {
        if (!window.AuthService || !window.FirestoreService) return;

        let user = window.AuthService.getCurrentUser();
        if (user) {
            // Intento de obtener datos extendidos de Firestore
            try {
                const userDoc = await window.FirestoreService.users.get(user.uid);
                if (userDoc) {
                    // Mezclar datos de Auth con Firestore (Firestore tiene prioridad para nombres custom)
                    user = { ...user, ...userDoc };
                }
            } catch (e) {
                console.warn('Could not fetch user profile from Firestore', e);
            }

            const nameEl = document.getElementById('settings-userName');
            const emailEl = document.getElementById('settings-userEmail');
            const avatarEl = document.getElementById('settings-userAvatar');

            // Logica estricta de visualización: NADA de placeholders genéricos
            const displayName = user.displayName || user.name || 'Usuario';

            if (nameEl) nameEl.textContent = displayName;

            if (emailEl) {
                let emailText = user.email;
                // Add member since date if available
                if (user.metadata && user.metadata.creationTime) {
                    try {
                        const date = new Date(user.metadata.creationTime);
                        const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
                        const dateStr = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
                        const memberSince = { es: 'Miembro desde', en: 'Member since', de: 'Mitglied seit' };
                        const lang = window.I18n?.currentLang || 'es';
                        emailText += ` • ${memberSince[lang] || memberSince.es} ${dateStr}`;
                    } catch (e) {
                        console.warn('Error formatting date', e);
                    }
                }
                emailEl.textContent = emailText;
            }

            if (avatarEl) {
                if (user.photoURL) {
                    avatarEl.innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius: 50%;">`;
                } else {
                    const initial = (displayName.charAt(0) || '?').toUpperCase();
                    avatarEl.textContent = initial;
                    avatarEl.innerHTML = initial; // Reset HTML in case it had an image
                }
            }
        }
    },

    // Cargar preferencias del localStorage
    loadPreferences() {
        const saved = localStorage.getItem('gentleFinances_settings');
        if (saved) {
            try {
                this.preferences = { ...this.preferences, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Error loading settings:', e);
            }
        }
    },

    // Guardar preferencias
    savePreferences() {
        localStorage.setItem('gentleFinances_settings', JSON.stringify(this.preferences));
        // Emit custom event for other modules to react
        window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.preferences }));
    },

    // Actualizar UI con las preferencias actuales
    updateUI() {
        // Currency selector
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.value = this.preferences.currency;
        }

        // Language selector
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) {
            const currentLang = window.I18n?.currentLang || this.preferences.language || 'es';
            langSelect.value = currentLang;
        }

        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        const darkModeStatus = document.getElementById('darkModeStatus');
        if (darkModeToggle) {
            darkModeToggle.classList.toggle('active', this.preferences.darkMode);
        }
        if (darkModeStatus) {
            darkModeStatus.textContent = this.preferences.darkMode ? 'Activado' : 'Desactivado';
        }

        // Notifications toggle
        const notifToggle = document.getElementById('notifToggle');
        const notifStatus = document.getElementById('notifStatus');
        if (notifToggle) {
            notifToggle.classList.toggle('active', this.preferences.notifications);
        }
        if (notifStatus) {
            notifStatus.textContent = this.preferences.notifications ? 'Activadas' : 'Desactivadas';
        }
    },

    // Cambiar idioma
    setLanguage(lang) {
        if (window.I18n) {
            window.I18n.setLanguage(lang);
        }
        this.preferences.language = lang;
        this.savePreferences();
    },

    // Cambiar divisa
    setCurrency(currency) {
        this.preferences.currency = currency;
        this.preferences.currencySymbol = this.currencySymbols[currency] || '€';
        this.savePreferences();
        this.showToast(`Divisa cambiada a ${currency}`);

        // Refresh current view to update currency display
        if (window.Navigation && Navigation.currentPage) {
            Navigation.initPageLogic(Navigation.currentPage);
        }
    },

    // Obtener símbolo de divisa actual
    getCurrencySymbol() {
        return this.preferences.currencySymbol || '€';
    },

    // Formatear precio con divisa actual
    formatPrice(amount) {
        const symbol = this.getCurrencySymbol();
        if (window.Utils?.formatCurrency) return Utils.formatCurrency(amount);
        const formatted = Math.abs(amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
    },

    // Toggle tema oscuro
    toggleDarkMode() {
        this.preferences.darkMode = !this.preferences.darkMode;
        this.applyTheme();
        this.savePreferences();
        this.updateUI();
        this.showToast(this.preferences.darkMode ? 'Modo oscuro activado' : 'Modo claro activado');
    },

    // Toggle notificaciones
    toggleNotifications() {
        this.preferences.notifications = !this.preferences.notifications;
        this.savePreferences();
        this.updateUI();
        this.showToast(this.preferences.notifications ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
    },

    // Aplicar tema
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.preferences.darkMode ? 'dark' : 'light');
    },

    // Mostrar popup de ayuda para bancos
    showBankHelp() {
        const helpHTML = `
            <div class="help-popup-overlay active" id="bankHelpPopup" onclick="if(event.target === this) Settings.closeBankHelp()">
                <div class="help-popup">
                    <div class="help-popup-header">
                        <h3 class="help-popup-title">📥 Cómo importar desde tu banco</h3>
                        <button class="btn btn-ghost btn-icon" onclick="Settings.closeBankHelp()">✕</button>
                    </div>
                    <div class="flex flex-col gap-md">
                        <div class="card" style="background: var(--bg-tertiary);">
                            <h4 style="margin-bottom: var(--space-sm);">🏦 BBVA</h4>
                            <ol style="padding-left: var(--space-lg); color: var(--text-secondary); font-size: var(--text-sm);">
                                <li>Accede a tu banca online BBVA</li>
                                <li>Ve a Cuentas > Movimientos</li>
                                <li>Haz clic en "Exportar" arriba a la derecha</li>
                                <li>Selecciona formato CSV y el rango de fechas</li>
                                <li>Descarga e importa aquí</li>
                            </ol>
                        </div>
                        <div class="card" style="background: var(--bg-tertiary);">
                            <h4 style="margin-bottom: var(--space-sm);">🔴 Santander</h4>
                            <ol style="padding-left: var(--space-lg); color: var(--text-secondary); font-size: var(--text-sm);">
                                <li>Entra en tu banca online Santander</li>
                                <li>Ve a Mis Cuentas > Ver movimientos</li>
                                <li>Selecciona las fechas deseadas</li>
                                <li>Pulsa "Descargar" y elige Excel/CSV</li>
                                <li>Importa el archivo descargado</li>
                            </ol>
                        </div>
                        <div class="card" style="background: var(--bg-tertiary);">
                            <h4 style="margin-bottom: var(--space-sm);">⭐ CaixaBank</h4>
                            <ol style="padding-left: var(--space-lg); color: var(--text-secondary); font-size: var(--text-sm);">
                                <li>Accede a CaixaBankNow</li>
                                <li>Ve a Cuentas > Movimientos</li>
                                <li>Filtra por fechas si lo deseas</li>
                                <li>Haz clic en el icono de descarga (⬇️)</li>
                                <li>Selecciona formato CSV</li>
                            </ol>
                        </div>
                        <div class="card" style="background: var(--bg-tertiary);">
                            <h4 style="margin-bottom: var(--space-sm);">🦁 ING</h4>
                            <ol style="padding-left: var(--space-lg); color: var(--text-secondary); font-size: var(--text-sm);">
                                <li>Entra en tu área de cliente ING</li>
                                <li>Ve a Cuentas > Movimientos</li>
                                <li>Selecciona el período</li>
                                <li>Pulsa "Exportar" > CSV</li>
                                <li>Importa el archivo aquí</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', helpHTML);
    },

    closeBankHelp() {
        const popup = document.getElementById('bankHelpPopup');
        if (popup) popup.remove();
    },

    // Exportar todos los datos
    exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            settings: this.preferences,
            transactions: JSON.parse(localStorage.getItem('gentleFinances_transactions') || '[]'),
            budgets: JSON.parse(localStorage.getItem('gentleFinances_budgets') || '[]'),
            goals: JSON.parse(localStorage.getItem('gentleFinances_goals') || '[]')
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `gentlefinances-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
        this.showToast('Datos exportados correctamente');
    },

    // Reiniciar app (borrar datos locales)
    resetApp() {
        const confirm = window.confirm('¿Estás seguro? Esto borrará todos los datos locales. Esta acción no se puede deshacer.');
        if (!confirm) return;

        const confirmAgain = window.confirm('Esta es tu última oportunidad. ¿Reiniciar la aplicación?');
        if (!confirmAgain) return;

        // Limpiar localStorage manteniendo solo las credenciales
        const keysToRemove = ['gentleFinances_transactions', 'gentleFinances_budgets', 'gentleFinances_goals', 'gentleFinances_settings'];
        keysToRemove.forEach(key => localStorage.removeItem(key));

        this.showToast('Aplicación reiniciada');
        setTimeout(() => window.location.reload(), 1500);
    },

    // Borrar datos de la nube
    async clearCloudData() {
        Safety.confirm(
            '⚠️ BORRAR DATOS NUBE',
            'Esto eliminará permanentemente todas tus transacciones del servidor. Esta acción es IRREVERSIBLE.',
            async () => {
                try {
                    if (window.FirestoreService && window.FirestoreService.transactions) {
                        await window.FirestoreService.transactions.deleteAll();
                        this.showToast('Datos de la nube eliminados correctamente');
                        // Clear local state
                        if (window.GentleFinances) {
                            window.GentleFinances.state.transactions = [];
                            // Force refresh
                            if (window.Dashboard) window.Dashboard.refresh();
                        }
                    } else {
                        throw new Error('Servicio no disponible');
                    }
                } catch (error) {
                    console.error('Error clearing cloud data:', error);
                    this.showToast('Error al borrar datos: ' + error.message, 'error');
                }
            }
        );
    },

    // Toast
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

// Make available globally
window.Settings = Settings;

// Global currency formatter helper
window.formatCurrency = (amount) => Settings.formatPrice(amount);
