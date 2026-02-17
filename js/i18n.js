/**
 * GentleFinances - Sistema de Internacionalización (i18n)
 * Soporta: Español (es), English (en), Deutsch (de)
 */

const I18n = {
    currentLang: 'es',

    translations: {
        es: {
            // Navegación
            nav_dashboard: 'Resumen',
            nav_transactions: 'Transacciones',
            nav_goals: 'Metas',
            nav_subscriptions: 'Suscripciones',
            nav_portfolio: 'Mi Portfolio',
            nav_import: 'Importar',
            nav_reports: 'Informes',
            nav_settings: 'Configuración',
            nav_security: 'Seguridad',
            nav_help: 'Ayuda',
            nav_investments: 'Inversiones',
            nav_crypto: 'Cripto',
            nav_realestate: 'Inmobiliaria',

            // Dashboard
            dash_available: 'Disponible',
            dash_income: 'Ingresos',
            dash_expenses: 'Gastos',
            dash_net_worth: 'Patrimonio Neto',
            dash_recent_activity: 'Actividad Reciente',
            dash_this_month: 'este mes',
            dash_no_activity: 'No hay actividad reciente',
            dash_budget_progress: 'Progreso del Presupuesto',

            // Transacciones
            tx_title: 'Transacciones',
            tx_add: 'Nueva Transacción',
            tx_filter: 'Filtrar',
            tx_search: 'Buscar...',
            tx_all: 'Todas',
            tx_income: 'Ingresos',
            tx_expense: 'Gastos',
            tx_no_results: 'No se encontraron transacciones',
            tx_date: 'Fecha',
            tx_description: 'Descripción',
            tx_amount: 'Importe',
            tx_category: 'Categoría',

            // Categorías
            cat_food: 'Alimentación',
            cat_transport: 'Transporte',
            cat_entertainment: 'Ocio',
            cat_bills: 'Facturas',
            cat_shopping: 'Compras',
            cat_health: 'Salud',
            cat_housing: 'Vivienda',
            cat_salary: 'Salario',
            cat_other: 'Otros',
            cat_general: 'General',
            cat_subscriptions: 'Suscripciones',
            cat_travel: 'Viajes',

            // Importar
            import_title: 'Importar Datos Bancarios',
            import_drop: 'Arrastra tu archivo aquí o haz clic para seleccionarlo',
            import_formats: 'Formatos soportados: CSV, OFX, QIF',
            import_preview: 'Vista Previa',
            import_confirm: 'Confirmar Importación',
            import_cancel: 'Cancelar',
            import_success: 'Importación completada',
            import_transactions: 'transacciones',
            import_income_total: 'Total Ingresos',
            import_expense_total: 'Total Gastos',

            // Configuración
            settings_title: 'Configuración',
            settings_profile: 'Perfil',
            settings_currency: 'Divisa',
            settings_language: 'Idioma',
            settings_dark_mode: 'Modo Oscuro',
            settings_notifications: 'Notificaciones',
            settings_active: 'Activado',
            settings_inactive: 'Desactivado',
            settings_save: 'Guardar',
            settings_export: 'Exportar Datos',
            settings_reset: 'Reiniciar App',

            // Seguridad
            security_title: 'Seguridad',
            security_subtitle: 'Protege tu información financiera',
            security_score_good: 'Tu Nivel de Seguridad es Bueno',
            security_pin: 'Código PIN',
            security_pin_desc: 'Protege la app con un PIN de 4 dígitos',
            security_pin_setup: 'Configurar PIN',
            security_pin_change: 'Cambiar PIN',
            security_pin_remove: 'Eliminar PIN',
            security_sessions: 'Sesiones Activas',
            security_session_current: 'Actual',
            security_revoke: 'Cerrar sesión en este dispositivo',
            security_revoke_all: 'Cerrar Todas las Demás Sesiones',
            security_encryption: 'Cifrado AES-256',
            security_encryption_desc: 'Tus datos están cifrados de extremo a extremo',
            security_active: 'Activo',
            security_gdpr: 'Exportar Todos Mis Datos (GDPR)',
            security_gdpr_desc: 'Descarga una copia de toda tu información',
            security_export_btn: 'Exportar',
            security_change_password: 'Cambiar Contraseña',
            security_change_password_desc: 'Actualiza tu contraseña de acceso',
            security_change_btn: 'Cambiar',

            // Informes
            reports_title: 'Informes',
            reports_week: 'Semana',
            reports_month: 'Mes',
            reports_year: 'Año',
            reports_income: 'Ingresos',
            reports_expenses: 'Gastos',
            reports_savings: 'Ahorro',
            reports_savings_rate: 'Tasa de Ahorro',
            reports_categories: 'Gastos por Categoría',
            reports_trend: 'Tendencia Ingresos vs Gastos',
            reports_daily: 'Gasto Diario',
            reports_top_merchants: 'Top Comercios',
            reports_wealth: 'Distribución de Patrimonio',

            // Ayuda
            help_title: '¿En qué podemos ayudarte?',
            help_search: 'Buscar ayuda...',
            help_getting_started: 'Guía de Inicio Rápido',
            help_faq: 'Preguntas Frecuentes',
            help_contact: 'Contacto',

            // Greeting
            greeting_morning: 'Buenos días',
            greeting_afternoon: 'Buenas tardes',
            greeting_evening: 'Buenas noches',
            welcome_back: 'Bienvenido de nuevo',

            // Dashboard extras
            dash_net_worth_label: 'Patrimonio Neto',
            dash_view_all: 'Ver Todo',
            dash_no_transactions: 'No hay movimientos',

            // Budget
            budget_title: 'Presupuesto',
            budget_income: 'Ingresos',
            budget_budgeted: 'Presupuestado',
            budget_spent: 'Gastado',
            budget_available: 'Disponible',
            budget_add_category: 'Añadir Categoría',

            // Goals
            goals_title: 'Metas de Ahorro',
            goals_add: 'Nueva Meta',
            goals_saved: 'Ahorrado',
            goals_remaining: 'Restante',
            goals_target: 'Objetivo',

            // Subscriptions
            subs_title: 'Suscripciones',
            subs_monthly: 'Mensual',
            subs_annual: 'Anual',
            subs_total_monthly: 'Total Mensual',
            subs_add: 'Nueva Suscripción',

            // Portfolio
            portfolio_title: 'Mi Portfolio',
            portfolio_total_value: 'Valor Total',
            portfolio_daily_change: 'Cambio Diario',
            portfolio_add_investment: 'Añadir Inversión',
            portfolio_stocks: 'Acciones',
            portfolio_crypto: 'Criptomonedas',
            portfolio_realestate: 'Inmobiliario',

            // Transaction modal
            tx_modal_new: 'Nueva Transacción',
            tx_modal_edit: 'Editar Transacción',
            tx_modal_merchant: 'Comercio / Concepto',
            tx_modal_save: 'Guardar',
            tx_modal_expense: 'Gasto',
            tx_modal_income_type: 'Ingreso',

            // Reports export
            reports_export: 'Exportar Informe',
            reports_export_title: 'Exportar Informe Financiero',
            reports_generating: 'Generando...',
            reports_no_data: 'Sin datos en este período',

            // PWA specific
            pwa_install_title: 'Instalar GentleFinances',
            pwa_install_desc: 'Añade la app a tu pantalla de inicio para acceso rápido',
            pwa_install_btn: 'Instalar',
            pwa_install_later: 'Ahora no',
            pwa_offline: 'Sin conexión',
            pwa_online: 'Conectado',
            pwa_update_available: 'Actualización disponible',
            pwa_update_btn: 'Actualizar',

            // Bottom nav
            nav_more: 'Más',
            nav_home: 'Inicio',

            // Confirmations
            confirm_delete: '¿Estás seguro?',
            confirm_yes: 'Sí, eliminar',
            confirm_no: 'Cancelar',

            // Time
            time_now: 'Ahora mismo',
            time_minutes_ago: 'Hace {n} minutos',
            time_hours_ago: 'Hace {n} horas',
            time_days_ago: 'Hace {n} días',

            // Misc
            logout: 'Cerrar Sesión',
            search_placeholder: 'Buscar...',
            view_details: 'Ver detalles',

            // General
            btn_cancel: 'Cancelar',
            btn_save: 'Guardar',
            btn_delete: 'Eliminar',
            btn_edit: 'Editar',
            btn_close: 'Cerrar',
            btn_confirm: 'Confirmar',
            btn_add: 'Añadir',
            loading: 'Cargando...',
            error: 'Error',
            success: 'Éxito',
            no_data: 'Sin datos',
            last_sync: 'Última sincronización',
        },

        en: {
            // Navigation
            nav_dashboard: 'Dashboard',
            nav_transactions: 'Transactions',
            nav_goals: 'Goals',
            nav_subscriptions: 'Subscriptions',
            nav_portfolio: 'My Portfolio',
            nav_import: 'Import',
            nav_reports: 'Reports',
            nav_settings: 'Settings',
            nav_security: 'Security',
            nav_help: 'Help',
            nav_investments: 'Investments',
            nav_crypto: 'Crypto',
            nav_realestate: 'Real Estate',

            // Dashboard
            dash_available: 'Available',
            dash_income: 'Income',
            dash_expenses: 'Expenses',
            dash_net_worth: 'Net Worth',
            dash_recent_activity: 'Recent Activity',
            dash_this_month: 'this month',
            dash_no_activity: 'No recent activity',
            dash_budget_progress: 'Budget Progress',

            // Transactions
            tx_title: 'Transactions',
            tx_add: 'New Transaction',
            tx_filter: 'Filter',
            tx_search: 'Search...',
            tx_all: 'All',
            tx_income: 'Income',
            tx_expense: 'Expenses',
            tx_no_results: 'No transactions found',
            tx_date: 'Date',
            tx_description: 'Description',
            tx_amount: 'Amount',
            tx_category: 'Category',

            // Categories
            cat_food: 'Food & Groceries',
            cat_transport: 'Transport',
            cat_entertainment: 'Entertainment',
            cat_bills: 'Bills',
            cat_shopping: 'Shopping',
            cat_health: 'Health',
            cat_housing: 'Housing',
            cat_salary: 'Salary',
            cat_other: 'Other',
            cat_general: 'General',
            cat_subscriptions: 'Subscriptions',
            cat_travel: 'Travel',

            // Import
            import_title: 'Import Bank Data',
            import_drop: 'Drag your file here or click to select',
            import_formats: 'Supported formats: CSV, OFX, QIF',
            import_preview: 'Preview',
            import_confirm: 'Confirm Import',
            import_cancel: 'Cancel',
            import_success: 'Import completed',
            import_transactions: 'transactions',
            import_income_total: 'Total Income',
            import_expense_total: 'Total Expenses',

            // Settings
            settings_title: 'Settings',
            settings_profile: 'Profile',
            settings_currency: 'Currency',
            settings_language: 'Language',
            settings_dark_mode: 'Dark Mode',
            settings_notifications: 'Notifications',
            settings_active: 'Active',
            settings_inactive: 'Inactive',
            settings_save: 'Save',
            settings_export: 'Export Data',
            settings_reset: 'Reset App',

            // Security
            security_title: 'Security',
            security_subtitle: 'Protect your financial information',
            security_score_good: 'Your Security Level is Good',
            security_pin: 'PIN Code',
            security_pin_desc: 'Protect the app with a 4-digit PIN',
            security_pin_setup: 'Set PIN',
            security_pin_change: 'Change PIN',
            security_pin_remove: 'Remove PIN',
            security_sessions: 'Active Sessions',
            security_session_current: 'Current',
            security_revoke: 'Sign out on this device',
            security_revoke_all: 'Sign Out All Other Sessions',
            security_encryption: 'AES-256 Encryption',
            security_encryption_desc: 'Your data is end-to-end encrypted',
            security_active: 'Active',
            security_gdpr: 'Export All My Data (GDPR)',
            security_gdpr_desc: 'Download a copy of all your information',
            security_export_btn: 'Export',
            security_change_password: 'Change Password',
            security_change_password_desc: 'Update your login password',
            security_change_btn: 'Change',

            // Reports
            reports_title: 'Reports',
            reports_week: 'Week',
            reports_month: 'Month',
            reports_year: 'Year',
            reports_income: 'Income',
            reports_expenses: 'Expenses',
            reports_savings: 'Savings',
            reports_savings_rate: 'Savings Rate',
            reports_categories: 'Expenses by Category',
            reports_trend: 'Income vs Expenses Trend',
            reports_daily: 'Daily Spending',
            reports_top_merchants: 'Top Merchants',
            reports_wealth: 'Wealth Distribution',

            // Help
            help_title: 'How can we help you?',
            help_search: 'Search help...',
            help_getting_started: 'Quick Start Guide',
            help_faq: 'Frequently Asked Questions',
            help_contact: 'Contact',

            // Greeting
            greeting_morning: 'Good morning',
            greeting_afternoon: 'Good afternoon',
            greeting_evening: 'Good evening',
            welcome_back: 'Welcome back',

            // Dashboard extras
            dash_net_worth_label: 'Net Worth',
            dash_view_all: 'View All',
            dash_no_transactions: 'No transactions',

            // Budget
            budget_title: 'Budget',
            budget_income: 'Income',
            budget_budgeted: 'Budgeted',
            budget_spent: 'Spent',
            budget_available: 'Available',
            budget_add_category: 'Add Category',

            // Goals
            goals_title: 'Savings Goals',
            goals_add: 'New Goal',
            goals_saved: 'Saved',
            goals_remaining: 'Remaining',
            goals_target: 'Target',

            // Subscriptions
            subs_title: 'Subscriptions',
            subs_monthly: 'Monthly',
            subs_annual: 'Annual',
            subs_total_monthly: 'Monthly Total',
            subs_add: 'New Subscription',

            // Portfolio
            portfolio_title: 'My Portfolio',
            portfolio_total_value: 'Total Value',
            portfolio_daily_change: 'Daily Change',
            portfolio_add_investment: 'Add Investment',
            portfolio_stocks: 'Stocks',
            portfolio_crypto: 'Cryptocurrencies',
            portfolio_realestate: 'Real Estate',

            // Transaction modal
            tx_modal_new: 'New Transaction',
            tx_modal_edit: 'Edit Transaction',
            tx_modal_merchant: 'Merchant / Concept',
            tx_modal_save: 'Save',
            tx_modal_expense: 'Expense',
            tx_modal_income_type: 'Income',

            // Reports export
            reports_export: 'Export Report',
            reports_export_title: 'Export Financial Report',
            reports_generating: 'Generating...',
            reports_no_data: 'No data in this period',

            // PWA specific
            pwa_install_title: 'Install GentleFinances',
            pwa_install_desc: 'Add the app to your home screen for quick access',
            pwa_install_btn: 'Install',
            pwa_install_later: 'Not now',
            pwa_offline: 'Offline',
            pwa_online: 'Online',
            pwa_update_available: 'Update available',
            pwa_update_btn: 'Update',

            // Bottom nav
            nav_more: 'More',
            nav_home: 'Home',

            // Confirmations
            confirm_delete: 'Are you sure?',
            confirm_yes: 'Yes, delete',
            confirm_no: 'Cancel',

            // Time
            time_now: 'Just now',
            time_minutes_ago: '{n} minutes ago',
            time_hours_ago: '{n} hours ago',
            time_days_ago: '{n} days ago',

            // Misc
            logout: 'Sign Out',
            search_placeholder: 'Search...',
            view_details: 'View details',

            // General
            btn_cancel: 'Cancel',
            btn_save: 'Save',
            btn_delete: 'Delete',
            btn_edit: 'Edit',
            btn_close: 'Close',
            btn_confirm: 'Confirm',
            btn_add: 'Add',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            no_data: 'No data',
            last_sync: 'Last sync',
        },

        de: {
            // Navigation
            nav_dashboard: 'Übersicht',
            nav_transactions: 'Transaktionen',
            nav_goals: 'Ziele',
            nav_subscriptions: 'Abonnements',
            nav_portfolio: 'Mein Portfolio',
            nav_import: 'Importieren',
            nav_reports: 'Berichte',
            nav_settings: 'Einstellungen',
            nav_security: 'Sicherheit',
            nav_help: 'Hilfe',
            nav_investments: 'Investitionen',
            nav_crypto: 'Krypto',
            nav_realestate: 'Immobilien',

            // Dashboard
            dash_available: 'Verfügbar',
            dash_income: 'Einnahmen',
            dash_expenses: 'Ausgaben',
            dash_net_worth: 'Nettovermögen',
            dash_recent_activity: 'Letzte Aktivitäten',
            dash_this_month: 'diesen Monat',
            dash_no_activity: 'Keine aktuellen Aktivitäten',
            dash_budget_progress: 'Budgetfortschritt',

            // Transactions
            tx_title: 'Transaktionen',
            tx_add: 'Neue Transaktion',
            tx_filter: 'Filtern',
            tx_search: 'Suchen...',
            tx_all: 'Alle',
            tx_income: 'Einnahmen',
            tx_expense: 'Ausgaben',
            tx_no_results: 'Keine Transaktionen gefunden',
            tx_date: 'Datum',
            tx_description: 'Beschreibung',
            tx_amount: 'Betrag',
            tx_category: 'Kategorie',

            // Categories
            cat_food: 'Lebensmittel',
            cat_transport: 'Transport',
            cat_entertainment: 'Freizeit',
            cat_bills: 'Rechnungen',
            cat_shopping: 'Einkaufen',
            cat_health: 'Gesundheit',
            cat_housing: 'Wohnen',
            cat_salary: 'Gehalt',
            cat_other: 'Sonstiges',
            cat_general: 'Allgemein',
            cat_subscriptions: 'Abonnements',
            cat_travel: 'Reisen',

            // Import
            import_title: 'Bankdaten Importieren',
            import_drop: 'Datei hier ablegen oder klicken zum Auswählen',
            import_formats: 'Unterstützte Formate: CSV, OFX, QIF',
            import_preview: 'Vorschau',
            import_confirm: 'Import Bestätigen',
            import_cancel: 'Abbrechen',
            import_success: 'Import abgeschlossen',
            import_transactions: 'Transaktionen',
            import_income_total: 'Gesamteinnahmen',
            import_expense_total: 'Gesamtausgaben',

            // Settings
            settings_title: 'Einstellungen',
            settings_profile: 'Profil',
            settings_currency: 'Währung',
            settings_language: 'Sprache',
            settings_dark_mode: 'Dunkelmodus',
            settings_notifications: 'Benachrichtigungen',
            settings_active: 'Aktiv',
            settings_inactive: 'Inaktiv',
            settings_save: 'Speichern',
            settings_export: 'Daten Exportieren',
            settings_reset: 'App Zurücksetzen',

            // Security
            security_title: 'Sicherheit',
            security_subtitle: 'Schützen Sie Ihre Finanzinformationen',
            security_score_good: 'Ihr Sicherheitsniveau ist Gut',
            security_pin: 'PIN-Code',
            security_pin_desc: 'Schützen Sie die App mit einer 4-stelligen PIN',
            security_pin_setup: 'PIN Einrichten',
            security_pin_change: 'PIN Ändern',
            security_pin_remove: 'PIN Entfernen',
            security_sessions: 'Aktive Sitzungen',
            security_session_current: 'Aktuell',
            security_revoke: 'Auf diesem Gerät abmelden',
            security_revoke_all: 'Alle anderen Sitzungen beenden',
            security_encryption: 'AES-256 Verschlüsselung',
            security_encryption_desc: 'Ihre Daten sind Ende-zu-Ende verschlüsselt',
            security_active: 'Aktiv',
            security_gdpr: 'Alle Meine Daten Exportieren (DSGVO)',
            security_gdpr_desc: 'Laden Sie eine Kopie aller Ihrer Daten herunter',
            security_export_btn: 'Exportieren',
            security_change_password: 'Passwort Ändern',
            security_change_password_desc: 'Aktualisieren Sie Ihr Anmeldepasswort',
            security_change_btn: 'Ändern',

            // Reports
            reports_title: 'Berichte',
            reports_week: 'Woche',
            reports_month: 'Monat',
            reports_year: 'Jahr',
            reports_income: 'Einnahmen',
            reports_expenses: 'Ausgaben',
            reports_savings: 'Ersparnisse',
            reports_savings_rate: 'Sparquote',
            reports_categories: 'Ausgaben nach Kategorie',
            reports_trend: 'Einnahmen vs. Ausgaben Trend',
            reports_daily: 'Tägliche Ausgaben',
            reports_top_merchants: 'Top Händler',
            reports_wealth: 'Vermögensverteilung',

            // Help
            help_title: 'Wie können wir Ihnen helfen?',
            help_search: 'Hilfe suchen...',
            help_getting_started: 'Schnellstart-Anleitung',
            help_faq: 'Häufig gestellte Fragen',
            help_contact: 'Kontakt',

            // Greeting
            greeting_morning: 'Guten Morgen',
            greeting_afternoon: 'Guten Tag',
            greeting_evening: 'Guten Abend',
            welcome_back: 'Willkommen zurück',

            // Dashboard extras
            dash_net_worth_label: 'Nettovermögen',
            dash_view_all: 'Alle anzeigen',
            dash_no_transactions: 'Keine Transaktionen',

            // Budget
            budget_title: 'Budget',
            budget_income: 'Einnahmen',
            budget_budgeted: 'Budgetiert',
            budget_spent: 'Ausgegeben',
            budget_available: 'Verfügbar',
            budget_add_category: 'Kategorie hinzufügen',

            // Goals
            goals_title: 'Sparziele',
            goals_add: 'Neues Ziel',
            goals_saved: 'Gespart',
            goals_remaining: 'Verbleibend',
            goals_target: 'Ziel',

            // Subscriptions
            subs_title: 'Abonnements',
            subs_monthly: 'Monatlich',
            subs_annual: 'Jährlich',
            subs_total_monthly: 'Monatliche Gesamtkosten',
            subs_add: 'Neues Abonnement',

            // Portfolio
            portfolio_title: 'Mein Portfolio',
            portfolio_total_value: 'Gesamtwert',
            portfolio_daily_change: 'Tagesveränderung',
            portfolio_add_investment: 'Investition hinzufügen',
            portfolio_stocks: 'Aktien',
            portfolio_crypto: 'Kryptowährungen',
            portfolio_realestate: 'Immobilien',

            // Transaction modal
            tx_modal_new: 'Neue Transaktion',
            tx_modal_edit: 'Transaktion bearbeiten',
            tx_modal_merchant: 'Händler / Konzept',
            tx_modal_save: 'Speichern',
            tx_modal_expense: 'Ausgabe',
            tx_modal_income_type: 'Einnahme',

            // Reports export
            reports_export: 'Bericht exportieren',
            reports_export_title: 'Finanzbericht exportieren',
            reports_generating: 'Wird generiert...',
            reports_no_data: 'Keine Daten in diesem Zeitraum',

            // PWA specific
            pwa_install_title: 'GentleFinances installieren',
            pwa_install_desc: 'Fügen Sie die App zu Ihrem Startbildschirm hinzu',
            pwa_install_btn: 'Installieren',
            pwa_install_later: 'Nicht jetzt',
            pwa_offline: 'Offline',
            pwa_online: 'Online',
            pwa_update_available: 'Update verfügbar',
            pwa_update_btn: 'Aktualisieren',

            // Bottom nav
            nav_more: 'Mehr',
            nav_home: 'Start',

            // Confirmations
            confirm_delete: 'Sind Sie sicher?',
            confirm_yes: 'Ja, löschen',
            confirm_no: 'Abbrechen',

            // Time
            time_now: 'Gerade eben',
            time_minutes_ago: 'Vor {n} Minuten',
            time_hours_ago: 'Vor {n} Stunden',
            time_days_ago: 'Vor {n} Tagen',

            // Misc
            logout: 'Abmelden',
            search_placeholder: 'Suchen...',
            view_details: 'Details anzeigen',

            // General
            btn_cancel: 'Abbrechen',
            btn_save: 'Speichern',
            btn_delete: 'Löschen',
            btn_edit: 'Bearbeiten',
            btn_close: 'Schließen',
            btn_confirm: 'Bestätigen',
            btn_add: 'Hinzufügen',
            loading: 'Laden...',
            error: 'Fehler',
            success: 'Erfolg',
            no_data: 'Keine Daten',
            last_sync: 'Letzte Synchronisierung',
        }
    },

    /**
     * Inicializar el sistema i18n
     */
    init() {
        const saved = localStorage.getItem('gentleFinances_lang');
        if (saved && this.translations[saved]) {
            this.currentLang = saved;
        } else {
            // Detectar idioma del navegador
            const browserLang = navigator.language?.substring(0, 2).toLowerCase();
            if (browserLang && this.translations[browserLang]) {
                this.currentLang = browserLang;
            }
        }
        this.applyTranslations();
        console.log(`🌍 i18n initialized: ${this.currentLang}`);
    },

    /**
     * Obtener traducción para una clave con soporte de parámetros
     * @param {string} key - Clave de traducción
     * @param {Object|string} [params] - Parámetros para plantilla {n}, {name}, etc. o texto fallback (string)
     * @returns {string} Texto traducido con parámetros reemplazados
     * @example I18n.t('time_minutes_ago', { n: 5 }) // "Hace 5 minutos"
     */
    t(key, params = null) {
        const lang = this.translations[this.currentLang];
        let text = lang?.[key] || this.translations['es']?.[key] || '';

        // Si no se encontró traducción, usar params como fallback si es string, o la key
        if (!text) {
            return (typeof params === 'string') ? params : key;
        }

        // Si params es un objeto, reemplazar las plantillas {key} con sus valores
        if (params && typeof params === 'object') {
            Object.keys(params).forEach(param => {
                text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
            });
        }

        return text;
    },

    /**
     * Cambiar idioma
     * @param {string} lang - Código de idioma (es, en, de)
     */
    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.warn(`Language not supported: ${lang}`);
            return;
        }
        this.currentLang = lang;
        localStorage.setItem('gentleFinances_lang', lang);
        this.applyTranslations();

        // Actualizar el sidebar dinámicamente
        if (window.GFSidebar) window.GFSidebar.inject();

        // Disparar evento para que otros módulos puedan reaccionar
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));

        const names = { es: 'Español', en: 'English', de: 'Deutsch' };
        if (window.GentleFinances?.showToast) {
            window.GentleFinances.showToast(`🌍 Idioma: ${names[lang]}`);
        }
    },

    /**
     * Aplicar traducciones al DOM usando atributos data-i18n
     * Uso: <span data-i18n="nav_dashboard">Resumen</span>
     *       <input data-i18n-placeholder="search_placeholder">
     *       <button data-i18n-title="view_details">...</button>
     */
    applyTranslations() {
        // Traducir contenido de texto (data-i18n)
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation && translation !== key) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });

        // Traducir placeholders (data-i18n-placeholder)
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            if (translation && translation !== key) {
                el.placeholder = translation;
            }
        });

        // Traducir atributos title (data-i18n-title)
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translation = this.t(key);
            if (translation && translation !== key) {
                el.title = translation;
            }
        });

        // Actualizar el atributo lang del HTML
        document.documentElement.lang = this.currentLang;
    },

    /**
     * Obtener la lista de idiomas disponibles
     */
    getAvailableLanguages() {
        return [
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
        ];
    }
};

window.I18n = I18n;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => I18n.init());
} else {
    I18n.init();
}

// Escuchar cambio de idioma para actualizar HTML lang y re-renderizar contenido dinámico
window.addEventListener('languageChanged', (e) => {
    const { lang } = e.detail;

    // Actualizar atributo lang del documento
    document.documentElement.lang = lang;

    // Re-renderizar sidebar si existe
    if (window.GFSidebar?.inject) {
        window.GFSidebar.inject();
    }

    // Re-renderizar dashboard si existe y está visible
    if (window.GFDashboard?.render) {
        window.GFDashboard.render();
    }

    // Re-renderizar la vista activa actual si tiene método render
    if (window.GentleFinances?.currentView?.render) {
        window.GentleFinances.currentView.render();
    }
});

console.log('✅ i18n (Multilanguage) loaded - ES / EN / DE');
