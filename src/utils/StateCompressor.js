// State compression using LZ-based compression
export class StateCompressor {
    constructor() {
        // Use pako for compression if available, otherwise fallback to basic compression
        this.compressionLib = null;
        this.initCompressionLib();
    }

    async initCompressionLib() {
        try {
            // Try to load pako dynamically
            if (typeof window !== 'undefined' && window.pako) {
                this.compressionLib = window.pako;
            }
        } catch (e) {
            console.log('Compression library not available, using fallback');
        }
    }

    async compress(state) {
        const jsonStr = JSON.stringify(state);
        
        if (this.compressionLib && this.compressionLib.deflate) {
            // Use pako compression
            try {
                const compressed = this.compressionLib.deflate(jsonStr);
                return this.arrayBufferToBase64(compressed);
            } catch (e) {
                console.error('Compression failed, using fallback:', e);
            }
        }
        
        // Fallback: Simple LZ-based compression
        return this.simpleLZCompress(jsonStr);
    }

    async decompress(compressed) {
        if (this.compressionLib && this.compressionLib.inflate) {
            // Try pako decompression
            try {
                const arrayBuffer = this.base64ToArrayBuffer(compressed);
                const decompressed = this.compressionLib.inflate(arrayBuffer, { to: 'string' });
                return JSON.parse(decompressed);
            } catch (e) {
                // Fall through to simple decompression
            }
        }
        
        // Fallback: Simple LZ-based decompression
        const jsonStr = this.simpleLZDecompress(compressed);
        return JSON.parse(jsonStr);
    }

    // Simple LZ77-inspired compression
    simpleLZCompress(str) {
        const dict = {};
        const result = [];
        let dictSize = 256;
        let w = '';
        
        for (let i = 0; i < str.length; i++) {
            const c = str.charAt(i);
            const wc = w + c;
            
            if (dict.hasOwnProperty(wc)) {
                w = wc;
            } else {
                result.push(dict.hasOwnProperty(w) ? dict[w] : w.charCodeAt(0));
                
                if (dictSize < 65536) {
                    dict[wc] = dictSize++;
                }
                
                w = c;
            }
        }
        
        if (w !== '') {
            result.push(dict.hasOwnProperty(w) ? dict[w] : w.charCodeAt(0));
        }
        
        // Convert to base64
        return btoa(result.map(n => String.fromCharCode(n & 0xFF, (n >> 8) & 0xFF)).join(''));
    }

    simpleLZDecompress(compressed) {
        try {
            // Decode from base64
            const data = atob(compressed);
            const codes = [];
            
            for (let i = 0; i < data.length; i += 2) {
                codes.push(data.charCodeAt(i) | (data.charCodeAt(i + 1) << 8));
            }
            
            const dict = {};
            let dictSize = 256;
            let w = String.fromCharCode(codes[0]);
            let result = w;
            
            for (let i = 1; i < codes.length; i++) {
                const k = codes[i];
                let entry;
                
                if (k < 256) {
                    entry = String.fromCharCode(k);
                } else if (dict.hasOwnProperty(k)) {
                    entry = dict[k];
                } else if (k === dictSize) {
                    entry = w + w.charAt(0);
                } else {
                    throw new Error('Invalid compressed data');
                }
                
                result += entry;
                
                if (dictSize < 65536) {
                    dict[dictSize++] = w + entry.charAt(0);
                }
                
                w = entry;
            }
            
            return result;
        } catch (e) {
            throw new Error('Decompression failed: ' + e.message);
        }
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        return bytes.buffer;
    }

    // Get compression ratio
    getCompressionRatio(original, compressed) {
        const originalSize = new Blob([JSON.stringify(original)]).size;
        const compressedSize = new Blob([compressed]).size;
        return (1 - compressedSize / originalSize) * 100;
    }
}