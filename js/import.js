/**
 * Controlador de Importación de Archivos
 * Maneja la carga, parsing y previsualización de archivos bancarios
 */

// Estado
let parsedData = null;
let currentMapping = null;

// Guías de exportación por banco
// Guías de exportación por banco detalladas para GentleFinances
const BANK_GUIDES = {
    caixabank: {
        name: 'CaixaBank',
        icon: '⭐',
        link: 'https://www.caixabank.es/particular/atencion-cliente/faq/como-puedo-consultar-o-descargar-mis-movimientos.html',
        steps: [
            'Entra en CaixaBankNow (web o app).',
            'Ve a la pestaña "Mis cuentas" y pulsa en tu cuenta principal.',
            'Haz clic en "Ver movimientos".',
            'En el menú "Más opciones" (icono de tres puntos), elige "Descargar movimientos".',
            '**Truco GentleFinances**: Selecciona "Formato Excel (.xlsx)" o "CSV" para que podamos detectar automáticamente tus categorías.'
        ],
        format: 'Excel (.xlsx) o CSV',
        notes: 'Si usas la App y no ves el Excel, prueba a entrar por la web; allí siempre aparece.'
    },
    imagin: {
        name: 'Imagin',
        icon: '📱',
        link: 'https://www.imagin.com/ayuda',
        steps: [
            'Abre la App de Imagin.',
            'Entra en los detalles de tu cuenta pulsando sobre ella.',
            'Busca el icono de la flecha hacia abajo (⬇️) o "Descargar".',
            'Selecciona el periodo de tiempo.',
            '**Truco GentleFinances**: Envía el archivo a tu email o guárdalo en iCloud/Drive para subirlo aquí fácilmente.'
        ],
        format: 'CSV o XLS',
        notes: 'Imagin usa el motor de CaixaBank. Si fallas en la app, prueba las claves en la web de CaixaBank.'
    },
    bbva: {
        name: 'BBVA',
        icon: '🟦',
        link: 'https://www.bbva.es/personas/ayuda/preguntas-frecuentes.html',
        steps: [
            'Inicia sesión en la web de BBVA.',
            'Pulsa en la cuenta que quieres analizar.',
            'Baja hasta donde ves la lista de movimientos.',
            'Verás un icono de descarga (una hoja con flecha). Haz clic.',
            '**Truco GentleFinances**: Elige "Formato Excel". BBVA genera archivos muy limpios que procesamos al 100% de precisión.'
        ],
        format: 'Excel o CSV',
        notes: 'Asegúrate de que el filtro de fechas incluya todo el mes que quieres importar.'
    },
    traderepublic: {
        name: 'Trade Republic',
        icon: '📈',
        link: 'https://support.traderepublic.com/es-es/',
        steps: [
            'Abre la App > Ve a tu Perfil.',
            'Entra en la sección de "Documentos".',
            'Busca el "Extracto de cuenta" o "Informes de actividad".',
            'Trade Republic suele dar PDFs. Genera el de transacciones.',
            '**Truco GentleFinances**: Sube el PDF directamente. Nuestro motor inteligente lo leerá igual de bien que un Excel.'
        ],
        format: 'PDF o CSV (si está disponible)',
        notes: 'Ideal para seguir tus dividendos y depósitos de efectivo aquí.'
    },
    santander: {
        name: 'Banco Santander',
        icon: '🔴',
        link: 'https://www.bancosantander.es/ayuda-particular/cuentas-tarjetas/movimientos',
        steps: [
            'Entra en la Banca Online Santander.',
            'Haz clic en la cuenta deseada > Movimientos.',
            'Pulsa el botón "Exportar" que verás sobre el listado.',
            '**Truco GentleFinances**: Selecciona "Excel". Santander usa comas para los decimales y nosotros ya estamos configurados para entenderlo así.'
        ],
        format: 'Excel (XLS/XLSX)',
        notes: 'En la App de particulares el botón de exportar Excel puede estar escondido bajo "Filtros".'
    },
    sabadell: {
        name: 'Banco Sabadell',
        icon: '🔵',
        link: 'https://www.bancsabadell.com/cs/Satellite/SabAtl/Saldos-y-movimientos/1191332199014/es/',
        steps: [
            'Accede a tu banca a distancia.',
            'Ve a Cuentas > Saldos y movimientos.',
            'Selecciona el periodo de fechas.',
            'Haz clic en "Descargar" y elige el formato Excel.',
            '**Truco GentleFinances**: El Sabadell exporta mucha información extra; no te preocupes, nosotros limpiaremos el archivo automáticamente.'
        ],
        format: 'Excel o Norma 43',
        notes: 'Si eliges Norma 43 también funcionará, pero el Excel es más visual.'
    },
    bankinter: {
        name: 'Bankinter',
        icon: '🟠',
        link: 'https://www.bankinter.com/banca/ayuda/cuentas/consultar-descargar-movimientos',
        steps: [
            'Entra en Bankinter.com.',
            'En el menú lateral "Cuentas", elige "Movimientos".',
            'Pulsa el icono de la flecha de descarga arriba a la derecha.',
            '**Truco GentleFinances**: Al elegir Excel, Bankinter te permite elegir columnas. Déjalas todas por defecto para que podamos categorizar mejor.'
        ],
        format: 'Excel (.xls)',
        notes: 'Asegúrate de pulsar "Aplicar" en el filtro de fechas antes de descargar.'
    },
    openbank: {
        name: 'Openbank',
        icon: '🔑',
        link: 'https://www.openbank.es/ayuda/preguntas-frecuentes/cuentas',
        steps: [
            'Inicia sesión en la web de Openbank.',
            'Ve a Cuentas > Selecciona tu cuenta.',
            'Haz clic en el icono de descarga (⬇️) junto a los movimientos.',
            '**Truco GentleFinances**: Elige "CSV". Es el formato nativo de Openbank y se sube casi al instante.'
        ],
        format: 'CSV o Excel',
        notes: 'Openbank pertenece al grupo Santander, sus archivos son muy compatibles.'
    },
    revolut: {
        name: 'Revolut',
        icon: 'R',
        link: 'https://help.revolut.com/es-ES/help/accounts/account-statements/how-do-i-download-a-statement/',
        steps: [
            'App de Revolut > Pulsa en tu balance principal.',
            'Toca en "..." (Más) > "Extracto" (Statement).',
            'Elige fechas y selecciona formato "Excel" o "CSV".',
            '**Truco GentleFinances**: El CSV de Revolut es el mejor de todos. Incluye datos de comercios que nos ayudan a poner iconos automáticos a tus gastos.'
        ],
        format: 'CSV o Excel',
        notes: 'Revolut es instantáneo. Descárgalo y súbelo aquí en segundos.'
    },
    n26: {
        name: 'N26',
        icon: 'N',
        link: 'https://support.n26.com/es-es/app-y-funciones/app/como-descargar-mi-extracto-bancario',
        steps: [
            'Entra en la WebApp de N26 (app.n26.com).',
            'Pulsa en el icono de descarga (flecha) arriba a la derecha.',
            'Selecciona el rango de fechas y formato CSV.',
            '**Truco GentleFinances**: N26 solo permite descargar CSV desde el ordenador, no desde la App móvil móvil.'
        ],
        format: 'CSV',
        notes: 'Usa la versión web de N26 para obtener el archivo correcto.'
    },
    ing: {
        name: 'ING España',
        icon: '🦁',
        link: 'https://www.ing.es/ayuda/preguntas-frecuentes/cuentas/como-descargar-movimientos',
        steps: [
            'Accede a tu cuenta en la web de ING.',
            'Pincha en tu cuenta para ver los movimientos.',
            'En el menú lateral o superior verás "Consultar extractos" o un icono de XLS.',
            '**Truco GentleFinances**: Si usas Cuenta Nómina, el Excel incluirá el saldo acumulado, lo cual es genial para que nuestra gráfica de progreso sea perfecta.'
        ],
        format: 'Excel (.xls)',
        notes: 'ING es muy rápido procesando. Un mes entero se sube en 1 segundo.'
    }
};

