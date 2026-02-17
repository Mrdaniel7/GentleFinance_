/**
 * GentleFinances Modal System
 * Sistema de modales personalizados para reemplazar prompt() y alert()
 */

const GFModal = {
    // Container del modal
    container: null,

    // Inicializar el sistema de modales
    init() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.id = 'gfModalContainer';
        this.container.innerHTML = `
            <div class="gf-modal-overlay" id="gfModalOverlay">
                <div class="gf-modal" id="gfModal">
                    <div class="gf-modal-header">
                        <h3 class="gf-modal-title" id="gfModalTitle">Título</h3>
                        <button class="gf-modal-close" onclick="GFModal.close()">&times;</button>
                    </div>
                    <div class="gf-modal-body" id="gfModalBody"></div>
                    <div class="gf-modal-footer" id="gfModalFooter"></div>
                </div>
            </div>
        `;
        document.body.appendChild(this.container);

        // Cerrar al hacer clic fuera
        document.getElementById('gfModalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'gfModalOverlay') this.close();
        });

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });

        // Añadir estilos si no existen
        if (!document.getElementById('gfModalStyles')) {
            const styles = document.createElement('style');
            styles.id = 'gfModalStyles';
            styles.textContent = `
                .gf-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(4px);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    padding: 1rem;
                }
                .gf-modal-overlay.active {
                    display: flex;
                }
                .gf-modal {
                    background: var(--bg-secondary, #1a1a1a);
                    border: 1px solid var(--border-subtle, #3d3d3d);
                    border-radius: 12px;
                    max-width: 480px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: gfModalIn 0.2s ease-out;
                }
                @keyframes gfModalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .gf-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid var(--border-subtle, #3d3d3d);
                }
                .gf-modal-title {
                    font-family: var(--font-serif, 'Playfair Display', serif);
                    font-size: 1.25rem;
                    color: var(--gold-primary, #C5A058);
                    margin: 0;
                }
                .gf-modal-close {
                    background: none;
                    border: none;
                    color: var(--text-muted, #7a7a7a);
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                    transition: color 0.2s;
                }
                .gf-modal-close:hover {
                    color: var(--text-primary, #f0ede5);
                }
                .gf-modal-body {
                    padding: 1.5rem;
                }
                .gf-modal-footer {
                    display: flex;
                    gap: 0.75rem;
                    justify-content: flex-end;
                    padding: 1rem 1.5rem;
                    border-top: 1px solid var(--border-subtle, #3d3d3d);
                }
                .gf-input-group {
                    margin-bottom: 1rem;
                }
                .gf-input-label {
                    display: block;
                    font-size: 0.875rem;
                    color: var(--text-muted, #7a7a7a);
                    margin-bottom: 0.5rem;
                }
                .gf-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: var(--bg-tertiary, #2a2a2a);
                    border: 1px solid var(--border-subtle, #3d3d3d);
                    border-radius: 8px;
                    color: var(--text-primary, #f0ede5);
                    font-size: 1rem;
                    transition: border-color 0.2s;
                }
                .gf-input:focus {
                    outline: none;
                    border-color: var(--gold-primary, #C5A058);
                }
                .gf-radio-group {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .gf-radio-option {
                    flex: 1;
                    position: relative;
                }
                .gf-radio-option input {
                    position: absolute;
                    opacity: 0;
                }
                .gf-radio-option label {
                    display: block;
                    padding: 0.75rem;
                    background: var(--bg-tertiary, #2a2a2a);
                    border: 1px solid var(--border-subtle, #3d3d3d);
                    border-radius: 8px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.875rem;
                }
                .gf-radio-option input:checked + label {
                    border-color: var(--gold-primary, #C5A058);
                    background: rgba(197, 160, 88, 0.1);
                    color: var(--gold-primary, #C5A058);
                }
                .gf-asset-preview {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: var(--bg-tertiary, #2a2a2a);
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }
                .gf-asset-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    background: var(--bg-secondary, #1a1a1a);
                }
                .gf-asset-icon img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .gf-asset-info {
                    flex: 1;
                }
                .gf-asset-name {
                    font-weight: 600;
                }
                .gf-asset-price {
                    color: var(--gold-primary, #C5A058);
                    font-size: 1.125rem;
                    font-weight: 600;
                }
                .gf-calculation {
                    padding: 1rem;
                    background: rgba(197, 160, 88, 0.1);
                    border: 1px solid var(--gold-primary, #C5A058);
                    border-radius: 8px;
                    text-align: center;
                }
                .gf-calculation-label {
                    font-size: 0.75rem;
                    color: var(--text-muted, #7a7a7a);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .gf-calculation-value {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--gold-primary, #C5A058);
                }
            `;
            document.head.appendChild(styles);
        }
    },

    // Mostrar modal
    show(title, bodyHTML, footerHTML = '') {
        this.init();
        document.getElementById('gfModalTitle').textContent = title;
        document.getElementById('gfModalBody').innerHTML = bodyHTML;
        document.getElementById('gfModalFooter').innerHTML = footerHTML;
        document.getElementById('gfModalOverlay').classList.add('active');

        // Focus en primer input si existe
        const firstInput = document.querySelector('#gfModalBody input');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    },

    // Cerrar modal
    close() {
        const overlay = document.getElementById('gfModalOverlay');
        if (overlay) overlay.classList.remove('active');
        if (this.onClose) {
            this.onClose();
            this.onClose = null;
        }
    },

    // Modal de inversión
    showInvestModal(asset, onConfirm) {
        const icon = asset.image
            ? `<img src="${asset.image}" alt="${asset.name}">`
            : (asset.icon || '📈');

        const bodyHTML = `
            <div class="gf-asset-preview">
                <div class="gf-asset-icon">${icon}</div>
                <div class="gf-asset-info">
                    <div class="gf-asset-name">${asset.name}</div>
                    <div class="text-muted">${asset.symbol?.toUpperCase() || ''}</div>
                </div>
                <div class="gf-asset-price">${formatCurrencyModal(asset.price, asset.currency)}</div>
            </div>

            <div class="gf-radio-group">
                <div class="gf-radio-option">
                    <input type="radio" name="investType" id="investMoney" value="money" checked>
                    <label for="investMoney">💶 Importe (${window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€'})</label>
                </div>
                <div class="gf-radio-option">
                    <input type="radio" name="investType" id="investUnits" value="units">
                    <label for="investUnits">📊 Unidades</label>
                </div>
            </div>

            <div class="gf-input-group">
                <label class="gf-input-label" id="investInputLabel">Cantidad a invertir (${window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€'})</label>
                <input type="number" class="gf-input" id="investAmount" placeholder="0.00" min="0" step="any">
            </div>

            <div class="gf-calculation" id="investCalculation">
                <div class="gf-calculation-label">Obtendrás</div>
                <div class="gf-calculation-value" id="investResult">0 unidades</div>
            </div>
        `;

        const footerHTML = `
            <button class="btn btn-ghost" onclick="GFModal.close()">Cancelar</button>
            <button class="btn btn-primary" id="confirmInvestBtn">Confirmar Inversión</button>
        `;

        this.show(`Invertir en ${asset.name}`, bodyHTML, footerHTML);

        // Event listeners
        const amountInput = document.getElementById('investAmount');
        const resultDiv = document.getElementById('investResult');
        const labelDiv = document.getElementById('investInputLabel');
        const calcLabel = document.querySelector('.gf-calculation-label');
        const radios = document.querySelectorAll('input[name="investType"]');

        const updateCalculation = () => {
            const value = parseFloat(amountInput.value) || 0;
            const isMoney = document.getElementById('investMoney').checked;

            if (isMoney) {
                labelDiv.textContent = `Cantidad a invertir (${window.Settings?.getCurrencySymbol ? Settings.getCurrencySymbol() : '€'})`;
                calcLabel.textContent = 'Obtendrás';
                const units = value / asset.price;
                resultDiv.textContent = `${units.toFixed(6)} unidades`;
            } else {
                labelDiv.textContent = 'Número de unidades';
                calcLabel.textContent = 'Coste total';
                const cost = value * asset.price;
                resultDiv.textContent = formatCurrencyModal(cost, asset.currency);
            }
        };

        amountInput.addEventListener('input', updateCalculation);
        radios.forEach(r => r.addEventListener('change', updateCalculation));

        // Confirmar
        document.getElementById('confirmInvestBtn').addEventListener('click', () => {
            const value = parseFloat(amountInput.value) || 0;
            if (value <= 0) {
                amountInput.style.borderColor = 'var(--negative-light)';
                return;
            }

            const isMoney = document.getElementById('investMoney').checked;
            const quantity = isMoney ? value / asset.price : value;

            onConfirm({
                quantity,
                investedAmount: isMoney ? value : value * asset.price,
                type: isMoney ? 'money' : 'units'
            });

            this.close();
        });
    },

    // Alert personalizado
    alert(title, message, type = 'info') {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const bodyHTML = `
            <div style="text-align: center; padding: 1rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">${icons[type]}</div>
                <p style="color: var(--text-secondary);">${message}</p>
            </div>
        `;

        const footerHTML = `
            <button class="btn btn-primary" onclick="GFModal.close()">Aceptar</button>
        `;

        this.show(title, bodyHTML, footerHTML);
    },

    // Confirm personalizado
    confirm(title, message, onConfirm) {
        const bodyHTML = `
            <div style="text-align: center; padding: 1rem;">
                <p style="color: var(--text-secondary);">${message}</p>
            </div>
        `;

        const footerHTML = `
            <button class="btn btn-ghost" onclick="GFModal.close()">Cancelar</button>
            <button class="btn btn-primary" id="gfConfirmBtn">Confirmar</button>
        `;

        this.show(title, bodyHTML, footerHTML);

        document.getElementById('gfConfirmBtn').addEventListener('click', () => {
            onConfirm();
            this.close();
        });
    }
};

// Helper para formatear moneda
function formatCurrencyModal(value, currency) {
    return Utils.formatCurrency(value, currency);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => GFModal.init());

// Export global
window.GFModal = GFModal;

console.log('✅ Modal System cargado');
