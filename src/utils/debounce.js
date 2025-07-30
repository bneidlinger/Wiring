// Debounce utility function
export function debounce(func, delay) {
    let timeoutId;
    
    const debounced = function(...args) {
        // Clear existing timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        // Set new timeout
        timeoutId = setTimeout(() => {
            func.apply(this, args);
            timeoutId = null;
        }, delay);
    };
    
    // Add cancel method
    debounced.cancel = function() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };
    
    // Add flush method
    debounced.flush = function() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            func.apply(this);
            timeoutId = null;
        }
    };
    
    return debounced;
}