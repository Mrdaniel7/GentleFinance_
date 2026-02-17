/**
 * Controlador de Seguridad - GentleFinances
 * Real security: PIN con hash SHA-256, sesiones reales Firestore,
 * cambio de contraseña Firebase, exportación GDPR real.
 */

const Security = {
    settings: {
        hasPIN: false,
        sessions: []
    },
    currentSessionId: null,

    // -------------------------------------------------------------------------
    // INICIALIZACIÓN
    // -------------------------------------------------------------------------

    async init() {
        console.log('🛡️ Security: Initializing...');
        if (window.AuthService) {
            window.AuthService.onAuthChange(async (user) => {
                if (user) {
                    await this.loadSettings(user.uid);
                    await this.initSessions(user.uid);
                    this.updateSecurityScore();
                } else {
                    this.settings = { hasPIN: false, sessions: [] };
                }
            });
        }
    },

    // -------------------------------------------------------------------------
    // CARGA Y GUARDADO EN FIRESTORE
    // -------------------------------------------------------------------------

    async loadSettings(userId) {
        try {
            if (!window.FirestoreService?.db) return;
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const docRef = doc(window.FirestoreService.db, 'users', userId, 'settings', 'security');
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                // Solo guardamos si tiene PIN (el hash, no el PIN en claro)
                this.settings.hasPIN = !!data.pinHash;
                this.settings.pinHash = data.pinHash || null;
            }
            this.updatePINUI();
            console.log('🛡️ Security settings loaded');
        } catch (e) {
            console.error('Error loading security settings:', e);
        }
    },

    async saveSettings(data) {
        const user = window.AuthService?.currentUser;
        if (!user || !window.FirestoreService?.db) return;
        try {
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const docRef = doc(window.FirestoreService.db, 'users', user.uid, 'settings', 'security');
            await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
            console.log('🛡️ Security settings saved');
        } catch (e) {
            console.error('Error saving security settings:', e);
        }
    },

    // -------------------------------------------------------------------------
    // HASH DE PIN (SHA-256 nativo, sin librerías externas)
    // -------------------------------------------------------------------------

    async hashPIN(pin) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin + 'GentleFinances_salt_v1');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async verifyPIN(pin, storedHash) {
        const hash = await this.hashPIN(pin);
        return hash === storedHash;
    },

    // -------------------------------------------------------------------------
    // CONFIGURAR / CAMBIAR / ELIMINAR PIN
    // -------------------------------------------------------------------------

    async setupPIN() {
        const modal = this._createPINModal('Configurar PIN', 'Introduce un PIN de 4 dígitos:', async (pin) => {
            if (!/^\d{4}$/.test(pin)) {
                this.showToast('El PIN debe tener exactamente 4 dígitos numéricos', 'error');
                return false;
            }
            const confirm = await this._promptPIN('Confirma tu PIN:');
            if (pin !== confirm) {
                this.showToast('Los PINs no coinciden. Inténtalo de nuevo.', 'error');
                return false;
            }
            const hash = await this.hashPIN(pin);
            await this.saveSettings({ pinHash: hash });
            this.settings.hasPIN = true;
            this.settings.pinHash = hash;
            this.updatePINUI();
            this.updateSecurityScore();
            this.showToast('✅ PIN configurado correctamente');
            return true;
        });
    },

    async changePIN() {
        if (!this.settings.hasPIN) { this.setupPIN(); return; }

        const current = await this._promptPIN('Introduce tu PIN actual:');
        const valid = await this.verifyPIN(current, this.settings.pinHash);
        if (!valid) {
            this.showToast('PIN incorrecto', 'error');
            return;
        }
        const newPIN = await this._promptPIN('Introduce el nuevo PIN (4 dígitos):');
        if (!/^\d{4}$/.test(newPIN)) {
            this.showToast('El PIN debe tener exactamente 4 dígitos numéricos', 'error');
            return;
        }
        const confirmPIN = await this._promptPIN('Confirma el nuevo PIN:');
        if (newPIN !== confirmPIN) {
            this.showToast('Los PINs no coinciden', 'error');
            return;
        }
        const hash = await this.hashPIN(newPIN);
        await this.saveSettings({ pinHash: hash });
        this.settings.pinHash = hash;
        this.showToast('✅ PIN cambiado correctamente');
    },

    async removePIN() {
        if (!this.settings.hasPIN) return;
        const current = await this._promptPIN('Introduce tu PIN actual para eliminarlo:');
        const valid = await this.verifyPIN(current, this.settings.pinHash);
        if (!valid) {
            this.showToast('PIN incorrecto', 'error');
            return;
        }
        if (!confirm('¿Seguro que quieres eliminar el PIN? La app quedará desprotegida.')) return;
        await this.saveSettings({ pinHash: null });
        this.settings.hasPIN = false;
        this.settings.pinHash = null;
        this.updatePINUI();
        this.updateSecurityScore();
        this.showToast('PIN eliminado');
    },

    // Auxiliar: mostrar un campo de texto en un pequeño modal inline
    _promptPIN(label) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.7);
                display: flex; align-items: center; justify-content: center; z-index: 9999;
            `;
            overlay.innerHTML = `
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: var(--space-xl); min-width: 300px; text-align: center;">
                    <p style="margin-bottom: var(--space-md); font-weight: var(--font-medium);">${label}</p>
                    <input type="password" id="_pinPromptInput" maxlength="4" inputmode="numeric" pattern="[0-9]*"
                        style="width: 100%; text-align: center; font-size: 2rem; letter-spacing: 0.5rem; padding: var(--space-md); background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); margin-bottom: var(--space-md);"
                        placeholder="••••">
                    <div style="display: flex; gap: var(--space-md); justify-content: center;">
                        <button id="_pinCancelBtn" class="btn btn-ghost">Cancelar</button>
                        <button id="_pinOkBtn" class="btn btn-primary">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            const input = overlay.querySelector('#_pinPromptInput');
            input.focus();
            const confirm = () => {
                const val = input.value;
                overlay.remove();
                resolve(val);
            };
            overlay.querySelector('#_pinOkBtn').onclick = confirm;
            overlay.querySelector('#_pinCancelBtn').onclick = () => { overlay.remove(); resolve(''); };
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirm(); });
        });
    },

    // -------------------------------------------------------------------------
    // PANTALLA DE BLOQUEO
    // -------------------------------------------------------------------------

    checkProtection() {
        if (this.settings.hasPIN) {
            this.showLockScreen();
            return true;
        }
        return false;
    },

    showLockScreen() {
        const lockScreen = document.getElementById('security-lock-screen');
        if (lockScreen) {
            lockScreen.style.display = 'flex';
            const input = document.getElementById('security-pin-input');
            if (input) { input.value = ''; setTimeout(() => input.focus(), 100); }
        }
    },

    async unlock() {
        const input = document.getElementById('security-pin-input');
        if (!input) return;
        const pin = input.value;

        if (!this.settings.pinHash) {
            // No hay PIN configurado, cerrar la pantalla igualmente
            this._hideLockScreen();
            return;
        }

        const valid = await this.verifyPIN(pin, this.settings.pinHash);
        if (valid) {
            this._hideLockScreen();
            this.showToast('🔓 Acceso concedido');
        } else {
            this.showToast('❌ PIN incorrecto', 'error');
            const parent = input.parentElement;
            if (parent) {
                parent.classList.add('shake');
                setTimeout(() => parent.classList.remove('shake'), 500);
            }
            input.value = '';
        }
    },

    _hideLockScreen() {
        const lockScreen = document.getElementById('security-lock-screen');
        if (lockScreen) {
            lockScreen.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                lockScreen.style.display = 'none';
                lockScreen.style.animation = '';
            }, 300);
        }
    },

    // -------------------------------------------------------------------------
    // CAMBIO DE CONTRASEÑA (Firebase Auth real)
    // -------------------------------------------------------------------------

    async changePassword() {
        const user = window.AuthService?.currentUser;
        if (!user) { this.showToast('Debes iniciar sesión', 'error'); return; }

        // Firebase requiere re-autenticación reciente para cambiar contraseña
        const currentPwd = await this._promptPassword('Introduce tu contraseña actual:');
        if (!currentPwd) return;

        const newPwd = await this._promptPassword('Nueva contraseña (mínimo 8 caracteres):');
        if (!newPwd) return;
        if (newPwd.length < 8) {
            this.showToast('La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }
        const confirmPwd = await this._promptPassword('Confirma la nueva contraseña:');
        if (newPwd !== confirmPwd) {
            this.showToast('Las contraseñas no coinciden', 'error');
            return;
        }

        try {
            // Re-autenticar con Firebase antes de cambiar contraseña
            const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } =
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

            const credential = EmailAuthProvider.credential(user.email, currentPwd);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPwd);
            this.showToast('✅ Contraseña actualizada correctamente');
        } catch (e) {
            console.error('Error changing password:', e);
            if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
                this.showToast('Contraseña actual incorrecta', 'error');
            } else if (e.code === 'auth/requires-recent-login') {
                this.showToast('Por seguridad, cierra sesión y vuelve a entrar antes de cambiar la contraseña', 'error');
            } else {
                this.showToast('Error al cambiar contraseña: ' + e.message, 'error');
            }
        }
    },

    _promptPassword(label) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.7);
                display: flex; align-items: center; justify-content: center; z-index: 9999;
            `;
            overlay.innerHTML = `
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: var(--space-xl); min-width: 320px;">
                    <p style="margin-bottom: var(--space-md); font-weight: var(--font-medium);">${label}</p>
                    <input type="password" id="_pwdPromptInput"
                        style="width: 100%; padding: var(--space-md); background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); margin-bottom: var(--space-md);">
                    <div style="display: flex; gap: var(--space-md); justify-content: flex-end;">
                        <button id="_pwdCancelBtn" class="btn btn-ghost">Cancelar</button>
                        <button id="_pwdOkBtn" class="btn btn-primary">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            const input = overlay.querySelector('#_pwdPromptInput');
            input.focus();
            const confirm = () => { const v = input.value; overlay.remove(); resolve(v); };
            overlay.querySelector('#_pwdOkBtn').onclick = confirm;
            overlay.querySelector('#_pwdCancelBtn').onclick = () => { overlay.remove(); resolve(''); };
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirm(); });
        });
    },

    // -------------------------------------------------------------------------
    // SESIONES REALES (Firestore)
    // -------------------------------------------------------------------------

    async initSessions(userId) {
        if (!userId) return;

        let sessionId = sessionStorage.getItem('gentleFinances_sessionId');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
            sessionStorage.setItem('gentleFinances_sessionId', sessionId);
        }
        this.currentSessionId = sessionId;

        const ua = navigator.userAgent;
        let browser = 'Navegador';
        if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';

        let os = 'Sistema';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (/iPhone|iPad/.test(ua)) os = 'iOS';

        const deviceType = /Mobile|Android|iPhone|iPad/i.test(ua) ? '📱' : '💻';

        const sessionData = {
            id: sessionId,
            browser,
            os,
            deviceType,
            lastActive: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        try {
            await window.FirestoreService.sessions.create(userId, sessionData);
            await this.refreshSessionsList(userId);
        } catch (e) {
            console.error('Error registering session:', e);
        }
    },

    async refreshSessionsList(userId) {
        if (!userId) {
            const user = window.AuthService?.currentUser;
            if (user) userId = user.uid;
            else return;
        }
        try {
            const sessions = await window.FirestoreService.sessions.list(userId);
            this.settings.sessions = sessions;
            this.renderSessions();
        } catch (e) {
            console.error('Error fetching sessions:', e);
        }
    },

    renderSessions() {
        const container = document.getElementById('security-sessions-list');
        if (!container) return;

        if (!this.settings.sessions || this.settings.sessions.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">No hay sesiones activas registradas</div>';
            return;
        }

        container.innerHTML = '';
        this.settings.sessions.forEach(session => {
            const isCurrent = session.id === this.currentSessionId;
            const el = document.createElement('div');
            el.style.cssText = 'display: flex; align-items: center; gap: var(--space-md); padding: var(--space-md); background: var(--bg-tertiary); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 0.5rem;';
            if (isCurrent) {
                el.style.borderColor = 'var(--gold-muted)';
                el.style.background = 'rgba(197, 160, 88, 0.05)';
            }

            let timeStr = 'Desconocido';
            if (session.lastActive) {
                try {
                    const d = session.lastActive?.toDate ? session.lastActive.toDate() : new Date(session.lastActive);
                    const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
                    timeStr = d.toLocaleDateString(locale) + ' ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
                } catch (e) { /* silent */ }
            }

            el.innerHTML = `
                <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: rgba(197,160,88,0.1); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
                    ${session.deviceType || '💻'}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: var(--font-medium);">${session.os || 'Sistema'} · ${session.browser || 'Navegador'}</div>
                    <div class="text-muted text-sm">Última actividad: ${timeStr}</div>
                </div>
                ${isCurrent
                    ? `<span style="background: rgba(74,222,128,0.15); color: var(--positive-light); padding: 4px 10px; border-radius: var(--radius-full); font-size: var(--text-xs); white-space: nowrap;">✓ Actual</span>`
                    : `<button class="btn btn-icon btn-ghost" onclick="Security.revokeSession('${session.id}')" title="Cerrar sesión en este dispositivo" style="color: var(--error-light);">✕</button>`
                }
            `;
            container.appendChild(el);
        });
    },

    async revokeSession(sessionId) {
        if (!confirm('¿Cerrar sesión en este dispositivo?')) return;
        const user = window.AuthService?.currentUser;
        if (!user) return;
        try {
            await window.FirestoreService.sessions.revoke(user.uid, sessionId);
            this.showToast('Sesión cerrada correctamente');
            await this.refreshSessionsList(user.uid);
        } catch (e) {
            console.error('Error revoking session:', e);
            this.showToast('Error al cerrar sesión', 'error');
        }
    },

    async revokeAllSessions() {
        if (!confirm('¿Cerrar sesión en todos los demás dispositivos?')) return;
        const user = window.AuthService?.currentUser;
        if (!user) return;
        const others = (this.settings.sessions || []).filter(s => s.id !== this.currentSessionId);
        try {
            await Promise.all(others.map(s => window.FirestoreService.sessions.revoke(user.uid, s.id)));
            this.showToast('✅ Todas las demás sesiones han sido cerradas');
            await this.refreshSessionsList(user.uid);
        } catch (e) {
            console.error('Error revoking all sessions:', e);
            this.showToast('Error al cerrar sesiones', 'error');
        }
    },

    // -------------------------------------------------------------------------
    // EXPORTACIÓN GDPR REAL (descarga JSON con todos los datos de Firestore)
    // -------------------------------------------------------------------------

    async exportGDPR() {
        const user = window.AuthService?.currentUser;
        if (!user) { this.showToast('Debes iniciar sesión', 'error'); return; }

        this.showToast('Preparando exportación de datos...', 'info');

        try {
            const results = await Promise.allSettled([
                window.FirestoreService?.transactions?.getAll?.() || Promise.resolve([]),
                window.FirestoreService?.accounts?.getAll?.() || Promise.resolve([]),
                window.FirestoreService?.budgets?.getAll?.() || Promise.resolve([]),
                window.FirestoreService?.goals?.getAll?.() || Promise.resolve([]),
            ]);

            const exportData = {
                exportDate: new Date().toISOString(),
                gdprCompliant: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || null,
                    createdAt: user.metadata?.creationTime || null
                },
                data: {
                    transactions: results[0].status === 'fulfilled' ? results[0].value : [],
                    accounts: results[1].status === 'fulfilled' ? results[1].value : [],
                    budgets: results[2].status === 'fulfilled' ? results[2].value : [],
                    goals: results[3].status === 'fulfilled' ? results[3].value : [],
                },
                settings: JSON.parse(localStorage.getItem('gentleFinances_settings') || '{}'),
                exportedBy: 'GentleFinances GDPR Export v1.0'
            };

            // Convertir a JSON y descargar
            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gentlefinances-gdpr-${user.uid.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.showToast('✅ Datos exportados correctamente (GDPR)');
        } catch (e) {
            console.error('Error exporting GDPR data:', e);
            this.showToast('Error al exportar datos: ' + e.message, 'error');
        }
    },

    // -------------------------------------------------------------------------
    // ACTUALIZAR UI
    // -------------------------------------------------------------------------

    updatePINUI() {
        const pinSetupBtn = document.getElementById('security-pin-setup-btn');
        const pinChangeBtn = document.getElementById('security-pin-change-btn');
        const pinRemoveBtn = document.getElementById('security-pin-remove-btn');
        const pinStatus = document.getElementById('security-pin-status');

        if (this.settings.hasPIN) {
            if (pinSetupBtn) pinSetupBtn.style.display = 'none';
            if (pinChangeBtn) pinChangeBtn.style.display = 'inline-flex';
            if (pinRemoveBtn) pinRemoveBtn.style.display = 'inline-flex';
            if (pinStatus) {
                pinStatus.textContent = 'Activado';
                pinStatus.style.background = 'rgba(74,222,128,0.15)';
                pinStatus.style.color = 'var(--positive-light)';
            }
        } else {
            if (pinSetupBtn) pinSetupBtn.style.display = 'inline-flex';
            if (pinChangeBtn) pinChangeBtn.style.display = 'none';
            if (pinRemoveBtn) pinRemoveBtn.style.display = 'none';
            if (pinStatus) {
                pinStatus.textContent = 'Desactivado';
                pinStatus.style.background = 'rgba(148,163,184,0.15)';
                pinStatus.style.color = 'var(--text-muted)';
            }
        }
    },

    updateSecurityScore() {
        let score = 50; // Base: cuenta con email
        if (this.settings.hasPIN) score += 25;
        // Firebase Auth con email verificado
        const user = window.AuthService?.currentUser;
        if (user?.emailVerified) score += 25;

        const scoreEl = document.getElementById('security-score-value');
        const scoreCircle = document.getElementById('security-score-circle');
        const scoreLabel = document.getElementById('security-score-label');

        if (scoreEl) scoreEl.textContent = score + '%';
        if (scoreCircle) {
            scoreCircle.style.background = `conic-gradient(var(--positive-light) ${score}%, var(--bg-tertiary) 0)`;
        }
        if (scoreLabel) {
            scoreLabel.textContent = score >= 75 ? 'Nivel de Seguridad Excelente' :
                score >= 50 ? 'Nivel de Seguridad Bueno' : 'Nivel de Seguridad Básico';
        }
    },

    // -------------------------------------------------------------------------
    // TOAST
    // -------------------------------------------------------------------------

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }
};

window.Security = Security;
