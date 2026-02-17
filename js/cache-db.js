/**
 * GentleFinances - IndexedDB Cache Layer
 * Caché local usando IndexedDB para datos offline.
 * Firebase es la fuente de verdad; IndexedDB es caché rápido.
 */

const CacheDB = {
    DB_NAME: 'GentleFinancesCache',
    DB_VERSION: 1,
    db: null,

    STORES: ['transactions', 'accounts', 'budgets', 'goals', 'subscriptions', 'portfolio', 'sessions', 'userProfile'],

    /**
     * Abrir/crear la base de datos IndexedDB
     */
    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                this.STORES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'id' });
                        // Índices comunes
                        if (storeName === 'transactions') {
                            store.createIndex('date', 'date', { unique: false });
                            store.createIndex('category', 'category', { unique: false });
                        }
                    }
                });

                console.log('📦 IndexedDB: Stores created');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('📦 IndexedDB: Connected');
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('📦 IndexedDB: Error', event.target.error);
                reject(event.target.error);
            };
        });
    },

    /**
     * Guardar un array de items en un store (reemplaza todo)
     */
    async putAll(storeName, items) {
        if (!this.db) await this.init();
        if (!items || !Array.isArray(items)) return;

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);

            // Limpiar store y rellenar con datos frescos
            store.clear();
            items.forEach(item => {
                if (item && item.id) {
                    // Serializar dates para IndexedDB
                    const cleanItem = this._serializeItem(item);
                    store.put(cleanItem);
                }
            });

            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    },

    /**
     * Guardar un solo item
     */
    async put(storeName, item) {
        if (!this.db) await this.init();
        if (!item || !item.id) return;

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.put(this._serializeItem(item));

            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    },

    /**
     * Obtener todos los items de un store
     */
    async getAll(storeName) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    /**
     * Obtener un item por ID
     */
    async get(storeName, id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    /**
     * Eliminar un item por ID
     */
    async delete(storeName, id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.delete(id);

            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    },

    /**
     * Limpiar un store completo
     */
    async clear(storeName) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.clear();

            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    },

    /**
     * Limpiar toda la base de datos
     */
    async clearAll() {
        for (const store of this.STORES) {
            await this.clear(store);
        }
        console.log('📦 IndexedDB: All stores cleared');
    },

    /**
     * Serializar un item para IndexedDB (los Dates de Firestore no son clonables)
     */
    _serializeItem(item) {
        const clean = {};
        for (const [key, value] of Object.entries(item)) {
            if (value && typeof value === 'object' && typeof value.toDate === 'function') {
                // Firestore Timestamp → ISO string
                clean[key] = value.toDate().toISOString();
            } else if (value instanceof Date) {
                clean[key] = value.toISOString();
            } else {
                clean[key] = value;
            }
        }
        return clean;
    },

    /**
     * Obtener estadísticas de la caché
     */
    async getStats() {
        const stats = {};
        for (const storeName of this.STORES) {
            try {
                const items = await this.getAll(storeName);
                stats[storeName] = items.length;
            } catch (e) {
                stats[storeName] = 0;
            }
        }
        return stats;
    }
};

window.CacheDB = CacheDB;

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CacheDB.init());
} else {
    CacheDB.init();
}

console.log('📦 CacheDB (IndexedDB) module loaded');
