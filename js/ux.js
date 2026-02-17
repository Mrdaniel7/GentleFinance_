/**
 * Componentes UX Avanzados
 * FAB de entrada rápida, calculadora, notificaciones PWA
 */

const UX = {
    // Inicialización
    init() {
        this.createFAB();
        this.setupOfflineDetection();
        this.checkLowBalance();
    },

    // Crear Floating Action Button
    createFAB() {
        // Evitar duplicados
        if (document.getElementById('fab-container')) return;

        const fabContainer = document.createElement('div');
        fabContainer.id = 'fab-container';
        fabContainer.innerHTML = `
            <style>
                .fab-container {
                    position: fixed;
                    bottom: 100px;
                    right: 20px;
                    z-index: 1000;
                }
                
                .fab-main {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #C5A058, #A88B47);
                    color: #0D0D0D;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    box-shadow: 0 4px 12px rgba(197, 160, 88, 0.4);
                    transition: all 0.3s ease;
                }
                
                .fab-main:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(197, 160, 88, 0.5);
                }
                
                .fab-main.open {
                    transform: rotate(45deg);
                }
                
                .fab-menu {
                    position: absolute;
                    bottom: 70px;
                    right: 0;
                    display: none;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .fab-menu.open {
                    display: flex;
                }
                
                .fab-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #1A1A1A;
                    border: 1px solid #3D3D3D;
                    border-radius: 28px;
                    padding: 8px 16px 8px 8px;
                    cursor: pointer;
                    animation: slideIn 0.2s ease;
                    white-space: nowrap;
                }
                
                .fab-item:hover {
                    border-color: #C5A058;
                }
                
                .fab-item-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #2A2A2A;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                }
                
                .fab-item-label {
                    color: #F0EDE5;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
            
            <div class="fab-container">
                <div class="fab-menu" id="fabMenu">
                    <div class="fab-item" onclick="UX.quickAddExpense()">
                        <div class="fab-item-icon">💸</div>
                        <span class="fab-item-label">Añadir Gasto</span>
                    </div>
                    <div class="fab-item" onclick="UX.quickAddIncome()">
                        <div class="fab-item-icon">💰</div>
                        <span class="fab-item-label">Añadir Ingreso</span>
                    </div>
                    <div class="fab-item" onclick="UX.openCalculator()">
                        <div class="fab-item-icon">🧮</div>
                        <span class="fab-item-label">Calculadora</span>
                    </div>
                </div>
                <button class="fab-main" id="fabMain" onclick="UX.toggleFAB()">+</button>
            </div>
        `;

        document.body.appendChild(fabContainer);
    },

    // Toggle FAB menu
    toggleFAB() {
        const fab = document.getElementById('fabMain');
        const menu = document.getElementById('fabMenu');
        fab.classList.toggle('open');
        menu.classList.toggle('open');
    },

    // Añadir gasto rápido
    quickAddExpense() {
        this.toggleFAB();
        if (window.GentleFinances) {
            GentleFinances.openModal('addTransactionModal');
            // Optional: Set type to expense if possible, currently defaults to form state
            const typeExpense = document.getElementById('typeExpense');
            if (typeExpense) typeExpense.click();
        }
    },

    // Añadir ingreso rápido
    quickAddIncome() {
        this.toggleFAB();
        if (window.GentleFinances) {
            GentleFinances.openModal('addTransactionModal');
            // Set type to income
            const typeIncome = document.getElementById('typeIncome');
            if (typeIncome) typeIncome.click();
        }
    },

    // Guardar transacción (Legacy - Deprecated)
    saveTransaction(transaction) {
        console.warn('UX.saveTransaction is deprecated. Use Transactions.add() or FirestoreService.');
        // No guardamos en local para evitar conflictos.
        if (window.GentleFinances && window.GentleFinances.showToast) {
            window.GentleFinances.showToast('⚠️ Error interno: Intento de guardado local', 'error');
        }
    },

    // Abrir calculadora
    openCalculator() {
        this.toggleFAB();

        // Crear modal de calculadora
        const modal = document.createElement('div');
        modal.id = 'calculatorModal';
        modal.innerHTML = `
            <style>
                .calc-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }
                
                .calc-container {
                    background: #1A1A1A;
                    border: 1px solid #3D3D3D;
                    border-radius: 16px;
                    padding: 20px;
                    width: 280px;
                }
                
                .calc-display {
                    background: #0D0D0D;
                    border-radius: 8px;
                    padding: 16px;
                    text-align: right;
                    font-size: 28px;
                    font-family: monospace;
                    color: #F0EDE5;
                    margin-bottom: 16px;
                    overflow: hidden;
                }
                
                .calc-buttons {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                }
                
                .calc-btn {
                    padding: 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 18px;
                    cursor: pointer;
                    background: #2A2A2A;
                    color: #F0EDE5;
                    transition: all 0.2s;
                }
                
                .calc-btn:hover {
                    background: #3D3D3D;
                }
                
                .calc-btn.operator {
                    background: #C5A058;
                    color: #0D0D0D;
                }
                
                .calc-btn.operator:hover {
                    background: #D4AF5D;
                }
                
                .calc-btn.equals {
                    background: #4ade80;
                    color: #0D0D0D;
                }
            </style>
            
            <div class="calc-overlay" onclick="if(event.target === this) UX.closeCalculator()">
                <div class="calc-container">
                    <div class="calc-display" id="calcDisplay">0</div>
                    <div class="calc-buttons">
                        <button class="calc-btn" onclick="UX.calcInput('C')">C</button>
                        <button class="calc-btn" onclick="UX.calcInput('±')">±</button>
                        <button class="calc-btn" onclick="UX.calcInput('%')">%</button>
                        <button class="calc-btn operator" onclick="UX.calcInput('/')">÷</button>
                        
                        <button class="calc-btn" onclick="UX.calcInput('7')">7</button>
                        <button class="calc-btn" onclick="UX.calcInput('8')">8</button>
                        <button class="calc-btn" onclick="UX.calcInput('9')">9</button>
                        <button class="calc-btn operator" onclick="UX.calcInput('*')">×</button>
                        
                        <button class="calc-btn" onclick="UX.calcInput('4')">4</button>
                        <button class="calc-btn" onclick="UX.calcInput('5')">5</button>
                        <button class="calc-btn" onclick="UX.calcInput('6')">6</button>
                        <button class="calc-btn operator" onclick="UX.calcInput('-')">−</button>
                        
                        <button class="calc-btn" onclick="UX.calcInput('1')">1</button>
                        <button class="calc-btn" onclick="UX.calcInput('2')">2</button>
                        <button class="calc-btn" onclick="UX.calcInput('3')">3</button>
                        <button class="calc-btn operator" onclick="UX.calcInput('+')">+</button>
                        
                        <button class="calc-btn" style="grid-column: span 2" onclick="UX.calcInput('0')">0</button>
                        <button class="calc-btn" onclick="UX.calcInput('.')">.</button>
                        <button class="calc-btn equals" onclick="UX.calcInput('=')">=</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.calcValue = '0';
        this.calcPending = null;
        this.calcOperator = null;
    },

    // Input calculadora
    calcValue: '0',
    calcPending: null,
    calcOperator: null,

    calcInput(key) {
        const display = document.getElementById('calcDisplay');

        if (key === 'C') {
            this.calcValue = '0';
            this.calcPending = null;
            this.calcOperator = null;
        } else if (key === '±') {
            this.calcValue = (parseFloat(this.calcValue) * -1).toString();
        } else if (key === '%') {
            this.calcValue = (parseFloat(this.calcValue) / 100).toString();
        } else if (['+', '-', '*', '/'].includes(key)) {
            this.calcPending = parseFloat(this.calcValue);
            this.calcOperator = key;
            this.calcValue = '0';
        } else if (key === '=') {
            if (this.calcPending !== null && this.calcOperator) {
                const current = parseFloat(this.calcValue);
                let result;
                switch (this.calcOperator) {
                    case '+': result = this.calcPending + current; break;
                    case '-': result = this.calcPending - current; break;
                    case '*': result = this.calcPending * current; break;
                    case '/': result = this.calcPending / current; break;
                }
                this.calcValue = result.toString();
                this.calcPending = null;
                this.calcOperator = null;
            }
        } else if (key === '.') {
            if (!this.calcValue.includes('.')) {
                this.calcValue += '.';
            }
        } else {
            if (this.calcValue === '0') {
                this.calcValue = key;
            } else {
                this.calcValue += key;
            }
        }

        display.textContent = this.calcValue;
    },

    // Cerrar calculadora
    closeCalculator() {
        const modal = document.getElementById('calculatorModal');
        if (modal) modal.remove();
    },

    // Detección offline
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showToast('✅ Conexión restaurada', 'success');
        });

        window.addEventListener('offline', () => {
            this.showToast('⚠️ Sin conexión - Modo offline', 'warning');
        });
    },

    // Verificar saldo bajo
    checkLowBalance() {
        const balance = parseFloat(localStorage.getItem('gentleFinances_balance') || '1000');
        const threshold = parseFloat(localStorage.getItem('gentleFinances_lowBalanceThreshold') || '100');

        if (balance < threshold) {
            setTimeout(() => {
                this.showToast(`⚠️ ${Utils.formatCurrency(balance)}`, 'warning');
            }, 2000);
        }
    },

    // Calcular puntuación de salud financiera
    calculateHealthScore() {
        // Factores: ahorro, deuda, presupuesto, metas
        let score = 50; // Base

        const savings = parseFloat(localStorage.getItem('gentleFinances_savings') || '0');
        const monthlyIncome = parseFloat(localStorage.getItem('gentleFinances_income') || '2000');

        // Ratio de ahorro
        const savingsRate = (savings / monthlyIncome) * 100;
        if (savingsRate >= 20) score += 25;
        else if (savingsRate >= 10) score += 15;
        else if (savingsRate >= 5) score += 5;

        // Presupuesto configurado
        const hasBudget = localStorage.getItem('gentleFinances_budgets');
        if (hasBudget) score += 15;

        // Metas activas
        const hasGoals = localStorage.getItem('gentleFinances_goals');
        if (hasGoals) score += 10;

        return Math.min(100, Math.max(0, score));
    },

    // Toast
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer') || document.body;

        const bgColors = {
            success: 'rgba(74, 222, 128, 0.15)',
            warning: 'rgba(251, 191, 36, 0.15)',
            error: 'rgba(248, 113, 113, 0.15)'
        };

        const borderColors = {
            success: 'rgba(74, 222, 128, 0.3)',
            warning: 'rgba(251, 191, 36, 0.3)',
            error: 'rgba(248, 113, 113, 0.3)'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bgColors[type] || 'rgba(26, 26, 26, 0.95)'};
            color: #F0EDE5;
            padding: 12px 24px;
            border-radius: 8px;
            border: 1px solid ${borderColors[type] || 'rgba(197, 160, 88, 0.3)'};
            z-index: 9999;
            animation: fadeInUp 0.3s ease;
        `;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }
};

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => UX.init());