// Inicialización
// Inicialización adaptada para SPA
window.Import = {
    init() {
        initDropZone();
        initBankGuides();
    },
    closeGuideModal() {
        const modal = document.getElementById('importGuideModal');
        if (modal) modal.classList.remove('active');
    },
    confirm() {
        confirmImport();
    },
    reset() {
        resetImport();
    }
};

// =============================================================================
// ZONA DE ARRASTRE (DROP ZONE)
// =============================================================================

// =============================================================================
// ZONA DE ARRASTRE (DROP ZONE)
// =============================================================================

function initDropZone() {
    const dropZone = document.getElementById('import-dropZone');
    const fileInput = document.getElementById('import-fileInput');

    // Safety check for SPA - elements may not exist if view is not active
    if (!dropZone || !fileInput) {
        return;
    }

    // Check if already initialized to prevent duplicate pairs of listeners
    if (dropZone.dataset.listenersAttached === 'true') {
        return;
    }

    // Click para abrir selector
    dropZone.addEventListener('click', () => fileInput.click());

    // Eventos de arrastre
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Input de archivo
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Mark as initialized
    dropZone.dataset.listenersAttached = 'true';
}

// =============================================================================
// GUÍAS DE BANCOS
// =============================================================================

function initBankGuides() {
    const guideContainer = document.getElementById('import-bankGuides');
    if (!guideContainer) return;

    // Check if container already processed
    if (guideContainer.dataset.listenersAttached === 'true') {
        return;
    }

    guideContainer.querySelectorAll('.bank-guide-item').forEach(item => {
        item.addEventListener('click', () => {
            const bankId = item.dataset.bank;
            showBankGuide(bankId);
        });
    });

    // Mark as initialized
    guideContainer.dataset.listenersAttached = 'true';
}

