# 📖 Funciones de GentleFinance

Documento que describe todas las funciones de la aplicación organizadas por módulo, junto con su código relevante.

---

## 📁 `js/app.js` — Aplicación Principal

Singleton principal `GentleFinances` con utilidades globales.

### `init()`
Inicializa la aplicación: registra Service Worker, configura listeners de auth, componentes UI y formularios.
```javascript
init() {
    this.registerServiceWorker();
    this.setupAuthListener();
    this.setupOnlineStatus();
    this.initializeComponents();
    this.setupEventListeners();
    this.initModals();
    this.initForms();
}
```

### `registerServiceWorker()`
Registra el Service Worker para funcionalidad PWA offline.
```javascript
registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js');
    }
}
```

### `setupAuthListener()`
Configura el listener de autenticación de Firebase para detectar cambios de sesión del usuario.

### `loadFirebaseData()`
Carga los datos del usuario desde Firebase (transacciones, cuentas, presupuestos, metas).

### `clearState()`
Limpia el estado de la aplicación (transacciones, cuentas, presupuestos, metas).
```javascript
clearState() {
    this.state.transactions = [];
    this.state.accounts = [];
    this.state.budgets = [];
    this.state.goals = [];
}
```

### `setupOnlineStatus()`
Configura listeners para detectar si la app está online u offline.

### `initializeComponents()`
Inicializa los componentes de la interfaz de usuario.

### `setupEventListeners()`
Configura los event listeners globales (resize, click, etc.).

### `initModals()`
Inicializa la funcionalidad de los modales (abrir, cerrar, clic fuera).

### `initForms()`
Inicializa los manejadores de formularios de transacciones.

### `confirmAndDeleteTransaction()`
Muestra diálogo de confirmación y elimina una transacción.

### `handleTransactionSubmit(form)`
Maneja el envío del formulario de transacción (crear o editar).
```javascript
handleTransactionSubmit(form) {
    // Obtiene datos del formulario
    // Valida campos requeridos
    // Crea o actualiza transacción en Firebase
    // Sube archivos adjuntos si los hay
    // Actualiza el dashboard
}
```

### `syncAccountBalance(amountDiff)`
Sincroniza el saldo de la cuenta tras una transacción.

### `getCategoryIcon(category)`
Devuelve el icono emoji correspondiente a una categoría.
```javascript
getCategoryIcon(category) {
    const icons = {
        food: '🍽️', transport: '🚗', entertainment: '🎬',
        bills: '📄', shopping: '🛍️', health: '💊',
        housing: '🏠', education: '📚', salary: '💰',
        freelance: '💻', investments: '📈', other: '📦'
    };
    return icons[category] || '📦';
}
```

### `openModal(modalId)`
Abre un modal por su ID.
```javascript
openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}
```

### `closeModal(modalId)`
Cierra un modal por su ID.

### `closeAllModals()`
Cierra todos los modales abiertos.

### `handleFileSelect(input)`
Maneja la selección de archivos desde un input file.

### `removeFile(type, index)`
Elimina un archivo de la lista (nuevo o existente).

### `renderFileGrid()`
Renderiza la cuadrícula de archivos adjuntos en el modal de transacción.

### `showToast(message, type)`
Muestra una notificación toast en pantalla.
```javascript
showToast(message, type = 'gold') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
```

### `updateGreeting()`
Actualiza el saludo según la hora del día (Buenos días/tardes/noches).

### `updateLastSync()`
Actualiza la visualización de la última sincronización.

### `refreshData()`
Refresca los datos del dashboard manualmente.

### `refreshDashboard()`
Refresca los datos del dashboard.

### `handleResize()`
Maneja el evento de redimensionar la ventana.

### `openEditTransactionModal(tx)`
Abre el modal de edición con los datos de una transacción existente.

### `deleteTransaction(id)`
Elimina una transacción por su ID en Firebase.

### `openAddTransactionModal()`
Abre el modal para añadir una nueva transacción (formulario vacío).

---

### Utilidades (`Utils`)

### `Utils.formatCurrency(amount, currency)`
Formatea una cantidad como moneda.
```javascript
formatCurrency(amount, currency) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency || 'EUR'
    }).format(amount);
}
```

### `Utils.formatRelativeTime(date)`
Formatea una fecha como tiempo relativo ('hace 5 minutos').

---

## 📁 `js/dashboard.js` — Dashboard

Controlador del panel principal con widgets y gráficos.

