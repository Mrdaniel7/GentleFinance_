/**
 * CryptoService - End-to-End Encryption Service
 * Uses Web Crypto API (AES-GCM) to encrypt data before storage/transmission.
 */
class CryptoService {
    constructor() {
        this.key = null;
        this.keyName = 'gentleFinances_master_key';
        this.isReady = false;
        this.init();
    }

    async init() {
        try {
            // Load existing key or generate new one
            const rawKey = localStorage.getItem(this.keyName);
            if (rawKey) {
                this.key = await this.importKey(rawKey);
            } else {
                this.key = await this.generateKey();
                const exported = await this.exportKey(this.key);
                localStorage.setItem(this.keyName, exported);
            }
            this.isReady = true;
            console.log('🔒 CryptoService Initialized (AES-GCM 256-bit)');
        } catch (e) {
            console.error('CryptoService initialization failed:', e);
        }
    }

    async generateKey() {
        return window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    async exportKey(key) {
        const exported = await window.crypto.subtle.exportKey("jwk", key);
        return JSON.stringify(exported);
    }

    async importKey(jwkString) {
        const jwk = JSON.parse(jwkString);
        return window.crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "AES-GCM" },
            true,
            ["encrypt", "decrypt"]
        );
    }

    async encrypt(data) {
        if (!this.isReady || !this.key) await this.init();

        const encoder = new TextEncoder();
        const encodedData = encoder.encode(JSON.stringify(data));

        // Generate IV (Initialization Vector) - 12 bytes for AES-GCM
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            this.key,
            encodedData
        );

        // Return IV + Ciphertext encoded in Base64
        // Format: IV_BASE64:CIPHERTEXT_BASE64
        const ivBase64 = this.arrayBufferToBase64(iv);
        const cipherBase64 = this.arrayBufferToBase64(encryptedBuffer);

        return `${ivBase64}:${cipherBase64}`;
    }

    async decrypt(encryptedString) {
        if (!this.isReady || !this.key) await this.init();

        try {
            const parts = encryptedString.split(':');
            if (parts.length !== 2) throw new Error('Invalid encrypted format');

            const iv = this.base64ToArrayBuffer(parts[0]);
            const ciphertext = this.base64ToArrayBuffer(parts[1]);

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                this.key,
                ciphertext
            );

            const decoder = new TextDecoder();
            const decodedString = decoder.decode(decryptedBuffer);
            return JSON.parse(decodedString);
        } catch (e) {
            // console.warn('Decryption failed, calling handler:', e.message);
            throw e;
        }
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async syncKey(userId) {
        if (!userId) return;

        try {
            console.log('🔄 Syncing Encryption Key...');

            // 1. Check if we have a key in Cloud (Primary Source of Truth for consistency)
            const cloudKey = await window.FirestoreService.settings.getKey(userId);
            const localKeyStr = localStorage.getItem(this.keyName);

            if (cloudKey) {
                // CASE A: Cloud has key
                if (cloudKey !== localKeyStr) {
                    console.warn('⚠️ Found remote key different from local. Overwriting local with remote to ensure data access.');
                    // Restore from Cloud
                    localStorage.setItem(this.keyName, cloudKey);
                    this.key = await this.importKey(cloudKey);
                    console.log('✅ Key restored from Cloud.');
                } else {
                    console.log('✅ keys match.');
                }
            } else {
                // CASE B: No key in Cloud
                if (localKeyStr) {
                    // We have local, upload it
                    console.log('⬆️ Backing up existing local key to Cloud...');
                    await window.FirestoreService.settings.saveKey(userId, localKeyStr);
                } else {
                    // No local, no cloud. Generate new (should have happened in init, but safety check)
                    console.log('🆕 Generating new key for Cloud backup...');
                    if (!this.key) await this.init();
                    const newKeyStr = localStorage.getItem(this.keyName);
                    await window.FirestoreService.settings.saveKey(userId, newKeyStr);
                }
                console.log('✅ Key backed up to Cloud.');
            }

            this.isReady = true;

        } catch (error) {
            console.error('❌ Key Sync Failed:', error);
        }
    }
}

// Global Instance
window.CryptoService = new CryptoService();