/**
 * Sistema de Seguridad para Acciones Destructivas
 */
const Safety = {
    callback: null,
    timer: null,
    countdown: 5,
    keyword: 'borrar',

    /**
     * Abrir modal de confirmación
     * @param {string} title 
     * @param {string} message 
     * @param {Function} onConfirm 
     * @param {string} type 'strict' | 'simple'
     */
    confirm(title, message, onConfirm, type = 'strict') {
        this.callback = onConfirm;
        this.countdown = type === 'strict' ? 5 : 0;
        this.type = type;

        // Elementos
        const modal = document.getElementById('safetyModal');
        const titleEl = document.getElementById('safetyTitle');
        const msgEl = document.getElementById('safetyMessage');
        const inputGroup = document.querySelector('#safetyModal .input-group');
        const input = document.getElementById('safetyInput');
        const btn = document.getElementById('safetyConfirmBtn');
        const btnText = document.getElementById('safetyBtnText');

        if (!modal || !input || !btn) return;

        // Configurar contenido
        titleEl.textContent = title || '¿Estás seguro?';
        msgEl.textContent = message || 'Esta acción no se puede deshacer.';

        // Reset estado
        input.value = '';
        input.oninput = () => this.validate(input.value);

        if (type === 'strict') {
            if (inputGroup) inputGroup.style.display = 'block';
            input.focus();
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';

            // Iniciar cuenta atrás
            clearInterval(this.timer);
            this.updateBtnText(btnText);

            this.timer = setInterval(() => {
                this.countdown--;
                this.updateBtnText(btnText);

                if (this.countdown <= 0) {
                    clearInterval(this.timer);
                    this.validate(input.value);
                }
            }, 1000);
        } else {
            // Simple mode
            if (inputGroup) inputGroup.style.display = 'none';
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btnText.textContent = 'ELIMINAR';
        }

        btn.onclick = () => this.execute();

        // Mostrar modal
        modal.classList.add('active');
        // Prevenir scroll
        document.body.style.overflow = 'hidden';
    },

    updateBtnText(el) {
        if (this.countdown > 0) {
            el.textContent = `Espera ${this.countdown}s...`;
        } else {
            el.textContent = 'CONFIRMAR ELIMINACIÓN';
        }
    },

    validate(text) {
        if (this.type !== 'strict') return;

        const btn = document.getElementById('safetyConfirmBtn');
        const isMatch = text.toLowerCase().trim() === this.keyword;
        const isTimeUp = this.countdown <= 0;

        if (isMatch && isTimeUp) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        } else {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    },

    execute() {
        if (this.callback) this.callback();
        this.close();
    },

    close() {
        clearInterval(this.timer);
        const modal = document.getElementById('safetyModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.callback = null;
    }
};

// Hacer global
window.Safety = Safety;