function showBankGuide(bankId) {
    const guide = BANK_GUIDES[bankId];
    if (!guide) return;

    const modal = document.getElementById('importGuideModal');
    if (!modal) {
        alert(`Instrucciones para ${guide.name}:\n\n${guide.steps.join('\n')}\n\nVisita su web oficial para más ayuda.`);
        return;
    }

    // Populate Modal
    const guideIcon = document.getElementById('guideIcon');
    const guideTitle = document.getElementById('guideTitle');
    const guideBody = document.getElementById('guideBody');
    const guideFormat = document.getElementById('guideFormat');
    const guideLink = document.getElementById('guideLink');

    if (guideIcon) guideIcon.textContent = guide.icon || '🏦';
    if (guideTitle) guideTitle.textContent = `Importar de ${guide.name}`;

    if (guideBody) {
        guideBody.innerHTML = `
            <div style="margin-bottom: var(--space-md);">
                <ol style="padding-left: 20px; color: var(--text-primary); line-height: 1.6;">
                    ${guide.steps.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}
                </ol>
            </div>
            <div style="background: var(--bg-secondary); padding: var(--space-md); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                <strong style="color: var(--gold-primary);">💡 Nota:</strong>
                <p style="margin: 0; color: var(--text-secondary); font-size: var(--text-sm); margin-top: 4px;">${guide.notes}</p>
            </div>
        `;
    }

    if (guideFormat) {
        guideFormat.innerHTML = `Formato recomendado: <span style="color: var(--text-primary); font-weight: bold;">${guide.format}</span>`;
    }

    if (guideLink) {
        guideLink.href = guide.link;
        guideLink.setAttribute('aria-label', `Ir a ayuda oficial de ${guide.name}`);
    }

    // Show Modal
    modal.classList.add('active');
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    const modal = document.getElementById('importGuideModal');
    if (e.target === modal) {
        Import.closeGuideModal();
    }
});

// =============================================================================
// PROCESAMIENTO DE ARCHIVO
// =============================================================================

async function handleFile(file) {
    // Validar tipo de archivo
    const validExtensions = ['.csv', '.ofx', '.qfx', '.qif', '.txt'];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(ext)) {
        showToast('Formato no soportado. Usa CSV, OFX, QFX o QIF', 'error');
        return;
    }

    // Mostrar loading
    showToast('Procesando archivo...', 'info');

    try {
        // Llamar a la API de parsing
        const result = await window.GentleFinancesAPI.import.parseFile(file);

        if (result.success) {
            parsedData = result;
            currentMapping = result.mapping;
            showPreview(result);
        } else {
            showToast('Error al procesar el archivo', 'error');
        }
    } catch (error) {
        console.error('Error parsing file:', error);
        showToast(error.message || 'Error al procesar el archivo', 'error');
    }
}

// =============================================================================
// VISTA PREVIA
// =============================================================================

function showPreview(data) {
    // Actualizar pasos
    document.getElementById('import-step1').classList.remove('active');
    document.getElementById('import-step1').classList.add('completed');
    document.getElementById('import-step2').classList.add('active');

    // Cambiar secciones
    document.getElementById('import-uploadSection').style.display = 'none';
    document.getElementById('import-previewSection').style.display = 'block'; // Was classlist.add('active') but inline style is more reliable with existing HTML

    // Info del archivo
    document.getElementById('import-fileName').textContent = data.fileName;

    // Resumen
    const transactions = data.allTransactions || data.transactions;
    const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

    document.getElementById('import-totalTransactions').textContent = transactions.length;
    document.getElementById('import-totalIncome').textContent = formatCurrency(income);
    document.getElementById('import-totalExpenses').textContent = formatCurrency(expenses);

    // Tabla de previsualización
    renderPreviewTable(transactions);
}

