// ============================================
// GENTLEFINANCES - Main Application
// Core functionality and utilities
// ============================================

/**
 * GentleFinances App
 * Main application singleton
 */
const GentleFinances = {
    // App version
    version: '1.0.0',

    // App state
    state: {
        currentPage: 'dashboard',
        isOnline: navigator.onLine,
        lastSync: new Date(),
        user: null,
        accounts: [],
        transactions: [],
        budgets: [],
        goals: []
    },

    // Configuration
    config: {
        currency: 'EUR',
        currencySymbol: '€',
        locale: 'es-ES',
        dateFormat: 'dd/MM/yyyy',
        animationDuration: 300
    },

    /**
     * Initialize the application
     */
    async init() {
        console.log(`🌟 GentleFinances v${this.version} - Initializing...`);

        // Check online status
        this.setupOnlineStatus();

        // Register Global Sync
        window.syncAccountBalance = this.syncAccountBalance.bind(this);
        this.initializeComponents();

        // Security Check
        if (window.Security) {
            await Security.init();
            if (Security.checkProtection()) {
                console.log('🔒 Security Lock Active');
            }
        }

        // Setup event listeners
        this.setupEventListeners();

        // Update greeting
        this.updateGreeting();

        // wait for auth before loading data
        this.setupAuthListener();

        console.log('✅ GentleFinances initialized successfully');

        // Hide loading screen after a short delay
        // Loader is handled by AuthUI (Gatekeeper)
        // setTimeout(() => { ... }, 1500);

        // Register Service Worker for PWA
        this.registerServiceWorker();
    },

    /**
     * Register Service Worker
     */
    registerServiceWorker() {
        // Registration now handled in index.html for PWA update detection
        // This is kept as a no-op fallback
        console.log('📱 PWA: Service Worker registration delegated to index.html');
    },

    /**
     * Setup Auth Listener
     */
    setupAuthListener() {
        const initListener = () => {
            if (window.AuthService) {
                window.AuthService.onAuthChange(async (user) => {
                    this.state.user = user;
                    if (user && user.emailVerified) {
                        console.log('👤 User authenticated and verified:', user.email);

                        // 1. SYNC ENCRYPTION KEY (Critical before loading data)
                        if (window.CryptoService) {
                            try {
                                await window.CryptoService.syncKey(user.uid);
                            } catch (e) {
                                console.error('Critical: Failed to sync encryption key', e);
                                this.showToast('Error de seguridad al sincronizar claves', 'error');
                            }
                        }

                        // 2. Load Data
                        await this.loadFirebaseData();
                        if (window.Dashboard) window.Dashboard.init();
                        if (window.Subscriptions) {
                            await window.Subscriptions.loadData();
                            window.Subscriptions.render();
                        }
                        if (window.Transactions) window.Transactions.init();
                        if (window.Budget) window.Budget.init();
                        if (window.Reports) window.Reports.init(); // Fix race condition
                        if (window.PortfolioManager) window.PortfolioManager.init(); // Ensure portfolio is synced
                        if (window.Settings) window.Settings.init(); // Init settings (profile, theme)
                    } else {
                        console.log('👤 User signed out. Clearing state.');
                        this.clearState();
                    }
                });
            }
        };

        if (window.AuthService) {
            initListener();
        } else {
            window.addEventListener('firebase-ready', initListener, { once: true });
        }
    },

    /**
     * Load data from Firebase
     */
    async loadFirebaseData() {
        try {
            console.log('🔥 Loading data from Firebase...');

            // Load Accounts
            const accounts = await window.FirestoreService.accounts.getAll();
            this.state.accounts = accounts;

            // Load Budgets (current month)
            const budgets = await window.FirestoreService.budgets.getAll();
            this.state.budgets = budgets;

            // Load Goals
            const goals = await window.FirestoreService.goals.getAll();
            this.state.goals = goals;

            // Load Portfolio
            if (window.PortfolioManager) {
                await window.PortfolioManager.init();
            }

            // Note: Transactions are loaded by Transactions module via subscription

            // Cache data in IndexedDB for offline access
            if (window.CacheDB) {
                try {
                    if (accounts?.length) await CacheDB.putAll('accounts', accounts);
                    if (budgets?.length) await CacheDB.putAll('budgets', budgets);
                    if (goals?.length) await CacheDB.putAll('goals', goals);
                    console.log('📦 Data cached in IndexedDB');
                } catch (cacheErr) {
                    console.warn('📦 IndexedDB cache failed (non-critical):', cacheErr.message);
                }
            }

            console.log('📦 Data loaded from Firebase');
        } catch (error) {
            console.error('Failed to load data from Firebase:', error);

            // Fallback: try loading from IndexedDB cache
            if (window.CacheDB) {
                try {
                    console.log('📦 Attempting to load from IndexedDB cache...');
                    this.state.accounts = await CacheDB.getAll('accounts');
                    this.state.budgets = await CacheDB.getAll('budgets');
                    this.state.goals = await CacheDB.getAll('goals');
                    console.log('📦 Data loaded from IndexedDB cache (offline mode)');
                    this.showToast('Datos cargados desde caché local', 'warning');
                } catch (cacheErr) {
                    console.error('📦 IndexedDB cache also failed:', cacheErr);
                    this.showToast('Error al cargar datos', 'error');
                }
            } else {
                this.showToast('Error al cargar datos', 'error');
            }
        }
    },

    /**
     * Clear application state
     */
    clearState() {
        console.log('🧹 Clearing application state (Strict Mode)...');
        this.state.user = null;
        this.state.accounts = [];
        this.state.transactions = [];
        this.state.budgets = [];
        this.state.goals = [];

        // UI Cleanup
        if (window.AuthUI && typeof window.AuthUI.denyAccess === 'function') {
            window.AuthUI.denyAccess('guest');
        } else if (window.AuthUI && typeof window.AuthUI.toggleView === 'function') {
            window.AuthUI.toggleView('auth');
        } else {
            // Fallback if AuthUI not ready
            const authC = document.getElementById('authContainer');
            const appC = document.getElementById('appContainer');
            if (authC) authC.style.display = 'flex';
            if (appC) appC.style.display = 'none';
        }
    },

    /**
     * Setup online/offline status listeners
     */
    setupOnlineStatus() {
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            this.showToast('Conexión restaurada', 'success');
        });

        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            this.showToast('Sin conexión - Modo offline', 'warning');
        });
    },

    /**
     * Initialize UI components
     */
    initializeComponents() {
        this.initModals();
        this.initForms();
    },

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Add transaction button
        const addBtn = document.getElementById('addTransactionBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddTransactionModal());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }

            // Ctrl/Cmd + N for new transaction
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openAddTransactionModal();
            }
        });

        // Window resize handler
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 200));
    },

    /**
     * Initialize modal functionality
     */
    initModals() {
        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal(overlay.id);
                }
            });
        });

        // Close button handlers
        document.querySelectorAll('.modal-close, #cancelTransactionBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
    },

    /**
     * Initialize form handlers
     */
    initForms() {
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTransactionSubmit(e.target);
            });
        }

        // Transaction type toggle
        const typeExpense = document.getElementById('typeExpense');
        const typeIncome = document.getElementById('typeIncome');

        if (typeExpense && typeIncome) {
            typeExpense.addEventListener('click', () => {
                typeExpense.classList.add('btn-secondary');
                typeExpense.classList.remove('btn-ghost');
                typeIncome.classList.remove('btn-secondary');
                typeIncome.classList.add('btn-ghost');
            });

            typeIncome.addEventListener('click', () => {
                typeIncome.classList.add('btn-secondary');
                typeIncome.classList.remove('btn-ghost');
                typeExpense.classList.remove('btn-secondary');
                typeExpense.classList.add('btn-ghost');
            });
        }

        // Set default date to today
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }

        // Delete button handler
        const deleteBtn = document.getElementById('deleteTransactionBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.confirmAndDeleteTransaction();
            });
        }
    },

    /**
     * Confirm and Delete Transaction (called from UI)
     */
    confirmAndDeleteTransaction() {
        const id = document.getElementById('transactionId').value;
        if (!id) return;

        Safety.confirm(
            'Eliminar Transacción',
            'Se eliminará esta transacción y se ajustará el saldo. ¿Deseas continuar?',
            () => this.deleteTransaction(id),
            'simple' // Modo simple: sin escribir "borrar"
        );
    },

    /**
     * Handle transaction form submission
     * @param {HTMLFormElement} form 
     */
    async handleTransactionSubmit(form) {
        const formData = new FormData(form);
        const isIncome = document.getElementById('typeIncome').classList.contains('btn-secondary');
        const category = document.getElementById('category').value;

        const transaction = {
            merchantName: document.getElementById('merchant').value,
            description: document.getElementById('merchant').value, // Use merchant as description for now
            amount: parseFloat(document.getElementById('amount').value) * (isIncome ? 1 : -1),
            category: category,
            categoryId: category, // Map basic category to ID
            date: new Date(document.getElementById('date').value),
            icon: this.getCategoryIcon(category)
        };

        // Validate amount
        if (isNaN(transaction.amount)) {
            this.showToast('Por favor, introduce un importe válido', 'error');
            return;
        }

        try {
            // Handle Multiple File Uploads
            const uploadedFiles = [];

            if (this.filesToUpload.length > 0) {
                this.showToast(`Subiendo ${this.filesToUpload.length} archivos...`, 'info');

                for (const file of this.filesToUpload) {
                    try {
                        const downloadURL = await window.StorageService.uploadFile(file, 'receipts');
                        uploadedFiles.push({
                            url: downloadURL,
                            name: file.name,
                            type: file.type
                        });
                    } catch (uploadError) {
                        console.error('File upload failed:', uploadError);
                        this.showToast(`Error al subir ${file.name}`, 'warning');
                    }
                }
            }

            // Combine existing and new files
            const finalFiles = [...this.existingFiles, ...uploadedFiles];

            // Save to transaction object
            transaction.files = finalFiles;

            // Backward compatibility for single file view
            if (finalFiles.length > 0) {
                transaction.fileUrl = finalFiles[0].url;
                transaction.fileName = finalFiles[0].name;
            } else {
                transaction.fileUrl = null;
                transaction.fileName = null;
            }

            const id = document.getElementById('transactionId').value;
            let accountParams = { amountDiff: 0 };

            if (id) {
                // Update existing
                // Find old transaction to calculate difference
                const oldTx = this.state.transactions.find(t => t.id === id);

                if (oldTx) {
                    accountParams.amountDiff = transaction.amount - oldTx.amount;
                } else {
                    // Fallback if not found in state (shouldn't happen if loaded)
                    accountParams.amountDiff = transaction.amount;
                }

                await window.FirestoreService.transactions.update(id, transaction);
                this.showToast('Transacción actualizada', 'gold');

                // Update local state immediately
                const index = this.state.transactions.findIndex(t => t.id === id);
                if (index !== -1) {
                    this.state.transactions[index] = { ...this.state.transactions[index], ...transaction };
                }

            } else {
                // Create new
                accountParams.amountDiff = transaction.amount;
                console.log('Creating transaction:', transaction); // Debug
                const newId = await window.FirestoreService.transactions.create(transaction);
                this.showToast('Transacción guardada', 'gold');

                // Update local state immediately
                this.state.transactions.unshift({ ...transaction, id: newId });
            }

            // --- SYNC ACCOUNT BALANCE ---
            await this.syncAccountBalance(accountParams.amountDiff);
            // ----------------------------

            this.closeAllModals();

            // Reset form
            form.reset();
            document.getElementById('transactionId').value = '';
            document.getElementById('date').valueAsDate = new Date();
            document.getElementById('deleteTransactionBtn').style.display = 'none';

            // Refresh dashboard
            if (window.Dashboard) window.Dashboard.refresh();

        } catch (error) {
            console.error('Error saving transaction:', error);
            this.showToast('Error al guardar transacción', 'error');
        }
    },

    /**
     * Sync Account Balance helper
     * Updates the first available account or creates one
     * @param {number} amountDiff 
     */
    async syncAccountBalance(amountDiff) {
        if (!amountDiff || isNaN(amountDiff)) return;

        try {
            let account = (this.state.accounts || []).find(a => a.isDefault) || (this.state.accounts || [])[0];

            if (!account) {
                // Create default account if none exists
                const newAccount = {
                    name: 'Cuenta Principal',
                    balance: parseFloat(amountDiff) || 0,
                    type: 'cash',
                    currency: 'EUR',
                    isDefault: true
                };
                console.log('Creating default account...');
                const id = await window.FirestoreService.accounts.create(newAccount);
                account = { ...newAccount, id };
                this.state.accounts.push(account);
            } else {
                // Update existing account
                const newBalance = (parseFloat(account.balance) || 0) + amountDiff;
                account.balance = newBalance;

                if (window.FirestoreService?.accounts) {
                    await window.FirestoreService.accounts.update(account.id, { balance: newBalance });
                }
            }

            console.log(`💰 Account '${account.name}' synced. New balance: ${account.balance}`);

        } catch (error) {
            console.error('Error syncing account balance:', error);
            this.showToast('Error al actualizar saldo', 'error');
        }
    },

    /**
     * Get icon for category
     * @param {string} category 
     * @returns {string}
     */
    getCategoryIcon(category) {
        const icons = {
            food: '🍽️',
            transport: '🚗',
            entertainment: '🎬',
            bills: '📄',
            shopping: '🛍️',
            health: '🏥',
            subscriptions: '📺',
            income: '💼'
        };
        return icons[category] || '💰';
    },

    /**
     * Open a modal
     * @param {string} modalId 
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Focus first input
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    },

    /**
     * Close a modal
     * @param {string} modalId 
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Close all modals
     */
    closeAllModals() {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    },

    // --- File Management ---

    filesToUpload: [], // Array of File objects
    existingFiles: [], // Array of {url, name, type} objects

    /**
     * Handle file selection from input
     * @param {HTMLInputElement} input 
     */
    handleFileSelect(input) {
        const files = Array.from(input.files);
        if (!files.length) return;

        // Limit total files
        const currentCount = this.filesToUpload.length + this.existingFiles.length;
        if (currentCount + files.length > 5) {
            this.showToast('Máximo 5 archivos por transacción', 'warning');
            return;
        }

        this.filesToUpload = [...this.filesToUpload, ...files];
        this.renderFileGrid();

        // Reset input to allow selecting same file again if deleted
        input.value = '';
    },

    /**
     * Remove file from list
     * @param {string} type - 'new' or 'existing'
     * @param {number} index 
     */
    removeFile(type, index) {
        if (type === 'new') {
            this.filesToUpload.splice(index, 1);
        } else {
            this.existingFiles.splice(index, 1);
        }
        this.renderFileGrid();
    },

    /**
     * Render the file grid
     */
    renderFileGrid() {
        const grid = document.getElementById('fileGrid');
        if (!grid) return;

        grid.innerHTML = '';

        // Create Add Button dynamically
        const addBtn = document.createElement('div');
        addBtn.className = 'file-add-btn';
        addBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            `;
        addBtn.onclick = () => document.getElementById('transactionFile').click();

        // Calculate total files
        const totalFiles = this.filesToUpload.length + this.existingFiles.length;

        // Render Existing Files
        this.existingFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';

            const isImage = file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

            if (isImage) {
                item.innerHTML = `<img src="${file.url}" alt="${file.name}">`;
            } else {
                item.innerHTML = `<span class="file-type-icon">📄</span>`;
            }

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = (e) => {
                e.stopPropagation(); // Prevent opening file
                this.removeFile('existing', index);
            };
            item.appendChild(removeBtn);

            // Open on click
            item.onclick = () => {
                console.log('Opening file:', file.url);
                if (file.url) {
                    window.open(file.url, '_blank');
                } else {
                    console.warn('File has no URL');
                }
            };

            grid.appendChild(item);
        });

        // Render New Uploads
        this.filesToUpload.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    item.innerHTML = `<img src="${e.target.result}" alt="${file.name}">` + item.innerHTML;
                };
                reader.readAsDataURL(file);
            } else {
                item.innerHTML = `<span class="file-type-icon">📄</span>`;
            }

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                this.removeFile('new', index);
            };
            item.appendChild(removeBtn);
            item.innerHTML += `<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(212,175,55,0.8);color:white;font-size:8px;text-align:center;">NUEVO</div>`;

            grid.appendChild(item);
        });

        // Add button at the end if limit not reached
        if (totalFiles < 5) {
            grid.appendChild(addBtn);
        }
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'gold') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
                <span>${message}</span>
                <button class="btn btn-icon btn-ghost" onclick="this.parentElement.remove()" style="margin-left: auto; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; padding: 0;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            `;

        container.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    /**
     * Update greeting based on time of day
     */
    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Buenos días';

        if (hour >= 12 && hour < 18) {
            greeting = 'Buenas tardes';
        } else if (hour >= 18 || hour < 6) {
            greeting = 'Buenas noches';
        }

        const greetingEl = document.querySelector('h1.text-gold');
        if (greetingEl) {
            greetingEl.textContent = greeting;
        }
    },

    /**
     * Update last sync display
     */
    updateLastSync() {
        const syncEl = document.getElementById('lastSync');
        if (syncEl) {
            syncEl.textContent = Utils.formatRelativeTime(this.state.lastSync);
        }
    },

    /**
     * Refresh dashboard data manually (optional helper)
     */
    refreshData() {
        if (this.state.user) {
            this.loadFirebaseData();
        }
    },

    /**
     * Refresh dashboard data
     */
    refreshDashboard() {
        // Delegate to Dashboard module for accurate calculation
        if (window.Dashboard && window.Dashboard.refresh) {
            window.Dashboard.refresh();
        }
    },

    /**
     * Handle window resize
     */
    handleResize() {
        // Handle responsive adjustments if needed
        console.log('Window resized');
    },

    /**
     * Open Modal to Edit Transaction
     * @param {Object} tx 
     */
    openEditTransactionModal(tx) {
        const modal = document.getElementById('addTransactionModal');
        if (!modal) return;

        // Update Title
        modal.querySelector('.modal-title').textContent = 'Editar Transacción';

        // Set ID
        document.getElementById('transactionId').value = tx.id;
        document.getElementById('currentFileUrl').value = tx.fileUrl || '';
        document.getElementById('currentFileName').value = tx.fileName || '';

        // Set Type
        const isIncome = tx.amount > 0;
        const typeExpense = document.getElementById('typeExpense');
        const typeIncome = document.getElementById('typeIncome');

        if (isIncome) {
            typeIncome.click();
        } else {
            typeExpense.click();
        }

        // Set Values
        document.getElementById('amount').value = Math.abs(tx.amount);
        document.getElementById('merchant').value = tx.merchantName || tx.description;
        document.getElementById('category').value = tx.categoryId || tx.category || 'other';

        // Date
        const date = tx.dateObj || new Date(tx.date);
        document.getElementById('date').value = date.toISOString().split('T')[0];

        // Show Files
        this.filesToUpload = [];
        this.existingFiles = [];

        if (tx.files && Array.isArray(tx.files)) {
            this.existingFiles = [...tx.files];
        } else if (tx.fileUrl) {
            // Backward compatibility
            this.existingFiles.push({
                url: tx.fileUrl,
                name: tx.fileName || 'Archivo adjunto',
                type: 'unknown'
            });
        }

        this.renderFileGrid();

        // Show Delete Button
        const deleteBtn = document.getElementById('deleteTransactionBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'block';
        }

        this.openModal('addTransactionModal');
    },

    /**
     * Delete Transaction
     * @param {string} id 
     */
    async deleteTransaction(id) {
        try {
            // Find transaction to revert balance
            const tx = this.state.transactions.find(t => t.id === id);

            await window.FirestoreService.transactions.delete(id);

            // Revert balance (subtract the amount)
            if (tx) {
                await this.syncAccountBalance(-tx.amount);
            }

            this.showToast('Transacción eliminada', 'gold');
            this.closeAllModals();

            // Refresh dashboard
            if (window.Dashboard) window.Dashboard.refresh();

        } catch (error) {
            console.error('Error deleting transaction:', error);
            this.showToast('Error al eliminar', 'error');
        }
    },

    /**
     * Open Modal to Add Transaction (Reset Form)
     */
    openAddTransactionModal() {
        const modal = document.getElementById('addTransactionModal');
        if (!modal) return;

        // Reset Title
        modal.querySelector('.modal-title').textContent = 'Nueva Transacción';

        // Reset ID and Form
        document.getElementById('transactionId').value = '';
        document.getElementById('transactionForm').reset();
        document.getElementById('date').valueAsDate = new Date();
        document.getElementById('deleteTransactionBtn').style.display = 'none';

        // Reset File
        this.filesToUpload = [];
        this.existingFiles = [];
        this.renderFileGrid();

        // Defaults
        document.getElementById('typeExpense').click();

        this.openModal('addTransactionModal');
    }
};