### `init()`
Inicializa el dashboard: carga widgets, binds de eventos, gráfico.
```javascript
init() {
    this.loadWidgets();
    this.bindEvents();
    this.initNetWorthChart();
}
```

### `loadWidgets()`
Carga y renderiza todos los widgets del dashboard.

### `calculateNetWorth()`
Calcula el patrimonio neto incluyendo cuentas, inversiones y criptomonedas.
```javascript
calculateNetWorth() {
    let total = 0;
    const accounts = GentleFinances.state.accounts || [];
    total = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    // Suma inversiones y criptomonedas del Portfolio
    return { total, accounts: total, investments: 0, crypto: 0 };
}
```

### `calculateAvailableBalance()`
Calcula el saldo disponible de todas las cuentas.

### `checkBalanceConsistency(accountTotal)`
Verifica si el saldo de las cuentas coincide con la suma de transacciones.

### `calculateCashFlow()`
Calcula el flujo de caja mensual (ingresos vs gastos).

### `updateNetWorthWidget(data)`
Actualiza el widget de patrimonio neto en la UI.

### `updateBalanceWidget(data)`
Actualiza el widget de saldo disponible.

### `updateCashFlowWidget(data)`
Actualiza los widgets de ingresos y gastos.

### `updateRecentActivity()`
Actualiza la lista de actividad reciente (últimas 5 transacciones).

### `updateBudgetWidget()`
Actualiza el widget de resumen de presupuesto.

### `initNetWorthChart()`
Inicializa el gráfico de patrimonio neto con Chart.js.

### `updateChartTimeframe(range)`
Cambia el rango temporal del gráfico (1M, 3M, 6M, 1Y).

### `updateChartData()`
Actualiza los datos del gráfico según el rango seleccionado.

### `calculateNetWorthHistory(range)`
Calcula el historial del patrimonio neto basándose en transacciones.

### `bindEvents()`
Vincula los eventos del dashboard (botones de rango, refrescar, etc.).

### `reorderWidget(widgetId, newOrder)`
Cambia el orden de un widget en el dashboard.

### `refresh()`
Refresca todos los datos del dashboard.

### `startAutoRefresh()`
Inicia el refresco automático periódico del dashboard.

---

## 📁 `js/api.js` — Servicio de APIs

API standalone sin servidor para cripto, inversiones e inmobiliario.

### CryptoAPI

