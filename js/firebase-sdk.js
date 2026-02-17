// =============================================================================
// FIREBASE WEB SDK CONFIGURATION
// GentleFinances - Frontend Integration
// =============================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification,
    signInWithRedirect,
    getRedirectResult
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// =============================================================================
// CONFIGURACIÓN - REEMPLAZAR CON TUS CREDENCIALES
// =============================================================================

const firebaseConfig = {
    apiKey: "AIzaSyC2Yo_gFLfTZGEBeMpxvkduB3Dl8E9ct1I",
    authDomain: "gentlefinances-c9b79.firebaseapp.com",
    projectId: "gentlefinances-c9b79",
    storageBucket: "gentlefinances-c9b79.firebasestorage.app",
    messagingSenderId: "94865297545",
    appId: "1:94865297545:web:d061fa67fb3880474af658",
    measurementId: "G-JQ9TBYKP08"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Inicializar Storage
const googleProvider = new GoogleAuthProvider();

// =============================================================================
// SERVICIO DE ALMACENAMIENTO (STORAGE)
// =============================================================================

export const StorageService = {
    /**
     * Subir archivo a Firebase Storage
     * @param {File} file - Archivo a subir
     * @param {string} path - Ruta base (ej: 'receipts')
     * @returns {Promise<string>} URL de descarga
     */
    async uploadFile(file, path = 'uploads') {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('No autenticado');

        // Crear referencia única: users/{userId}/{path}/{timestamp}_{filename}
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storageRef = ref(storage, `users/${userId}/${path}/${timestamp}_${safeName}`);

        // Subir archivo
        const snapshot = await uploadBytes(storageRef, file);
        console.log('Archivo subido:', snapshot);

        // Obtener URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    }
};

// =============================================================================
// SERVICIO DE AUTENTICACIÓN
// =============================================================================

export const AuthService = {
    currentUser: null,

    // Escuchar cambios de autenticación
    onAuthChange(callback) {
        return onAuthStateChanged(auth, (user) => {
            // Si el usuario existe pero no ha verificado su email, forzamos logout (excepto si acaba de registrarse y estamos esperando)
            // Nota: Para mejorar la UX, podríamos permitir un estado "no verificado" restringido, pero el requisito es estricto.
            // Para evitar loops infinitos, manejaremos la verificación en el UI o en el login.
            // Aquí solo actualizamos el estado.
            this.currentUser = user;
            callback(user);
        });
    },

    // Registro con email/password
    async register(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName });

            // Enviar email de verificación
            await sendEmailVerification(userCredential.user);

            // Crear documento de usuario en Firestore
            await FirestoreService.users.create(userCredential.user.uid, {
                email,
                displayName,
                createdAt: serverTimestamp(),
                emailVerified: false // Flag explícito
            });

            // Hacemos logout para obligar al usuario a verificar antes de entrar
            await signOut(auth);

            return {
                success: true,
                user: userCredential.user,
                message: 'Verificación enviada. Por favor, revisa tu correo antes de iniciar sesión.'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Login con email/password
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                await signOut(auth);
                return {
                    success: false,
                    error: 'auth/email-not-verified',
                    user: user // Devolvemos el usuario para poder reenviar el correo si es necesario
                };
            }

            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Login con Google
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return this._handleGoogleResult(result);
        } catch (error) {
            console.warn('Popup login failed, trying redirect...', error.code);
            if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                try {
                    await signInWithRedirect(auth, googleProvider);
                    return { success: true, redirecting: true };
                } catch (redirectError) {
                    return { success: false, error: redirectError.message };
                }
            }
            return { success: false, error: error.message };
        }
    },

    async _handleGoogleResult(result) {
        // Los usuarios de Google suelen tener el email verificado por defecto
        // Pero por seguridad, podríamos verificarlo
        if (!result.user.emailVerified) {
            await signOut(auth);
            return { success: false, error: 'auth/email-not-verified' };
        }

        // Verificar si es nuevo usuario
        const userDoc = await FirestoreService.users.get(result.user.uid);
        if (!userDoc) {
            await FirestoreService.users.create(result.user.uid, {
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                createdAt: serverTimestamp(),
                emailVerified: true
            });
        }

        return { success: true, user: result.user };
    },

    // Method to check for redirect result on page load
    async checkRedirectResult() {
        try {
            // Add a timeout to prevent infinite hanging
            const redirectPromise = getRedirectResult(auth);
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3000));

            const result = await Promise.race([redirectPromise, timeoutPromise]);

            if (result) {
                return this._handleGoogleResult(result);
            }
            return null;
        } catch (error) {
            console.error("Redirect result error:", error);
            // Ignore no redirect result errors
            if (error.code === 'auth/popup-closed-by-user') return null;
            return { success: false, error: error.message };
        }
    },

    // Reenviar correo de verificación
    async resendVerificationEmail(user) {
        try {
            if (user) {
                await sendEmailVerification(user);
                return { success: true };
            }
            // Si no tenemos el objeto user (porque hicimos logout), necesitaríamos loguear temporalmente 
            // o pedir al usuario que intente login de nuevo para obtener la referencia.
            // Para simplificar, asumiremos que se llama justo después de un intento fallido de login donde capturamos el user.
            return { success: false, error: 'No user provided' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Cerrar sesión
    async logout() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Obtener usuario actual
    getCurrentUser() {
        return auth.currentUser;
    }
};

// =============================================================================
// SERVICIO DE FIRESTORE
// =============================================================================

// =============================================================================
// SERVICIO DE FIRESTORE CON ENCRIPTACIÓN E2EE
// =============================================================================

// Helper para Encriptación E2EE
const E2EE = {
    // Campos que NO se encriptan (necesarios para queries de Firestore)
    whitelist: ['id', 'userId', 'uid', 'createdAt', 'updatedAt', 'date', 'month', 'year', 'email', 'emailVerified', 'displayName', 'photoURL', 'providerId'],

    async encryptData(data) {
        if (!window.CryptoService) return data;

        // Esperar a que Crypto esté listo
        if (!window.CryptoService.isReady) await window.CryptoService.init();

        const metadata = {};
        const payload = {};

        // Separar metadatos de datos sensibles
        Object.keys(data).forEach(key => {
            if (this.whitelist.includes(key) || data[key] instanceof Date || (data[key] && typeof data[key] === 'object' && data[key].seconds)) { // Timestamps de Firestore
                metadata[key] = data[key];
            } else {
                payload[key] = data[key];
            }
        });

        // Si no hay payload (solo metadatos), devolver tal cual
        if (Object.keys(payload).length === 0) return metadata;

        // Encriptar payload
        const encryptedString = await window.CryptoService.encrypt(payload);

        return {
            ...metadata,
            encryptedData: encryptedString,
            isEncrypted: true // Flag para identificar registros encriptados
        };
    },

    async decryptData(data) {
        if (!data || !data.isEncrypted || !data.encryptedData || !window.CryptoService) return data;

        // Esperar a que Crypto esté listo
        if (!window.CryptoService.isReady) await window.CryptoService.init();

        try {
            const decryptedPayload = await window.CryptoService.decrypt(data.encryptedData);

            // Fusionar metadatos con el payload desencriptado
            // Omitir encryptedData e isEncrypted en el resultado final
            const { encryptedData, isEncrypted, ...metadata } = data;

            return {
                ...metadata,
                ...decryptedPayload
            };
        } catch (e) {
            // Silently handle decryption errors for legacy/corrupt data to prevent app crash
            console.warn('⚠️ Ignorando registro antiguo/ilegible:', e.message);
            return {
                ...data,
                _decryptionError: true,
                _originalData: data // Mantener acceso a datos crudos si falla
            };
        }
    }
};

export const FirestoreService = {
    // --- USUARIOS ---
    users: {
        async create(userId, data) {
            // Los perfiles de usuario suelen ser públicos/semi-públicos para Auth, 
            // pero podemos encriptar configuraciones sensibles si las hubiera.
            // Por ahora mantenemos los usuarios legibles para Auth UI.
            await setDoc(doc(db, 'users', userId), data);
        },

        async get(userId) {
            const docSnap = await getDoc(doc(db, 'users', userId));
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        },

        async update(userId, data) {
            await updateDoc(doc(db, 'users', userId), {
                ...data,
                updatedAt: serverTimestamp()
            });
        }
    },

    // --- SETTINGS (KEYS & PREFERENCES) ---
    settings: {
        async getKey(userId) {
            // We use a separate collection 'user_settings' to store sensitive keys
            // This avoids E2EE loops (we don't encrypt the key with itself)
            const docSnap = await getDoc(doc(db, 'user_settings', userId));
            if (docSnap.exists()) {
                return docSnap.data().masterKey;
            }
            return null;
        },

        async saveKey(userId, keyString) {
            await setDoc(doc(db, 'user_settings', userId), {
                masterKey: keyString,
                updatedAt: serverTimestamp()
            }, { merge: true });
        }
    },

    // --- SESSIONS (REAL DEVICE MANAGEMENT) ---
    sessions: {
        async create(userId, sessionData) {
            const sessionsRef = collection(db, 'users', userId, 'sessions');
            await setDoc(doc(sessionsRef, sessionData.id), {
                ...sessionData,
                lastActive: serverTimestamp()
            });
        },

        async list(userId) {
            const q = query(
                collection(db, 'users', userId, 'sessions'),
                orderBy('lastActive', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                lastActive: doc.data().lastActive?.toDate().toISOString() || new Date().toISOString()
            }));
        },

        async revoke(userId, sessionId) {
            await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
        },

        async update(userId, sessionId) {
            const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
            await updateDoc(sessionRef, {
                lastActive: serverTimestamp()
            });
        }
    },

    // --- TRANSACCIONES ---
    transactions: {
        async create(data) {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            // Encriptar datos antes de guardar
            const secureData = await E2EE.encryptData({
                ...data,
                userId
            });

            const docRef = await addDoc(collection(db, 'transactions'), {
                ...secureData,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        },

        async getAll(filters = {}) {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            let q = query(
                collection(db, 'transactions'),
                where('userId', '==', userId),
                orderBy('date', 'desc')
            );

            if (filters.limit) {
                q = query(q, limit(filters.limit));
            }

            const snapshot = await getDocs(q);
            // Desencriptar cada documento
            const results = await Promise.all(snapshot.docs.map(async doc => {
                try {
                    const data = { id: doc.id, ...doc.data() };
                    return await E2EE.decryptData(data);
                } catch (e) {
                    console.warn(`⚠️ Error decrypting transaction ${doc.id}:`, e);
                    return null;
                }
            }));

            return results.filter(r => r !== null && !r._decryptionError);
        },

        async get(transactionId) {
            const docSnap = await getDoc(doc(db, 'transactions', transactionId));
            if (!docSnap.exists()) return null;

            const data = { id: docSnap.id, ...docSnap.data() };
            return await E2EE.decryptData(data);
        },

        async update(transactionId, updates) {
            // E2EE requiere Read-Modify-Write porque 'updateDoc' no puede mezclar campos en blob encriptado
            // 1. Obtener doc actual (desencriptado)
            const currentDoc = await this.get(transactionId);
            if (!currentDoc) throw new Error('Documento no encontrado');

            // 2. Fusionar cambios
            const startData = { ...currentDoc, ...updates };
            // Eliminar ID del objeto de datos
            delete startData.id;

            // 3. Re-encriptar todo
            const secureData = await E2EE.encryptData(startData);

            // 4. Guardar (usamos setDoc con merge para respetar timestamps del servidor si fuera necesario, 
            // pero aquí sobrescribimos el blob secureData)
            await setDoc(doc(db, 'transactions', transactionId), {
                ...secureData,
                updatedAt: serverTimestamp()
            });
        },

        async delete(transactionId) {
            await deleteDoc(doc(db, 'transactions', transactionId));
        },

        // Suscripción en tiempo real
        subscribe(callback) {
            const userId = auth.currentUser?.uid;
            if (!userId) return () => { };

            const q = query(
                collection(db, 'transactions'),
                where('userId', '==', userId),
                orderBy('date', 'desc'),
                limit(50)
            );

            return onSnapshot(q, async (snapshot) => {
                // Async mapping dentro de snapshot
                const transactions = await Promise.all(snapshot.docs.map(async doc => {
                    try {
                        const data = { id: doc.id, ...doc.data() };
                        return await E2EE.decryptData(data);
                    } catch (e) {
                        console.warn(`⚠️ Error decrypting transaction ${doc.id}:`, e);
                        return null;
                    }
                }));

                // Filter out nulls (failed decryptions) and decryption errors
                callback(transactions.filter(t => t !== null && !t._decryptionError));
            }, (error) => {
                console.error('❌ Error en listener bytes:', error.message);
            });
        },

        async deleteAll() {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            const q = query(
                collection(db, 'transactions'),
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(q);
            const batch = writeBatch(db);

            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        }
    },

    // --- PRESUPUESTOS ---
    budgets: {
        async create(data) {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            const secureData = await E2EE.encryptData({
                ...data,
                userId
            });

            const docRef = await addDoc(collection(db, 'budgets'), {
                ...secureData,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        },

        async getAll(month = null) {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            let q = query(
                collection(db, 'budgets'),
                where('userId', '==', userId)
            );

            if (month) {
                q = query(q, where('month', '==', month));
            }

            const snapshot = await getDocs(q);
            const results = await Promise.all(snapshot.docs.map(async doc => {
                const data = { id: doc.id, ...doc.data() };
                return await E2EE.decryptData(data);
            }));
            return results.filter(r => r !== null && !r._decryptionError);
        },

        async update(budgetId, updates) {
            // Read-Modify-Write pattern
            const docSnap = await getDoc(doc(db, 'budgets', budgetId));
            if (!docSnap.exists()) return;

            const currentData = await E2EE.decryptData({ id: docSnap.id, ...docSnap.data() });
            const newData = { ...currentData, ...updates };
            delete newData.id; // Cleanup

            const secureData = await E2EE.encryptData(newData);

            await setDoc(doc(db, 'budgets', budgetId), {
                ...secureData,
                updatedAt: serverTimestamp()
            });
        },

        async delete(budgetId) {
            await deleteDoc(doc(db, 'budgets', budgetId));
        }
    },

    // --- METAS ---
    goals: {
        async create(data) {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            const secureData = await E2EE.encryptData({ ...data, userId });

            const docRef = await addDoc(collection(db, 'goals'), {
                ...secureData,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        },

        async getAll() {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            const q = query(collection(db, 'goals'), where('userId', '==', userId));
            const snapshot = await getDocs(q);

            const results = await Promise.all(snapshot.docs.map(async doc => {
                const data = { id: doc.id, ...doc.data() };
                return await E2EE.decryptData(data);
            }));
            return results.filter(r => r !== null && !r._decryptionError);
        },

        async update(goalId, updates) {
            const docSnap = await getDoc(doc(db, 'goals', goalId));
            if (!docSnap.exists()) return;

            const currentData = await E2EE.decryptData({ id: docSnap.id, ...docSnap.data() });
            const newData = { ...currentData, ...updates };
            delete newData.id;

            const secureData = await E2EE.encryptData(newData);

            await setDoc(doc(db, 'goals', goalId), {
                ...secureData,
                updatedAt: serverTimestamp()
            });
        },

        async delete(goalId) {
            await deleteDoc(doc(db, 'goals', goalId));
        }
    },

    // --- DEUDAS ---
    debts: {
        async create(data) {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            const secureData = await E2EE.encryptData({ ...data, userId });

            const docRef = await addDoc(collection(db, 'debts'), {
                ...secureData,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        },

        async getAll() {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            const q = query(collection(db, 'debts'), where('userId', '==', userId));
            const snapshot = await getDocs(q);

            const results = await Promise.all(snapshot.docs.map(async doc => {
                const data = { id: doc.id, ...doc.data() };
                return await E2EE.decryptData(data);
            }));
            return results.filter(r => r !== null && !r._decryptionError);
        },

        async update(debtId, updates) {
            const docSnap = await getDoc(doc(db, 'debts', debtId));
            if (!docSnap.exists()) return;

            const currentData = await E2EE.decryptData({ id: docSnap.id, ...docSnap.data() });
            const newData = { ...currentData, ...updates };
            delete newData.id;

            const secureData = await E2EE.encryptData(newData);

            await setDoc(doc(db, 'debts', debtId), {
                ...secureData,
                updatedAt: serverTimestamp()
            });
        },

        async delete(debtId) {
            await deleteDoc(doc(db, 'debts', debtId));
        }
    },

    // --- CUENTAS ---
    accounts: {
        async create(data) {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            const secureData = await E2EE.encryptData({ ...data, userId });

            const docRef = await addDoc(collection(db, 'accounts'), {
                ...secureData,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        },

        async getAll() {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            const q = query(collection(db, 'accounts'), where('userId', '==', userId));
            const snapshot = await getDocs(q);

            const results = await Promise.all(snapshot.docs.map(async doc => {
                const data = { id: doc.id, ...doc.data() };
                return await E2EE.decryptData(data);
            }));
            return results.filter(r => r !== null && !r._decryptionError);
        },

        async update(accountId, updates) {
            const docSnap = await getDoc(doc(db, 'accounts', accountId));
            if (!docSnap.exists()) return;

            const currentData = await E2EE.decryptData({ id: docSnap.id, ...docSnap.data() });
            const newData = { ...currentData, ...updates };
            delete newData.id;

            const secureData = await E2EE.encryptData(newData);

            await setDoc(doc(db, 'accounts', accountId), {
                ...secureData,
                updatedAt: serverTimestamp()
            });
        },

        async delete(accountId) {
            await deleteDoc(doc(db, 'accounts', accountId));
        }
    },

    // --- SUSCRIPCIONES ---
    subscriptions: {
        async create(data) {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            const secureData = await E2EE.encryptData({ ...data, userId });

            const docRef = await addDoc(collection(db, 'subscriptions'), {
                ...secureData,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        },

        async getAll() {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            const q = query(collection(db, 'subscriptions'), where('userId', '==', userId));
            const snapshot = await getDocs(q);

            return Promise.all(snapshot.docs.map(async doc => {
                const data = { id: doc.id, ...doc.data() };
                return await E2EE.decryptData(data);
            }));
        },

        async update(subscriptionId, updates) {
            const docSnap = await getDoc(doc(db, 'subscriptions', subscriptionId));
            if (!docSnap.exists()) return;

            const currentData = await E2EE.decryptData({ id: docSnap.id, ...docSnap.data() });
            const newData = { ...currentData, ...updates };
            delete newData.id;

            const secureData = await E2EE.encryptData(newData);

            await setDoc(doc(db, 'subscriptions', subscriptionId), {
                ...secureData,
                updatedAt: serverTimestamp()
            });
        },

        async delete(subscriptionId) {
            await deleteDoc(doc(db, 'subscriptions', subscriptionId));
        }
    },

    // --- PORTFOLIO ---
    portfolio: {
        async get() {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            const docSnap = await getDoc(doc(db, 'portfolios', userId));
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return { investments: [] };
        },

        async save(data) {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No autenticado');

            await setDoc(doc(db, 'portfolios', userId), {
                ...data,
                userId,
                updatedAt: serverTimestamp()
            });
        }
    }
};

// Make services available globally
window.AuthService = AuthService;
window.FirestoreService = FirestoreService;
window.StorageService = StorageService;

// Dispatch event to signal readiness
window.dispatchEvent(new CustomEvent('firebase-ready'));
console.log('🔥 Firebase SDK fully initialized and global services exposed.');

// Re-init AuthUI if it loaded before Firebase
if (window.AuthUI && window.AuthUI.init) {
    window.AuthUI.init();
}
