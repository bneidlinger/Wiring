export class ProgressIndicator {
    constructor() {
        this.element = null;
        this.progressBar = null;
        this.messageElement = null;
        this.cancelCallback = null;
        this.isVisible = false;
    }
    
    /**
     * Show progress indicator
     */
    show(message = 'Processing...', onCancel = null) {
        if (this.element) {
            this.hide();
        }
        
        this.cancelCallback = onCancel;
        this.createProgressElement();
        this.update(message, 0);
        this.isVisible = true;
    }
    
    /**
     * Create progress indicator element
     */
    createProgressElement() {
        // Create container
        this.element = document.createElement('div');
        this.element.className = 'progress-indicator';
        this.element.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            padding: 24px;
            min-width: 300px;
            max-width: 400px;
            z-index: 10002;
        `;
        
        // Create content
        this.element.innerHTML = `
            <div class="progress-content">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #333;">Exporting...</h3>
                <div class="progress-message" style="margin-bottom: 16px; font-size: 14px; color: #666;"></div>
                <div class="progress-bar-container" style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                    <div class="progress-bar" style="width: 0%; height: 100%; background: #3498db; transition: width 0.3s ease;"></div>
                </div>
                <div class="progress-details" style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span class="progress-percent" style="font-size: 14px; color: #666;">0%</span>
                    ${this.cancelCallback ? '<button class="progress-cancel" style="padding: 4px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; font-size: 12px;">Cancel</button>' : ''}
                </div>
                <div class="progress-time" style="margin-top: 8px; font-size: 12px; color: #999;"></div>
            </div>
        `;
        
        // Get elements
        this.progressBar = this.element.querySelector('.progress-bar');
        this.messageElement = this.element.querySelector('.progress-message');
        this.percentElement = this.element.querySelector('.progress-percent');
        this.timeElement = this.element.querySelector('.progress-time');
        
        // Setup cancel button
        if (this.cancelCallback) {
            const cancelBtn = this.element.querySelector('.progress-cancel');
            cancelBtn.addEventListener('click', () => {
                this.cancel();
            });
        }
        
        // Add to document
        document.body.appendChild(this.element);
        
        // Track start time
        this.startTime = Date.now();
    }
    
    /**
     * Update progress
     */
    update(message, percent) {
        if (!this.element) return;
        
        // Update message
        if (message !== undefined) {
            this.messageElement.textContent = message;
        }
        
        // Update progress
        if (percent !== undefined) {
            const clampedPercent = Math.max(0, Math.min(100, percent));
            this.progressBar.style.width = `${clampedPercent}%`;
            this.percentElement.textContent = `${Math.round(clampedPercent)}%`;
            
            // Update time estimate
            this.updateTimeEstimate(clampedPercent);
        }
    }
    
    /**
     * Update time estimate
     */
    updateTimeEstimate(percent) {
        if (percent <= 0) return;
        
        const elapsed = Date.now() - this.startTime;
        const estimated = (elapsed / percent) * 100;
        const remaining = estimated - elapsed;
        
        if (percent > 5 && remaining > 0) {
            this.timeElement.textContent = `Time remaining: ${this.formatTime(remaining)}`;
        } else {
            this.timeElement.textContent = `Elapsed: ${this.formatTime(elapsed)}`;
        }
    }
    
    /**
     * Format time in human readable format
     */
    formatTime(ms) {
        if (ms < 1000) return 'Less than a second';
        
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes < 60) {
            return remainingSeconds > 0 
                ? `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`
                : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
    
    /**
     * Show completion state
     */
    complete(message = 'Export completed!') {
        if (!this.element) return;
        
        this.update(message, 100);
        
        // Change appearance for completion
        this.progressBar.style.background = '#2ecc71';
        this.element.querySelector('h3').textContent = 'Success!';
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            this.hide();
        }, 2000);
    }
    
    /**
     * Show error state
     */
    error(message = 'Export failed') {
        if (!this.element) return;
        
        this.messageElement.textContent = message;
        this.progressBar.style.background = '#e74c3c';
        this.element.querySelector('h3').textContent = 'Error';
        
        // Replace cancel button with close button
        const details = this.element.querySelector('.progress-details');
        details.innerHTML = `
            <span style="color: #e74c3c; font-size: 14px;">Export failed</span>
            <button class="progress-close" style="padding: 4px 12px; border: 1px solid #e74c3c; background: white; color: #e74c3c; border-radius: 4px; cursor: pointer; font-size: 12px;">Close</button>
        `;
        
        details.querySelector('.progress-close').addEventListener('click', () => {
            this.hide();
        });
    }
    
    /**
     * Cancel operation
     */
    cancel() {
        if (this.cancelCallback) {
            this.cancelCallback();
        }
        this.hide();
    }
    
    /**
     * Hide progress indicator
     */
    hide() {
        if (this.element) {
            this.element.remove();
            this.element = null;
            this.progressBar = null;
            this.messageElement = null;
            this.cancelCallback = null;
            this.isVisible = false;
        }
    }
    
    /**
     * Create a simple progress indicator for quick operations
     */
    static async withProgress(message, operation) {
        const progress = new ProgressIndicator();
        progress.show(message);
        
        try {
            const result = await operation((percent, msg) => {
                progress.update(msg, percent);
            });
            
            progress.complete();
            return result;
            
        } catch (error) {
            progress.error(error.message);
            throw error;
        }
    }
}