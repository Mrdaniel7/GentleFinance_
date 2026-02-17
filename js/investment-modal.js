// =============================================================================
// INVESTMENT MODAL - Modal avanzado para añadir inversiones
// =============================================================================

const InvestmentModal = {
    currentAsset: null,

    // Abrir modal con datos del activo
    open(asset) {
        this.currentAsset = asset;
        this.render();
        document.getElementById('investmentModal').style.display = 'flex';
        document.getElementById('investmentModal').classList.add('active');
    },

    // Cerrar modal
    close() {
        document.getElementById('investmentModal').style.display = 'none';
        document.getElementById('investmentModal').classList.remove('active');
        this.currentAsset = null;
    },

    // Renderizar contenido del modal
    render() {
        const asset = this.currentAsset;
        const modal = document.getElementById('investmentModal');

        if (!modal) {
            this.createModalElement();
        }

        const content = document.getElementById('investmentModalContent');
        content.innerHTML = `
            <div class="investment-modal-header">
                <div class="flex items-center gap-md">
                    ${asset.image ? `<img src="${asset.image}" alt="${asset.name}" class="investment-modal-icon">` :
                `<div class="investment-modal-icon-placeholder">${asset.symbol?.charAt(0) || '?'}</div>`
            }
                    <div>
                        <h2 class="investment-modal-title">${asset.name || asset.symbol}</h2>
                        <div class="investment-modal-symbol">${asset.symbol}</div>
                    </div>
                </div>
                <button class="btn btn-ghost btn-icon" onclick="InvestmentModal.close()">✕</button>
            </div>
            
            <div class="investment-modal-price">
                <span class="price-value">${this.formatCurrency(asset.price, asset.currency || 'EUR')}</span>
                <span class="price-change ${(asset.changePercent || 0) >= 0 ? 'text-positive' : 'text-negative'}">
                    ${(asset.changePercent || 0) >= 0 ? '+' : ''}${(asset.changePercent || 0).toFixed(2)}%
                </span>
            </div>
            
            <form id="investmentForm" onsubmit="InvestmentModal.save(event)">
                <!-- Tipo de operación -->
                <div class="form-group">
                    <label class="form-label">Tipo de Operación</label>
                    <div class="btn-group-toggle">
                        <button type="button" class="btn-toggle active" data-type="buy" onclick="InvestmentModal.setType('buy')">
                            📈 Comprar
                        </button>
                        <button type="button" class="btn-toggle" data-type="sell" onclick="InvestmentModal.setType('sell')">
                            📉 Vender
                        </button>
                    </div>
                </div>
                
                <!-- Cantidad -->
                <div class="form-group">
                    <label class="form-label">Cantidad</label>
                    <div class="input-with-suffix">
                        <input type="number" id="investmentQuantity" class="input" 
                               step="0.0001" min="0.0001" placeholder="0.00"
                               oninput="InvestmentModal.calculateTotal()">
                        <span class="input-suffix">${asset.symbol}</span>
                    </div>
                </div>
                
                <!-- O Importe -->
                <div class="form-divider">
                    <span>O especifica el importe</span>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Importe en ${asset.currency || 'EUR'}</label>
                    <div class="input-with-suffix">
                        <input type="number" id="investmentAmount" class="input" 
                               step="0.01" min="0.01" placeholder="0.00"
                               oninput="InvestmentModal.calculateQuantity()">
                        <span class="input-suffix">${asset.currency || 'EUR'}</span>
                    </div>
                </div>
                
                <!-- Periodicidad -->
                <div class="form-group">
                    <label class="form-label">Periodicidad</label>
                    <select id="investmentPeriodicity" class="input">
                        <option value="once">⚡ Única vez</option>
                        <option value="daily">📅 Diaria</option>
                        <option value="weekly">📆 Semanal</option>
                        <option value="biweekly">📆 Quincenal</option>
                        <option value="monthly">🗓️ Mensual</option>
                    </select>
                </div>
                
                <!-- Fecha -->
                <div class="form-group">
                    <label class="form-label">Fecha de inicio</label>
                    <input type="date" id="investmentDate" class="input" value="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <!-- Notas -->
                <div class="form-group">
                    <label class="form-label">Notas (opcional)</label>
                    <textarea id="investmentNotes" class="input" rows="2" placeholder="Ej: DCA mensual, objetivo largo plazo..."></textarea>
                </div>
                
                <!-- Resumen -->
                <div class="investment-summary">
                    <div class="summary-row">
                        <span>Total estimado:</span>
                        <span id="investmentTotal" class="summary-value">${Utils.formatCurrency(0)}</span>
                    </div>
                </div>
                
                <!-- Botones -->
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="InvestmentModal.close()">Cancelar</button>
                    <button type="submit" class="btn btn-primary" id="investmentSubmitBtn">
                        💼 Añadir al Portfolio
                    </button>
                </div>
            </form>
        `;
    },

    // Crear elemento modal si no existe
    createModalElement() {
        const modal = document.createElement('div');
        modal.id = 'investmentModal';
        modal.className = 'investment-modal-overlay';
        modal.innerHTML = `<div class="investment-modal" id="investmentModalContent"></div>`;
        modal.onclick = (e) => {
            if (e.target === modal) this.close();
        };
        document.body.appendChild(modal);
    },

    // Cambiar tipo de operación
    setType(type) {
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        const submitBtn = document.getElementById('investmentSubmitBtn');
        submitBtn.textContent = type === 'buy' ? '💼 Añadir al Portfolio' : '💰 Registrar Venta';
    },

    // Calcular total desde cantidad
    calculateTotal() {
        const qty = parseFloat(document.getElementById('investmentQuantity').value) || 0;
        const price = this.currentAsset?.price || 0;
        const total = qty * price;
        document.getElementById('investmentAmount').value = total > 0 ? total.toFixed(2) : '';
        document.getElementById('investmentTotal').textContent = this.formatCurrency(total, this.currentAsset?.currency || 'EUR');
    },

    // Calcular cantidad desde importe
    calculateQuantity() {
        const amount = parseFloat(document.getElementById('investmentAmount').value) || 0;
        const price = this.currentAsset?.price || 0;
        const qty = price > 0 ? amount / price : 0;
        document.getElementById('investmentQuantity').value = qty > 0 ? qty.toFixed(6) : '';
        document.getElementById('investmentTotal').textContent = this.formatCurrency(amount, this.currentAsset?.currency || 'EUR');
    },

    // Guardar inversión
    save(event) {
        event.preventDefault();

        const quantity = parseFloat(document.getElementById('investmentQuantity').value);
        const amount = parseFloat(document.getElementById('investmentAmount').value);
        const periodicity = document.getElementById('investmentPeriodicity').value;
        const date = document.getElementById('investmentDate').value;
        const notes = document.getElementById('investmentNotes').value;
        const type = document.querySelector('.btn-toggle.active')?.dataset.type || 'buy';

        if (!quantity && !amount) {
            this.showToast('Introduce una cantidad o importe', 'error');
            return;
        }

        const investment = {
            id: Date.now().toString(),
            type: type,
            assetType: this.currentAsset.type || 'stock',
            symbol: this.currentAsset.symbol,
            name: this.currentAsset.name,
            image: this.currentAsset.image,
            quantity: quantity || (amount / this.currentAsset.price),
            price: this.currentAsset.price,
            totalAmount: amount || (quantity * this.currentAsset.price),
            currency: this.currentAsset.currency || 'EUR',
            periodicity: periodicity,
            startDate: date,
            notes: notes,
            createdAt: new Date().toISOString()
        };

        // Guardar estrictamente en Firebase vía PortfolioManager
        if (typeof PortfolioManager !== 'undefined' && PortfolioManager.addInvestment) {
            PortfolioManager.addInvestment(investment).then(() => {
                const actionText = type === 'buy' ? 'añadido' : 'registrada venta de';
                this.showToast(`✅ ${investment.quantity.toFixed(4)} ${investment.symbol} ${actionText} al portfolio`, 'success');
                this.close();

                // Refrescar vistas si existen
                if (typeof Portfolio !== 'undefined' && Portfolio.refresh) {
                    Portfolio.refresh();
                }
            }).catch(err => {
                console.error('Error saving investment:', err);
                this.showToast('❌ Error al guardar en Firebase', 'error');
            });
        } else {
            console.error('PortfolioManager not found');
            this.showToast('❌ Error crítico: Gestor no disponible', 'error');
        }
    },

    // Formatear moneda
    formatCurrency(value, currency) {
        if (!value && value !== 0) return Utils.formatCurrency(0, currency);
        return Utils.formatCurrency(value, currency);
    },

    // Mostrar toast
    showToast(message, type = 'success') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    }
};

// Export global
window.InvestmentModal = InvestmentModal;

// Función helper para abrir desde cualquier lugar
window.openInvestmentModal = (asset) => InvestmentModal.open(asset);
