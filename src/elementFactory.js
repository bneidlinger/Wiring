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
            READER: { width: 100, height: 150 },
            WOR: { width: 120, height: 100 },
            RM4: { width: 250, height: 100 },
            PSU: { width: 200, height: 200 },
            PAM: { width: 100, height: 100 },
            STRIKE: { width: 80, height: 120 },
            REX: { width: 80, height: 80 }
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
            }
        };
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
        rect.setAttribute('fill', 'rgba(248, 249, 250, 0.01)'); // Nearly transparent but still captures events
        rect.setAttribute('stroke', '#495057');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '5');
        rect.setAttribute('class', 'component-drag-handle');
        
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
        
        // Add terminal points
        this.addTerminals(group, type, dimensions);
        
        // Assemble component - put graphics first, then label, then rect on top for dragging
        group.appendChild(componentGraphics);
        group.appendChild(label);
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
            default:
                return this.createDefaultGraphics(dimensions);
        }
    }
    
    // ACM (Access Control Module)
    createACMGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Main board
        const board = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        board.setAttribute('x', '20');
        board.setAttribute('y', '20');
        board.setAttribute('width', dimensions.width - 40);
        board.setAttribute('height', dimensions.height - 50);
        board.setAttribute('fill', '#2c3e50');
        board.setAttribute('stroke', '#34495e');
        board.setAttribute('stroke-width', '2');
        board.setAttribute('rx', '3');
        
        // CPU chip
        const cpu = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cpu.setAttribute('x', dimensions.width / 2 - 30);
        cpu.setAttribute('y', '40');
        cpu.setAttribute('width', '60');
        cpu.setAttribute('height', '60');
        cpu.setAttribute('fill', '#34495e');
        cpu.setAttribute('stroke', '#1a252f');
        cpu.setAttribute('stroke-width', '1');
        
        // LED indicators
        const ledColors = ['#2ecc71', '#e74c3c', '#f39c12', '#3498db'];
        for (let i = 0; i < 4; i++) {
            const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            led.setAttribute('cx', 40 + i * 20);
            led.setAttribute('cy', dimensions.height - 35);
            led.setAttribute('r', '4');
            led.setAttribute('fill', ledColors[i]);
            led.setAttribute('opacity', '0.8');
        }
        
        // Terminal blocks representation
        const leftTerminals = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leftTerminals.setAttribute('x', '30');
        leftTerminals.setAttribute('y', '30');
        leftTerminals.setAttribute('width', '15');
        leftTerminals.setAttribute('height', dimensions.height - 70);
        leftTerminals.setAttribute('fill', '#7f8c8d');
        leftTerminals.setAttribute('stroke', '#34495e');
        leftTerminals.setAttribute('stroke-width', '1');
        
        const rightTerminals = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rightTerminals.setAttribute('x', dimensions.width - 45);
        rightTerminals.setAttribute('y', '30');
        rightTerminals.setAttribute('width', '15');
        rightTerminals.setAttribute('height', dimensions.height - 70);
        rightTerminals.setAttribute('fill', '#7f8c8d');
        rightTerminals.setAttribute('stroke', '#34495e');
        rightTerminals.setAttribute('stroke-width', '1');
        
        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height / 2 + 20);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '16');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('fill', '#ecf0f1');
        label.textContent = 'ACCESS CONTROL';
        
        group.appendChild(board);
        group.appendChild(leftTerminals);
        group.appendChild(rightTerminals);
        group.appendChild(cpu);
        group.appendChild(label);
        
        // Add LED indicators
        for (let i = 0; i < 4; i++) {
            const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            led.setAttribute('cx', 40 + i * 20);
            led.setAttribute('cy', dimensions.height - 35);
            led.setAttribute('r', '4');
            led.setAttribute('fill', ledColors[i]);
            led.setAttribute('opacity', '0.8');
            group.appendChild(led);
        }
        
        return group;
    }
    
    // iSTAR G2 Controller
    createISTARGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Main housing
        const housing = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housing.setAttribute('x', '15');
        housing.setAttribute('y', '15');
        housing.setAttribute('width', dimensions.width - 30);
        housing.setAttribute('height', dimensions.height - 40);
        housing.setAttribute('fill', '#34495e');
        housing.setAttribute('stroke', '#2c3e50');
        housing.setAttribute('stroke-width', '2');
        housing.setAttribute('rx', '5');
        
        // Display screen
        const screen = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        screen.setAttribute('x', dimensions.width / 2 - 60);
        screen.setAttribute('y', '30');
        screen.setAttribute('width', '120');
        screen.setAttribute('height', '60');
        screen.setAttribute('fill', '#1abc9c');
        screen.setAttribute('stroke', '#16a085');
        screen.setAttribute('stroke-width', '2');
        screen.setAttribute('rx', '2');
        
        // Screen text
        const screenText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        screenText.setAttribute('x', dimensions.width / 2);
        screenText.setAttribute('y', '65');
        screenText.setAttribute('text-anchor', 'middle');
        screenText.setAttribute('font-size', '14');
        screenText.setAttribute('font-family', 'monospace');
        screenText.setAttribute('fill', '#2c3e50');
        screenText.textContent = 'iSTAR G2';
        
        // Status LEDs
        for (let i = 0; i < 6; i++) {
            const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            led.setAttribute('cx', 40 + i * 25);
            led.setAttribute('cy', dimensions.height - 60);
            led.setAttribute('r', '3');
            led.setAttribute('fill', i < 3 ? '#2ecc71' : '#e74c3c');
            led.setAttribute('opacity', '0.7');
            group.appendChild(led);
        }
        
        // Network ports
        for (let i = 0; i < 2; i++) {
            const port = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            port.setAttribute('x', dimensions.width - 60 - i * 30);
            port.setAttribute('y', dimensions.height - 50);
            port.setAttribute('width', '20');
            port.setAttribute('height', '15');
            port.setAttribute('fill', '#7f8c8d');
            port.setAttribute('stroke', '#34495e');
            port.setAttribute('stroke-width', '1');
            group.appendChild(port);
        }
        
        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 30);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '12');
        label.setAttribute('fill', '#ecf0f1');
        label.textContent = 'CONTROLLER';
        
        group.appendChild(housing);
        group.appendChild(screen);
        group.appendChild(screenText);
        group.appendChild(label);
        
        return group;
    }
    
    // Output Module
    createOutputModuleGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Main board
        const board = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        board.setAttribute('x', '15');
        board.setAttribute('y', '15');
        board.setAttribute('width', dimensions.width - 30);
        board.setAttribute('height', dimensions.height - 40);
        board.setAttribute('fill', '#2c3e50');
        board.setAttribute('stroke', '#34495e');
        board.setAttribute('stroke-width', '2');
        board.setAttribute('rx', '3');
        
        // Relay blocks
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 2; j++) {
                const relay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                relay.setAttribute('x', 40 + i * 60);
                relay.setAttribute('y', 30 + j * 40);
                relay.setAttribute('width', '40');
                relay.setAttribute('height', '30');
                relay.setAttribute('fill', '#34495e');
                relay.setAttribute('stroke', '#1a252f');
                relay.setAttribute('stroke-width', '1');
                relay.setAttribute('rx', '2');
                group.appendChild(relay);
                
                // Relay label
                const relayLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                relayLabel.setAttribute('x', 60 + i * 60);
                relayLabel.setAttribute('y', 50 + j * 40);
                relayLabel.setAttribute('text-anchor', 'middle');
                relayLabel.setAttribute('font-size', '10');
                relayLabel.setAttribute('fill', '#ecf0f1');
                relayLabel.textContent = `R${i * 2 + j + 1}`;
                group.appendChild(relayLabel);
            }
        }
        
        // Status LEDs
        for (let i = 0; i < 8; i++) {
            const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            led.setAttribute('cx', 40 + i * 30);
            led.setAttribute('cy', dimensions.height - 30);
            led.setAttribute('r', '3');
            led.setAttribute('fill', '#e74c3c');
            led.setAttribute('opacity', '0.6');
            group.appendChild(led);
        }
        
        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 45);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '12');
        label.setAttribute('fill', '#ecf0f1');
        label.textContent = 'OUTPUT MODULE';
        
        group.appendChild(board);
        group.appendChild(label);
        
        return group;
    }
    
    // Card Reader
    createCardReaderGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Reader body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', '20');
        body.setAttribute('y', '15');
        body.setAttribute('width', dimensions.width - 40);
        body.setAttribute('height', dimensions.height - 40);
        body.setAttribute('fill', '#34495e');
        body.setAttribute('stroke', '#2c3e50');
        body.setAttribute('stroke-width', '2');
        body.setAttribute('rx', '8');
        
        // Card slot
        const slot = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        slot.setAttribute('x', dimensions.width / 2 - 25);
        slot.setAttribute('y', '40');
        slot.setAttribute('width', '50');
        slot.setAttribute('height', '5');
        slot.setAttribute('fill', '#1a252f');
        slot.setAttribute('rx', '2');
        
        // LED indicator
        const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        led.setAttribute('cx', dimensions.width / 2);
        led.setAttribute('cy', '60');
        led.setAttribute('r', '5');
        led.setAttribute('fill', '#e74c3c');
        led.setAttribute('opacity', '0.8');
        
        // Keypad representation
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                const key = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                key.setAttribute('x', dimensions.width / 2 - 25 + i * 18);
                key.setAttribute('y', 75 + j * 18);
                key.setAttribute('width', '14');
                key.setAttribute('height', '14');
                key.setAttribute('fill', '#7f8c8d');
                key.setAttribute('stroke', '#34495e');
                key.setAttribute('stroke-width', '1');
                key.setAttribute('rx', '2');
                group.appendChild(key);
            }
        }
        
        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', '30');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '11');
        label.setAttribute('fill', '#ecf0f1');
        label.textContent = 'READER';
        
        group.appendChild(body);
        group.appendChild(slot);
        group.appendChild(led);
        group.appendChild(label);
        
        return group;
    }
    
    // WOR Reader (Wireless)
    createWORReaderGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Reader body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', '15');
        body.setAttribute('y', '15');
        body.setAttribute('width', dimensions.width - 30);
        body.setAttribute('height', dimensions.height - 30);
        body.setAttribute('fill', '#34495e');
        body.setAttribute('stroke', '#2c3e50');
        body.setAttribute('stroke-width', '2');
        body.setAttribute('rx', '10');
        
        // Antenna symbol
        const antenna1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        antenna1.setAttribute('d', `M${dimensions.width / 2 - 15} 30 Q${dimensions.width / 2} 20 ${dimensions.width / 2 + 15} 30`);
        antenna1.setAttribute('fill', 'none');
        antenna1.setAttribute('stroke', '#3498db');
        antenna1.setAttribute('stroke-width', '2');
        
        const antenna2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        antenna2.setAttribute('d', `M${dimensions.width / 2 - 20} 35 Q${dimensions.width / 2} 25 ${dimensions.width / 2 + 20} 35`);
        antenna2.setAttribute('fill', 'none');
        antenna2.setAttribute('stroke', '#3498db');
        antenna2.setAttribute('stroke-width', '2');
        antenna2.setAttribute('opacity', '0.6');
        
        // Card symbol
        const card = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        card.setAttribute('x', dimensions.width / 2 - 20);
        card.setAttribute('y', dimensions.height / 2 - 10);
        card.setAttribute('width', '40');
        card.setAttribute('height', '25');
        card.setAttribute('fill', '#ecf0f1');
        card.setAttribute('stroke', '#bdc3c7');
        card.setAttribute('stroke-width', '1');
        card.setAttribute('rx', '3');
        
        // LED indicator
        const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        led.setAttribute('cx', dimensions.width / 2);
        led.setAttribute('cy', dimensions.height - 25);
        led.setAttribute('r', '4');
        led.setAttribute('fill', '#2ecc71');
        led.setAttribute('opacity', '0.8');
        
        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 35);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '10');
        label.setAttribute('fill', '#ecf0f1');
        label.textContent = 'WIRELESS';
        
        group.appendChild(body);
        group.appendChild(antenna1);
        group.appendChild(antenna2);
        group.appendChild(card);
        group.appendChild(led);
        group.appendChild(label);
        
        return group;
    }
    
    // RM-4 Module
    createRM4Graphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Main board
        const board = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        board.setAttribute('x', '15');
        board.setAttribute('y', '15');
        board.setAttribute('width', dimensions.width - 30);
        board.setAttribute('height', dimensions.height - 30);
        board.setAttribute('fill', '#2c3e50');
        board.setAttribute('stroke', '#34495e');
        board.setAttribute('stroke-width', '2');
        board.setAttribute('rx', '3');
        
        // Reader ports
        for (let i = 0; i < 4; i++) {
            const port = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            port.setAttribute('x', 40 + i * 50);
            port.setAttribute('y', '30');
            port.setAttribute('width', '35');
            port.setAttribute('height', '40');
            port.setAttribute('fill', '#34495e');
            port.setAttribute('stroke', '#1a252f');
            port.setAttribute('stroke-width', '1');
            port.setAttribute('rx', '2');
            group.appendChild(port);
            
            // Port label
            const portLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            portLabel.setAttribute('x', 57.5 + i * 50);
            portLabel.setAttribute('y', '55');
            portLabel.setAttribute('text-anchor', 'middle');
            portLabel.setAttribute('font-size', '12');
            portLabel.setAttribute('fill', '#ecf0f1');
            portLabel.textContent = `R${i + 1}`;
            group.appendChild(portLabel);
        }
        
        // Status LEDs
        for (let i = 0; i < 4; i++) {
            const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            led.setAttribute('cx', 57.5 + i * 50);
            led.setAttribute('cy', dimensions.height - 25);
            led.setAttribute('r', '3');
            led.setAttribute('fill', '#e74c3c');
            led.setAttribute('opacity', '0.6');
            group.appendChild(led);
        }
        
        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 35);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '12');
        label.setAttribute('fill', '#ecf0f1');
        label.textContent = 'RM-4 MODULE';
        
        group.appendChild(board);
        group.appendChild(label);
        
        return group;
    }
    
    // Power Supply
    createPowerSupplyGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Metal housing
        const housing = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housing.setAttribute('x', '15');
        housing.setAttribute('y', '15');
        housing.setAttribute('width', dimensions.width - 30);
        housing.setAttribute('height', dimensions.height - 30);
        housing.setAttribute('fill', '#7f8c8d');
        housing.setAttribute('stroke', '#34495e');
        housing.setAttribute('stroke-width', '2');
        housing.setAttribute('rx', '3');
        
        // Ventilation grilles
        for (let i = 0; i < 5; i++) {
            const grille = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            grille.setAttribute('x', '30');
            grille.setAttribute('y', 30 + i * 15);
            grille.setAttribute('width', dimensions.width - 60);
            grille.setAttribute('height', '8');
            grille.setAttribute('fill', '#34495e');
            grille.setAttribute('rx', '1');
            group.appendChild(grille);
        }
        
        // AC input terminals
        const acInput = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        acInput.setAttribute('x', '25');
        acInput.setAttribute('y', dimensions.height - 60);
        acInput.setAttribute('width', '40');
        acInput.setAttribute('height', '30');
        acInput.setAttribute('fill', '#2c3e50');
        acInput.setAttribute('stroke', '#1a252f');
        acInput.setAttribute('stroke-width', '1');
        
        // DC output terminals
        const dcOutput = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        dcOutput.setAttribute('x', dimensions.width - 65);
        dcOutput.setAttribute('y', dimensions.height - 60);
        dcOutput.setAttribute('width', '40');
        dcOutput.setAttribute('height', '30');
        dcOutput.setAttribute('fill', '#e74c3c');
        dcOutput.setAttribute('stroke', '#c0392b');
        dcOutput.setAttribute('stroke-width', '1');
        
        // Power LED
        const powerLed = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        powerLed.setAttribute('cx', dimensions.width / 2);
        powerLed.setAttribute('cy', dimensions.height - 45);
        powerLed.setAttribute('r', '5');
        powerLed.setAttribute('fill', '#2ecc71');
        powerLed.setAttribute('opacity', '0.8');
        
        // Labels
        const acLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        acLabel.setAttribute('x', '45');
        acLabel.setAttribute('y', dimensions.height - 65);
        acLabel.setAttribute('text-anchor', 'middle');
        acLabel.setAttribute('font-size', '10');
        acLabel.setAttribute('fill', '#ecf0f1');
        acLabel.textContent = 'AC';
        
        const dcLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dcLabel.setAttribute('x', dimensions.width - 45);
        dcLabel.setAttribute('y', dimensions.height - 65);
        dcLabel.setAttribute('text-anchor', 'middle');
        dcLabel.setAttribute('font-size', '10');
        dcLabel.setAttribute('fill', '#ecf0f1');
        dcLabel.textContent = 'DC';
        
        const mainLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        mainLabel.setAttribute('x', dimensions.width / 2);
        mainLabel.setAttribute('y', '130');
        mainLabel.setAttribute('text-anchor', 'middle');
        mainLabel.setAttribute('font-size', '14');
        mainLabel.setAttribute('font-weight', 'bold');
        mainLabel.setAttribute('fill', '#2c3e50');
        mainLabel.textContent = 'POWER SUPPLY';
        
        group.appendChild(housing);
        group.appendChild(acInput);
        group.appendChild(dcOutput);
        group.appendChild(powerLed);
        group.appendChild(acLabel);
        group.appendChild(dcLabel);
        group.appendChild(mainLabel);
        
        return group;
    }
    
    // PAM Relay
    createPAMRelayGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Relay housing
        const housing = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housing.setAttribute('x', '15');
        housing.setAttribute('y', '15');
        housing.setAttribute('width', dimensions.width - 30);
        housing.setAttribute('height', dimensions.height - 30);
        housing.setAttribute('fill', '#34495e');
        housing.setAttribute('stroke', '#2c3e50');
        housing.setAttribute('stroke-width', '2');
        housing.setAttribute('rx', '5');
        
        // Relay coil symbol
        const coil = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        coil.setAttribute('x', dimensions.width / 2 - 20);
        coil.setAttribute('y', '30');
        coil.setAttribute('width', '40');
        coil.setAttribute('height', '20');
        coil.setAttribute('fill', 'none');
        coil.setAttribute('stroke', '#e74c3c');
        coil.setAttribute('stroke-width', '2');
        coil.setAttribute('rx', '10');
        
        // Contact points
        const contact1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        contact1.setAttribute('cx', dimensions.width / 2 - 15);
        contact1.setAttribute('cy', '60');
        contact1.setAttribute('r', '4');
        contact1.setAttribute('fill', '#f39c12');
        
        const contact2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        contact2.setAttribute('cx', dimensions.width / 2 + 15);
        contact2.setAttribute('cy', '60');
        contact2.setAttribute('r', '4');
        contact2.setAttribute('fill', '#f39c12');
        
        // Switch arm
        const switchArm = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        switchArm.setAttribute('x1', dimensions.width / 2 - 15);
        switchArm.setAttribute('y1', '60');
        switchArm.setAttribute('x2', dimensions.width / 2 + 10);
        switchArm.setAttribute('y2', '55');
        switchArm.setAttribute('stroke', '#ecf0f1');
        switchArm.setAttribute('stroke-width', '3');
        switchArm.setAttribute('stroke-linecap', 'round');
        
        // LED indicator
        const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        led.setAttribute('cx', dimensions.width / 2);
        led.setAttribute('cy', dimensions.height - 25);
        led.setAttribute('r', '4');
        led.setAttribute('fill', '#e74c3c');
        led.setAttribute('opacity', '0.7');
        
        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 35);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '11');
        label.setAttribute('fill', '#ecf0f1');
        label.textContent = 'PAM RELAY';
        
        group.appendChild(housing);
        group.appendChild(coil);
        group.appendChild(contact1);
        group.appendChild(contact2);
        group.appendChild(switchArm);
        group.appendChild(led);
        group.appendChild(label);
        
        return group;
    }
    
    // Strike (Door Strike)
    createStrikeGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Strike body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', '20');
        body.setAttribute('y', '10');
        body.setAttribute('width', dimensions.width - 40);
        body.setAttribute('height', dimensions.height - 30);
        body.setAttribute('fill', '#7f8c8d');
        body.setAttribute('stroke', '#34495e');
        body.setAttribute('stroke-width', '2');
        body.setAttribute('rx', '3');
        
        // Strike plate
        const plate = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        plate.setAttribute('x', '30');
        plate.setAttribute('y', '20');
        plate.setAttribute('width', dimensions.width - 60);
        plate.setAttribute('height', dimensions.height - 50);
        plate.setAttribute('fill', '#95a5a6');
        plate.setAttribute('stroke', '#7f8c8d');
        plate.setAttribute('stroke-width', '1');
        
        // Latch cavity
        const cavity = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cavity.setAttribute('x', dimensions.width / 2 - 10);
        cavity.setAttribute('y', dimensions.height / 2 - 20);
        cavity.setAttribute('width', '20');
        cavity.setAttribute('height', '40');
        cavity.setAttribute('fill', '#2c3e50');
        cavity.setAttribute('rx', '2');
        
        // Mounting holes
        const hole1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hole1.setAttribute('cx', dimensions.width / 2);
        hole1.setAttribute('cy', '30');
        hole1.setAttribute('r', '3');
        hole1.setAttribute('fill', '#34495e');
        
        const hole2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hole2.setAttribute('cx', dimensions.width / 2);
        hole2.setAttribute('cy', dimensions.height - 30);
        hole2.setAttribute('r', '3');
        hole2.setAttribute('fill', '#34495e');
        
        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 10);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '10');
        label.setAttribute('fill', '#2c3e50');
        label.textContent = 'STRIKE';
        
        group.appendChild(body);
        group.appendChild(plate);
        group.appendChild(cavity);
        group.appendChild(hole1);
        group.appendChild(hole2);
        group.appendChild(label);
        
        return group;
    }
    
    // REX Button (Request to Exit)
    createREXButtonGraphics(dimensions) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Button housing
        const housing = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housing.setAttribute('x', '15');
        housing.setAttribute('y', '15');
        housing.setAttribute('width', dimensions.width - 30);
        housing.setAttribute('height', dimensions.height - 30);
        housing.setAttribute('fill', '#95a5a6');
        housing.setAttribute('stroke', '#7f8c8d');
        housing.setAttribute('stroke-width', '2');
        housing.setAttribute('rx', '5');
        
        // Button outer ring
        const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        outerRing.setAttribute('cx', dimensions.width / 2);
        outerRing.setAttribute('cy', dimensions.height / 2 - 5);
        outerRing.setAttribute('r', '25');
        outerRing.setAttribute('fill', '#e74c3c');
        outerRing.setAttribute('stroke', '#c0392b');
        outerRing.setAttribute('stroke-width', '2');
        
        // Button center
        const buttonCenter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        buttonCenter.setAttribute('cx', dimensions.width / 2);
        buttonCenter.setAttribute('cy', dimensions.height / 2 - 5);
        buttonCenter.setAttribute('r', '18');
        buttonCenter.setAttribute('fill', '#c0392b');
        
        // EXIT text
        const exitText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        exitText.setAttribute('x', dimensions.width / 2);
        exitText.setAttribute('y', dimensions.height / 2);
        exitText.setAttribute('text-anchor', 'middle');
        exitText.setAttribute('font-size', '12');
        exitText.setAttribute('font-weight', 'bold');
        exitText.setAttribute('fill', '#ffffff');
        exitText.textContent = 'EXIT';
        
        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', dimensions.width / 2);
        label.setAttribute('y', dimensions.height - 10);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '9');
        label.setAttribute('fill', '#2c3e50');
        label.textContent = 'REX';
        
        group.appendChild(housing);
        group.appendChild(outerRing);
        group.appendChild(buttonCenter);
        group.appendChild(exitText);
        group.appendChild(label);
        
        return group;
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
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        const rect = element.querySelector('.component-drag-handle');
        const dragHandle = rect || element.querySelector('rect') || element;
        
        // Ensure cursor is set
        if (dragHandle) {
            dragHandle.style.cursor = 'move';
        }
        
        const handleMouseDown = (e) => {
            if (this.canvas.mode !== 'select') return;
            
            isDragging = true;
            
            // Disable pan while dragging
            if (this.panZoomInstance) {
                this.panZoomInstance.disablePan();
            }
            
            const transform = element.transform.baseVal.getItem(0);
            initialX = transform.matrix.e;
            initialY = transform.matrix.f;
            
            const mousePos = this.canvas.getMousePosition(e);
            startX = mousePos.x;
            startY = mousePos.y;
            
            this.canvas.selectElement(element);
            e.stopPropagation();
            e.preventDefault();
        };
        
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const mousePos = this.canvas.getMousePosition(e);
            const dx = mousePos.x - startX;
            const dy = mousePos.y - startY;
            
            const newX = this.canvas.snapToGrid(initialX + dx);
            const newY = this.canvas.snapToGrid(initialY + dy);
            
            element.setAttribute('transform', `translate(${newX}, ${newY})`);
            
            // Update connected wires
            this.updateConnectedWires(element);
            e.preventDefault();
        };
        
        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                
                // Re-enable pan
                if (this.panZoomInstance) {
                    this.panZoomInstance.enablePan();
                }
                
                // Update state
                const transform = element.transform.baseVal.getItem(0);
                const newX = transform.matrix.e;
                const newY = transform.matrix.f;
                
                this.stateStore.updateElement(element.id, {
                    x: newX,
                    y: newY
                });
                
                // Emit component-moved event for auto-routing
                const event = new CustomEvent('component-moved', {
                    detail: {
                        componentId: element.id,
                        newPosition: { x: newX, y: newY }
                    }
                });
                document.dispatchEvent(event);
            }
        };
        
        dragHandle.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
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