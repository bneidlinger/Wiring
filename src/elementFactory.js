import { DragHelper } from './utils/dragHelper.js';

export class ElementFactory {
    constructor(canvas, stateStore, panZoomInstance, componentLibrary) {
        this.canvas = canvas;
        this.stateStore = stateStore;
        this.panZoomInstance = panZoomInstance;
        this.componentLibrary = componentLibrary;
        this.elementIdCounter = 0;
        
        // Component dimensions (approximate based on images)
        this.componentDimensions = {
            ACM: { width: 400, height: 150 },
            iSTAR: { width: 350, height: 200 },
            OUTPUT: { width: 300, height: 150 },
            READER: { width: 100, height: 180 },
            WOR: { width: 120, height: 100 },
            RM4: { width: 250, height: 120 },
            PSU: { width: 200, height: 220 },
            PAM: { width: 100, height: 100 },
            STRIKE: { width: 80, height: 140 },
            REX: { width: 100, height: 100 },
            B9512G: { width: 450, height: 250 }
        };
        
        // Terminal configurations for each component type
        this.terminalConfigs = {
            ACM: {
                inputs: 8,
                outputs: 8,
                power: 2,
                data: 2
            },
            iSTAR: {
                inputs: 4,
                outputs: 4,
                power: 2,
                readers: 2
            },
            PSU: {
                ac_in: 2,
                dc_out: 6
            },
            PAM: {
                control: 2,
                relay: 3
            },
            STRIKE: {
                power: 2
            },
            REX: {
                signal: 2
            },
            B9512G: {
                zones: 8,
                outputs: 8,
                power: 2,
                bus: 2,
                comm: 2
            }
        };
        
        // Initialize LED animations
        this.initializeLEDAnimations();
    }

    createElement(type, x, y, config = {}) {
        const id = `${type}_${++this.elementIdCounter}`;
        const dimensions = this.componentDimensions[type] || { width: 200, height: 100 };
        
        // Create group for component
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('id', id);
        group.setAttribute('class', `component ${type.toLowerCase()}`);
        group.setAttribute('transform', `translate(${x}, ${y})`);
        group.dataset.type = type;
        
        // Create background rectangle for drag handling
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', dimensions.width);
        rect.setAttribute('height', dimensions.height);
        rect.setAttribute('fill', 'rgba(0, 0, 0, 0.01)'); // Very faint fill for mouse events
        rect.setAttribute('stroke', '#495057');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '5');
        rect.setAttribute('class', 'component-drag-handle');
        rect.setAttribute('style', 'cursor: move; pointer-events: all;');
        // Make it the drag target
        rect.setAttribute('data-drag-handle', 'true');
        
        // Create component-specific SVG graphics
        const componentGraphics = this.createComponentGraphics(type, dimensions);
        
        // Create label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 10);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '14');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('fill', '#212529');
        label.textContent = id;
        
        // Assemble component layers in correct order
        // 1. Component graphics (bottom layer)
        group.appendChild(componentGraphics);
        
        // 2. Label
        group.appendChild(label);
        
        // 3. Terminal points (need to be clickable but not block drag)
        const terminalsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        terminalsGroup.setAttribute('class', 'terminals');
        terminalsGroup.style.pointerEvents = 'none'; // Let events pass through
        group.appendChild(terminalsGroup);
        this.addTerminals(terminalsGroup, type, dimensions);
        
        // 4. Drag handle (top layer for consistent hover/drag)
        group.appendChild(rect);
        
        // Make draggable
        this.makeDraggable(group);
        
        // Add to canvas
        this.canvas.addComponent(group);
        
        // Save to state
        this.stateStore.addElement({
            id,
            type,
            x,
            y,
            config
        });
        
