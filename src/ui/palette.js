export class Palette {
    constructor(elementFactory) {
        this.elementFactory = elementFactory;
        this.setupDragAndDrop();
        this.updateComponentPreviews();
    }
    
    updateComponentPreviews() {
        const componentItems = document.querySelectorAll('.component-item');
        
        componentItems.forEach(item => {
            const type = item.dataset.type;
            const preview = item.querySelector('.component-preview');
            
            if (preview && preview.tagName === 'IMG') {
                // Replace image with SVG preview
                const svgPreview = this.createPreviewSVG(type);
                preview.parentNode.replaceChild(svgPreview, preview);
            }
        });
    }
    
    createPreviewSVG(type) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'component-preview');
        svg.setAttribute('viewBox', '0 0 100 60');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '48');
        
        // Create a scaled-down version of the component graphics
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Get component dimensions
        const dimensions = this.elementFactory.componentDimensions[type] || { width: 200, height: 100 };
        
        // Calculate scale to fit preview
        const scaleX = 90 / dimensions.width;
        const scaleY = 50 / dimensions.height;
        const scale = Math.min(scaleX, scaleY);
        
        // Center the component
        const offsetX = (100 - dimensions.width * scale) / 2;
        const offsetY = (60 - dimensions.height * scale) / 2;
        
        g.setAttribute('transform', `translate(${offsetX}, ${offsetY}) scale(${scale})`);
        
        // Get the component graphics
        const componentGraphics = this.elementFactory.createComponentGraphics(type, dimensions);
        
        // Clone and append all child elements
        Array.from(componentGraphics.children).forEach(child => {
            g.appendChild(child.cloneNode(true));
        });
        
        svg.appendChild(g);
        return svg;
    }

    setupDragAndDrop() {
        const componentItems = document.querySelectorAll('.component-item');
        
        componentItems.forEach(item => {
            // Make items draggable
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('componentType', item.dataset.type);
                
                // Visual feedback
                item.style.opacity = '0.5';
            });
            
            item.addEventListener('dragend', (e) => {
                item.style.opacity = '1';
            });
        });
        
        // Set up drop zone
        const canvas = document.getElementById('canvas-svg');
        
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const componentType = e.dataTransfer.getData('componentType');
            if (!componentType) return;
            
            // Get drop position in SVG coordinates
            const pt = canvas.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            
            const screenCTM = canvas.getScreenCTM();
            const svgPt = pt.matrixTransform(screenCTM.inverse());
            
            // Snap to grid
            const gridSize = 50;
            const x = Math.round(svgPt.x / gridSize) * gridSize;
            const y = Math.round(svgPt.y / gridSize) * gridSize;
            
            // Create component
            this.elementFactory.createElement(componentType, x, y);
        });
    }
    
    filterComponents(searchTerm) {
        const items = document.querySelectorAll('.component-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const name = item.querySelector('span').textContent.toLowerCase();
            const type = item.dataset.type.toLowerCase();
            
            if (name.includes(term) || type.includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
}