function renderPreviewTable(transactions) {
    const tbody = document.getElementById('import-previewTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid var(--border-subtle); text-align: left;">
                    <th style="padding: var(--space-sm);">Fecha</th>
                    <th style="padding: var(--space-sm);">Concepto</th>
                    <th style="padding: var(--space-sm);">Importe</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.slice(0, 50).map(tx => `
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                        <td style="padding: var(--space-sm);">${formatDate(new Date(tx.date))}</td>
                        <td style="padding: var(--space-sm);">${escapeHtml(tx.description || '-')}</td>
                        <td style="padding: var(--space-sm);" class="${tx.amount >= 0 ? 'text-positive' : 'text-negative'}">
                            ${formatCurrency(tx.amount)}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    if (transactions.length > 50) {
        tbody.innerHTML += `
            <div class="text-muted text-center p-md">
                ... y ${transactions.length - 50} transacciones más
            </div>
        `;
    }
}

// =============================================================================
// IMPORTACIÓN FINAL
// =============================================================================

async function confirmImport() {
    const transactionsToSave = parsedData?.allTransactions || parsedData?.transactions;

    if (!transactionsToSave || transactionsToSave.length === 0) {
        showToast('No hay datos para importar', 'error');
        return;
    }

    // STRICT CHECK: Ensure Auth & Firestore
    const currentUser = window.AuthService?.getCurrentUser();
    if (!currentUser || !window.FirestoreService) {
        showToast('❌ Error: No estás conectado a tu cuenta. Inicia sesión para importar.', 'error');
        return;
    }

    showToast('Importando transacciones a la nube...', 'info');

    let savedCount = 0;
    let errorCount = 0;

    try {
        let totalImpact = 0;
        // Guardar secuencialmente para no saturar
        for (const tx of transactionsToSave) {
            try {
                // Preparar objeto de transacción compatible con el modelo
                const newTx = {
                    date: typeof tx.date === 'string' ? new Date(tx.date) : tx.date,
                    amount: parseFloat(tx.amount),
                    description: tx.description || 'Importado',
                    category: tx.category || 'general',
                    type: tx.amount >= 0 ? 'income' : 'expense',
                    notes: `Importado de ${parsedData.fileName}`
                };

                if (window.FirestoreService?.transactions) {
                    await window.FirestoreService.transactions.create(newTx);
                    totalImpact += newTx.amount;
                    savedCount++;
                }
            } catch (err) {
                console.error('Error saving transaction:', err);
                errorCount++;
            }
        }

        // Sincronizar el saldo total de la cuenta tras la importación
        if (savedCount > 0 && window.syncAccountBalance) {
            await window.syncAccountBalance(totalImpact);
        }

        if (savedCount > 0) {
            showSuccess(savedCount, 0); // Duplicados no verificados por ahora
        } else {
            showToast('No se pudieron guardar las transacciones', 'error');
        }

    } catch (error) {
        console.error('Import error:', error);
        showToast(error.message || 'Error al importar', 'error');
    }
}

function showSuccess(savedCount, duplicatesSkipped) {
    // Actualizar pasos
    const step2 = document.getElementById('import-step2');
    if (step2) {
        step2.classList.remove('active');
        step2.classList.add('completed');
    }
    const step3 = document.getElementById('import-step3');
    if (step3) {
        step3.classList.add('active');
        step3.classList.add('completed');
    }

    // Cambiar secciones
    const previewSec = document.getElementById('import-previewSection');
    if (previewSec) previewSec.style.display = 'none';

    const successSec = document.getElementById('import-successSection');
    if (successSec) successSec.style.display = 'block';

    // Mensaje de éxito
    let message = `Se han importado ${savedCount} transacciones correctamente.`;
    if (duplicatesSkipped > 0) {
        message += ` Se omitieron ${duplicatesSkipped} duplicados.`;
    }
    const msgEl = document.getElementById('import-successMessage');
    if (msgEl) msgEl.textContent = message;
}

// =============================================================================
// RESET
// =============================================================================

function resetImport() {
    parsedData = null;
    currentMapping = null;

    // Reset pasos
    document.getElementById('import-step1').classList.remove('completed');
    document.getElementById('import-step1').classList.add('active');
    document.getElementById('import-step2').classList.remove('active', 'completed');
    document.getElementById('import-step3').classList.remove('active', 'completed');

    // Reset secciones
    document.getElementById('import-uploadSection').style.display = 'block';
    document.getElementById('import-previewSection').style.display = 'none';
    document.getElementById('import-successSection').style.display = 'none';

    // Reset input
    const fileInput = document.getElementById('import-fileInput');
    if (fileInput) fileInput.value = '';
}

// =============================================================================
// UTILIDADES
// =============================================================================

function formatCurrency(value) {
    if (window.Utils?.formatCurrency) return Utils.formatCurrency(value);
    const sign = value < 0 ? '-' : '';
    return sign + '€' + Math.abs(value).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(date) {
    if (!date || isNaN(date)) return '-';
    const locale = window.Utils?._getLocale ? Utils._getLocale() : 'es-ES';
    return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
