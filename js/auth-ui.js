// =============================================================================
// AUTENTICACIÓN UI - GentleFinances (GATEKEEPER EDITION v2)
// Control Estricto de Acceso + Manejo de Carga Diferida
// =============================================================================

const AuthUI = {
    initialized: false,
    retryCount: 0,
    maxRetries: 50, // 5 seconds approx

    // Inicializar listeners de autenticación
    async init() {
        if (this.initialized) return;

        // 1. Estado Inicial: Muestra Loading por defecto
        this.toggleView('loading');

        // 2. Esperar a AuthService (Polling + Evento)
        if (typeof AuthService === 'undefined') {
            console.warn('⏳ AuthUI: AuthService not ready yet. Waiting...');

            // Opción A: Escuchar evento
            window.addEventListener('firebase-ready', () => {
                console.log('⚡ AuthUI: Received firebase-ready event.');
                this.init();
            }, { once: true });

            // Opción B: Polling de seguridad (por si el evento ya pasó)
            setTimeout(() => this.checkDependency(), 100);
            return;
        }

        this.initialized = true;
        console.log('✅ AuthUI: Initializing with AuthService...');

        // 3. Manejo de Redirección (Google)
        try {
            const redirectResult = await AuthService.checkRedirectResult();
            if (redirectResult && !redirectResult.success) {
                this.showError(redirectResult.error);
            }
        } catch (e) {
            console.error('Redirect Error:', e);
        }

        // 4. EL GATEKEEPER: Escuchar cambios de estado
        AuthService.onAuthChange((user) => {
            console.log('🔐 Auth State Changed:', user ? `User: ${user.email}` : 'No User');

            if (user) {
                if (user.emailVerified) {
                    this.grantAccess(user);
                } else {
                    this.denyAccess('unverified', user);
                }
            } else {
                this.denyAccess('guest');
            }
        });

        this.bindEvents();
    },

    checkDependency() {
        if (typeof AuthService !== 'undefined') {
            this.init();
        } else if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            setTimeout(() => this.checkDependency(), 100);
        } else {
            console.error('⛔ AuthUI: Timeout waiting for AuthService.');
            alert('Error de conexión con el servicio de autenticación. Recarga la página.');
            // Fallback: Show login anyway to avoid permanent blank screen, though it won't work well
            this.toggleView('auth');
        }
    },

    // Toggle de Vistas (Helper centralizado)
    toggleView(viewName) {
        const loading = document.getElementById('loadingScreen');
        const auth = document.getElementById('authContainer');
        const app = document.getElementById('appContainer');

        // Helper to force hide
        const hide = (el) => {
            if (el) {
                el.style.display = 'none';
                if (el.id === 'appContainer') el.style.setProperty('display', 'none', 'important');
            }
        };

        hide(loading);
        hide(auth);
        hide(app);

        switch (viewName) {
            case 'loading':
                if (loading) loading.style.display = 'flex';
                break;
            case 'auth':
                if (auth) auth.style.display = 'flex';
                break;
            case 'app':
                if (app) {
                    app.style.display = 'block';
                    // Remove !important if it was set via style attribute string previously
                    app.style.removeProperty('display');
                    app.style.display = 'block';
                }
                break;
        }
    },

    // ✅ Conceder Acceso
    grantAccess(user) {
        console.log('🔓 Access Granted.');

        // 1. Mostrar App
        this.toggleView('app');

        // 2. Actualizar UI Usuario
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = user.displayName || user.email || 'Usuario';

        const userAvatarEl = document.getElementById('userAvatar');
        if (userAvatarEl && user.photoURL) userAvatarEl.src = user.photoURL;

        // 3. Inicializar Módulos (SOLO AHORA)
        try {
            if (window.Security && window.Security.init) window.Security.init();
            if (typeof Dashboard !== 'undefined' && Dashboard.init) Dashboard.init();
            if (typeof Transactions !== 'undefined' && Transactions.init) Transactions.init();
            if (typeof Budget !== 'undefined' && Budget.init) Budget.init();
            if (typeof Settings !== 'undefined' && Settings.loadUserProfile) Settings.loadUserProfile();
        } catch (e) {
            console.warn('Error initializing modules:', e);
        }
    },

    // ⛔ Denegar Acceso
    denyAccess(reason, user = null) {
        // console.log(`⛔ Access Denied: ${reason}`);
        this.toggleView('auth'); // Mostrar Login

        // Asegurar que estamos en la pestaña de login
        const tabLogin = document.getElementById('tabLogin');
        if (tabLogin) tabLogin.click();

        if (reason === 'unverified') {
            this.showError('auth/email-not-verified', user);
        }
    },

    bindEvents() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            this.setLoading(true);
            const result = await AuthService.login(email, password);
            this.setLoading(false);

            if (!result.success) {
                this.showError(result.error, result.user);
            }
        });

        // Register form
        document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            this.setLoading(true);
            const result = await AuthService.register(email, password, name);
            this.setLoading(false);

            if (!result.success) {
                this.showError(result.error);
            }
        });

        // Google login
        document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
            this.setLoading(true);
            try {
                const result = await AuthService.loginWithGoogle();
                if (!result.redirecting) this.setLoading(false);
                if (!result.success && !result.redirecting) this.showError(result.error);
            } catch (error) {
                this.setLoading(false);
                this.showError(error.message || 'Error desconocido');
            }
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            await AuthService.logout();
        });

        // Tabs Logic
        const tabLogin = document.getElementById('tabLogin');
        const tabRegister = document.getElementById('tabRegister');
        const loginSection = document.getElementById('loginSection');
        const registerSection = document.getElementById('registerSection');
        const errorEl = document.getElementById('authError');

        if (tabLogin && tabRegister) {
            tabLogin.addEventListener('click', () => {
                tabLogin.classList.add('active');
                tabRegister.classList.remove('active');
                loginSection.style.display = 'block';
                registerSection.style.display = 'none';
                if (errorEl) errorEl.style.display = 'none';
            });

            tabRegister.addEventListener('click', () => {
                tabRegister.classList.add('active');
                tabLogin.classList.remove('active');
                registerSection.style.display = 'block';
                loginSection.style.display = 'none';
                if (errorEl) errorEl.style.display = 'none';
            });
        }
    },

    setLoading(loading) {
        const buttons = document.querySelectorAll('.btn-auth-primary, .btn-auth-google');
        buttons.forEach(btn => {
            if (loading) {
                if (btn.textContent.trim() !== 'Cargando...') btn.dataset.originalText = btn.innerHTML;
                btn.disabled = true;
                btn.textContent = 'Cargando...';
            } else {
                btn.disabled = false;
                if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
            }
        });
    },

    showError(message, user = null) {
        const errorEl = document.getElementById('authError');
        if (!errorEl) return alert(this.translateError(message));

        if (message === 'auth/email-not-verified') {
            errorEl.innerHTML = `
                Tu email no ha sido verificado.<br>
                <button id="resendVerificationBtn" class="btn btn-sm btn-secondary" style="margin-top: 10px;">Reenviar correo</button>
            `;
            setTimeout(() => {
                document.getElementById('resendVerificationBtn')?.addEventListener('click', async (e) => {
                    e.target.textContent = 'Enviando...';
                    e.target.disabled = true;
                    if (user) {
                        const res = await AuthService.resendVerificationEmail(user);
                        if (res.success) {
                            e.target.textContent = '¡Enviado!';
                            setTimeout(() => errorEl.style.display = 'none', 2000);
                        } else {
                            e.target.textContent = 'Error';
                            alert(res.error);
                        }
                    } else {
                        alert("Inicia sesión de nuevo.");
                    }
                });
            }, 0);
        } else {
            errorEl.textContent = this.translateError(message);
        }
        errorEl.style.display = 'block';
        if (message !== 'auth/email-not-verified') setTimeout(() => errorEl.style.display = 'none', 5000);
    },

    translateError(error) {
        const translations = {
            'auth/invalid-email': 'Email inválido',
            'auth/user-disabled': 'Usuario deshabilitado',
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/email-already-in-use': 'Email ya registrado',
            'auth/weak-password': 'Contraseña muy débil',
            'auth/network-request-failed': 'Error de conexión',
            'auth/popup-closed-by-user': 'Ventana cerrada',
            'auth/email-not-verified': 'Email no verificado',
            'auth/invalid-credential': 'Credenciales inválidas'
        };
        for (const [key, value] of Object.entries(translations)) {
            if (error.includes(key)) return value;
        }
        return error;
    }
};

document.addEventListener('DOMContentLoaded', () => AuthUI.init());
window.AuthUI = AuthUI;