/**
 * Utility Functions
 */
const Utils = {
    /**
     * Format currency
     * @param {number} amount 
     * @param {string} currency 
     * @returns {string}
     */
    formatCurrency(amount, currency) {
        const curr = currency || window.Settings?.preferences?.currency || 'EUR';
        const locale = this._getLocale ? this._getLocale() : 'es-ES';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: curr,
            minimumFractionDigits: 2
        }).format(amount);
    },

    /**
     * Format relative time
     * @param {Date} date 
     * @returns {string}
     */
    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const t = window.I18n ? (k, p) => window.I18n.t(k, p) : null;

        if (minutes < 1) return t ? t('time_now') : 'Ahora mismo';
        if (minutes < 60) return t ? t('time_minutes_ago', { n: minutes }) : `Hace ${minutes} min`;
        if (hours < 24) return t ? t('time_hours_ago', { n: hours }) : `Hace ${hours}h`;
        if (days < 7) return t ? t('time_days_ago', { n: days }) : `Hace ${days}d`;

        return new Date(date).toLocaleDateString(this._getLocale());
    },

    /**
     * Format date
     * @param {Date} date 
     * @returns {string}
     */
    formatDate(date) {
        return new Intl.DateTimeFormat(this._getLocale(), {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(new Date(date));
    },

    /**
     * Get locale string based on current i18n language
     * @returns {string} Locale (e.g., 'es-ES', 'en-US', 'de-DE')
     */
    _getLocale() {
        const localeMap = { es: 'es-ES', en: 'en-US', de: 'de-DE' };
        const lang = window.I18n?.currentLang || 'es';
        return localeMap[lang] || 'es-ES';
    },

    /**
     * Debounce function
     * @param {Function} func 
     * @param {number} wait 
     * @returns {Function}
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     * @param {Function} func 
     * @param {number} limit 
     * @returns {Function}
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Generate unique ID
     * @returns {string}
     */
    generateId() {
        return `${Date.now()} -${Math.random().toString(36).substr(2, 9)} `;
    },

    /**
     * Deep clone object
     * @param {Object} obj 
     * @returns {Object}
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    GentleFinances.init();
});

// Make available globally
window.GentleFinances = GentleFinances;
window.Utils = Utils;
