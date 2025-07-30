// Storage manager with fallback strategies
export class StorageManager {
    constructor() {
        this.storageType = this.detectStorageType();
        this.prefix = 'wiringDiagram_';
        this.quotaWarningThreshold = 0.9; // Warn at 90% capacity
    }

    detectStorageType() {
        // Check for localStorage availability
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return 'localStorage';
        } catch (e) {
            // Fallback to IndexedDB
            if ('indexedDB' in window) {
                return 'indexedDB';
            }
            // Last resort: in-memory storage
            return 'memory';
        }
    }

    async save(key, data) {
        const fullKey = this.prefix + key;
        
        switch (this.storageType) {
            case 'localStorage':
                return this.saveToLocalStorage(fullKey, data);
            case 'indexedDB':
                return this.saveToIndexedDB(fullKey, data);
            case 'memory':
                return this.saveToMemory(fullKey, data);
        }
    }

    async load(key) {
        const fullKey = this.prefix + key;
        
        switch (this.storageType) {
            case 'localStorage':
                return this.loadFromLocalStorage(fullKey);
            case 'indexedDB':
                return this.loadFromIndexedDB(fullKey);
            case 'memory':
                return this.loadFromMemory(fullKey);
        }
    }

    async remove(key) {
        const fullKey = this.prefix + key;
        
        switch (this.storageType) {
            case 'localStorage':
                localStorage.removeItem(fullKey);
                break;
            case 'indexedDB':
                await this.removeFromIndexedDB(fullKey);
                break;
            case 'memory':
                delete this.memoryStorage[fullKey];
                break;
        }
    }

    // localStorage implementation
    saveToLocalStorage(key, data) {
        try {
            const serialized = JSON.stringify(data);
            
            // Check quota before saving
            const quota = this.getStorageQuota();
            if (quota.usage > quota.quota * this.quotaWarningThreshold) {
                console.warn('Storage quota nearly exceeded:', quota);
                this.cleanupOldData();
            }
            
            localStorage.setItem(key, serialized);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                // Try cleanup and retry
                this.cleanupOldData();
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                    return true;
                } catch (retryError) {
                    throw new Error('Storage quota exceeded even after cleanup');
                }
            }
            throw e;
        }
    }

    loadFromLocalStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return null;
        }
    }

    // IndexedDB implementation
    async saveToIndexedDB(key, data) {
        const db = await this.openIndexedDB();
        const transaction = db.transaction(['storage'], 'readwrite');
        const store = transaction.objectStore('storage');
        
        return new Promise((resolve, reject) => {
            const request = store.put({ key, data, timestamp: Date.now() });
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async loadFromIndexedDB(key) {
        const db = await this.openIndexedDB();
        const transaction = db.transaction(['storage'], 'readonly');
        const store = transaction.objectStore('storage');
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.data : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async removeFromIndexedDB(key) {
        const db = await this.openIndexedDB();
        const transaction = db.transaction(['storage'], 'readwrite');
        const store = transaction.objectStore('storage');
        
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('WiringDiagramDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('storage')) {
                    db.createObjectStore('storage', { keyPath: 'key' });
                }
            };
        });
    }

    // Memory storage fallback
    memoryStorage = {};

    saveToMemory(key, data) {
        this.memoryStorage[key] = JSON.parse(JSON.stringify(data));
        return true;
    }

    loadFromMemory(key) {
        return this.memoryStorage[key] 
            ? JSON.parse(JSON.stringify(this.memoryStorage[key])) 
            : null;
    }

    // Utility methods
    getStorageQuota() {
        if (this.storageType !== 'localStorage') {
            return { usage: 0, quota: Infinity };
        }

        let usage = 0;
        let quota = 5 * 1024 * 1024; // 5MB default for localStorage

        try {
            // Calculate current usage
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    usage += localStorage.getItem(key).length + key.length;
                }
            }

            // Try to detect actual quota
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                navigator.storage.estimate().then(estimate => {
                    quota = estimate.quota || quota;
                });
            }
        } catch (e) {
            console.error('Failed to calculate storage quota:', e);
        }

        return { usage, quota };
    }

    cleanupOldData() {
        if (this.storageType !== 'localStorage') return;

        try {
            const items = [];
            
            // Collect all items with timestamps
            for (let key in localStorage) {
                if (key.startsWith(this.prefix) && key.includes('backup')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data.timestamp) {
                            items.push({ key, timestamp: data.timestamp });
                        }
                    } catch (e) {
                        // Invalid item, remove it
                        localStorage.removeItem(key);
                    }
                }
            }
            
            // Sort by timestamp and remove oldest
            items.sort((a, b) => a.timestamp - b.timestamp);
            
            // Remove oldest 25% of backup items
            const removeCount = Math.ceil(items.length * 0.25);
            for (let i = 0; i < removeCount; i++) {
                localStorage.removeItem(items[i].key);
            }
            
            console.log(`Cleaned up ${removeCount} old backup items`);
        } catch (e) {
            console.error('Cleanup failed:', e);
        }
    }

    // Export all data
    async exportAll() {
        const data = {};
        
        switch (this.storageType) {
            case 'localStorage':
                for (let key in localStorage) {
                    if (key.startsWith(this.prefix)) {
                        try {
                            data[key] = JSON.parse(localStorage.getItem(key));
                        } catch (e) {
                            data[key] = localStorage.getItem(key);
                        }
                    }
                }
                break;
                
            case 'indexedDB':
                const db = await this.openIndexedDB();
                const transaction = db.transaction(['storage'], 'readonly');
                const store = transaction.objectStore('storage');
                
                return new Promise((resolve, reject) => {
                    const request = store.getAll();
                    
                    request.onsuccess = () => {
                        request.result.forEach(item => {
                            data[item.key] = item.data;
                        });
                        resolve(data);
                    };
                    request.onerror = () => reject(request.error);
                });
                
            case 'memory':
                Object.assign(data, this.memoryStorage);
                break;
        }
        
        return data;
    }

    // Import data
    async importAll(data) {
        for (const [key, value] of Object.entries(data)) {
            if (key.startsWith(this.prefix)) {
                await this.save(key.substring(this.prefix.length), value);
            }
        }
    }
}