#### `getTop100(page, perPage)`
Obtiene las 100 principales criptomonedas de CoinGecko.
```javascript
async getTop100(page = 1, perPage = 100) {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=${perPage}&page=${page}`;
    const response = await fetch(url);
    return response.json();
}
```

#### `getCoin(coinId)`
Obtiene detalles de una criptomoneda específica.

#### `getHistory(coinId, days)`
Obtiene historial de precios de una criptomoneda.

#### `search(query)`
Busca criptomonedas por nombre o símbolo.

#### `getTrending()`
Obtiene las criptomonedas trending del momento.

#### `getGlobal()`
Obtiene datos globales del mercado de criptomonedas.

### InvestmentsAPI (Finnhub)

#### `isRealAPI()`
Comprueba si se está usando la API real de Finnhub.

#### `getQuote(symbol)`
Obtiene cotización para un símbolo bursátil.
```javascript
async getQuote(symbol) {
    const url = `${FINNHUB_CONFIG.baseUrl}/quote?symbol=${symbol}&token=${FINNHUB_CONFIG.apiKey}`;
    const response = await fetch(url);
    return response.json();
}
```

#### `getQuotes(symbols)`
Obtiene cotizaciones múltiples.

#### `getHistory(symbol, range)`
Obtiene datos históricos de un valor (Finnhub candle).

#### `search(query)`
Busca valores por nombre o símbolo.

#### `getMovers()`
Obtiene los valores con más movimiento del mercado.

#### `getIndices()`
Obtiene índices de mercado (usando ETFs como proxy).

#### `getFundamentals(symbol)`
Obtiene datos fundamentales de una empresa.

### RealEstateAPI (INE)

#### `getPrices()`
Obtiene precios de vivienda por comunidad autónoma.

#### `getCommunity(id)`
Obtiene datos de una comunidad autónoma específica.

#### `getHistory()`
Obtiene historial de precios inmobiliarios.

#### `getAffordability()`
Obtiene índice de accesibilidad de vivienda.

### ImportAPI

#### `parseFile(file)`
Parsea un archivo bancario (CSV, OFX, QIF).

#### `getGuides()`
Devuelve las guías de exportación bancaria.

### Parsers

#### `parseCSV(content)`
Parsea contenido CSV a formato de transacciones.

---

## 📁 `js/auth-ui.js` — Interfaz de Autenticación

Control de acceso con autenticación Firebase.

### `init()`
Inicializa los listeners de autenticación y verifica dependencias.
```javascript
init() {
    this.checkDependency();
    this.bindEvents();
}
```

### `checkDependency()`
Verifica que Firebase Auth esté disponible, con reintentos.

### `toggleView(viewName)`
Cambia entre vista de login y vista de la aplicación.

### `grantAccess(user)`
Concede acceso a la aplicación tras autenticación exitosa.

### `denyAccess(reason, user)`
Deniega acceso mostrando pantalla de login con razón.

### `bindEvents()`
Vincula eventos de los botones de login/registro/Google Sign-In.

### `setLoading(loading)`
Muestra/oculta indicador de carga en el formulario de auth.

### `showError(message, user)`
Muestra mensajes de error en la interfaz de auth.

### `translateError(error)`
Traduce códigos de error de Firebase a mensajes legibles.

---

## 📁 `js/budget.js` — Módulo de Presupuesto (Básico)

### `init()`
Inicializa el módulo de presupuesto.

### `loadBudget()`
Carga datos de presupuesto del mes actual.

### `render(budgets)`
Renderiza la vista del presupuesto.

### `getAvailableToBudget()`
Calcula el dinero disponible para presupuestar.
```javascript
getAvailableToBudget() {
    const accounts = GentleFinances.state.accounts || [];
    const budgets = GentleFinances.state.budgets || [];
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);
    return totalBalance - totalBudgeted;
}
```

### `setCategory(data)`
Crea o actualiza una categoría de presupuesto.

### `moveMoney(fromCategory, toCategory, amount)`
Mueve dinero entre categorías de presupuesto.

### `getSummary()`
Devuelve resumen del presupuesto (total presupuestado, gastado, etc.).

---

## 📁 `js/budgets.js` — Presupuestos (Zero-Based)

Implementa presupuesto base cero con plantillas.

### `init()`
Inicializa el módulo de presupuestos.

### `loadData()`
Carga datos de presupuesto desde Firebase.

### `getCategoryName(id)` / `getCategoryIcon(id)`
Devuelven nombre e icono de una categoría.

### `render()`
Renderiza la vista completa de presupuestos.

### `updateMonthDisplay()`
Actualiza la visualización del mes actual.

### `prevMonth()` / `nextMonth()`
Navegan entre meses.

### `renderCategories()`
Renderiza la lista de categorías con barras de progreso.

### `updateSummary()`
Actualiza el resumen (ingresos, presupuestado, gastado, disponible).

### `renderChart()`
Renderiza un gráfico circular con la distribución del presupuesto.

### `editCategory(id)`
Permite editar una categoría existente.

### `addCategory()`
Añade una nueva categoría de presupuesto.

### `applyTemplate(template)`
Aplica una plantilla predefinida de presupuesto (50/30/20, etc.).

### `showTemplates()`
Muestra las plantillas disponibles.

---

## 📁 `js/crypto-service.js` — Servicio de Cifrado E2E

Encriptación AES-GCM 256-bit usando Web Crypto API.

### `constructor()`
Inicializa el servicio con clave maestra.

### `init()`
Carga clave existente de localStorage o genera una nueva.
```javascript
async init() {
    const rawKey = localStorage.getItem(this.keyName);
    if (rawKey) {
        this.key = await this.importKey(rawKey);
    } else {
        this.key = await this.generateKey();
        const exported = await this.exportKey(this.key);
        localStorage.setItem(this.keyName, exported);
    }
    this.isReady = true;
}
```

### `generateKey()`
Genera clave AES-GCM 256-bit.

### `exportKey(key)` / `importKey(jwkString)`
Exporta/importa la clave en formato JWK.

### `encrypt(data)`
Encripta datos con IV aleatorio. Formato: `IV_BASE64:CIPHERTEXT_BASE64`.

### `decrypt(encryptedString)`
Desencripta datos. Separa IV y ciphertext, luego descifra.

### `arrayBufferToBase64(buffer)` / `base64ToArrayBuffer(base64)`
Conversión entre ArrayBuffer y Base64.

### `syncKey(userId)`
Sincroniza la clave de cifrado con Firebase (backup en la nube).

---

## 📁 `js/crypto.js` — Página de Criptomonedas

Controlador de la vista de criptomonedas con gráficos y búsqueda.

### `init()`
Inicializa la página: carga stats globales, top 100, trending, búsqueda.

### `loadGlobalStats()`
Carga estadísticas globales del mercado crypto.

### `loadTop100()`
Carga y renderiza la tabla de las 100 principales criptomonedas.

### `drawSparkline(canvasId, data, isPositive)`
Dibuja mini gráfico sparkline en un canvas.
```javascript
drawSparkline(canvasId, data, isPositive) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = isPositive ? '#4CAF50' : '#F44336';
    // Dibuja línea con los puntos de datos
}
```

### `loadTrending()`
Carga criptomonedas en tendencia.

### `initSearch()`
Inicializa la barra de búsqueda de criptomonedas.

### `renderSearchResults(results)`
Renderiza los resultados de búsqueda.

### `openCoinModal(coinId)`
Abre el modal con detalles de una criptomoneda específica.

### `closeModal()`
Cierra el modal de criptomoneda.

### `initChartControls()`
Inicializa los controles del gráfico (1D, 7D, 30D, 1Y).

### `loadCoinChart(coinId, days)`
Carga y renderiza el gráfico de precios de una criptomoneda.

### `openInvestModal(coinId)` / `investInCrypto()`
Abre el modal de inversión y procesa la compra de criptomoneda.

---

## 📁 `js/firebase-sdk.js` — SDK de Firebase

Configuración e integración con Firebase (Auth, Firestore, Storage).

### StorageService

#### `uploadFile(file, path)`
Sube un archivo a Firebase Storage y devuelve la URL de descarga.

### AuthService

#### `onAuthChange(callback)`
Escucha cambios de autenticación.

#### `register(email, password, displayName)`
Registra un nuevo usuario con email/contraseña.

#### `login(email, password)`
Inicia sesión con email/contraseña.

#### `loginWithGoogle()`
Inicia sesión con Google (popup o redirect).

#### `checkRedirectResult()`
Verifica si hay un resultado de redirect pendiente (Google Sign-In).

#### `resendVerificationEmail(user)`
Reenvía el correo de verificación.

#### `logout()`
Cierra la sesión del usuario.

#### `getCurrentUser()`
Devuelve el usuario autenticado actual.

### FirestoreService

#### `users.create(userId, data)` / `users.get(userId)` / `users.update(userId, data)`
CRUD de usuarios en Firestore.

#### `settings.getKey(userId)` / `settings.saveKey(userId, keyString)`
Guarda y recupera la clave de cifrado en Firestore.

#### `sessions.create(userId, sessionData)` / `sessions.list(userId)` / `sessions.revoke(userId, sessionId)`
Gestión de sesiones de dispositivos.

#### `transactions.create(data)`
Crea una nueva transacción en Firestore (con cifrado E2E).
```javascript
async create(data) {
    const user = AuthService.getCurrentUser();
    const encrypted = await E2EE.encryptData(data);
    await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        ...encrypted,
        userId: user.uid,
        createdAt: serverTimestamp()
    });
}
```

#### `transactions.getAll(filters)` / `transactions.get(transactionId)`
Lee transacciones (con descifrado E2E automático).

#### `transactions.update(transactionId, updates)` / `transactions.delete(transactionId)`
Actualiza/elimina transacciones.

#### `transactions.subscribe(callback)`
Suscripción en tiempo real a cambios en transacciones.

#### `transactions.deleteAll()`
Elimina todas las transacciones del usuario.

#### `budgets.create(data)` / `budgets.getAll(month)` / `budgets.update(budgetId, updates)` / `budgets.delete(budgetId)`
CRUD de presupuestos.

---

## 📁 `js/goals.js` — Metas de Ahorro

Gestión de metas de ahorro y deudas.

### `init()` / `loadData()`
Inicializa y carga datos de metas desde Firebase.

### `render()` / `renderSummary()` / `renderGoals()` / `renderDebts()`
Renderiza la vista completa, resumen, lista de metas y deudas.

### `getCircularProgress(percent, radius, color)`
Genera SVG de barra de progreso circular.
```javascript
getCircularProgress(percent, radius = 30, color = 'var(--gold-primary)') {
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return `<svg>...círculo de progreso...</svg>`;
}
```

### `add()` / `saveGoal()` / `editGoal(id)` / `deleteGoal(id)`
Añade, guarda, edita y elimina metas.

### `selectIcon(btn)` / `updateIconSelection()`
Gestiona la selección de iconos para metas.

### `openContributeModal(id)` / `saveContribution()`
Abre modal para aportar fondos a una meta y guarda la aportación.

### `addDebt()` / `saveDebt()` / `deleteDebt(id)`
CRUD de deudas.

### `showDebtSimulator()`
Muestra el simulador de pago de deudas.

### `openModal(id)` / `closeModal(id)`
Helpers para abrir/cerrar modales de metas.

---

## 📁 `js/help.js` — Centro de Ayuda

### `init()`
Inicializa el buscador de ayuda.

### `search(query)`
Busca en las preguntas frecuentes filtrando por texto.

### `toggleFaq(element)`
Muestra/oculta la respuesta de una pregunta FAQ.

### `scrollTo(sectionId)`
Hace scroll suave a una sección de ayuda.

### `showToast(message)`
Muestra notificación toast.

---

## 📁 `js/i18n.js` — Internacionalización

Sistema de traducciones multi-idioma (es, en, de).

Contiene todas las cadenas de texto de la aplicación traducidas a español, inglés y alemán.

### Funciones de traducción
Proporciona traducción de: navegación, transacciones, categorías, ajustes, seguridad, informes, presupuestos, metas, suscripciones, portfolio, PWA, etc.

---

## 📁 `js/import.js` — Importación de Datos

Importación de archivos bancarios (CSV, XLS, OFX).

### `init()` / `closeGuideModal()` / `confirm()` / `reset()`
Inicialización y control del módulo de importación.

### `initDropZone()`
Configura la zona de arrastre (drag & drop) para archivos.

### `initBankGuides()`
Inicializa las guías de exportación por banco (CaixaBank, BBVA, Santander, etc.).

### `showBankGuide(bankId)`
Muestra la guía paso a paso para exportar datos de un banco específico.

### `handleFile(file)`
Procesa un archivo subido: detecta formato y parsea.

### `showPreview(data)` / `renderPreviewTable(transactions)`
Muestra vista previa de las transacciones importadas.

### `confirmImport()`
Confirma la importación y guarda las transacciones en Firebase.

### `showSuccess(savedCount, duplicatesSkipped)`
Muestra mensaje de éxito con contadores.

---

## 📁 `js/investment-modal.js` — Modal de Inversiones

### `open(asset)` / `close()`
Abre/cierra el modal de inversión con datos del activo.

### `render()`
Renderiza el contenido del modal con formulario de inversión.

### `createModalElement()`
Crea el elemento DOM del modal si no existe.

### `setType(type)`
Cambia el tipo de operación (compra/venta).

### `calculateTotal()` / `calculateQuantity()`
Calcula total desde cantidad o cantidad desde importe.

### `save(event)`
Guarda la inversión en el portfolio.

---

## 📁 `js/investments.js` — Página de Inversiones

Buscador de acciones, gráficos y datos de mercado.

### `initInvestments()`
Inicializa la página de inversiones.

### `closeStockDetail()`
Cierra la vista de detalle de una acción.

### `loadWatchlist()` / `saveWatchlist()`
Carga/guarda la watchlist del usuario.

### `toggleWatchlist(symbol)`
Añade/elimina un valor de la watchlist.

### `initSearch()` / `renderSearchResults(results)`
Búsqueda de valores bursátiles.

### `loadStock(symbol)`
Carga datos completos de un valor (cotización, fundamentales, gráfico).

### `renderFundamentals(data, quote)`
Renderiza los datos fundamentales de una empresa.

### `loadPriceChart(symbol, range)`
Carga y renderiza el gráfico de precios con Chart.js.

### `loadMarketIndices()`
Carga índices del mercado (S&P 500, NASDAQ, etc.).

### `loadTopMovers()`
Carga los valores con más movimiento.

### `renderWatchlist()` / `addToWatchlist(symbol)` / `removeFromWatchlist(symbol)`
Gestión de la watchlist.

### `investInStock()`
Abre modal para invertir en una acción.

---

## 📁 `js/modal.js` — Sistema de Modales

Sistema de modales personalizado reemplazando `prompt()` y `alert()`.

### `init()`
Inicializa el sistema de modales creando el contenedor HTML.

### `show(title, bodyHTML, footerHTML)`
Muestra un modal con contenido personalizado.

### `close()`
Cierra el modal activo.

### `showInvestModal(asset, onConfirm)`
Muestra modal especializado para inversiones con calculadora.

### `alert(title, message, type)`
Alert personalizado con estilo de la aplicación.

### `confirm(title, message, onConfirm)`
Diálogo de confirmación personalizado.

---

## 📁 `js/navigation.js` — Navegación SPA

Sistema de navegación Single Page Application.

### `init()`
Inicializa la navegación con manejo de historial del navegador.
```javascript
init() {
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.page) {
            this.navigateTo(event.state.page, false);
        }
    });
    const initialPage = window.location.hash.substring(1) || 'dashboard';
    this.navigateTo(initialPage, false, true);
}
```

### `navigateTo(pageId, pushState, isInitial)`
Navega a una sección: oculta todas las vistas, muestra la seleccionada, actualiza sidebar/bottom nav, inicializa módulo.

### `initPageModule(pageId)`
Inicializa el módulo lógico correspondiente a cada página.
```javascript
initPageModule(pageId) {
    switch (pageId) {
        case 'dashboard':   Dashboard.init(); break;
        case 'transactions': Transactions.render(); break;
        case 'budget':       Budget.init(); break;
        case 'goals':        Goals.init(); break;
        case 'investments':  initInvestments(); break;
        case 'crypto':       CryptoView.init(); break;
        case 'realestate':   RealEstateView.init(); break;
        case 'subscriptions': Subscriptions.init(); break;
        case 'portfolio':    PortfolioManager.init(); break;
        case 'import':       Import.init(); break;
        case 'reports':      Reports.init(); break;
        case 'settings':     Settings.init(); break;
    }
}
```

### `openMobileDrawer()` / `closeMobileDrawer()`
Abre/cierra el drawer de navegación móvil.

### `toggleMobileSubmenu(id)`
Alterna submenú en navegación móvil.

---

## 📁 `js/portfolio.js` — Gestor de Portfolio

Control de inversiones (acciones, cripto, inmobiliario).

### `init()`
Inicializa y carga datos de inversiones desde Firestore.

### `addInvestment(investment)`
Añade una nueva inversión al portfolio.
```javascript
async addInvestment(investment) {
    const newInv = {
        id: Date.now().toString(),
        ...investment,
        date: new Date().toISOString()
    };
    this.investments.push(newInv);
    await this.save();
    this.updateUI();
}
```

### `removeInvestment(id)`
Elimina una inversión por ID.

### `save()`
Guarda el estado actual en Firestore.

### `getTotalValue()`
Calcula el valor total del portfolio.

### `getByType(type)`
Filtra inversiones por tipo (stock, crypto, realestate).

### `updateUI()` / `renderSummary()` / `renderPositions()`
Actualiza la interfaz con datos del portfolio.

### `renderOverviewChart()`
Renderiza gráfico de distribución del portfolio.

### `renderList(container)`
Renderiza lista detallada de inversiones.

### `getIconForType(type)`
Devuelve icono para un tipo de inversión.

---

## 📁 `js/realestate.js` — Mercado Inmobiliario

Visualización de precios inmobiliarios en España.

### `init()`
Inicializa la vista de mercado inmobiliario.

### `loadPrices()`
Carga precios por comunidad autónoma (datos INE).

### `renderCommunityTable(communities, sortBy)`
Renderiza tabla de precios por comunidad.

### `renderRankings(communities)`
Renderiza rankings (más caras/baratas).

### `loadHistory()`
Carga y renderiza gráfico de evolución histórica de precios.

### `initSortTabs()`
Inicializa pestañas de ordenación.

### `showCommunityDetail(communityId)`
Muestra detalle de una comunidad autónoma.

### `initSpainMap(communities)`
Inicializa el mapa de España con datos de precios.

### `openInvestRealEstate()`
Abre modal para registrar inversión inmobiliaria.

---

## 📁 `js/reports.js` — Informes Financieros

Generación de informes con gráficos y exportación.

### `init()`
Inicializa el módulo de informes.

### `setupListeners()`
Configura listeners de botones de período y exportación.

### `loadData()`
Carga transacciones y las procesa para gráficos.

### `setPeriod(period)`
Cambia el período del informe (semana, mes, año).

### `processData()` / `filterTransactionsByPeriod(transactions, period)`
Procesa y filtra transacciones por período.

### `processTrends(transactions)`
Calcula tendencias de ingresos vs gastos.

### `processCategories(transactions)`
Procesa gastos por categoría.

### `processPayerAnalysis(transactions)`
Analiza los principales pagadores/comercios.

### `processWealth(holdings, liquidCash)`
Procesa distribución de patrimonio.

### `renderCharts()` / `renderCategoryChart()` / `renderTrendChart()` / `renderDailyChart()`
Renderiza los diferentes gráficos del informe.

### `renderWealthDistributionChart()` / `renderWealthEvolutionChart()`
Gráficos de distribución y evolución del patrimonio.

### `renderTopMerchants()` / `renderCategoryBreakdown()`
Renderiza lista de principales comercios y desglose por categoría.

### `updateKPIs(income, expenses)`
Actualiza indicadores clave (ingresos, gastos, ahorro, tasa de ahorro).

### `exportData()`
Exporta informe financiero como CSV descargable.

---

## 📁 `js/security.js` — Seguridad

PIN con hash SHA-256, sesiones reales, cambio de contraseña Firebase.

### `init()`
Inicializa el módulo de seguridad.

### `loadSettings(userId)` / `saveSettings(data)`
Carga/guarda configuración de seguridad en Firestore.

### `hashPIN(pin)` / `verifyPIN(pin, storedHash)`
Hash SHA-256 del PIN y verificación contra hash almacenado.
```javascript
async hashPIN(pin) {
    const msgBuffer = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### `setupPIN()` / `changePIN()` / `removePIN()`
Configurar, cambiar y eliminar PIN de acceso.

### `checkProtection()` / `showLockScreen()` / `unlock()`
Pantalla de bloqueo con verificación de PIN.

### `changePassword()`
Cambia la contraseña de Firebase Auth.

### `initSessions(userId)` / `refreshSessionsList(userId)` / `renderSessions()`
Gestión de sesiones activas de dispositivos.

### `revokeSession(sessionId)` / `revokeAllSessions()`
Revocar sesiones individuales o todas.

### `exportGDPR()`
Exporta todos los datos del usuario en JSON (cumplimiento GDPR).

### `updatePINUI()` / `updateSecurityScore()`
Actualiza elementos UI de seguridad y puntuación.

---

## 📁 `js/settings.js` — Configuración

Preferencias del usuario y ajustes de la aplicación.

### `init()`
Inicializa ajustes.

### `loadUserProfile()`
Carga perfil del usuario desde Firebase Auth y Firestore.

### `loadPreferences()` / `savePreferences()`
Carga/guarda preferencias en localStorage.

### `updateUI()`
Actualiza la interfaz con las preferencias actuales.

### `setLanguage(lang)` / `setCurrency(currency)`
Cambia idioma y moneda.

### `getCurrencySymbol()` / `formatPrice(amount)`
Obtiene símbolo de divisa y formatea precio.

### `toggleDarkMode()` / `toggleNotifications()`
Alterna modo oscuro y notificaciones.

### `applyTheme()`
Aplica el tema visual seleccionado.

### `showBankHelp()` / `closeBankHelp()`
Popup de ayuda para exportar datos bancarios.

### `exportData()`
Exporta todos los datos como JSON descargable.

### `resetApp()`
Reinicia la app (borra datos locales).

### `clearCloudData()`
Borra todos los datos del usuario en la nube (Firestore).

---

## 📁 `js/sidebar.js` — Barra Lateral

Componente reutilizable de sidebar.

### `getCurrentPage()`
Detecta la página actual según la URL.

### `getBasePath()`
Determina la ruta base según la ubicación del archivo.

### `generateHTML()`
Genera el HTML completo de la sidebar con todos los elementos de navegación.

### `getIcon(name)`
Devuelve el SVG del icono correspondiente.

### `inject()`
Inyecta la sidebar en el DOM.

### `toggleSubmenu(page)`
Alterna submenú en la sidebar.

---

## 📁 `js/subscriptions.js` — Suscripciones

Gestión de pagos recurrentes.

### `init()`
Inicializa el módulo de suscripciones.

### `setupModalListeners()`
Configura listeners del modal de suscripciones.

### `loadData()`
Carga suscripciones desde Firebase.

### `render()` / `renderSubscriptions()` / `renderUpcoming()`
Renderiza lista de suscripciones y próximos pagos.

### `updateSummary()`
Actualiza resumen (total mensual, anual, próximo pago).

### `add()` / `edit(id)` / `save(e)` / `delete()`
CRUD completo de suscripciones.

### `openModal()` / `closeModal()`
Control del modal de suscripciones.

### `getFrequencyLabel(freq)` / `formatDate(dateStr)`
Utilidades de formato.

---

## 📁 `js/transactions.js` — Transacciones

Búsqueda, filtrado, CRUD y exportación de transacciones.

### `init()`
Inicializa el módulo de transacciones.

### `setupRealtimeListener()`
Configura suscripción en tiempo real a Firestore.
```javascript
setupRealtimeListener() {
    this.unsubscribe = FirestoreService.transactions.subscribe((transactions) => {
        this.transactions = transactions;
        this.applyFilters();
    });
}
```

### `getCategoryIcon(category)`
Devuelve icono emoji para una categoría.

### `bindEvents()`
Vincula eventos de búsqueda y filtrado.

### `applyFilters()`
Aplica filtros (texto, tipo, categoría, fecha).

### `render()`
Renderiza la lista de transacciones agrupadas por fecha.

### `groupByDate(transactions)`
Agrupa transacciones por fecha.

### `renderTransaction(tx)`
Renderiza una transacción individual como HTML.

### `updateSummary()`
Actualiza resumen (total ingresos, gastos, balance).

### `showDetail(id)`
Muestra detalle/edición de una transacción.

### `downloadCSV()`
Exporta transacciones filtradas a CSV.

### `formatDateHeader(dateStr)` / `formatTime(dateInput)` / `getCategoryName(category)` / `escapeHtml(text)`
Utilidades de formato.

---

## 📁 `js/ux.js` — Componentes UX

FAB de entrada rápida, calculadora, notificaciones.

### `init()`
Inicializa los componentes UX.

### `createFAB()`
Crea el Floating Action Button con animaciones.

### `toggleFAB()`
Muestra/oculta el menú del FAB.

### `quickAddExpense()` / `quickAddIncome()`
Acceso rápido para añadir gasto/ingreso.

### `openCalculator()`
Abre la calculadora integrada.

### `calcInput(key)` / `closeCalculator()`
Maneja input de la calculadora y la cierra.

### `setupOfflineDetection()`
Detecta el estado de conexión (online/offline).

### `checkLowBalance()`
Verifica si el saldo es bajo y notifica al usuario.

### `calculateHealthScore()`
Calcula la puntuación de salud financiera del usuario.

### Safety (Sistema de Confirmación)

#### `Safety.confirm(title, message, onConfirm, type)`
Modal de confirmación estricta para acciones destructivas.
```javascript
confirm(title, message, onConfirm, type = 'strict') {
    // En modo 'strict': requiere escribir "borrar" + esperar 5 segundos
    // En modo 'simple': confirmación estándar
}
```

#### `Safety.validate(text)` / `Safety.execute()` / `Safety.close()`
Valida texto de confirmación, ejecuta acción y cierra modal.

---

## 📁 `js/spain-map.js` — Mapa de España

Renderiza mapa SVG de España con datos de precios por provincia.

### `init(containerId, priceData)`
Inicializa el mapa en un contenedor.

### `renderMap()`
Renderiza el SVG del mapa con las provincias.

### `loadData()` / `applyDataToMap(data)` / `applyDataToMapDirect(priceData)`
Carga datos y aplica colores según precios.

### `getColorForPrice(price)`
Devuelve color según nivel de precio (más caro = más dorado).
```javascript
getColorForPrice(price) {
    if (price > 3000) return '#FFD700';  // Oro (muy caro)
    if (price > 2000) return '#C5A058';  // Dorado
    if (price > 1500) return '#8B7355';  // Marrón dorado
    return '#4A4A4A';                     // Gris (barato)
}
```

### `handleHover(e, id)` / `handleOut(e)` / `moveTooltip(e)`
Manejo de hover/tooltip sobre provincias.

### `handleClick(id)`
Maneja clic sobre una provincia.

---

## 📁 `service-worker.js` — Service Worker

Soporte offline y caché para la PWA.

### Eventos del Service Worker

- **`install`** — Cachea assets estáticos (JS, CSS, HTML, fuentes, iconos).
- **`activate`** — Limpia cachés antiguas.
- **`fetch`** — Network-first para JS/CSS, Cache-first para imágenes/fuentes.
- **`sync`** — Sincronización en segundo plano de transacciones.
- **`push`** — Notificaciones push.
- **`notificationclick`** — Maneja clic en notificación.
- **`message`** — Escucha mensajes del cliente (skipWaiting).

### `syncTransactions()`
Sincroniza transacciones pendientes desde IndexedDB.
```javascript
async function syncTransactions() {
    console.log('[ServiceWorker] Syncing transactions...');
    return Promise.resolve();
}
```