        return group;
    }

    createComponentGraphics(type, dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        switch(type) {
            case 'ACM':
                return this.createACMGraphics(dimensions);
            case 'iSTAR':
                return this.createISTARGraphics(dimensions);
            case 'OUTPUT':
                return this.createOutputModuleGraphics(dimensions);
            case 'READER':
                return this.createCardReaderGraphics(dimensions);
            case 'WOR':
                return this.createWORReaderGraphics(dimensions);
            case 'RM4':
                return this.createRM4Graphics(dimensions);
            case 'PSU':
                return this.createPowerSupplyGraphics(dimensions);
            case 'PAM':
                return this.createPAMRelayGraphics(dimensions);
            case 'STRIKE':
                return this.createStrikeGraphics(dimensions);
            case 'REX':
                return this.createREXButtonGraphics(dimensions);
            case 'B9512G':
                return this.createB9512GGraphics(dimensions);
            default:
                return this.createDefaultGraphics(dimensions);
        }
    }
    
    // ACM (Access Control Module) - Professional PCB Design
    createACMGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create definitions for patterns, gradients and filters
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // PCB texture pattern
        const pcbPattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pcbPattern.setAttribute('id', 'pcb-texture');
        pcbPattern.setAttribute('x', '0');
        pcbPattern.setAttribute('y', '0');
        pcbPattern.setAttribute('width', '4');
        pcbPattern.setAttribute('height', '4');
        pcbPattern.setAttribute('patternUnits', 'userSpaceOnUse');
        
        const textureRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        textureRect.setAttribute('width', '4');
        textureRect.setAttribute('height', '4');
        textureRect.setAttribute('fill', '#0d4f3c');
        pcbPattern.appendChild(textureRect);
        
        const textureDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        textureDot.setAttribute('cx', '2');
        textureDot.setAttribute('cy', '2');
        textureDot.setAttribute('r', '0.5');
        textureDot.setAttribute('fill', '#0b4533');
        textureDot.setAttribute('opacity', '0.3');
        pcbPattern.appendChild(textureDot);
        
        // Solder mask gradient
        const solderMaskGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        solderMaskGradient.setAttribute('id', 'solder-mask');
        solderMaskGradient.setAttribute('cx', '50%');
        solderMaskGradient.setAttribute('cy', '50%');
        solderMaskGradient.setAttribute('r', '150%');
        
        const maskStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        maskStop1.setAttribute('offset', '0%');
        maskStop1.setAttribute('style', 'stop-color:#0f5a45;stop-opacity:1');
        solderMaskGradient.appendChild(maskStop1);
        
        const maskStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        maskStop2.setAttribute('offset', '100%');
        maskStop2.setAttribute('style', 'stop-color:#0b4533;stop-opacity:1');
        solderMaskGradient.appendChild(maskStop2);
        
        // Gold plating gradient for pads
        const goldGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        goldGradient.setAttribute('id', 'gold-plating');
        goldGradient.setAttribute('x1', '0%');
        goldGradient.setAttribute('y1', '0%');
        goldGradient.setAttribute('x2', '100%');
        goldGradient.setAttribute('y2', '100%');
        
        const goldStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        goldStop1.setAttribute('offset', '0%');
        goldStop1.setAttribute('style', 'stop-color:#ffd700;stop-opacity:1');
        goldGradient.appendChild(goldStop1);
        
        const goldStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        goldStop2.setAttribute('offset', '50%');
        goldStop2.setAttribute('style', 'stop-color:#ffed4e;stop-opacity:1');
        goldGradient.appendChild(goldStop2);
        
        const goldStop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        goldStop3.setAttribute('offset', '100%');
        goldStop3.setAttribute('style', 'stop-color:#d4af37;stop-opacity:1');
        goldGradient.appendChild(goldStop3);
        
        // Copper trace gradient
        const copperGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        copperGradient.setAttribute('id', 'copper-trace');
        copperGradient.setAttribute('x1', '0%');
        copperGradient.setAttribute('y1', '0%');
        copperGradient.setAttribute('x2', '0%');
        copperGradient.setAttribute('y2', '100%');
        
        const copperStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        copperStop1.setAttribute('offset', '0%');
        copperStop1.setAttribute('style', 'stop-color:#d97706;stop-opacity:1');
        copperGradient.appendChild(copperStop1);
        
        const copperStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        copperStop2.setAttribute('offset', '100%');
        copperStop2.setAttribute('style', 'stop-color:#b45309;stop-opacity:1');
        copperGradient.appendChild(copperStop2);
        
        // Component shadow filter
        const componentShadow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        componentShadow.setAttribute('id', 'component-shadow');
        componentShadow.setAttribute('x', '-50%');
        componentShadow.setAttribute('y', '-50%');
        componentShadow.setAttribute('width', '200%');
        componentShadow.setAttribute('height', '200%');
        
        const compBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        compBlur.setAttribute('in', 'SourceAlpha');
        compBlur.setAttribute('stdDeviation', '1');
        componentShadow.appendChild(compBlur);
        
        const compOffset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset');
        compOffset.setAttribute('dx', '0.5');
        compOffset.setAttribute('dy', '0.5');
        compOffset.setAttribute('result', 'offsetblur');
        componentShadow.appendChild(compOffset);
        
        const compFlood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
        compFlood.setAttribute('flood-color', '#000000');
        compFlood.setAttribute('flood-opacity', '0.3');
        componentShadow.appendChild(compFlood);
        
        const compComposite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
        compComposite.setAttribute('in2', 'offsetblur');
        compComposite.setAttribute('operator', 'in');
        componentShadow.appendChild(compComposite);
        
        const compMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
        const compMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        const compMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        compMergeNode2.setAttribute('in', 'SourceGraphic');
        compMerge.appendChild(compMergeNode1);
        compMerge.appendChild(compMergeNode2);
        componentShadow.appendChild(compMerge);
        
        // IC package gradient
        const icGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        icGradient.setAttribute('id', 'ic-package');
        icGradient.setAttribute('x1', '0%');
        icGradient.setAttribute('y1', '0%');
        icGradient.setAttribute('x2', '100%');
        icGradient.setAttribute('y2', '100%');
        
        const icStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        icStop1.setAttribute('offset', '0%');
        icStop1.setAttribute('style', 'stop-color:#1f2937;stop-opacity:1');
        icGradient.appendChild(icStop1);
        
        const icStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        icStop2.setAttribute('offset', '50%');
        icStop2.setAttribute('style', 'stop-color:#111827;stop-opacity:1');
        icGradient.appendChild(icStop2);
        
        const icStop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        icStop3.setAttribute('offset', '100%');
        icStop3.setAttribute('style', 'stop-color:#030712;stop-opacity:1');
        icGradient.appendChild(icStop3);
        
        defs.appendChild(pcbPattern);
        defs.appendChild(solderMaskGradient);
        defs.appendChild(goldGradient);
        defs.appendChild(copperGradient);
        defs.appendChild(componentShadow);
        defs.appendChild(icGradient);
        group.appendChild(defs);
        
        // Main PCB substrate
        const pcbBoard = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        pcbBoard.setAttribute('x', '10');
        pcbBoard.setAttribute('y', '10');
        pcbBoard.setAttribute('width', dimensions.width - 20);
        pcbBoard.setAttribute('height', dimensions.height - 20);
        pcbBoard.setAttribute('fill', 'url(#pcb-texture)');
        pcbBoard.setAttribute('stroke', '#0a3d2e');
        pcbBoard.setAttribute('stroke-width', '2');
        pcbBoard.setAttribute('rx', '3');
        
        // Solder mask overlay
        const solderMask = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        solderMask.setAttribute('x', '10');
        solderMask.setAttribute('y', '10');
        solderMask.setAttribute('width', dimensions.width - 20);
        solderMask.setAttribute('height', dimensions.height - 20);
        solderMask.setAttribute('fill', 'url(#solder-mask)');
        solderMask.setAttribute('opacity', '0.9');
        solderMask.setAttribute('rx', '3');
        
        // Mounting holes
        const mountingHoles = [];
        const holePositions = [
            { x: 20, y: 20 },
            { x: dimensions.width - 20, y: 20 },
            { x: 20, y: dimensions.height - 20 },
            { x: dimensions.width - 20, y: dimensions.height - 20 }
        ];
        
        holePositions.forEach(pos => {
            // Copper ring
            const copperRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            copperRing.setAttribute('cx', pos.x);
            copperRing.setAttribute('cy', pos.y);
            copperRing.setAttribute('r', '5');
            copperRing.setAttribute('fill', 'none');
            copperRing.setAttribute('stroke', 'url(#copper-trace)');
            copperRing.setAttribute('stroke-width', '2');
            mountingHoles.push(copperRing);
            
            // Hole
            const hole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            hole.setAttribute('cx', pos.x);
            hole.setAttribute('cy', pos.y);
            hole.setAttribute('r', '3');
            hole.setAttribute('fill', '#1a1a1a');
            mountingHoles.push(hole);
        });
        
        // Ground plane areas
        const groundPlane1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        groundPlane1.setAttribute('x', '15');
        groundPlane1.setAttribute('y', '15');
        groundPlane1.setAttribute('width', '40');
        groundPlane1.setAttribute('height', dimensions.height - 30);
        groundPlane1.setAttribute('fill', 'url(#copper-trace)');
        groundPlane1.setAttribute('opacity', '0.3');
        groundPlane1.setAttribute('rx', '2');
        
        const groundPlane2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        groundPlane2.setAttribute('x', dimensions.width - 55);
        groundPlane2.setAttribute('y', '15');
        groundPlane2.setAttribute('width', '40');
        groundPlane2.setAttribute('height', dimensions.height - 30);
        groundPlane2.setAttribute('fill', 'url(#copper-trace)');
        groundPlane2.setAttribute('opacity', '0.3');
        groundPlane2.setAttribute('rx', '2');
        
        // Main MCU (QFP package)
        const mcuGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        mcuGroup.setAttribute('filter', 'url(#component-shadow)');
        
        const mcuBody = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        mcuBody.setAttribute('x', dimensions.width / 2 - 35);
        mcuBody.setAttribute('y', '50');
        mcuBody.setAttribute('width', '70');
        mcuBody.setAttribute('height', '70');
        mcuBody.setAttribute('fill', 'url(#ic-package)');
        mcuBody.setAttribute('rx', '2');
        
        // MCU pin dot indicator
        const pinDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pinDot.setAttribute('cx', dimensions.width / 2 - 30);
        pinDot.setAttribute('cy', '55');
        pinDot.setAttribute('r', '2');
        pinDot.setAttribute('fill', '#6b7280');
        
        // MCU pins (simplified representation)
        for (let side = 0; side < 4; side++) {
            for (let pin = 0; pin < 12; pin++) {
                const pinRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                
                if (side === 0) { // top
                    pinRect.setAttribute('x', dimensions.width / 2 - 28 + pin * 5);
                    pinRect.setAttribute('y', '47');
                    pinRect.setAttribute('width', '3');
                    pinRect.setAttribute('height', '5');
                } else if (side === 1) { // right
                    pinRect.setAttribute('x', dimensions.width / 2 + 32);
                    pinRect.setAttribute('y', '57 + pin * 5');
                    pinRect.setAttribute('width', '5');
                    pinRect.setAttribute('height', '3');
                } else if (side === 2) { // bottom
                    pinRect.setAttribute('x', dimensions.width / 2 - 28 + pin * 5);
                    pinRect.setAttribute('y', '118');
                    pinRect.setAttribute('width', '3');
                    pinRect.setAttribute('height', '5');
                } else { // left
                    pinRect.setAttribute('x', dimensions.width / 2 - 40);
                    pinRect.setAttribute('y', 57 + pin * 5);
                    pinRect.setAttribute('width', '5');
                    pinRect.setAttribute('height', '3');
                }
                
                pinRect.setAttribute('fill', '#c0c0c0');
                mcuGroup.appendChild(pinRect);
            }
        }
        
        mcuGroup.appendChild(mcuBody);
        mcuGroup.appendChild(pinDot);
        
        // MCU silk screen text
        const mcuText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        mcuText.setAttribute('x', dimensions.width / 2);
        mcuText.setAttribute('y', '90');
        mcuText.setAttribute('text-anchor', 'middle');
        mcuText.setAttribute('font-size', '8');
        mcuText.setAttribute('font-family', 'monospace');
        mcuText.setAttribute('fill', '#f5f5f5');
        mcuText.textContent = 'STM32F407';
        
        const mcuDesignator = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        mcuDesignator.setAttribute('x', dimensions.width / 2);
        mcuDesignator.setAttribute('y', '100');
        mcuDesignator.setAttribute('text-anchor', 'middle');
        mcuDesignator.setAttribute('font-size', '6');
        mcuDesignator.setAttribute('font-family', 'monospace');
        mcuDesignator.setAttribute('fill', '#e5e5e5');
        mcuDesignator.textContent = 'U1';
        
        // Crystal oscillator
        const crystalGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        crystalGroup.setAttribute('filter', 'url(#component-shadow)');
        
        const crystal = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        crystal.setAttribute('x', dimensions.width / 2 + 50);
        crystal.setAttribute('y', '70');
        crystal.setAttribute('width', '20');
        crystal.setAttribute('height', '12');
        crystal.setAttribute('fill', '#c0c0c0');
        crystal.setAttribute('rx', '2');
        
        const crystalLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        crystalLabel.setAttribute('x', dimensions.width / 2 + 60);
        crystalLabel.setAttribute('y', '78');
        crystalLabel.setAttribute('text-anchor', 'middle');
        crystalLabel.setAttribute('font-size', '5');
        crystalLabel.setAttribute('font-family', 'monospace');
        crystalLabel.setAttribute('fill', '#000');
        crystalLabel.textContent = '16MHz';
        
        crystalGroup.appendChild(crystal);
        crystalGroup.appendChild(crystalLabel);
        
        // Capacitors
        const capacitors = [];
        const capPositions = [
            { x: dimensions.width / 2 - 50, y: 70, value: 'C1' },
            { x: dimensions.width / 2 - 50, y: 85, value: 'C2' },
            { x: dimensions.width / 2 + 50, y: 90, value: 'C3' },
            { x: dimensions.width / 2 + 65, y: 90, value: 'C4' }
        ];
        
        capPositions.forEach(cap => {
            const capGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            capGroup.setAttribute('filter', 'url(#component-shadow)');
            
            const capacitor = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            capacitor.setAttribute('x', cap.x);
            capacitor.setAttribute('y', cap.y);
            capacitor.setAttribute('width', '8');
            capacitor.setAttribute('height', '6');
            capacitor.setAttribute('fill', '#8b4513');
            capacitor.setAttribute('rx', '1');
            
            const capLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            capLabel.setAttribute('x', cap.x + 4);
            capLabel.setAttribute('y', cap.y - 2);
            capLabel.setAttribute('text-anchor', 'middle');
            capLabel.setAttribute('font-size', '5');
            capLabel.setAttribute('font-family', 'monospace');
            capLabel.setAttribute('fill', '#f5f5f5');
            capLabel.textContent = cap.value;
            
            capGroup.appendChild(capacitor);
            capGroup.appendChild(capLabel);
            capacitors.push(capGroup);
        });
        
        // Terminal blocks with realistic screw terminals
        const terminalBlock1 = this.createTerminalBlock(25, 30, 8, dimensions.height - 60, 'TB1');
        const terminalBlock2 = this.createTerminalBlock(dimensions.width - 45, 30, 8, dimensions.height - 60, 'TB2');
        
        // Status LEDs
        const ledPositions = [
            { x: 70, y: dimensions.height - 40, color: '#00ff00', label: 'PWR', designator: 'D1' },
            { x: 100, y: dimensions.height - 40, color: '#ff0000', label: 'ERR', designator: 'D2' },
            { x: 130, y: dimensions.height - 40, color: '#ffaa00', label: 'COM', designator: 'D3' },
            { x: 160, y: dimensions.height - 40, color: '#0080ff', label: 'RUN', designator: 'D4' }
        ];
        
        const leds = [];
        ledPositions.forEach(led => {
            const ledGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Create LED-specific gradient for realism
            const ledGradientId = `led-gradient-${led.designator}`;
            const ledGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
            ledGradient.setAttribute('id', ledGradientId);
            
            const ledStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            ledStop1.setAttribute('offset', '0%');
            ledStop1.setAttribute('stop-color', led.color);
            ledStop1.setAttribute('stop-opacity', '0.6');
            ledGradient.appendChild(ledStop1);
            
            const ledStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            ledStop2.setAttribute('offset', '70%');
            ledStop2.setAttribute('stop-color', led.color);
            ledStop2.setAttribute('stop-opacity', '0.8');
            ledGradient.appendChild(ledStop2);
            
            const ledStop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            ledStop3.setAttribute('offset', '100%');
            ledStop3.setAttribute('stop-color', led.color);
            ledStop3.setAttribute('stop-opacity', '0.4');
            ledGradient.appendChild(ledStop3);
            
            defs.appendChild(ledGradient);
            
            // LED glow effect (when lit)
            const ledGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledGlow.setAttribute('cx', led.x);
            ledGlow.setAttribute('cy', led.y);
            ledGlow.setAttribute('r', '8');
            ledGlow.setAttribute('fill', led.color);
            ledGlow.setAttribute('opacity', '0');
            ledGlow.setAttribute('filter', 'blur(4px)');
            ledGlow.setAttribute('class', 'led-glow');
            // Map LED types for glow
            const ledTypeMap = {
                'PWR': 'power',
                'ERR': 'alarm',
                'COM': 'communication',
                'RUN': 'status'
            };
            ledGlow.setAttribute('data-led-type', ledTypeMap[led.label] || 'status');
            
            // LED base (black plastic housing)
            const ledBase = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledBase.setAttribute('cx', led.x);
            ledBase.setAttribute('cy', led.y + 1);
            ledBase.setAttribute('r', '4.5');
            ledBase.setAttribute('fill', '#0a0a0a');
            
            // LED body (main colored part)
            const ledBody = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledBody.setAttribute('cx', led.x);
            ledBody.setAttribute('cy', led.y);
            ledBody.setAttribute('r', '4');
            ledBody.setAttribute('fill', `url(#${ledGradientId})`);
            ledBody.setAttribute('stroke', '#000000');
            ledBody.setAttribute('stroke-width', '0.5');
            ledBody.setAttribute('opacity', '0.9');
            
            // LED inner dome (diffused plastic look)
            const ledDome = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledDome.setAttribute('cx', led.x);
            ledDome.setAttribute('cy', led.y);
            ledDome.setAttribute('r', '3.5');
            ledDome.setAttribute('fill', led.color);
            ledDome.setAttribute('opacity', '0.3');
            ledDome.setAttribute('class', 'led');
            ledDome.setAttribute('data-led-type', ledTypeMap[led.label] || 'status');
            
            // LED highlight (glossy reflection)
            const ledHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            ledHighlight.setAttribute('cx', led.x - 1.5);
            ledHighlight.setAttribute('cy', led.y - 1.5);
            ledHighlight.setAttribute('rx', '1.8');
            ledHighlight.setAttribute('ry', '1.2');
            ledHighlight.setAttribute('fill', '#ffffff');
            ledHighlight.setAttribute('opacity', '0.5');
            ledHighlight.setAttribute('transform', `rotate(-45 ${led.x} ${led.y})`);
            
            // Small center highlight
            const ledCenter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledCenter.setAttribute('cx', led.x);
            ledCenter.setAttribute('cy', led.y);
            ledCenter.setAttribute('r', '0.5');
            ledCenter.setAttribute('fill', '#ffffff');
            ledCenter.setAttribute('opacity', '0.3');
            
            // Silk screen labels
            const ledLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            ledLabel.setAttribute('x', led.x);
            ledLabel.setAttribute('y', led.y - 8);
            ledLabel.setAttribute('text-anchor', 'middle');
            ledLabel.setAttribute('font-size', '6');
            ledLabel.setAttribute('font-family', 'monospace');
            ledLabel.setAttribute('fill', '#f5f5f5');
            ledLabel.textContent = led.label;
            
            const ledDesignator = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            ledDesignator.setAttribute('x', led.x);
            ledDesignator.setAttribute('y', led.y + 10);
            ledDesignator.setAttribute('text-anchor', 'middle');
            ledDesignator.setAttribute('font-size', '5');
            ledDesignator.setAttribute('font-family', 'monospace');
            ledDesignator.setAttribute('fill', '#e5e5e5');
            ledDesignator.textContent = led.designator;
            
            // Assemble LED components in correct order
            ledGroup.appendChild(ledGlow);
            ledGroup.appendChild(ledBase);
            ledGroup.appendChild(ledBody);
            ledGroup.appendChild(ledDome);
            ledGroup.appendChild(ledHighlight);
            ledGroup.appendChild(ledCenter);
            ledGroup.appendChild(ledLabel);
            ledGroup.appendChild(ledDesignator);
            leds.push(ledGroup);
        });
        
        // Copper traces
        const traces = [];
        
        // Power trace
        const powerTrace = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        powerTrace.setAttribute('d', `M ${dimensions.width - 40} 40 L ${dimensions.width / 2 + 35} 40 L ${dimensions.width / 2 + 35} 55`);
        powerTrace.setAttribute('stroke', 'url(#copper-trace)');
        powerTrace.setAttribute('stroke-width', '3');
        powerTrace.setAttribute('fill', 'none');
        powerTrace.setAttribute('opacity', '0.8');
        traces.push(powerTrace);
        
        // Ground trace
        const groundTrace = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        groundTrace.setAttribute('d', `M 30 40 L ${dimensions.width / 2 - 35} 40 L ${dimensions.width / 2 - 35} 55`);
        groundTrace.setAttribute('stroke', 'url(#copper-trace)');
        groundTrace.setAttribute('stroke-width', '3');
        groundTrace.setAttribute('fill', 'none');
        groundTrace.setAttribute('opacity', '0.8');
        traces.push(groundTrace);
        
        // Signal traces
        for (let i = 0; i < 4; i++) {
            const signalTrace = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            signalTrace.setAttribute('d', `M ${dimensions.width / 2 - 20 + i * 10} 120 L ${dimensions.width / 2 - 20 + i * 10} ${dimensions.height - 50} L ${70 + i * 30} ${dimensions.height - 50} L ${70 + i * 30} ${dimensions.height - 44}`);
            signalTrace.setAttribute('stroke', 'url(#copper-trace)');
            signalTrace.setAttribute('stroke-width', '1.5');
            signalTrace.setAttribute('fill', 'none');
            signalTrace.setAttribute('opacity', '0.7');
            traces.push(signalTrace);
        }
        
        // Via holes
        const vias = [];
        const viaPositions = [
            { x: dimensions.width / 2 - 20, y: 130 },
            { x: dimensions.width / 2, y: 130 },
            { x: dimensions.width / 2 + 20, y: 130 },
            { x: 80, y: 80 },
            { x: dimensions.width - 80, y: 80 }
        ];
        
        viaPositions.forEach(via => {
            const viaHole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            viaHole.setAttribute('cx', via.x);
            viaHole.setAttribute('cy', via.y);
            viaHole.setAttribute('r', '2');
            viaHole.setAttribute('fill', 'url(#copper-trace)');
            viaHole.setAttribute('stroke', '#0a3d2e');
            viaHole.setAttribute('stroke-width', '0.5');
            
            const viaCenter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            viaCenter.setAttribute('cx', via.x);
            viaCenter.setAttribute('cy', via.y);
            viaCenter.setAttribute('r', '0.8');
            viaCenter.setAttribute('fill', '#1a1a1a');
            
            vias.push(viaHole);
            vias.push(viaCenter);
        });
        
        // Board designation and version
        const boardText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        boardText.setAttribute('x', dimensions.width / 2);
        boardText.setAttribute('y', dimensions.height - 15);
        boardText.setAttribute('text-anchor', 'middle');
        boardText.setAttribute('font-size', '8');
        boardText.setAttribute('font-weight', 'bold');
        boardText.setAttribute('font-family', 'monospace');
        boardText.setAttribute('fill', '#f5f5f5');
        boardText.textContent = 'ACM-PRO v2.1';
        
        const mfgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        mfgText.setAttribute('x', dimensions.width / 2);
        mfgText.setAttribute('y', dimensions.height - 5);
        mfgText.setAttribute('text-anchor', 'middle');
        mfgText.setAttribute('font-size', '6');
        mfgText.setAttribute('font-family', 'monospace');
        mfgText.setAttribute('fill', '#e5e5e5');
        mfgText.textContent = 'REV B | 2024';
        
        // Assemble all elements
        group.appendChild(pcbBoard);
        group.appendChild(solderMask);
        group.appendChild(groundPlane1);
        group.appendChild(groundPlane2);
        
        // Add traces
        traces.forEach(trace => group.appendChild(trace));
        
        // Add vias
        vias.forEach(via => group.appendChild(via));
        
        // Add mounting holes
        mountingHoles.forEach(hole => group.appendChild(hole));
        
        // Add components
        group.appendChild(mcuGroup);
        group.appendChild(mcuText);
        group.appendChild(mcuDesignator);
        group.appendChild(crystalGroup);
        capacitors.forEach(cap => group.appendChild(cap));
        group.appendChild(terminalBlock1);
        group.appendChild(terminalBlock2);
        leds.forEach(led => group.appendChild(led));
        
        // Add text
        group.appendChild(boardText);
        group.appendChild(mfgText);
        
        return group;
    }
    
    // Helper method to create realistic terminal blocks
    createTerminalBlock(x, y, pinCount, height, designator) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Terminal block body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', x);
        body.setAttribute('y', y);
        body.setAttribute('width', '20');
        body.setAttribute('height', height);
        body.setAttribute('fill', '#006400');
        body.setAttribute('stroke', '#004d00');
        body.setAttribute('stroke-width', '1');
        body.setAttribute('rx', '2');
        body.setAttribute('filter', 'url(#component-shadow)');
        
        // Terminal pins with screw heads
        const pinSpacing = height / pinCount;
        for (let i = 0; i < pinCount; i++) {
            const pinY = y + pinSpacing / 2 + i * pinSpacing;
            
            // Metal contact
            const contact = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            contact.setAttribute('x', x + 5);
            contact.setAttribute('y', pinY - 4);
            contact.setAttribute('width', '10');
            contact.setAttribute('height', '8');
            contact.setAttribute('fill', 'url(#gold-plating)');
            contact.setAttribute('rx', '1');
            
            // Screw head
            const screw = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            screw.setAttribute('cx', x + 10);
            screw.setAttribute('cy', pinY);
            screw.setAttribute('r', '3');
            screw.setAttribute('fill', '#c0c0c0');
            screw.setAttribute('stroke', '#808080');
            screw.setAttribute('stroke-width', '0.5');
            
            // Screw slot
            const slot = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            slot.setAttribute('x1', x + 7);
            slot.setAttribute('y1', pinY);
            slot.setAttribute('x2', x + 13);
            slot.setAttribute('y2', pinY);
            slot.setAttribute('stroke', '#606060');
            slot.setAttribute('stroke-width', '0.8');
            
            // Pin number
            const pinLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            pinLabel.setAttribute('x', x - 5);
            pinLabel.setAttribute('y', pinY + 2);
            pinLabel.setAttribute('text-anchor', 'end');
            pinLabel.setAttribute('font-size', '5');
            pinLabel.setAttribute('font-family', 'monospace');
            pinLabel.setAttribute('fill', '#f5f5f5');
            pinLabel.textContent = (i + 1).toString();
            
            group.appendChild(contact);
            group.appendChild(screw);
            group.appendChild(slot);
            group.appendChild(pinLabel);
        }
        
        // Designator label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x + 10);
        label.setAttribute('y', y - 5);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '6');
        label.setAttribute('font-family', 'monospace');
        label.setAttribute('fill', '#f5f5f5');
        label.textContent = designator;
        
        group.appendChild(body);
        group.appendChild(label);
        
        return group;
    }
    
    // iSTAR G2 Controller
    createISTARGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Housing gradient
        const housingGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        housingGradient.setAttribute('id', 'istar-housing-gradient');
        housingGradient.setAttribute('x1', '0%');
        housingGradient.setAttribute('y1', '0%');
        housingGradient.setAttribute('x2', '0%');
        housingGradient.setAttribute('y2', '100%');
        
        const hStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        hStop1.setAttribute('offset', '0%');
        hStop1.setAttribute('style', 'stop-color:#374151;stop-opacity:1');
        housingGradient.appendChild(hStop1);
        
        const hStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        hStop2.setAttribute('offset', '100%');
        hStop2.setAttribute('style', 'stop-color:#1f2937;stop-opacity:1');
        housingGradient.appendChild(hStop2);
        
        defs.appendChild(housingGradient);
        
        // Screen gradient for LCD effect
        const screenGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        screenGradient.setAttribute('id', 'istar-screen-gradient');
        screenGradient.setAttribute('x1', '0%');
        screenGradient.setAttribute('y1', '0%');
        screenGradient.setAttribute('x2', '0%');
        screenGradient.setAttribute('y2', '100%');
        
        const sStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        sStop1.setAttribute('offset', '0%');
        sStop1.setAttribute('style', 'stop-color:#00d4ff;stop-opacity:1');
        screenGradient.appendChild(sStop1);
        
        const sStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        sStop2.setAttribute('offset', '100%');
        sStop2.setAttribute('style', 'stop-color:#0891b2;stop-opacity:1');
        screenGradient.appendChild(sStop2);
        
        defs.appendChild(screenGradient);
        
        // Inner shadow filter for screen
        const innerShadow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        innerShadow.setAttribute('id', 'istar-inner-shadow');
        
        const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feGaussianBlur.setAttribute('stdDeviation', '2');
        feGaussianBlur.setAttribute('result', 'offset-blur');
        innerShadow.appendChild(feGaussianBlur);
        
        const feComposite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
        feComposite.setAttribute('operator', 'out');
        feComposite.setAttribute('in', 'SourceGraphic');
        feComposite.setAttribute('in2', 'offset-blur');
        feComposite.setAttribute('result', 'inverse');
        innerShadow.appendChild(feComposite);
        
        const feFlood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
        feFlood.setAttribute('flood-color', '#000000');
        feFlood.setAttribute('flood-opacity', '0.3');
        feFlood.setAttribute('result', 'color');
        innerShadow.appendChild(feFlood);
        
        const feComposite2 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
        feComposite2.setAttribute('operator', 'in');
        feComposite2.setAttribute('in', 'color');
        feComposite2.setAttribute('in2', 'inverse');
        feComposite2.setAttribute('result', 'shadow');
        innerShadow.appendChild(feComposite2);
        
        const feComposite3 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
        feComposite3.setAttribute('operator', 'over');
        feComposite3.setAttribute('in', 'shadow');
        feComposite3.setAttribute('in2', 'SourceGraphic');
        innerShadow.appendChild(feComposite3);
        
        defs.appendChild(innerShadow);
        group.appendChild(defs);
        
        // Main housing with modern styling
        const housing = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housing.setAttribute('x', '15');
        housing.setAttribute('y', '15');
        housing.setAttribute('width', dimensions.width - 30);
        housing.setAttribute('height', dimensions.height - 40);
        housing.setAttribute('fill', 'url(#istar-housing-gradient)');
        housing.setAttribute('stroke', '#111827');
        housing.setAttribute('stroke-width', '1');
        housing.setAttribute('rx', '8');
        housing.setAttribute('filter', 'url(#acm-shadow)');
        
        // Housing highlight
        const housingHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housingHighlight.setAttribute('x', '20');
        housingHighlight.setAttribute('y', '20');
        housingHighlight.setAttribute('width', dimensions.width - 40);
        housingHighlight.setAttribute('height', '2');
        housingHighlight.setAttribute('fill', 'rgba(255,255,255,0.2)');
        housingHighlight.setAttribute('rx', '1');
        
        // Display screen with modern LCD effect
        const screenBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        screenBorder.setAttribute('x', dimensions.width / 2 - 65);
        screenBorder.setAttribute('y', '25');
        screenBorder.setAttribute('width', '130');
        screenBorder.setAttribute('height', '70');
        screenBorder.setAttribute('fill', '#111827');
        screenBorder.setAttribute('rx', '4');
        
        const screen = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        screen.setAttribute('x', dimensions.width / 2 - 60);
        screen.setAttribute('y', '30');
        screen.setAttribute('width', '120');
        screen.setAttribute('height', '60');
        screen.setAttribute('fill', 'url(#istar-screen-gradient)');
        screen.setAttribute('stroke', '#064e3b');
        screen.setAttribute('stroke-width', '1');
        screen.setAttribute('rx', '2');
        screen.setAttribute('filter', 'url(#istar-inner-shadow)');
        
        // Screen text with glow effect
        const screenTextGlow = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        screenTextGlow.setAttribute('x', dimensions.width / 2);
        screenTextGlow.setAttribute('y', '55');
        screenTextGlow.setAttribute('text-anchor', 'middle');
        screenTextGlow.setAttribute('font-size', '16');
        screenTextGlow.setAttribute('font-family', 'monospace');
        screenTextGlow.setAttribute('font-weight', 'bold');
        screenTextGlow.setAttribute('fill', '#00d4ff');
        screenTextGlow.setAttribute('filter', 'blur(2px)');
        screenTextGlow.textContent = 'iSTAR G2';
        
        const screenText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        screenText.setAttribute('x', dimensions.width / 2);
        screenText.setAttribute('y', '55');
        screenText.setAttribute('text-anchor', 'middle');
        screenText.setAttribute('font-size', '16');
        screenText.setAttribute('font-family', 'monospace');
        screenText.setAttribute('font-weight', 'bold');
        screenText.setAttribute('fill', '#f0fdfa');
        screenText.textContent = 'iSTAR G2';
        
        const screenSubtext = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        screenSubtext.setAttribute('x', dimensions.width / 2);
        screenSubtext.setAttribute('y', '75');
        screenSubtext.setAttribute('text-anchor', 'middle');
        screenSubtext.setAttribute('font-size', '10');
        screenSubtext.setAttribute('font-family', 'monospace');
        screenSubtext.setAttribute('fill', '#67e8f9');
        screenSubtext.textContent = 'System Online';
        
        // Status LEDs with modern styling
        const istarLeds = [
            { color: '#10b981', type: 'power', label: 'PWR' },
            { color: '#10b981', type: 'status', label: 'OK' },
            { color: '#3b82f6', type: 'communication', label: 'NET' },
            { color: '#f59e0b', type: 'trouble', label: 'TRB' },
            { color: '#ef4444', type: 'alarm', label: 'ALM' },
            { color: '#06b6d4', type: 'status', label: 'SUP' }
        ];
        
        // Network ports with 3D effect
        for (let i = 0; i < 2; i++) {
            const portGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            const portOuter = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            portOuter.setAttribute('x', dimensions.width - 65 - i * 35);
            portOuter.setAttribute('y', dimensions.height - 55);
            portOuter.setAttribute('width', '25');
            portOuter.setAttribute('height', '20');
            portOuter.setAttribute('fill', '#1f2937');
            portOuter.setAttribute('rx', '2');
            
            const port = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            port.setAttribute('x', dimensions.width - 63 - i * 35);
            port.setAttribute('y', dimensions.height - 53);
            port.setAttribute('width', '21');
            port.setAttribute('height', '16');
            port.setAttribute('fill', '#374151');
            port.setAttribute('stroke', '#1f2937');
            port.setAttribute('stroke-width', '1');
            port.setAttribute('rx', '1');
            
            // Port label
            const portLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            portLabel.setAttribute('x', dimensions.width - 52.5 - i * 35);
            portLabel.setAttribute('y', dimensions.height - 41);
            portLabel.setAttribute('text-anchor', 'middle');
            portLabel.setAttribute('font-size', '7');
            portLabel.setAttribute('fill', '#9ca3af');
            portLabel.textContent = `ETH${i + 1}`;
            
            portGroup.appendChild(portOuter);
            portGroup.appendChild(port);
            portGroup.appendChild(portLabel);
            group.appendChild(portGroup);
        }
        
        // Label with modern typography
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 25);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '12');
        label.setAttribute('font-weight', '600');
        label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        label.setAttribute('fill', '#e5e7eb');
        label.setAttribute('letter-spacing', '0.5');
        label.textContent = 'CONTROLLER';
        
        group.appendChild(housing);
        group.appendChild(housingHighlight);
        group.appendChild(screenBorder);
        group.appendChild(screen);
        group.appendChild(screenTextGlow);
        group.appendChild(screenText);
        group.appendChild(screenSubtext);
        group.appendChild(label);
        
        // Add modern LED indicators
        istarLeds.forEach((config, i) => {
            const ledGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // LED bezel
            const bezel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bezel.setAttribute('cx', 35 + i * 30);
            bezel.setAttribute('cy', dimensions.height - 60);
            bezel.setAttribute('r', '6');
            bezel.setAttribute('fill', '#1f2937');
            
            // LED glow
            const ledGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledGlow.setAttribute('cx', 35 + i * 30);
            ledGlow.setAttribute('cy', dimensions.height - 60);
            ledGlow.setAttribute('r', '7');
            ledGlow.setAttribute('fill', config.color);
            ledGlow.setAttribute('opacity', '0.3');
            ledGlow.setAttribute('filter', 'blur(3px)');
            
            // LED
            const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            led.setAttribute('cx', 35 + i * 30);
            led.setAttribute('cy', dimensions.height - 60);
            led.setAttribute('r', '4');
            led.setAttribute('fill', config.color);
            led.setAttribute('class', 'led');
            led.setAttribute('data-led-type', config.type);
            
            // LED highlight
            const ledHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledHighlight.setAttribute('cx', 35 + i * 30);
            ledHighlight.setAttribute('cy', dimensions.height - 62);
            ledHighlight.setAttribute('r', '2');
            ledHighlight.setAttribute('fill', 'rgba(255,255,255,0.5)');
            
            // LED label
            const ledLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            ledLabel.setAttribute('x', 35 + i * 30);
            ledLabel.setAttribute('y', dimensions.height - 45);
            ledLabel.setAttribute('text-anchor', 'middle');
            ledLabel.setAttribute('font-size', '8');
            ledLabel.setAttribute('font-weight', '500');
            ledLabel.setAttribute('fill', '#9ca3af');
            ledLabel.textContent = config.label;
            
            ledGroup.appendChild(bezel);
            ledGroup.appendChild(ledGlow);
            ledGroup.appendChild(led);
            ledGroup.appendChild(ledHighlight);
            ledGroup.appendChild(ledLabel);
            group.appendChild(ledGroup);
        });
        
        return group;
    }
    
    // Output Module
    createOutputModuleGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Board gradient
        const boardGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        boardGradient.setAttribute('id', 'output-board-gradient');
        boardGradient.setAttribute('x1', '0%');
        boardGradient.setAttribute('y1', '0%');
        boardGradient.setAttribute('x2', '0%');
        boardGradient.setAttribute('y2', '100%');
        
        const bStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop1.setAttribute('offset', '0%');
        bStop1.setAttribute('style', 'stop-color:#1e293b;stop-opacity:1');
        boardGradient.appendChild(bStop1);
        
        const bStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop2.setAttribute('offset', '100%');
        bStop2.setAttribute('style', 'stop-color:#0f172a;stop-opacity:1');
        boardGradient.appendChild(bStop2);
        
        defs.appendChild(boardGradient);
        
        // Relay gradient
        const relayGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        relayGradient.setAttribute('id', 'relay-gradient');
        relayGradient.setAttribute('x1', '0%');
        relayGradient.setAttribute('y1', '0%');
        relayGradient.setAttribute('x2', '0%');
        relayGradient.setAttribute('y2', '100%');
        
        const rStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        rStop1.setAttribute('offset', '0%');
        rStop1.setAttribute('style', 'stop-color:#475569;stop-opacity:1');
        relayGradient.appendChild(rStop1);
        
        const rStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        rStop2.setAttribute('offset', '50%');
        rStop2.setAttribute('style', 'stop-color:#334155;stop-opacity:1');
        relayGradient.appendChild(rStop2);
        
        const rStop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        rStop3.setAttribute('offset', '100%');
        rStop3.setAttribute('style', 'stop-color:#1e293b;stop-opacity:1');
        relayGradient.appendChild(rStop3);
        
        defs.appendChild(relayGradient);
        group.appendChild(defs);
        
        // Main board with modern styling
        const board = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        board.setAttribute('x', '15');
        board.setAttribute('y', '15');
        board.setAttribute('width', dimensions.width - 30);
        board.setAttribute('height', dimensions.height - 40);
        board.setAttribute('fill', 'url(#output-board-gradient)');
        board.setAttribute('stroke', '#0f172a');
        board.setAttribute('stroke-width', '1');
        board.setAttribute('rx', '6');
        board.setAttribute('filter', 'url(#acm-shadow)');
        
        // Board highlight
        const boardHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        boardHighlight.setAttribute('x', '20');
        boardHighlight.setAttribute('y', '20');
        boardHighlight.setAttribute('width', dimensions.width - 40);
        boardHighlight.setAttribute('height', '2');
        boardHighlight.setAttribute('fill', 'rgba(255,255,255,0.15)');
        boardHighlight.setAttribute('rx', '1');
        
        // Relay blocks with 3D effect
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 2; j++) {
                const relayGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                
                // Relay shadow
                const relayShadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                relayShadow.setAttribute('x', 41 + i * 60);
                relayShadow.setAttribute('y', 31 + j * 40);
                relayShadow.setAttribute('width', '40');
                relayShadow.setAttribute('height', '30');
                relayShadow.setAttribute('fill', '#000000');
                relayShadow.setAttribute('opacity', '0.3');
                relayShadow.setAttribute('rx', '3');
                relayShadow.setAttribute('filter', 'blur(2px)');
                
                // Relay body
                const relay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                relay.setAttribute('x', 40 + i * 60);
                relay.setAttribute('y', 30 + j * 40);
                relay.setAttribute('width', '40');
                relay.setAttribute('height', '30');
                relay.setAttribute('fill', 'url(#relay-gradient)');
                relay.setAttribute('stroke', '#0f172a');
                relay.setAttribute('stroke-width', '1');
                relay.setAttribute('rx', '3');
                
                // Relay highlight
                const relayHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                relayHighlight.setAttribute('x', 42 + i * 60);
                relayHighlight.setAttribute('y', 32 + j * 40);
                relayHighlight.setAttribute('width', '36');
                relayHighlight.setAttribute('height', '1');
                relayHighlight.setAttribute('fill', 'rgba(255,255,255,0.2)');
                relayHighlight.setAttribute('rx', '0.5');
                
                // Relay label with better typography
                const relayLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                relayLabel.setAttribute('x', 60 + i * 60);
                relayLabel.setAttribute('y', 50 + j * 40);
                relayLabel.setAttribute('text-anchor', 'middle');
                relayLabel.setAttribute('font-size', '11');
                relayLabel.setAttribute('font-weight', '600');
                relayLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
                relayLabel.setAttribute('fill', '#e2e8f0');
                relayLabel.textContent = `R${i * 2 + j + 1}`;
                
                relayGroup.appendChild(relayShadow);
                relayGroup.appendChild(relay);
                relayGroup.appendChild(relayHighlight);
                relayGroup.appendChild(relayLabel);
                group.appendChild(relayGroup);
            }
        }
        
        // Label with modern typography
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', 105);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '13');
        label.setAttribute('font-weight', '600');
        label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        label.setAttribute('fill', '#e2e8f0');
        label.setAttribute('letter-spacing', '0.5');
        label.textContent = 'OUTPUT MODULE';
        
        group.appendChild(board);
        group.appendChild(boardHighlight);
        group.appendChild(label);
        
        // Status LEDs for each relay with modern styling
        for (let i = 0; i < 8; i++) {
            const ledGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // LED bezel
            const bezel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bezel.setAttribute('cx', 40 + i * 30);
            bezel.setAttribute('cy', dimensions.height - 30);
            bezel.setAttribute('r', '5');
            bezel.setAttribute('fill', '#0f172a');
            
            // LED glow
            const ledGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledGlow.setAttribute('cx', 40 + i * 30);
            ledGlow.setAttribute('cy', dimensions.height - 30);
            ledGlow.setAttribute('r', '6');
            ledGlow.setAttribute('fill', i < 4 ? '#10b981' : '#ef4444');
            ledGlow.setAttribute('opacity', '0.3');
            ledGlow.setAttribute('filter', 'blur(2px)');
            
            // LED
            const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            led.setAttribute('cx', 40 + i * 30);
            led.setAttribute('cy', dimensions.height - 30);
            led.setAttribute('r', '3.5');
            led.setAttribute('fill', i < 4 ? '#10b981' : '#ef4444');
            led.setAttribute('class', 'led relay-led');
            led.setAttribute('data-led-type', i < 4 ? 'status' : 'alarm');
            led.setAttribute('data-relay', i + 1);
            
            // LED highlight
            const ledHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledHighlight.setAttribute('cx', 40 + i * 30);
            ledHighlight.setAttribute('cy', dimensions.height - 32);
            ledHighlight.setAttribute('r', '1.5');
            ledHighlight.setAttribute('fill', 'rgba(255,255,255,0.5)');
            
            // LED number
            const ledNum = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            ledNum.setAttribute('x', 40 + i * 30);
            ledNum.setAttribute('y', dimensions.height - 18);
            ledNum.setAttribute('text-anchor', 'middle');
            ledNum.setAttribute('font-size', '8');
            ledNum.setAttribute('font-weight', '500');
            ledNum.setAttribute('fill', '#94a3b8');
            ledNum.textContent = i + 1;
            
            ledGroup.appendChild(bezel);
            ledGroup.appendChild(ledGlow);
            ledGroup.appendChild(led);
            ledGroup.appendChild(ledHighlight);
            ledGroup.appendChild(ledNum);
            group.appendChild(ledGroup);
        }
        
        return group;
    }
    
    // Card Reader
    createCardReaderGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Body gradient
        const bodyGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        bodyGradient.setAttribute('id', 'reader-body-gradient');
        bodyGradient.setAttribute('x1', '0%');
        bodyGradient.setAttribute('y1', '0%');
        bodyGradient.setAttribute('x2', '0%');
        bodyGradient.setAttribute('y2', '100%');
        
        const bStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop1.setAttribute('offset', '0%');
        bStop1.setAttribute('style', 'stop-color:#374151;stop-opacity:1');
        bodyGradient.appendChild(bStop1);
        
        const bStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop2.setAttribute('offset', '100%');
        bStop2.setAttribute('style', 'stop-color:#111827;stop-opacity:1');
        bodyGradient.appendChild(bStop2);
        
        defs.appendChild(bodyGradient);
        
        // Keypad button gradient
        const keyGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        keyGradient.setAttribute('id', 'key-gradient');
        
        const kStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        kStop1.setAttribute('offset', '0%');
        kStop1.setAttribute('style', 'stop-color:#6b7280;stop-opacity:1');
        keyGradient.appendChild(kStop1);
        
        const kStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        kStop2.setAttribute('offset', '100%');
        kStop2.setAttribute('style', 'stop-color:#374151;stop-opacity:1');
        keyGradient.appendChild(kStop2);
        
        defs.appendChild(keyGradient);
        group.appendChild(defs);
        
        // Reader body with modern styling
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', '20');
        body.setAttribute('y', '15');
        body.setAttribute('width', dimensions.width - 40);
        body.setAttribute('height', dimensions.height - 40);
        body.setAttribute('fill', 'url(#reader-body-gradient)');
        body.setAttribute('stroke', '#030712');
        body.setAttribute('stroke-width', '1');
        body.setAttribute('rx', '10');
        body.setAttribute('filter', 'url(#acm-shadow)');
        
        // Body highlight
        const bodyHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bodyHighlight.setAttribute('x', '25');
        bodyHighlight.setAttribute('y', '20');
        bodyHighlight.setAttribute('width', dimensions.width - 50);
        bodyHighlight.setAttribute('height', '2');
        bodyHighlight.setAttribute('fill', 'rgba(255,255,255,0.2)');
        bodyHighlight.setAttribute('rx', '1');
        
        // Card slot with depth
        const slotOuter = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        slotOuter.setAttribute('x', dimensions.width / 2 - 27);
        slotOuter.setAttribute('y', '38');
        slotOuter.setAttribute('width', '54');
        slotOuter.setAttribute('height', '9');
        slotOuter.setAttribute('fill', '#030712');
        slotOuter.setAttribute('rx', '3');
        
        const slot = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        slot.setAttribute('x', dimensions.width / 2 - 25);
        slot.setAttribute('y', '40');
        slot.setAttribute('width', '50');
        slot.setAttribute('height', '5');
        slot.setAttribute('fill', '#1f2937');
        slot.setAttribute('rx', '2');
        
        // LED indicators with modern glow
        const readerLeds = [
            { cx: dimensions.width / 2 - 10, cy: '60', color: '#10b981', type: 'status' },
            { cx: dimensions.width / 2 + 10, cy: '60', color: '#ef4444', type: 'alarm' }
        ];
        
        // Keypad with 3D buttons
        const keypadBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        keypadBg.setAttribute('x', dimensions.width / 2 - 28);
        keypadBg.setAttribute('y', '72');
        keypadBg.setAttribute('width', '56');
        keypadBg.setAttribute('height', '76');
        keypadBg.setAttribute('fill', '#1f2937');
        keypadBg.setAttribute('rx', '4');
        
        // Label with modern typography
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', '30');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '11');
        label.setAttribute('font-weight', '600');
        label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        label.setAttribute('fill', '#e5e7eb');
        label.setAttribute('letter-spacing', '0.5');
        label.textContent = 'READER';
        
        group.appendChild(body);
        group.appendChild(bodyHighlight);
        group.appendChild(keypadBg);
        
        // Add keypad buttons with 3D effect
        const keyLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                const index = j * 3 + i;
                const keyGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                
                // Key shadow
                const keyShadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                keyShadow.setAttribute('x', dimensions.width / 2 - 24 + i * 18);
                keyShadow.setAttribute('y', 76 + j * 18);
                keyShadow.setAttribute('width', '14');
                keyShadow.setAttribute('height', '14');
                keyShadow.setAttribute('fill', '#030712');
                keyShadow.setAttribute('rx', '3');
                
                // Key button
                const key = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                key.setAttribute('x', dimensions.width / 2 - 25 + i * 18);
                key.setAttribute('y', 75 + j * 18);
                key.setAttribute('width', '14');
                key.setAttribute('height', '14');
                key.setAttribute('fill', 'url(#key-gradient)');
                key.setAttribute('stroke', '#1f2937');
                key.setAttribute('stroke-width', '0.5');
                key.setAttribute('rx', '3');
                
                // Key highlight
                const keyHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                keyHighlight.setAttribute('x', dimensions.width / 2 - 24 + i * 18);
                keyHighlight.setAttribute('y', 76 + j * 18);
                keyHighlight.setAttribute('width', '12');
                keyHighlight.setAttribute('height', '1');
                keyHighlight.setAttribute('fill', 'rgba(255,255,255,0.2)');
                keyHighlight.setAttribute('rx', '0.5');
                
                // Key label
                const keyLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                keyLabel.setAttribute('x', dimensions.width / 2 - 18 + i * 18);
                keyLabel.setAttribute('y', 86 + j * 18);
                keyLabel.setAttribute('text-anchor', 'middle');
                keyLabel.setAttribute('font-size', '8');
                keyLabel.setAttribute('font-weight', '600');
                keyLabel.setAttribute('fill', '#e5e7eb');
                keyLabel.textContent = keyLabels[index];
                
                keyGroup.appendChild(keyShadow);
                keyGroup.appendChild(key);
                keyGroup.appendChild(keyHighlight);
                keyGroup.appendChild(keyLabel);
                group.appendChild(keyGroup);
            }
        }
        
        group.appendChild(slotOuter);
        group.appendChild(slot);
        group.appendChild(label);
        
        // Add LED indicators
        readerLeds.forEach(config => {
            const ledGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // LED bezel
            const bezel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bezel.setAttribute('cx', config.cx);
            bezel.setAttribute('cy', config.cy);
            bezel.setAttribute('r', '7');
            bezel.setAttribute('fill', '#030712');
            
            // LED glow
            const ledGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledGlow.setAttribute('cx', config.cx);
            ledGlow.setAttribute('cy', config.cy);
            ledGlow.setAttribute('r', '8');
            ledGlow.setAttribute('fill', config.color);
            ledGlow.setAttribute('opacity', '0.3');
            ledGlow.setAttribute('filter', 'blur(3px)');
            
            // LED
            const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            led.setAttribute('cx', config.cx);
            led.setAttribute('cy', config.cy);
            led.setAttribute('r', '5');
            led.setAttribute('fill', config.color);
            led.setAttribute('class', 'led');
            led.setAttribute('data-led-type', config.type);
            
            // LED highlight
            const ledHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledHighlight.setAttribute('cx', config.cx);
            ledHighlight.setAttribute('cy', config.cy - 2);
            ledHighlight.setAttribute('r', '2');
            ledHighlight.setAttribute('fill', 'rgba(255,255,255,0.6)');
            
            ledGroup.appendChild(bezel);
            ledGroup.appendChild(ledGlow);
            ledGroup.appendChild(led);
            ledGroup.appendChild(ledHighlight);
            group.appendChild(ledGroup);
        });
        
        return group;
    }
    
    // WOR Reader (Wireless)
    createWORReaderGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Body gradient
        const bodyGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        bodyGradient.setAttribute('id', 'wor-body-gradient');
        bodyGradient.setAttribute('cx', '50%');
        bodyGradient.setAttribute('cy', '30%');
        
        const bStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop1.setAttribute('offset', '0%');
        bStop1.setAttribute('style', 'stop-color:#4b5563;stop-opacity:1');
        bodyGradient.appendChild(bStop1);
        
        const bStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop2.setAttribute('offset', '100%');
        bStop2.setAttribute('style', 'stop-color:#1f2937;stop-opacity:1');
        bodyGradient.appendChild(bStop2);
        
        defs.appendChild(bodyGradient);
        
        // Antenna animation
        const antennaAnimation = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        antennaAnimation.setAttribute('attributeName', 'transform');
        antennaAnimation.setAttribute('type', 'scale');
        antennaAnimation.setAttribute('values', '1,1; 1.1,1.1; 1,1');
        antennaAnimation.setAttribute('dur', '2s');
        antennaAnimation.setAttribute('repeatCount', 'indefinite');
        
        group.appendChild(defs);
        
        // Reader body with modern styling
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', '15');
        body.setAttribute('y', '15');
        body.setAttribute('width', dimensions.width - 30);
        body.setAttribute('height', dimensions.height - 30);
        body.setAttribute('fill', 'url(#wor-body-gradient)');
        body.setAttribute('stroke', '#111827');
        body.setAttribute('stroke-width', '1');
        body.setAttribute('rx', '12');
        body.setAttribute('filter', 'url(#acm-shadow)');
        
        // Body highlight
        const bodyHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bodyHighlight.setAttribute('x', '20');
        bodyHighlight.setAttribute('y', '20');
        bodyHighlight.setAttribute('width', dimensions.width - 40);
        bodyHighlight.setAttribute('height', '2');
        bodyHighlight.setAttribute('fill', 'rgba(255,255,255,0.25)');
        bodyHighlight.setAttribute('rx', '1');
        
        // Antenna group with animation
        const antennaGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        antennaGroup.setAttribute('transform-origin', `${dimensions.width / 2} 30`);
        
        // Antenna waves with gradient
        const antenna1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        antenna1.setAttribute('d', `M${dimensions.width / 2 - 15} 30 Q${dimensions.width / 2} 20 ${dimensions.width / 2 + 15} 30`);
        antenna1.setAttribute('fill', 'none');
        antenna1.setAttribute('stroke', '#3b82f6');
        antenna1.setAttribute('stroke-width', '2.5');
        antenna1.setAttribute('stroke-linecap', 'round');
        antenna1.setAttribute('opacity', '0.9');
        
        const antenna2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        antenna2.setAttribute('d', `M${dimensions.width / 2 - 20} 35 Q${dimensions.width / 2} 25 ${dimensions.width / 2 + 20} 35`);
        antenna2.setAttribute('fill', 'none');
        antenna2.setAttribute('stroke', '#60a5fa');
        antenna2.setAttribute('stroke-width', '2');
        antenna2.setAttribute('stroke-linecap', 'round');
        antenna2.setAttribute('opacity', '0.6');
        
        const antenna3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        antenna3.setAttribute('d', `M${dimensions.width / 2 - 25} 40 Q${dimensions.width / 2} 30 ${dimensions.width / 2 + 25} 40`);
        antenna3.setAttribute('fill', 'none');
        antenna3.setAttribute('stroke', '#93bbfc');
        antenna3.setAttribute('stroke-width', '1.5');
        antenna3.setAttribute('stroke-linecap', 'round');
        antenna3.setAttribute('opacity', '0.3');
        
        antennaGroup.appendChild(antenna3);
        antennaGroup.appendChild(antenna2);
        antennaGroup.appendChild(antenna1);
        antennaGroup.appendChild(antennaAnimation.cloneNode(true));
        
        // Card symbol with 3D effect
        const cardShadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cardShadow.setAttribute('x', dimensions.width / 2 - 19);
        cardShadow.setAttribute('y', dimensions.height / 2 - 9);
        cardShadow.setAttribute('width', '40');
        cardShadow.setAttribute('height', '25');
        cardShadow.setAttribute('fill', '#000000');
        cardShadow.setAttribute('opacity', '0.2');
        cardShadow.setAttribute('rx', '4');
        cardShadow.setAttribute('filter', 'blur(2px)');
        
        const cardGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        cardGradient.setAttribute('id', 'card-gradient');
        cardGradient.setAttribute('x1', '0%');
        cardGradient.setAttribute('y1', '0%');
        cardGradient.setAttribute('x2', '100%');
        cardGradient.setAttribute('y2', '100%');
        
        const cStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        cStop1.setAttribute('offset', '0%');
        cStop1.setAttribute('style', 'stop-color:#f3f4f6;stop-opacity:1');
        cardGradient.appendChild(cStop1);
        
        const cStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        cStop2.setAttribute('offset', '100%');
        cStop2.setAttribute('style', 'stop-color:#d1d5db;stop-opacity:1');
        cardGradient.appendChild(cStop2);
        
        defs.appendChild(cardGradient);
        
        const card = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        card.setAttribute('x', dimensions.width / 2 - 20);
        card.setAttribute('y', dimensions.height / 2 - 10);
        card.setAttribute('width', '40');
        card.setAttribute('height', '25');
        card.setAttribute('fill', 'url(#card-gradient)');
        card.setAttribute('stroke', '#9ca3af');
        card.setAttribute('stroke-width', '1');
        card.setAttribute('rx', '4');
        
        // Card chip
        const chip = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        chip.setAttribute('x', dimensions.width / 2 - 10);
        chip.setAttribute('y', dimensions.height / 2 - 5);
        chip.setAttribute('width', '15');
        chip.setAttribute('height', '10');
        chip.setAttribute('fill', '#fbbf24');
        chip.setAttribute('stroke', '#f59e0b');
        chip.setAttribute('stroke-width', '0.5');
        chip.setAttribute('rx', '1');
        
        // LED indicator with modern glow
        const ledGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // LED bezel
        const bezel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bezel.setAttribute('cx', dimensions.width / 2);
        bezel.setAttribute('cy', dimensions.height - 25);
        bezel.setAttribute('r', '7');
        bezel.setAttribute('fill', '#111827');
        
        // LED glow
        const ledGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ledGlow.setAttribute('cx', dimensions.width / 2);
        ledGlow.setAttribute('cy', dimensions.height - 25);
        ledGlow.setAttribute('r', '8');
        ledGlow.setAttribute('fill', '#3b82f6');
        ledGlow.setAttribute('opacity', '0.4');
        ledGlow.setAttribute('filter', 'blur(4px)');
        
        // LED
        const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        led.setAttribute('cx', dimensions.width / 2);
        led.setAttribute('cy', dimensions.height - 25);
        led.setAttribute('r', '5');
        led.setAttribute('fill', '#3b82f6');
        led.setAttribute('class', 'led');
        led.setAttribute('data-led-type', 'communication');
        
        // LED highlight
        const ledHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ledHighlight.setAttribute('cx', dimensions.width / 2);
        ledHighlight.setAttribute('cy', dimensions.height - 27);
        ledHighlight.setAttribute('r', '2');
        ledHighlight.setAttribute('fill', 'rgba(255,255,255,0.6)');
        
        ledGroup.appendChild(bezel);
        ledGroup.appendChild(ledGlow);
        ledGroup.appendChild(led);
        ledGroup.appendChild(ledHighlight);
        
        // Label with modern typography
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 10);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '10');
        label.setAttribute('font-weight', '600');
        label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        label.setAttribute('fill', '#e5e7eb');
        label.setAttribute('letter-spacing', '0.5');
        label.textContent = 'WIRELESS';
        
        group.appendChild(body);
        group.appendChild(bodyHighlight);
        group.appendChild(antennaGroup);
        group.appendChild(cardShadow);
        group.appendChild(card);
        group.appendChild(chip);
        group.appendChild(ledGroup);
        group.appendChild(label);
        
        return group;
    }
    
    // RM-4 Module
    createRM4Graphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Board gradient
        const boardGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        boardGradient.setAttribute('id', 'rm4-board-gradient');
        boardGradient.setAttribute('x1', '0%');
        boardGradient.setAttribute('y1', '0%');
        boardGradient.setAttribute('x2', '0%');
        boardGradient.setAttribute('y2', '100%');
        
        const bStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop1.setAttribute('offset', '0%');
        bStop1.setAttribute('style', 'stop-color:#1e3a8a;stop-opacity:1');
        boardGradient.appendChild(bStop1);
        
        const bStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop2.setAttribute('offset', '100%');
        bStop2.setAttribute('style', 'stop-color:#1e40af;stop-opacity:1');
        boardGradient.appendChild(bStop2);
        
        defs.appendChild(boardGradient);
        
        // Port gradient
        const portGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        portGradient.setAttribute('id', 'rm4-port-gradient');
        portGradient.setAttribute('x1', '0%');
        portGradient.setAttribute('y1', '0%');
        portGradient.setAttribute('x2', '0%');
        portGradient.setAttribute('y2', '100%');
        
        const pStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        pStop1.setAttribute('offset', '0%');
        pStop1.setAttribute('style', 'stop-color:#374151;stop-opacity:1');
        portGradient.appendChild(pStop1);
        
        const pStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        pStop2.setAttribute('offset', '100%');
        pStop2.setAttribute('style', 'stop-color:#111827;stop-opacity:1');
        portGradient.appendChild(pStop2);
        
        defs.appendChild(portGradient);
        group.appendChild(defs);
        
        // Main board with modern styling
        const board = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        board.setAttribute('x', '15');
        board.setAttribute('y', '15');
        board.setAttribute('width', dimensions.width - 30);
        board.setAttribute('height', dimensions.height - 30);
        board.setAttribute('fill', 'url(#rm4-board-gradient)');
        board.setAttribute('stroke', '#1e3a8a');
        board.setAttribute('stroke-width', '1');
        board.setAttribute('rx', '6');
        board.setAttribute('filter', 'url(#acm-shadow)');
        
        // Board highlight
        const boardHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        boardHighlight.setAttribute('x', '20');
        boardHighlight.setAttribute('y', '20');
        boardHighlight.setAttribute('width', dimensions.width - 40);
        boardHighlight.setAttribute('height', '2');
        boardHighlight.setAttribute('fill', 'rgba(255,255,255,0.3)');
        boardHighlight.setAttribute('rx', '1');
        
        // Reader ports with 3D effect
        for (let i = 0; i < 4; i++) {
            const portGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Port shadow
            const portShadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            portShadow.setAttribute('x', 41 + i * 50);
            portShadow.setAttribute('y', '31');
            portShadow.setAttribute('width', '35');
            portShadow.setAttribute('height', '40');
            portShadow.setAttribute('fill', '#000000');
            portShadow.setAttribute('opacity', '0.3');
            portShadow.setAttribute('rx', '3');
            portShadow.setAttribute('filter', 'blur(2px)');
            
            // Port outer frame
            const portOuter = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            portOuter.setAttribute('x', 39 + i * 50);
            portOuter.setAttribute('y', '28');
            portOuter.setAttribute('width', '39');
            portOuter.setAttribute('height', '44');
            portOuter.setAttribute('fill', '#1f2937');
            portOuter.setAttribute('rx', '4');
            
            // Port body
            const port = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            port.setAttribute('x', 40 + i * 50);
            port.setAttribute('y', '30');
            port.setAttribute('width', '35');
            port.setAttribute('height', '40');
            port.setAttribute('fill', 'url(#rm4-port-gradient)');
            port.setAttribute('stroke', '#030712');
            port.setAttribute('stroke-width', '1');
            port.setAttribute('rx', '3');
            
            // Port connector pins
            for (let j = 0; j < 2; j++) {
                for (let k = 0; k < 4; k++) {
                    const pin = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    pin.setAttribute('x', 45 + i * 50 + j * 12);
                    pin.setAttribute('y', 35 + k * 8);
                    pin.setAttribute('width', '6');
                    pin.setAttribute('height', '5');
                    pin.setAttribute('fill', '#fbbf24');
                    pin.setAttribute('stroke', '#f59e0b');
                    pin.setAttribute('stroke-width', '0.5');
                    pin.setAttribute('rx', '1');
                    portGroup.appendChild(pin);
                }
            }
            
            // Port label with modern styling
            const portLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            portLabel.setAttribute('x', 57.5 + i * 50);
            portLabel.setAttribute('y', '55');
            portLabel.setAttribute('text-anchor', 'middle');
            portLabel.setAttribute('font-size', '12');
            portLabel.setAttribute('font-weight', 'bold');
            portLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
            portLabel.setAttribute('fill', '#f3f4f6');
            portLabel.textContent = `R${i + 1}`;
            
            portGroup.appendChild(portShadow);
            portGroup.appendChild(portOuter);
            portGroup.appendChild(port);
            portGroup.appendChild(portLabel);
            group.appendChild(portGroup);
        }
        
        // Label with modern typography
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 35);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '13');
        label.setAttribute('font-weight', '600');
        label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        label.setAttribute('fill', '#e0e7ff');
        label.setAttribute('letter-spacing', '0.5');
        label.textContent = 'RM-4 MODULE';
        
        group.appendChild(board);
        group.appendChild(boardHighlight);
        group.appendChild(label);
        
        // Status LEDs with modern design
        for (let i = 0; i < 4; i++) {
            const ledGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // LED background plate
            const ledPlate = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            ledPlate.setAttribute('x', 47.5 + i * 50);
            ledPlate.setAttribute('y', dimensions.height - 30);
            ledPlate.setAttribute('width', '20');
            ledPlate.setAttribute('height', '12');
            ledPlate.setAttribute('fill', '#1f2937');
            ledPlate.setAttribute('rx', '2');
            
            // Communication LED
            const commLedGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            commLedGlow.setAttribute('cx', 52.5 + i * 50);
            commLedGlow.setAttribute('cy', dimensions.height - 24);
            commLedGlow.setAttribute('r', '4');
            commLedGlow.setAttribute('fill', '#3b82f6');
            commLedGlow.setAttribute('opacity', '0.3');
            commLedGlow.setAttribute('filter', 'blur(2px)');
            
            const commLed = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            commLed.setAttribute('cx', 52.5 + i * 50);
            commLed.setAttribute('cy', dimensions.height - 24);
            commLed.setAttribute('r', '2.5');
            commLed.setAttribute('fill', '#3b82f6');
            commLed.setAttribute('class', 'led');
            commLed.setAttribute('data-led-type', 'communication');
            commLed.setAttribute('data-reader', i + 1);
            
            // Status LED
            const statusLedGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            statusLedGlow.setAttribute('cx', 62.5 + i * 50);
            statusLedGlow.setAttribute('cy', dimensions.height - 24);
            statusLedGlow.setAttribute('r', '4');
            statusLedGlow.setAttribute('fill', '#10b981');
            statusLedGlow.setAttribute('opacity', '0.3');
            statusLedGlow.setAttribute('filter', 'blur(2px)');
            
            const statusLed = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            statusLed.setAttribute('cx', 62.5 + i * 50);
            statusLed.setAttribute('cy', dimensions.height - 24);
            statusLed.setAttribute('r', '2.5');
            statusLed.setAttribute('fill', '#10b981');
            statusLed.setAttribute('class', 'led');
            statusLed.setAttribute('data-led-type', 'status');
            statusLed.setAttribute('data-reader', i + 1);
            
            ledGroup.appendChild(ledPlate);
            ledGroup.appendChild(commLedGlow);
            ledGroup.appendChild(commLed);
            ledGroup.appendChild(statusLedGlow);
            ledGroup.appendChild(statusLed);
            group.appendChild(ledGroup);
        }
        
        return group;
    }
    
    // Power Supply
    createPowerSupplyGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Metal housing gradient
        const housingGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        housingGradient.setAttribute('id', 'psu-housing-gradient');
        housingGradient.setAttribute('x1', '0%');
        housingGradient.setAttribute('y1', '0%');
        housingGradient.setAttribute('x2', '0%');
        housingGradient.setAttribute('y2', '100%');
        
        const hStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        hStop1.setAttribute('offset', '0%');
        hStop1.setAttribute('style', 'stop-color:#94a3b8;stop-opacity:1');
        housingGradient.appendChild(hStop1);
        
        const hStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        hStop2.setAttribute('offset', '50%');
        hStop2.setAttribute('style', 'stop-color:#64748b;stop-opacity:1');
        housingGradient.appendChild(hStop2);
        
        const hStop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        hStop3.setAttribute('offset', '100%');
        hStop3.setAttribute('style', 'stop-color:#475569;stop-opacity:1');
        housingGradient.appendChild(hStop3);
        
        defs.appendChild(housingGradient);
        
        // Grille gradient for 3D effect
        const grilleGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grilleGradient.setAttribute('id', 'grille-gradient');
        grilleGradient.setAttribute('x1', '0%');
        grilleGradient.setAttribute('y1', '0%');
        grilleGradient.setAttribute('x2', '0%');
        grilleGradient.setAttribute('y2', '100%');
        
        const gStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        gStop1.setAttribute('offset', '0%');
        gStop1.setAttribute('style', 'stop-color:#1e293b;stop-opacity:1');
        grilleGradient.appendChild(gStop1);
        
        const gStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        gStop2.setAttribute('offset', '100%');
        gStop2.setAttribute('style', 'stop-color:#0f172a;stop-opacity:1');
        grilleGradient.appendChild(gStop2);
        
        defs.appendChild(grilleGradient);
        group.appendChild(defs);
        
        // Metal housing with modern styling
        const housing = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housing.setAttribute('x', '15');
        housing.setAttribute('y', '15');
        housing.setAttribute('width', dimensions.width - 30);
        housing.setAttribute('height', dimensions.height - 30);
        housing.setAttribute('fill', 'url(#psu-housing-gradient)');
        housing.setAttribute('stroke', '#334155');
        housing.setAttribute('stroke-width', '1');
        housing.setAttribute('rx', '4');
        housing.setAttribute('filter', 'url(#acm-shadow)');
        
        // Housing highlight for metallic effect
        const housingHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housingHighlight.setAttribute('x', '20');
        housingHighlight.setAttribute('y', '20');
        housingHighlight.setAttribute('width', dimensions.width - 40);
        housingHighlight.setAttribute('height', '2');
        housingHighlight.setAttribute('fill', 'rgba(255,255,255,0.4)');
        housingHighlight.setAttribute('rx', '1');
        
        // Ventilation grilles with depth
        for (let i = 0; i < 5; i++) {
            const grilleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Grille shadow
            const grilleShadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            grilleShadow.setAttribute('x', '31');
            grilleShadow.setAttribute('y', 31 + i * 15);
            grilleShadow.setAttribute('width', dimensions.width - 62);
            grilleShadow.setAttribute('height', '8');
            grilleShadow.setAttribute('fill', '#000000');
            grilleShadow.setAttribute('opacity', '0.3');
            grilleShadow.setAttribute('rx', '1');
            
            const grille = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            grille.setAttribute('x', '30');
            grille.setAttribute('y', 30 + i * 15);
            grille.setAttribute('width', dimensions.width - 60);
            grille.setAttribute('height', '8');
            grille.setAttribute('fill', 'url(#grille-gradient)');
            grille.setAttribute('rx', '1');
            
            grilleGroup.appendChild(grilleShadow);
            grilleGroup.appendChild(grille);
            group.appendChild(grilleGroup);
        }
        
        // AC input terminals with 3D effect
        const acInputOuter = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        acInputOuter.setAttribute('x', '23');
        acInputOuter.setAttribute('y', dimensions.height - 62);
        acInputOuter.setAttribute('width', '44');
        acInputOuter.setAttribute('height', '34');
        acInputOuter.setAttribute('fill', '#0f172a');
        acInputOuter.setAttribute('rx', '3');
        
        const acInput = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        acInput.setAttribute('x', '25');
        acInput.setAttribute('y', dimensions.height - 60);
        acInput.setAttribute('width', '40');
        acInput.setAttribute('height', '30');
        acInput.setAttribute('fill', '#1e293b');
        acInput.setAttribute('stroke', '#0f172a');
        acInput.setAttribute('stroke-width', '1');
        acInput.setAttribute('rx', '2');
        
        // AC terminal screws
        for (let i = 0; i < 3; i++) {
            const screw = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            screw.setAttribute('cx', 35 + i * 10);
            screw.setAttribute('cy', dimensions.height - 45);
            screw.setAttribute('r', '3');
            screw.setAttribute('fill', '#6b7280');
            screw.setAttribute('stroke', '#374151');
            screw.setAttribute('stroke-width', '0.5');
            group.appendChild(screw);
        }
        
        // DC output terminals with 3D effect
        const dcOutputOuter = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        dcOutputOuter.setAttribute('x', dimensions.width - 67);
        dcOutputOuter.setAttribute('y', dimensions.height - 62);
        dcOutputOuter.setAttribute('width', '44');
        dcOutputOuter.setAttribute('height', '34');
        dcOutputOuter.setAttribute('fill', '#7f1d1d');
        dcOutputOuter.setAttribute('rx', '3');
        
        const dcOutput = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        dcOutput.setAttribute('x', dimensions.width - 65);
        dcOutput.setAttribute('y', dimensions.height - 60);
        dcOutput.setAttribute('width', '40');
        dcOutput.setAttribute('height', '30');
        dcOutput.setAttribute('fill', '#dc2626');
        dcOutput.setAttribute('stroke', '#991b1b');
        dcOutput.setAttribute('stroke-width', '1');
        dcOutput.setAttribute('rx', '2');
        
        // DC terminal posts
        for (let i = 0; i < 2; i++) {
            const post = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            post.setAttribute('cx', dimensions.width - 50 + i * 20);
            post.setAttribute('cy', dimensions.height - 45);
            post.setAttribute('r', '5');
            post.setAttribute('fill', '#fbbf24');
            post.setAttribute('stroke', '#f59e0b');
            post.setAttribute('stroke-width', '1');
            
            // + and - symbols
            const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            symbol.setAttribute('x', dimensions.width - 50 + i * 20);
            symbol.setAttribute('y', dimensions.height - 42);
            symbol.setAttribute('text-anchor', 'middle');
            symbol.setAttribute('font-size', '10');
            symbol.setAttribute('font-weight', 'bold');
            symbol.setAttribute('fill', '#7f1d1d');
            symbol.textContent = i === 0 ? '+' : '−';
            
            group.appendChild(post);
            group.appendChild(symbol);
        }
        
        // Labels with modern typography
        const acLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        acLabel.setAttribute('x', '45');
        acLabel.setAttribute('y', dimensions.height - 65);
        acLabel.setAttribute('text-anchor', 'middle');
        acLabel.setAttribute('font-size', '11');
        acLabel.setAttribute('font-weight', '600');
        acLabel.setAttribute('fill', '#e5e7eb');
        acLabel.textContent = 'AC IN';
        
        const dcLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dcLabel.setAttribute('x', dimensions.width - 45);
        dcLabel.setAttribute('y', dimensions.height - 65);
        dcLabel.setAttribute('text-anchor', 'middle');
        dcLabel.setAttribute('font-size', '11');
        dcLabel.setAttribute('font-weight', '600');
        dcLabel.setAttribute('fill', '#fee2e2');
        dcLabel.textContent = 'DC OUT';
        
        const mainLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        mainLabel.setAttribute('x', dimensions.width / 2);
        mainLabel.setAttribute('y', '125');
        mainLabel.setAttribute('text-anchor', 'middle');
        mainLabel.setAttribute('font-size', '14');
        mainLabel.setAttribute('font-weight', '700');
        mainLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        mainLabel.setAttribute('fill', '#1f2937');
        mainLabel.setAttribute('letter-spacing', '0.5');
        mainLabel.textContent = 'POWER SUPPLY';
        
        group.appendChild(housing);
        group.appendChild(housingHighlight);
        group.appendChild(acInputOuter);
        group.appendChild(acInput);
        group.appendChild(dcOutputOuter);
        group.appendChild(dcOutput);
        group.appendChild(acLabel);
        group.appendChild(dcLabel);
        group.appendChild(mainLabel);
        
        // Power and status LEDs with modern design
        const psuLeds = [
            { cx: dimensions.width / 2 - 25, cy: dimensions.height - 45, color: '#10b981', type: 'power', label: 'AC' },
            { cx: dimensions.width / 2, cy: dimensions.height - 45, color: '#10b981', type: 'power', label: 'DC' },
            { cx: dimensions.width / 2 + 25, cy: dimensions.height - 45, color: '#f59e0b', type: 'trouble', label: 'FLT' }
        ];
        
        psuLeds.forEach(config => {
            const ledGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // LED bezel
            const bezel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bezel.setAttribute('cx', config.cx);
            bezel.setAttribute('cy', config.cy);
            bezel.setAttribute('r', '7');
            bezel.setAttribute('fill', '#1f2937');
            
            // LED glow
            const ledGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledGlow.setAttribute('cx', config.cx);
            ledGlow.setAttribute('cy', config.cy);
            ledGlow.setAttribute('r', '8');
            ledGlow.setAttribute('fill', config.color);
            ledGlow.setAttribute('opacity', '0.3');
            ledGlow.setAttribute('filter', 'blur(3px)');
            
            // LED
            const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            led.setAttribute('cx', config.cx);
            led.setAttribute('cy', config.cy);
            led.setAttribute('r', '5');
            led.setAttribute('fill', config.color);
            led.setAttribute('class', 'led');
            led.setAttribute('data-led-type', config.type);
            
            // LED highlight
            const ledHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledHighlight.setAttribute('cx', config.cx);
            ledHighlight.setAttribute('cy', config.cy - 2);
            ledHighlight.setAttribute('r', '2');
            ledHighlight.setAttribute('fill', 'rgba(255,255,255,0.6)');
            
            // LED label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', config.cx);
            label.setAttribute('y', dimensions.height - 30);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '9');
            label.setAttribute('font-weight', '500');
            label.setAttribute('fill', '#94a3b8');
            label.textContent = config.label;
            
            ledGroup.appendChild(bezel);
            ledGroup.appendChild(ledGlow);
            ledGroup.appendChild(led);
            ledGroup.appendChild(ledHighlight);
            ledGroup.appendChild(label);
            group.appendChild(ledGroup);
        });
        
        return group;
    }
    
    // PAM Relay
    createPAMRelayGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Housing gradient
        const housingGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        housingGradient.setAttribute('id', 'pam-housing-gradient');
        housingGradient.setAttribute('x1', '0%');
        housingGradient.setAttribute('y1', '0%');
        housingGradient.setAttribute('x2', '0%');
        housingGradient.setAttribute('y2', '100%');
        
        const hStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        hStop1.setAttribute('offset', '0%');
        hStop1.setAttribute('style', 'stop-color:#0f766e;stop-opacity:1');
        housingGradient.appendChild(hStop1);
        
        const hStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        hStop2.setAttribute('offset', '100%');
        hStop2.setAttribute('style', 'stop-color:#047857;stop-opacity:1');
        housingGradient.appendChild(hStop2);
        
        defs.appendChild(housingGradient);
        
        // Coil gradient
        const coilGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        coilGradient.setAttribute('id', 'coil-gradient');
        coilGradient.setAttribute('x1', '0%');
        coilGradient.setAttribute('y1', '0%');
        coilGradient.setAttribute('x2', '100%');
        coilGradient.setAttribute('y2', '0%');
        
        const cStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        cStop1.setAttribute('offset', '0%');
        cStop1.setAttribute('style', 'stop-color:#dc2626;stop-opacity:1');
        coilGradient.appendChild(cStop1);
        
        const cStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        cStop2.setAttribute('offset', '100%');
        cStop2.setAttribute('style', 'stop-color:#ef4444;stop-opacity:1');
        coilGradient.appendChild(cStop2);
        
        defs.appendChild(coilGradient);
        group.appendChild(defs);
        
        // Relay housing with modern styling
        const housing = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housing.setAttribute('x', '15');
        housing.setAttribute('y', '15');
        housing.setAttribute('width', dimensions.width - 30);
        housing.setAttribute('height', dimensions.height - 30);
        housing.setAttribute('fill', 'url(#pam-housing-gradient)');
        housing.setAttribute('stroke', '#064e3b');
        housing.setAttribute('stroke-width', '1');
        housing.setAttribute('rx', '8');
        housing.setAttribute('filter', 'url(#acm-shadow)');
        
        // Housing highlight
        const housingHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housingHighlight.setAttribute('x', '20');
        housingHighlight.setAttribute('y', '20');
        housingHighlight.setAttribute('width', dimensions.width - 40);
        housingHighlight.setAttribute('height', '2');
        housingHighlight.setAttribute('fill', 'rgba(255,255,255,0.3)');
        housingHighlight.setAttribute('rx', '1');
        
        // Relay coil with metallic effect
        const coilShadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        coilShadow.setAttribute('x', dimensions.width / 2 - 19);
        coilShadow.setAttribute('y', '31');
        coilShadow.setAttribute('width', '40');
        coilShadow.setAttribute('height', '20');
        coilShadow.setAttribute('fill', '#000000');
        coilShadow.setAttribute('opacity', '0.3');
        coilShadow.setAttribute('rx', '10');
        coilShadow.setAttribute('filter', 'blur(2px)');
        
        const coilOuter = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        coilOuter.setAttribute('x', dimensions.width / 2 - 22);
        coilOuter.setAttribute('y', '28');
        coilOuter.setAttribute('width', '44');
        coilOuter.setAttribute('height', '24');
        coilOuter.setAttribute('fill', '#7f1d1d');
        coilOuter.setAttribute('rx', '12');
        
        const coil = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        coil.setAttribute('x', dimensions.width / 2 - 20);
        coil.setAttribute('y', '30');
        coil.setAttribute('width', '40');
        coil.setAttribute('height', '20');
        coil.setAttribute('fill', 'url(#coil-gradient)');
        coil.setAttribute('stroke', '#991b1b');
        coil.setAttribute('stroke-width', '1');
        coil.setAttribute('rx', '10');
        
        // Coil winding lines
        for (let i = 0; i < 5; i++) {
            const winding = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            winding.setAttribute('x1', dimensions.width / 2 - 15 + i * 8);
            winding.setAttribute('y1', '35');
            winding.setAttribute('x2', dimensions.width / 2 - 15 + i * 8);
            winding.setAttribute('y2', '45');
            winding.setAttribute('stroke', '#7f1d1d');
            winding.setAttribute('stroke-width', '1');
            winding.setAttribute('opacity', '0.5');
            group.appendChild(winding);
        }
        
        // Contact points with metallic finish
        const contact1Outer = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        contact1Outer.setAttribute('cx', dimensions.width / 2 - 15);
        contact1Outer.setAttribute('cy', '60');
        contact1Outer.setAttribute('r', '6');
        contact1Outer.setAttribute('fill', '#92400e');
        
        const contact1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        contact1.setAttribute('cx', dimensions.width / 2 - 15);
        contact1.setAttribute('cy', '60');
        contact1.setAttribute('r', '4');
        contact1.setAttribute('fill', '#fbbf24');
        contact1.setAttribute('stroke', '#f59e0b');
        contact1.setAttribute('stroke-width', '0.5');
        
        const contact2Outer = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        contact2Outer.setAttribute('cx', dimensions.width / 2 + 15);
        contact2Outer.setAttribute('cy', '60');
        contact2Outer.setAttribute('r', '6');
        contact2Outer.setAttribute('fill', '#92400e');
        
        const contact2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        contact2.setAttribute('cx', dimensions.width / 2 + 15);
        contact2.setAttribute('cy', '60');
        contact2.setAttribute('r', '4');
        contact2.setAttribute('fill', '#fbbf24');
        contact2.setAttribute('stroke', '#f59e0b');
        contact2.setAttribute('stroke-width', '0.5');
        
        // Switch arm with shadow
        const switchArmShadow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        switchArmShadow.setAttribute('x1', dimensions.width / 2 - 14);
        switchArmShadow.setAttribute('y1', '61');
        switchArmShadow.setAttribute('x2', dimensions.width / 2 + 11);
        switchArmShadow.setAttribute('y2', '56');
        switchArmShadow.setAttribute('stroke', '#000000');
        switchArmShadow.setAttribute('stroke-width', '4');
        switchArmShadow.setAttribute('stroke-linecap', 'round');
        switchArmShadow.setAttribute('opacity', '0.2');
        
        const switchArm = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        switchArm.setAttribute('x1', dimensions.width / 2 - 15);
        switchArm.setAttribute('y1', '60');
        switchArm.setAttribute('x2', dimensions.width / 2 + 10);
        switchArm.setAttribute('y2', '55');
        switchArm.setAttribute('stroke', '#e5e7eb');
        switchArm.setAttribute('stroke-width', '3');
        switchArm.setAttribute('stroke-linecap', 'round');
        
        // LED indicator with modern glow
        const ledGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // LED bezel
        const bezel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bezel.setAttribute('cx', dimensions.width / 2);
        bezel.setAttribute('cy', dimensions.height - 25);
        bezel.setAttribute('r', '6');
        bezel.setAttribute('fill', '#064e3b');
        
        // LED glow
        const ledGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ledGlow.setAttribute('cx', dimensions.width / 2);
        ledGlow.setAttribute('cy', dimensions.height - 25);
        ledGlow.setAttribute('r', '7');
        ledGlow.setAttribute('fill', '#ef4444');
        ledGlow.setAttribute('opacity', '0.3');
        ledGlow.setAttribute('filter', 'blur(3px)');
        
        // LED
        const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        led.setAttribute('cx', dimensions.width / 2);
        led.setAttribute('cy', dimensions.height - 25);
        led.setAttribute('r', '4');
        led.setAttribute('fill', '#ef4444');
        led.setAttribute('class', 'led');
        led.setAttribute('data-led-type', 'status');
        
        // LED highlight
        const ledHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ledHighlight.setAttribute('cx', dimensions.width / 2);
        ledHighlight.setAttribute('cy', dimensions.height - 27);
        ledHighlight.setAttribute('r', '2');
        ledHighlight.setAttribute('fill', 'rgba(255,255,255,0.6)');
        
        ledGroup.appendChild(bezel);
        ledGroup.appendChild(ledGlow);
        ledGroup.appendChild(led);
        ledGroup.appendChild(ledHighlight);
        
        // Label with modern typography
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 10);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '11');
        label.setAttribute('font-weight', '600');
        label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        label.setAttribute('fill', '#d1fae5');
        label.setAttribute('letter-spacing', '0.5');
        label.textContent = 'PAM RELAY';
        
        group.appendChild(housing);
        group.appendChild(housingHighlight);
        group.appendChild(coilShadow);
        group.appendChild(coilOuter);
        group.appendChild(coil);
        group.appendChild(contact1Outer);
        group.appendChild(contact1);
        group.appendChild(contact2Outer);
        group.appendChild(contact2);
        group.appendChild(switchArmShadow);
        group.appendChild(switchArm);
        group.appendChild(ledGroup);
        group.appendChild(label);
        
        return group;
    }
    
    // Strike (Door Strike)
    createStrikeGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Metal body gradient
        const bodyGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        bodyGradient.setAttribute('id', 'strike-body-gradient');
        bodyGradient.setAttribute('x1', '0%');
        bodyGradient.setAttribute('y1', '0%');
        bodyGradient.setAttribute('x2', '100%');
        bodyGradient.setAttribute('y2', '100%');
        
        const bStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop1.setAttribute('offset', '0%');
        bStop1.setAttribute('style', 'stop-color:#d1d5db;stop-opacity:1');
        bodyGradient.appendChild(bStop1);
        
        const bStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop2.setAttribute('offset', '50%');
        bStop2.setAttribute('style', 'stop-color:#9ca3af;stop-opacity:1');
        bodyGradient.appendChild(bStop2);
        
        const bStop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop3.setAttribute('offset', '100%');
        bStop3.setAttribute('style', 'stop-color:#6b7280;stop-opacity:1');
        bodyGradient.appendChild(bStop3);
        
        defs.appendChild(bodyGradient);
        
        // Plate gradient for brushed metal effect
        const plateGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        plateGradient.setAttribute('id', 'strike-plate-gradient');
        plateGradient.setAttribute('x1', '0%');
        plateGradient.setAttribute('y1', '0%');
        plateGradient.setAttribute('x2', '0%');
        plateGradient.setAttribute('y2', '100%');
        
        const pStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        pStop1.setAttribute('offset', '0%');
        pStop1.setAttribute('style', 'stop-color:#e5e7eb;stop-opacity:1');
        plateGradient.appendChild(pStop1);
        
        const pStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        pStop2.setAttribute('offset', '100%');
        pStop2.setAttribute('style', 'stop-color:#d1d5db;stop-opacity:1');
        plateGradient.appendChild(pStop2);
        
        defs.appendChild(plateGradient);
        group.appendChild(defs);
        
        // Strike body with 3D effect
        const bodyShadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bodyShadow.setAttribute('x', '21');
        bodyShadow.setAttribute('y', '11');
        bodyShadow.setAttribute('width', dimensions.width - 40);
        bodyShadow.setAttribute('height', dimensions.height - 30);
        bodyShadow.setAttribute('fill', '#000000');
        bodyShadow.setAttribute('opacity', '0.2');
        bodyShadow.setAttribute('rx', '4');
        bodyShadow.setAttribute('filter', 'blur(2px)');
        
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', '20');
        body.setAttribute('y', '10');
        body.setAttribute('width', dimensions.width - 40);
        body.setAttribute('height', dimensions.height - 30);
        body.setAttribute('fill', 'url(#strike-body-gradient)');
        body.setAttribute('stroke', '#4b5563');
        body.setAttribute('stroke-width', '1');
        body.setAttribute('rx', '4');
        
        // Body edge highlight
        const bodyHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bodyHighlight.setAttribute('x', '22');
        bodyHighlight.setAttribute('y', '12');
        bodyHighlight.setAttribute('width', dimensions.width - 44);
        bodyHighlight.setAttribute('height', '1');
        bodyHighlight.setAttribute('fill', 'rgba(255,255,255,0.6)');
        bodyHighlight.setAttribute('rx', '0.5');
        
        // Strike plate with metallic finish
        const plateShadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        plateShadow.setAttribute('x', '31');
        plateShadow.setAttribute('y', '21');
        plateShadow.setAttribute('width', dimensions.width - 62);
        plateShadow.setAttribute('height', dimensions.height - 52);
        plateShadow.setAttribute('fill', '#000000');
        plateShadow.setAttribute('opacity', '0.1');
        plateShadow.setAttribute('rx', '2');
        
        const plate = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        plate.setAttribute('x', '30');
        plate.setAttribute('y', '20');
        plate.setAttribute('width', dimensions.width - 60);
        plate.setAttribute('height', dimensions.height - 50);
        plate.setAttribute('fill', 'url(#strike-plate-gradient)');
        plate.setAttribute('stroke', '#9ca3af');
        plate.setAttribute('stroke-width', '0.5');
        plate.setAttribute('rx', '2');
        
        // Latch cavity with depth
        const cavityOuter = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cavityOuter.setAttribute('x', dimensions.width / 2 - 12);
        cavityOuter.setAttribute('y', dimensions.height / 2 - 22);
        cavityOuter.setAttribute('width', '24');
        cavityOuter.setAttribute('height', '44');
        cavityOuter.setAttribute('fill', '#1f2937');
        cavityOuter.setAttribute('rx', '3');
        
        const cavity = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cavity.setAttribute('x', dimensions.width / 2 - 10);
        cavity.setAttribute('y', dimensions.height / 2 - 20);
        cavity.setAttribute('width', '20');
        cavity.setAttribute('height', '40');
        cavity.setAttribute('fill', '#0f172a');
        cavity.setAttribute('rx', '2');
        
        // Cavity inner shadow for depth
        const cavityInner = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cavityInner.setAttribute('x', dimensions.width / 2 - 8);
        cavityInner.setAttribute('y', dimensions.height / 2 - 18);
        cavityInner.setAttribute('width', '16');
        cavityInner.setAttribute('height', '36');
        cavityInner.setAttribute('fill', 'none');
        cavityInner.setAttribute('stroke', '#000000');
        cavityInner.setAttribute('stroke-width', '2');
        cavityInner.setAttribute('opacity', '0.3');
        cavityInner.setAttribute('rx', '1');
        
        // Mounting holes with depth
        const hole1Outer = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hole1Outer.setAttribute('cx', dimensions.width / 2);
        hole1Outer.setAttribute('cy', '30');
        hole1Outer.setAttribute('r', '4');
        hole1Outer.setAttribute('fill', '#374151');
        
        const hole1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hole1.setAttribute('cx', dimensions.width / 2);
        hole1.setAttribute('cy', '30');
        hole1.setAttribute('r', '3');
        hole1.setAttribute('fill', '#1f2937');
        
        const hole2Outer = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hole2Outer.setAttribute('cx', dimensions.width / 2);
        hole2Outer.setAttribute('cy', dimensions.height - 30);
        hole2Outer.setAttribute('r', '4');
        hole2Outer.setAttribute('fill', '#374151');
        
        const hole2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hole2.setAttribute('cx', dimensions.width / 2);
        hole2.setAttribute('cy', dimensions.height - 30);
        hole2.setAttribute('r', '3');
        hole2.setAttribute('fill', '#1f2937');
        
        // Screws in mounting holes
        const screw1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        screw1.setAttribute('cx', dimensions.width / 2);
        screw1.setAttribute('cy', '30');
        screw1.setAttribute('r', '1.5');
        screw1.setAttribute('fill', '#6b7280');
        
        const screw2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        screw2.setAttribute('cx', dimensions.width / 2);
        screw2.setAttribute('cy', dimensions.height - 30);
        screw2.setAttribute('r', '1.5');
        screw2.setAttribute('fill', '#6b7280');
        
        // Label with embossed effect
        const labelShadow = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelShadow.setAttribute('x', dimensions.width / 2);
        labelShadow.setAttribute('y', dimensions.height - 14);
        labelShadow.setAttribute('text-anchor', 'middle');
        labelShadow.setAttribute('font-size', '10');
        labelShadow.setAttribute('font-weight', '700');
        labelShadow.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        labelShadow.setAttribute('fill', '#000000');
        labelShadow.setAttribute('opacity', '0.2');
        labelShadow.textContent = 'STRIKE';
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 15);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '10');
        label.setAttribute('font-weight', '700');
        label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        label.setAttribute('fill', '#374151');
        label.textContent = 'STRIKE';
        
        group.appendChild(bodyShadow);
        group.appendChild(body);
        group.appendChild(bodyHighlight);
        group.appendChild(plateShadow);
        group.appendChild(plate);
        group.appendChild(cavityOuter);
        group.appendChild(cavity);
        group.appendChild(cavityInner);
        group.appendChild(hole1Outer);
        group.appendChild(hole1);
        group.appendChild(hole2Outer);
        group.appendChild(hole2);
        group.appendChild(screw1);
        group.appendChild(screw2);
        group.appendChild(labelShadow);
        group.appendChild(label);
        
        return group;
    }
    
    // REX Button (Request to Exit)
    createREXButtonGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Housing gradient
        const housingGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        housingGradient.setAttribute('id', 'rex-housing-gradient');
        housingGradient.setAttribute('x1', '0%');
        housingGradient.setAttribute('y1', '0%');
        housingGradient.setAttribute('x2', '0%');
        housingGradient.setAttribute('y2', '100%');
        
        const hStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        hStop1.setAttribute('offset', '0%');
        hStop1.setAttribute('style', 'stop-color:#e5e7eb;stop-opacity:1');
        housingGradient.appendChild(hStop1);
        
        const hStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        hStop2.setAttribute('offset', '100%');
        hStop2.setAttribute('style', 'stop-color:#9ca3af;stop-opacity:1');
        housingGradient.appendChild(hStop2);
        
        defs.appendChild(housingGradient);
        
        // Button gradient for 3D effect
        const buttonGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        buttonGradient.setAttribute('id', 'rex-button-gradient');
        buttonGradient.setAttribute('cx', '40%');
        buttonGradient.setAttribute('cy', '30%');
        
        const bStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop1.setAttribute('offset', '0%');
        bStop1.setAttribute('style', 'stop-color:#ef4444;stop-opacity:1');
        buttonGradient.appendChild(bStop1);
        
        const bStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop2.setAttribute('offset', '70%');
        bStop2.setAttribute('style', 'stop-color:#dc2626;stop-opacity:1');
        buttonGradient.appendChild(bStop2);
        
        const bStop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bStop3.setAttribute('offset', '100%');
        bStop3.setAttribute('style', 'stop-color:#991b1b;stop-opacity:1');
        buttonGradient.appendChild(bStop3);
        
        defs.appendChild(buttonGradient);
        
        // Inner shadow filter for button depth
        const innerShadow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        innerShadow.setAttribute('id', 'rex-inner-shadow');
        innerShadow.setAttribute('x', '-50%');
        innerShadow.setAttribute('y', '-50%');
        innerShadow.setAttribute('width', '200%');
        innerShadow.setAttribute('height', '200%');
        
        const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feGaussianBlur.setAttribute('in', 'SourceAlpha');
        feGaussianBlur.setAttribute('stdDeviation', '3');
        innerShadow.appendChild(feGaussianBlur);
        
        const feOffset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset');
        feOffset.setAttribute('dx', '0');
        feOffset.setAttribute('dy', '2');
        feOffset.setAttribute('result', 'offsetblur');
        innerShadow.appendChild(feOffset);
        
        const feFlood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
        feFlood.setAttribute('flood-color', '#000000');
        feFlood.setAttribute('flood-opacity', '0.5');
        innerShadow.appendChild(feFlood);
        
        const feComposite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
        feComposite.setAttribute('in2', 'offsetblur');
        feComposite.setAttribute('operator', 'in');
        innerShadow.appendChild(feComposite);
        
        const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
        const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode2.setAttribute('in', 'SourceGraphic');
        feMerge.appendChild(feMergeNode1);
        feMerge.appendChild(feMergeNode2);
        innerShadow.appendChild(feMerge);
        
        defs.appendChild(innerShadow);
        group.appendChild(defs);
        
        // Button housing with modern styling
        const housing = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housing.setAttribute('x', '15');
        housing.setAttribute('y', '15');
        housing.setAttribute('width', dimensions.width - 30);
        housing.setAttribute('height', dimensions.height - 30);
        housing.setAttribute('fill', 'url(#rex-housing-gradient)');
        housing.setAttribute('stroke', '#6b7280');
        housing.setAttribute('stroke-width', '1');
        housing.setAttribute('rx', '8');
        housing.setAttribute('filter', 'url(#acm-shadow)');
        
        // Housing highlight
        const housingHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housingHighlight.setAttribute('x', '18');
        housingHighlight.setAttribute('y', '18');
        housingHighlight.setAttribute('width', dimensions.width - 36);
        housingHighlight.setAttribute('height', '2');
        housingHighlight.setAttribute('fill', 'rgba(255,255,255,0.6)');
        housingHighlight.setAttribute('rx', '1');
        
        // Button bezel
        const bezel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bezel.setAttribute('cx', dimensions.width / 2);
        bezel.setAttribute('cy', dimensions.height / 2 - 5);
        bezel.setAttribute('r', '28');
        bezel.setAttribute('fill', '#374151');
        bezel.setAttribute('filter', 'url(#acm-shadow)');
        
        // Button outer ring with gradient
        const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        outerRing.setAttribute('cx', dimensions.width / 2);
        outerRing.setAttribute('cy', dimensions.height / 2 - 5);
        outerRing.setAttribute('r', '25');
        outerRing.setAttribute('fill', 'url(#rex-button-gradient)');
        outerRing.setAttribute('stroke', '#7f1d1d');
        outerRing.setAttribute('stroke-width', '1');
        outerRing.setAttribute('filter', 'url(#rex-inner-shadow)');
        
        // Button highlight ring
        const highlightRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlightRing.setAttribute('cx', dimensions.width / 2);
        highlightRing.setAttribute('cy', dimensions.height / 2 - 5);
        highlightRing.setAttribute('r', '23');
        highlightRing.setAttribute('fill', 'none');
        highlightRing.setAttribute('stroke', 'rgba(255,255,255,0.3)');
        highlightRing.setAttribute('stroke-width', '1');
        
        // Button center with pressed effect
        const buttonShadow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        buttonShadow.setAttribute('cx', dimensions.width / 2);
        buttonShadow.setAttribute('cy', dimensions.height / 2 - 4);
        buttonShadow.setAttribute('r', '18');
        buttonShadow.setAttribute('fill', '#000000');
        buttonShadow.setAttribute('opacity', '0.3');
        buttonShadow.setAttribute('filter', 'blur(2px)');
        
        const buttonCenter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        buttonCenter.setAttribute('cx', dimensions.width / 2);
        buttonCenter.setAttribute('cy', dimensions.height / 2 - 5);
        buttonCenter.setAttribute('r', '18');
        buttonCenter.setAttribute('fill', '#b91c1c');
        
        // Button center highlight
        const centerHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        centerHighlight.setAttribute('cx', dimensions.width / 2);
        centerHighlight.setAttribute('cy', dimensions.height / 2 - 10);
        centerHighlight.setAttribute('rx', '12');
        centerHighlight.setAttribute('ry', '8');
        centerHighlight.setAttribute('fill', 'rgba(255,255,255,0.2)');
        centerHighlight.setAttribute('filter', 'blur(2px)');
        
        // EXIT text with shadow
        const exitTextShadow = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        exitTextShadow.setAttribute('x', dimensions.width / 2);
        exitTextShadow.setAttribute('y', dimensions.height / 2 + 1);
        exitTextShadow.setAttribute('text-anchor', 'middle');
        exitTextShadow.setAttribute('font-size', '12');
        exitTextShadow.setAttribute('font-weight', '800');
        exitTextShadow.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        exitTextShadow.setAttribute('fill', '#000000');
        exitTextShadow.setAttribute('opacity', '0.3');
        exitTextShadow.textContent = 'EXIT';
        
        const exitText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        exitText.setAttribute('x', dimensions.width / 2);
        exitText.setAttribute('y', dimensions.height / 2);
        exitText.setAttribute('text-anchor', 'middle');
        exitText.setAttribute('font-size', '12');
        exitText.setAttribute('font-weight', '800');
        exitText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        exitText.setAttribute('fill', '#ffffff');
        exitText.setAttribute('letter-spacing', '1');
        exitText.textContent = 'EXIT';
        
        // Label with modern styling
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 15);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '10');
        label.setAttribute('font-weight', '600');
        label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        label.setAttribute('fill', '#374151');
        label.setAttribute('letter-spacing', '0.5');
        label.textContent = 'REX';
        
        group.appendChild(housing);
        group.appendChild(housingHighlight);
        group.appendChild(bezel);
        group.appendChild(outerRing);
        group.appendChild(highlightRing);
        group.appendChild(buttonShadow);
        group.appendChild(buttonCenter);
        group.appendChild(centerHighlight);
        group.appendChild(exitTextShadow);
        group.appendChild(exitText);
        group.appendChild(label);
        
        return group;
    }
    
    // Bosch B9512G Control Panel
    createB9512GGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Enclosure gradient
        const enclosureGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        enclosureGradient.setAttribute('id', 'b9512g-enclosure-gradient');
        enclosureGradient.setAttribute('x1', '0%');
        enclosureGradient.setAttribute('y1', '0%');
        enclosureGradient.setAttribute('x2', '0%');
        enclosureGradient.setAttribute('y2', '100%');
        
        const eStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        eStop1.setAttribute('offset', '0%');
        eStop1.setAttribute('style', 'stop-color:#f3f4f6;stop-opacity:1');
        enclosureGradient.appendChild(eStop1);
        
        const eStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        eStop2.setAttribute('offset', '100%');
        eStop2.setAttribute('style', 'stop-color:#d1d5db;stop-opacity:1');
        enclosureGradient.appendChild(eStop2);
        
        defs.appendChild(enclosureGradient);
        
        // Panel gradient
        const panelGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        panelGradient.setAttribute('id', 'b9512g-panel-gradient');
        panelGradient.setAttribute('x1', '0%');
        panelGradient.setAttribute('y1', '0%');
        panelGradient.setAttribute('x2', '0%');
        panelGradient.setAttribute('y2', '100%');
        
        const pStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        pStop1.setAttribute('offset', '0%');
        pStop1.setAttribute('style', 'stop-color:#1f2937;stop-opacity:1');
        panelGradient.appendChild(pStop1);
        
        const pStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        pStop2.setAttribute('offset', '100%');
        pStop2.setAttribute('style', 'stop-color:#111827;stop-opacity:1');
        panelGradient.appendChild(pStop2);
        
        defs.appendChild(panelGradient);
        
        // Bosch logo gradient
        const logoGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        logoGradient.setAttribute('id', 'bosch-logo-gradient');
        logoGradient.setAttribute('x1', '0%');
        logoGradient.setAttribute('y1', '0%');
        logoGradient.setAttribute('x2', '0%');
        logoGradient.setAttribute('y2', '100%');
        
        const lStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        lStop1.setAttribute('offset', '0%');
        lStop1.setAttribute('style', 'stop-color:#ef4444;stop-opacity:1');
        logoGradient.appendChild(lStop1);
        
        const lStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        lStop2.setAttribute('offset', '100%');
        lStop2.setAttribute('style', 'stop-color:#dc2626;stop-opacity:1');
        logoGradient.appendChild(lStop2);
        
        defs.appendChild(logoGradient);
        group.appendChild(defs);
        
        // Main enclosure with modern styling
        const enclosureShadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        enclosureShadow.setAttribute('x', '11');
        enclosureShadow.setAttribute('y', '11');
        enclosureShadow.setAttribute('width', dimensions.width - 20);
        enclosureShadow.setAttribute('height', dimensions.height - 20);
        enclosureShadow.setAttribute('fill', '#000000');
        enclosureShadow.setAttribute('opacity', '0.2');
        enclosureShadow.setAttribute('rx', '6');
        enclosureShadow.setAttribute('filter', 'blur(3px)');
        
        const enclosure = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        enclosure.setAttribute('x', '10');
        enclosure.setAttribute('y', '10');
        enclosure.setAttribute('width', dimensions.width - 20);
        enclosure.setAttribute('height', dimensions.height - 20);
        enclosure.setAttribute('fill', 'url(#b9512g-enclosure-gradient)');
        enclosure.setAttribute('stroke', '#6b7280');
        enclosure.setAttribute('stroke-width', '1');
        enclosure.setAttribute('rx', '6');
        
        // Enclosure highlight
        const enclosureHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        enclosureHighlight.setAttribute('x', '12');
        enclosureHighlight.setAttribute('y', '12');
        enclosureHighlight.setAttribute('width', dimensions.width - 24);
        enclosureHighlight.setAttribute('height', '2');
        enclosureHighlight.setAttribute('fill', 'rgba(255,255,255,0.5)');
        enclosureHighlight.setAttribute('rx', '1');
        
        // Inner panel with depth
        const innerPanelShadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        innerPanelShadow.setAttribute('x', '21');
        innerPanelShadow.setAttribute('y', '21');
        innerPanelShadow.setAttribute('width', dimensions.width - 42);
        innerPanelShadow.setAttribute('height', dimensions.height - 42);
        innerPanelShadow.setAttribute('fill', '#000000');
        innerPanelShadow.setAttribute('opacity', '0.1');
        innerPanelShadow.setAttribute('rx', '4');
        
        const innerPanel = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        innerPanel.setAttribute('x', '20');
        innerPanel.setAttribute('y', '20');
        innerPanel.setAttribute('width', dimensions.width - 40);
        innerPanel.setAttribute('height', dimensions.height - 40);
        innerPanel.setAttribute('fill', '#e5e7eb');
        innerPanel.setAttribute('stroke', '#9ca3af');
        innerPanel.setAttribute('stroke-width', '1');
        innerPanel.setAttribute('rx', '4');
        
        // Bosch logo area with modern styling
        const logoAreaOuter = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        logoAreaOuter.setAttribute('x', '28');
        logoAreaOuter.setAttribute('y', '28');
        logoAreaOuter.setAttribute('width', '104');
        logoAreaOuter.setAttribute('height', '44');
        logoAreaOuter.setAttribute('fill', '#991b1b');
        logoAreaOuter.setAttribute('rx', '4');
        
        const logoArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        logoArea.setAttribute('x', '30');
        logoArea.setAttribute('y', '30');
        logoArea.setAttribute('width', '100');
        logoArea.setAttribute('height', '40');
        logoArea.setAttribute('fill', 'url(#bosch-logo-gradient)');
        logoArea.setAttribute('rx', '3');
        
        // Bosch text with shadow
        const boschTextShadow = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        boschTextShadow.setAttribute('x', '80');
        boschTextShadow.setAttribute('y', '56');
        boschTextShadow.setAttribute('text-anchor', 'middle');
        boschTextShadow.setAttribute('font-size', '20');
        boschTextShadow.setAttribute('font-weight', '900');
        boschTextShadow.setAttribute('fill', '#000000');
        boschTextShadow.setAttribute('opacity', '0.3');
        boschTextShadow.setAttribute('font-family', 'Arial, sans-serif');
        boschTextShadow.textContent = 'BOSCH';
        
        const boschText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        boschText.setAttribute('x', '80');
        boschText.setAttribute('y', '55');
        boschText.setAttribute('text-anchor', 'middle');
        boschText.setAttribute('font-size', '20');
        boschText.setAttribute('font-weight', '900');
        boschText.setAttribute('fill', '#ffffff');
        boschText.setAttribute('font-family', 'Arial, sans-serif');
        boschText.textContent = 'BOSCH';
        
        // Model number with modern typography
        const modelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        modelText.setAttribute('x', '140');
        modelText.setAttribute('y', '55');
        modelText.setAttribute('text-anchor', 'start');
        modelText.setAttribute('font-size', '16');
        modelText.setAttribute('font-weight', '700');
        modelText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        modelText.setAttribute('fill', '#1f2937');
        modelText.textContent = 'B9512G Control Panel';
        
        // Zone LED panel with modern styling
        const zonePanelOuter = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        zonePanelOuter.setAttribute('x', '28');
        zonePanelOuter.setAttribute('y', '78');
        zonePanelOuter.setAttribute('width', '184');
        zonePanelOuter.setAttribute('height', '124');
        zonePanelOuter.setAttribute('fill', '#030712');
        zonePanelOuter.setAttribute('rx', '4');
        
        const zonePanelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        zonePanelBg.setAttribute('x', '30');
        zonePanelBg.setAttribute('y', '80');
        zonePanelBg.setAttribute('width', '180');
        zonePanelBg.setAttribute('height', '120');
        zonePanelBg.setAttribute('fill', 'url(#b9512g-panel-gradient)');
        zonePanelBg.setAttribute('stroke', '#030712');
        zonePanelBg.setAttribute('stroke-width', '1');
        zonePanelBg.setAttribute('rx', '3');
        
        // Zone panel title
        const zonePanelTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        zonePanelTitle.setAttribute('x', '120');
        zonePanelTitle.setAttribute('y', '95');
        zonePanelTitle.setAttribute('text-anchor', 'middle');
        zonePanelTitle.setAttribute('font-size', '10');
        zonePanelTitle.setAttribute('font-weight', '600');
        zonePanelTitle.setAttribute('fill', '#6b7280');
        zonePanelTitle.setAttribute('letter-spacing', '0.5');
        zonePanelTitle.textContent = 'ZONE STATUS';
        
        // System status panel with modern styling
        const statusPanelOuter = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        statusPanelOuter.setAttribute('x', '218');
        statusPanelOuter.setAttribute('y', '78');
        statusPanelOuter.setAttribute('width', '204');
        statusPanelOuter.setAttribute('height', '124');
        statusPanelOuter.setAttribute('fill', '#030712');
        statusPanelOuter.setAttribute('rx', '4');
        
        const statusPanelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        statusPanelBg.setAttribute('x', '220');
        statusPanelBg.setAttribute('y', '80');
        statusPanelBg.setAttribute('width', '200');
        statusPanelBg.setAttribute('height', '120');
        statusPanelBg.setAttribute('fill', 'url(#b9512g-panel-gradient)');
        statusPanelBg.setAttribute('stroke', '#030712');
        statusPanelBg.setAttribute('stroke-width', '1');
        statusPanelBg.setAttribute('rx', '3');
        
        // Status panel title
        const statusPanelTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        statusPanelTitle.setAttribute('x', '320');
        statusPanelTitle.setAttribute('y', '95');
        statusPanelTitle.setAttribute('text-anchor', 'middle');
        statusPanelTitle.setAttribute('font-size', '10');
        statusPanelTitle.setAttribute('font-weight', '600');
        statusPanelTitle.setAttribute('fill', '#6b7280');
        statusPanelTitle.setAttribute('letter-spacing', '0.5');
        statusPanelTitle.textContent = 'SYSTEM STATUS';
        
        // Terminal blocks area with 3D effect
        const terminalAreaOuter = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        terminalAreaOuter.setAttribute('x', '28');
        terminalAreaOuter.setAttribute('y', '208');
        terminalAreaOuter.setAttribute('width', dimensions.width - 56);
        terminalAreaOuter.setAttribute('height', '29');
        terminalAreaOuter.setAttribute('fill', '#374151');
        terminalAreaOuter.setAttribute('rx', '3');
        
        const terminalArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        terminalArea.setAttribute('x', '30');
        terminalArea.setAttribute('y', '210');
        terminalArea.setAttribute('width', dimensions.width - 60);
        terminalArea.setAttribute('height', '25');
        terminalArea.setAttribute('fill', '#4b5563');
        terminalArea.setAttribute('stroke', '#374151');
        terminalArea.setAttribute('stroke-width', '1');
        terminalArea.setAttribute('rx', '2');
        
        // Add all background elements first
        group.appendChild(enclosureShadow);
        group.appendChild(enclosure);
        group.appendChild(enclosureHighlight);
        group.appendChild(innerPanelShadow);
        group.appendChild(innerPanel);
        group.appendChild(logoAreaOuter);
        group.appendChild(logoArea);
        group.appendChild(boschTextShadow);
        group.appendChild(boschText);
        group.appendChild(modelText);
        group.appendChild(zonePanelOuter);
        group.appendChild(zonePanelBg);
        group.appendChild(zonePanelTitle);
        group.appendChild(statusPanelOuter);
        group.appendChild(statusPanelBg);
        group.appendChild(statusPanelTitle);
        group.appendChild(terminalAreaOuter);
        group.appendChild(terminalArea);
        
        // Zone LEDs with modern design
        const zoneColors = ['#10b981', '#10b981', '#f59e0b', '#ef4444', '#10b981', '#10b981', '#f59e0b', '#10b981'];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 2; col++) {
                const index = row * 2 + col;
                const x = 50 + col * 80;
                const y = 105 + row * 23;
                
                const ledGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                
                // LED bezel
                const bezel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                bezel.setAttribute('cx', x);
                bezel.setAttribute('cy', y);
                bezel.setAttribute('r', '8');
                bezel.setAttribute('fill', '#030712');
                
                // LED glow
                const ledGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                ledGlow.setAttribute('cx', x);
                ledGlow.setAttribute('cy', y);
                ledGlow.setAttribute('r', '9');
                ledGlow.setAttribute('fill', zoneColors[index]);
                ledGlow.setAttribute('opacity', '0.3');
                ledGlow.setAttribute('filter', 'blur(3px)');
                
                // LED
                const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                led.setAttribute('cx', x);
                led.setAttribute('cy', y);
                led.setAttribute('r', '6');
                led.setAttribute('fill', zoneColors[index]);
                led.setAttribute('class', `led zone-led-${index + 1}`);
                led.setAttribute('data-led-type', 'zone');
                led.setAttribute('data-zone', index + 1);
                
                // LED highlight
                const ledHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                ledHighlight.setAttribute('cx', x);
                ledHighlight.setAttribute('cy', y - 2);
                ledHighlight.setAttribute('r', '3');
                ledHighlight.setAttribute('fill', 'rgba(255,255,255,0.4)');
                
                // Zone label
                const zoneLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                zoneLabel.setAttribute('x', x + 15);
                zoneLabel.setAttribute('y', y + 4);
                zoneLabel.setAttribute('font-size', '10');
                zoneLabel.setAttribute('font-weight', '500');
                zoneLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
                zoneLabel.setAttribute('fill', '#d1d5db');
                zoneLabel.textContent = `Zone ${index + 1}`;
                
                ledGroup.appendChild(bezel);
                ledGroup.appendChild(ledGlow);
                ledGroup.appendChild(led);
                ledGroup.appendChild(ledHighlight);
                ledGroup.appendChild(zoneLabel);
                group.appendChild(ledGroup);
            }
        }
        
        // Status LEDs with modern design
        const statusLeds = [
            { label: 'AC POWER', color: '#10b981', y: 105 },
            { label: 'BATTERY', color: '#10b981', y: 125 },
            { label: 'SYSTEM TROUBLE', color: '#f59e0b', y: 145 },
            { label: 'ALARM', color: '#ef4444', y: 165 },
            { label: 'SUPERVISORY', color: '#06b6d4', y: 185 }
        ];
        
        statusLeds.forEach((status, index) => {
            const ledGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // LED bezel
            const bezel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bezel.setAttribute('cx', '240');
            bezel.setAttribute('cy', status.y);
            bezel.setAttribute('r', '8');
            bezel.setAttribute('fill', '#030712');
            
            // LED glow
            const ledGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledGlow.setAttribute('cx', '240');
            ledGlow.setAttribute('cy', status.y);
            ledGlow.setAttribute('r', '9');
            ledGlow.setAttribute('fill', status.color);
            ledGlow.setAttribute('opacity', '0.3');
            ledGlow.setAttribute('filter', 'blur(3px)');
            
            // LED
            const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            led.setAttribute('cx', '240');
            led.setAttribute('cy', status.y);
            led.setAttribute('r', '6');
            led.setAttribute('fill', status.color);
            led.setAttribute('class', `led status-led-${status.label.toLowerCase().replace(' ', '-')}`);
            led.setAttribute('data-led-type', 'status');
            led.setAttribute('data-status', status.label);
            
            // LED highlight
            const ledHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ledHighlight.setAttribute('cx', '240');
            ledHighlight.setAttribute('cy', status.y - 2);
            ledHighlight.setAttribute('r', '3');
            ledHighlight.setAttribute('fill', 'rgba(255,255,255,0.4)');
            
            // Label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', '255');
            label.setAttribute('y', status.y + 4);
            label.setAttribute('font-size', '10');
            label.setAttribute('font-weight', '500');
            label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
            label.setAttribute('fill', '#d1d5db');
            label.textContent = status.label;
            
            ledGroup.appendChild(bezel);
            ledGroup.appendChild(ledGlow);
            ledGroup.appendChild(led);
            ledGroup.appendChild(ledHighlight);
            ledGroup.appendChild(label);
            group.appendChild(ledGroup);
        });
        
        // Terminal blocks with 3D effect
        for (let i = 0; i < 12; i++) {
            const terminalGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Terminal shadow
            const terminalShadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            terminalShadow.setAttribute('x', 41 + i * 32);
            terminalShadow.setAttribute('y', '216');
            terminalShadow.setAttribute('width', '25');
            terminalShadow.setAttribute('height', '15');
            terminalShadow.setAttribute('fill', '#000000');
            terminalShadow.setAttribute('opacity', '0.2');
            terminalShadow.setAttribute('rx', '1');
            
            // Terminal block
            const terminal = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            terminal.setAttribute('x', 40 + i * 32);
            terminal.setAttribute('y', '215');
            terminal.setAttribute('width', '25');
            terminal.setAttribute('height', '15');
            terminal.setAttribute('fill', '#1f2937');
            terminal.setAttribute('stroke', '#030712');
            terminal.setAttribute('stroke-width', '1');
            terminal.setAttribute('rx', '1');
            
            // Terminal screw
            const screw = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            screw.setAttribute('cx', 52.5 + i * 32);
            screw.setAttribute('cy', '222.5');
            screw.setAttribute('r', '3');
            screw.setAttribute('fill', '#6b7280');
            screw.setAttribute('stroke', '#4b5563');
            screw.setAttribute('stroke-width', '0.5');
            
            terminalGroup.appendChild(terminalShadow);
            terminalGroup.appendChild(terminal);
            terminalGroup.appendChild(screw);
            group.appendChild(terminalGroup);
        }
        
        return group;
    }
    
    // Initialize LED animations and gradients
    initializeLEDAnimations() {
        // Create CSS animations for different LED states
        const style = document.createElement('style');
        style.textContent = `
            @keyframes led-blink-fast {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
            
            @keyframes led-blink-slow {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
            }
            
            @keyframes led-pulse {
                0%, 100% { opacity: 0.6; filter: blur(0px); }
                50% { opacity: 1; filter: blur(1px) brightness(1.2); }
            }
            
            @keyframes led-flash-alert {
                0% { opacity: 1; }
                50% { opacity: 0.2; }
                100% { opacity: 1; }
            }
            
            @keyframes led-glow {
                0%, 100% { 
                    filter: drop-shadow(0 0 3px currentColor) brightness(1.2); 
                }
                50% { 
                    filter: drop-shadow(0 0 8px currentColor) brightness(1.5); 
                }
            }
            
            /* Apply animations to different LED types */
            .led[data-led-type="power"] {
                animation: led-pulse 2s infinite ease-in-out;
                filter: drop-shadow(0 0 3px currentColor);
            }
            
            .led[data-led-type="status"] {
                animation: led-blink-slow 3s infinite ease-in-out;
                filter: drop-shadow(0 0 2px currentColor);
            }
            
            .led[data-led-type="alarm"] {
                animation: led-flash-alert 0.5s infinite ease-in-out;
                filter: drop-shadow(0 0 6px currentColor);
            }
            
            .led[data-led-type="trouble"] {
                animation: led-blink-fast 0.8s infinite ease-in-out;
                filter: drop-shadow(0 0 3px currentColor);
            }
            
            .led[data-led-type="zone"] {
                transition: all 0.3s ease;
            }
            
            .led[data-led-type="zone"].active {
                animation: led-glow 1.5s infinite ease-in-out;
            }
            
            .led[data-led-type="communication"] {
                animation: led-blink-fast 0.5s infinite;
                animation-play-state: paused;
            }
            
            .led[data-led-type="communication"].active {
                animation-play-state: running;
            }
            
            /* Component-specific LED styles */
            .component.reader .led {
                filter: drop-shadow(0 0 2px currentColor);
            }
            
            .component.psu .led[data-led-type="power"] {
                filter: drop-shadow(0 0 5px #28a745);
            }
            
            .component.b9512g .led[data-status="ALARM"] {
                animation: led-flash-alert 0.5s infinite;
                filter: drop-shadow(0 0 6px #dc3545);
            }
            
            .component.b9512g .led[data-status="SYSTEM TROUBLE"] {
                animation: led-blink-fast 1s infinite;
            }
            
            /* Hover effects for interactive components */
            .component.rex:hover .led {
                animation: led-pulse 0.5s infinite;
            }
            
            /* LED glow animations - synced with main LED */
            .led-glow[data-led-type="power"] {
                animation: led-glow-pulse 2s infinite ease-in-out;
            }
            
            .led-glow[data-led-type="alarm"] {
                animation: led-glow-flash 0.5s infinite ease-in-out;
            }
            
            .led-glow[data-led-type="status"] {
                animation: led-glow-slow 3s infinite ease-in-out;
            }
            
            .led-glow[data-led-type="communication"] {
                animation: led-glow-fast 0.5s infinite ease-in-out;
                animation-play-state: paused;
            }
            
            .led-glow[data-led-type="communication"].active {
                animation-play-state: running;
            }
            
            @keyframes led-glow-pulse {
                0%, 100% { opacity: 0.2; }
                50% { opacity: 0.6; }
            }
            
            @keyframes led-glow-flash {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 0; }
            }
            
            @keyframes led-glow-slow {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.1; }
            }
            
            @keyframes led-glow-fast {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 0.1; }
            }
        `;
        
        // Add style to document if not already present
        if (!document.getElementById('led-animations')) {
            style.id = 'led-animations';
            document.head.appendChild(style);
        }
        
        // Create gradient definitions
        this.createGradientDefinitions();
    }
    
    // Create SVG gradient definitions for modern design
    createGradientDefinitions() {
        // Wait for next tick to ensure canvas is initialized
        setTimeout(() => {
            if (!this.canvas || !this.canvas.svg) {
                console.warn('Canvas not initialized yet, skipping gradient creation');
                return;
            }
            
            // Check if defs already exists
            let defs = this.canvas.svg.querySelector('defs');
            if (!defs) {
                defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                this.canvas.svg.appendChild(defs);
            }
        
        // Define gradients for components
        const gradients = [
            // Board gradient (blue PCB)
            {
                id: 'boardGradient',
                type: 'linear',
                stops: [
                    { offset: '0%', color: '#1e3a8a', opacity: '1' },
                    { offset: '50%', color: '#1e40af', opacity: '1' },
                    { offset: '100%', color: '#1d4ed8', opacity: '1' }
                ]
            },
            // Metal housing gradient
            {
                id: 'metalGradient',
                type: 'linear',
                stops: [
                    { offset: '0%', color: '#e5e7eb', opacity: '1' },
                    { offset: '50%', color: '#f3f4f6', opacity: '1' },
                    { offset: '100%', color: '#d1d5db', opacity: '1' }
                ]
            },
            // Dark housing gradient
            {
                id: 'darkHousingGradient',
                type: 'linear',
                stops: [
                    { offset: '0%', color: '#374151', opacity: '1' },
                    { offset: '50%', color: '#4b5563', opacity: '1' },
                    { offset: '100%', color: '#1f2937', opacity: '1' }
                ]
            },
            // Screen gradient (LCD effect)
            {
                id: 'screenGradient',
                type: 'linear',
                stops: [
                    { offset: '0%', color: '#10b981', opacity: '1' },
                    { offset: '50%', color: '#34d399', opacity: '1' },
                    { offset: '100%', color: '#059669', opacity: '1' }
                ]
            },
            // Red button gradient
            {
                id: 'redButtonGradient',
                type: 'radial',
                stops: [
                    { offset: '0%', color: '#ef4444', opacity: '1' },
                    { offset: '70%', color: '#dc2626', opacity: '1' },
                    { offset: '100%', color: '#b91c1c', opacity: '1' }
                ]
            },
            // Power supply gradient
            {
                id: 'powerSupplyGradient',
                type: 'linear',
                stops: [
                    { offset: '0%', color: '#6b7280', opacity: '1' },
                    { offset: '50%', color: '#9ca3af', opacity: '1' },
                    { offset: '100%', color: '#4b5563', opacity: '1' }
                ]
            }
        ];
        
        gradients.forEach(gradientDef => {
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 
                gradientDef.type === 'radial' ? 'radialGradient' : 'linearGradient');
            gradient.setAttribute('id', gradientDef.id);
            
            if (gradientDef.type === 'linear') {
                gradient.setAttribute('x1', '0%');
                gradient.setAttribute('y1', '0%');
                gradient.setAttribute('x2', '0%');
                gradient.setAttribute('y2', '100%');
            }
            
            gradientDef.stops.forEach(stop => {
                const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopElement.setAttribute('offset', stop.offset);
                stopElement.setAttribute('stop-color', stop.color);
                if (stop.opacity) {
                    stopElement.setAttribute('stop-opacity', stop.opacity);
                }
                gradient.appendChild(stopElement);
            });
            
            defs.appendChild(gradient);
        });
        
        // Add shadow filters
        const shadowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        shadowFilter.setAttribute('id', 'componentShadow');
        shadowFilter.innerHTML = `
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="2" dy="2" result="offsetblur"/>
            <feFlood flood-color="#000000" flood-opacity="0.2"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        `;
        defs.appendChild(shadowFilter);
        
        // Add inner shadow filter
        const innerShadowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        innerShadowFilter.setAttribute('id', 'innerShadow');
        innerShadowFilter.innerHTML = `
            <feOffset dx="0" dy="1" />
            <feGaussianBlur stdDeviation="1" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood flood-color="black" flood-opacity="0.3" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        `;
        defs.appendChild(innerShadowFilter);
        }, 0); // End of setTimeout
    }
    
    // Default graphics for unknown types
    createDefaultGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '20');
        rect.setAttribute('y', '20');
        rect.setAttribute('width', dimensions.width - 40);
        rect.setAttribute('height', dimensions.height - 50);
        rect.setAttribute('fill', '#95a5a6');
        rect.setAttribute('stroke', '#7f8c8d');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '5');
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', dimensions.width / 2);
        text.setAttribute('y', dimensions.height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '16');
        text.setAttribute('fill', '#2c3e50');
        text.textContent = 'COMPONENT';
        
        group.appendChild(rect);
        group.appendChild(text);
        
        return group;
    }

    addTerminals(group, type, dimensions) {
        const terminals = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        terminals.setAttribute('class', 'terminals');
        
        // Give every component 4 standard terminals - one on each side
        // Top terminal
        this.createTerminal(terminals, dimensions.width / 2, 0, 'universal', '1');
        
        // Right terminal
        this.createTerminal(terminals, dimensions.width, dimensions.height / 2, 'universal', '2');
        
        // Bottom terminal
        this.createTerminal(terminals, dimensions.width / 2, dimensions.height, 'universal', '3');
        
        // Left terminal
        this.createTerminal(terminals, 0, dimensions.height / 2, 'universal', '4');
        
        group.appendChild(terminals);
    }

    createTerminal(parent, x, y, type, label) {
        const terminal = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        terminal.setAttribute('cx', x);
        terminal.setAttribute('cy', y);
        terminal.setAttribute('r', '6');
        terminal.setAttribute('fill', '#666');
        terminal.setAttribute('stroke', '#333');
        terminal.setAttribute('stroke-width', '2');
        terminal.setAttribute('class', `terminal terminal-${type}`);
        terminal.dataset.terminalType = type;
        terminal.dataset.terminalLabel = label;
        
        // CSS handles hover effects now
        
        parent.appendChild(terminal);
    }

    makeDraggable(element) {
        const dragHandle = element.querySelector('.component-drag-handle') || element;
        
        // Create drag helper instance
        const dragHelper = new DragHelper(element, {
            handle: dragHandle,
            snapToGrid: true,
            gridSize: this.canvas.gridSize,
            
            onStart: (e, pos) => {
                // Only allow dragging in select mode
                if (this.canvas.mode !== 'select') {
                    console.log('Not in select mode, canceling drag');
                    dragHelper.handleMouseUp(e);
                    return;
                }
                
                // Don't drag if clicking on terminal
                if (e.target.classList.contains('terminal')) {
                    console.log('Clicking on terminal, canceling drag');
                    dragHelper.handleMouseUp(e);
                    return;
                }
                
                console.log('Starting drag for:', element.id);
                this.canvas.selectElement(element);
            },
            
            onMove: (e, pos) => {
                // Update spatial index during drag
                this.canvas.updateElementPosition(element);
                
                // Update connected wires
                this.updateConnectedWires(element);
            },
            
            onEnd: (e, pos) => {
                console.log('Drag ended at:', pos);
                
                // Update state store
                this.stateStore.updateElement(element.id, {
                    x: pos.x,
                    y: pos.y
                });
                
                // Final spatial index update
                this.canvas.updateElementPosition(element);
                
                // Emit component-moved event for auto-routing
                const event = new CustomEvent('component-moved', {
                    detail: {
                        componentId: element.id,
                        newPosition: pos
                    }
                });
                document.dispatchEvent(event);
            }
        });
        
        // Store drag helper for cleanup
        element._dragHelper = dragHelper;
    }

    updateConnectedWires(element) {
        // TODO: Update any wires connected to this element
    }
    
    addTerminalToComponent(component, x, y) {
        const terminals = component.querySelector('.terminals');
        if (!terminals) return;
        
        // Get component dimensions
        const rect = component.querySelector('rect');
        const width = parseFloat(rect.getAttribute('width'));
        const height = parseFloat(rect.getAttribute('height'));
        
        // Calculate relative position
        const relX = Math.max(0, Math.min(width, x));
        const relY = Math.max(0, Math.min(height, y));
        
        // Create new terminal
        const terminalCount = terminals.querySelectorAll('.terminal').length + 1;
        this.createTerminal(terminals, relX, relY, 'universal', terminalCount.toString());
        
        // Update state
        const componentId = component.id;
        const element = this.stateStore.state.project.elements.find(el => el.id === componentId);
        if (element) {
            if (!element.additionalTerminals) {
                element.additionalTerminals = [];
            }
            element.additionalTerminals.push({ x: relX, y: relY, label: terminalCount.toString() });
            this.stateStore.saveToLocalStorage();
        }
    }
    
    // Create element from component template
    createFromTemplate(template, x, y, instanceConfig = {}) {
        const instance = template.createInstance(instanceConfig);
        instance.position = { x, y };
        
        // Create group for component
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('id', instance.id);
        group.setAttribute('class', `component ${template.type.toLowerCase()}`);
        group.setAttribute('transform', `translate(${x}, ${y})`);
        group.dataset.type = template.type;
        group.dataset.templateId = template.id;
        
        // Create background rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', instance.dimensions.width);
        rect.setAttribute('height', instance.dimensions.height);
        rect.setAttribute('fill', instance.appearance.backgroundColor);
        rect.setAttribute('stroke', instance.appearance.borderColor);
        rect.setAttribute('stroke-width', instance.appearance.borderWidth);
        rect.setAttribute('rx', instance.appearance.borderRadius);
        
        // Create visual representation
        if (instance.appearance.iconPath) {
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttribute('href', instance.appearance.iconPath);
            image.setAttribute('x', '10');
            image.setAttribute('y', '10');
            image.setAttribute('width', instance.dimensions.width - 20);
            image.setAttribute('height', instance.dimensions.height - 40);
            image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            group.appendChild(image);
        }
        
        // Create label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', instance.dimensions.width / 2);
        label.setAttribute('y', instance.dimensions.height - 10);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '14');
        label.setAttribute('font-weight', 'bold');
        label.textContent = instance.name;
        
        // Add terminals from template
        this.addTemplateTerminals(group, template, instance.dimensions);
        
        // Assemble component
        group.appendChild(rect);
        group.appendChild(label);
        
        // Make draggable
        this.makeDraggable(group);
        
        // Add to canvas
        this.canvas.addComponent(group);
        
        // Save to state
        this.stateStore.addElement({
            id: instance.id,
            type: template.type,
            templateId: template.id,
            x,
            y,
            config: instanceConfig,
            properties: instance.properties,
            metadata: instance.metadata
        });
        
        // Track usage
        template.metadata.trackUsage();
        
        return group;
    }
    
    // Add terminals from template definition
    addTemplateTerminals(group, template, dimensions) {
        const terminals = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        terminals.setAttribute('class', 'terminals');
        
        template.terminals.forEach((terminal, index) => {
            const pos = this.getTerminalPosition(terminal, dimensions);
            this.createTerminal(
                terminals, 
                pos.x, 
                pos.y, 
                terminal.type, 
                terminal.label || terminal.id
            );
        });
        
        group.appendChild(terminals);
    }
    
    // Get terminal position based on template definition
    getTerminalPosition(terminal, dimensions) {
        const positions = {
            'top': { x: dimensions.width / 2, y: 0 },
            'bottom': { x: dimensions.width / 2, y: dimensions.height },
            'left': { x: 0, y: dimensions.height / 2 },
            'right': { x: dimensions.width, y: dimensions.height / 2 },
            'top-left': { x: 0, y: 0 },
            'top-right': { x: dimensions.width, y: 0 },
            'bottom-left': { x: 0, y: dimensions.height },
            'bottom-right': { x: dimensions.width, y: dimensions.height }
        };
        
        return positions[terminal.position] || { 
            x: terminal.x || 0, 
            y: terminal.y || 0 
        };
    }
}