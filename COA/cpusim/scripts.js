document.addEventListener('DOMContentLoaded', function() {
   // Initialize the CPU simulator
   const cpuSimulator = {
       // CPU registers
       registers: {
           pc: 0, // Program Counter
           ir: '00000000', // Instruction Register
           acc: 0, // Accumulator
           r1: 0, // General Purpose Register 1
           r2: 0, // General Purpose Register 2
           r3: 0, // General Purpose Register 3
       },

       // CPU state
       state: {
           running: false,
           halted: false,
           currentPhase: 'fetch', // fetch, decode, execute
           speed: 5, // 1-10 scale
           instructions: [],
           memory: Array(64).fill(0),
           memoryMap: {}, // Maps instruction line to memory address
       },

       // DOM elements
       elements: {
           pcValue: document.getElementById('pc-value'),
           irValue: document.getElementById('ir-value'),
           accValue: document.getElementById('acc-value'),
           r1Value: document.getElementById('r1-value'),
           r2Value: document.getElementById('r2-value'),
           r3Value: document.getElementById('r3-value'),
           fetchPhase: document.getElementById('fetch-phase'),
           decodePhase: document.getElementById('decode-phase'),
           executePhase: document.getElementById('execute-phase'),
           controlUnitLog: document.getElementById('control-unit-log'),
           memoryCells: document.getElementById('memory-cells'),
           programInput: document.getElementById('program-input'),
           consoleOutput: document.getElementById('console-output'),
           loadBtn: document.getElementById('load-btn'),
           stepBtn: document.getElementById('step-btn'),
           runBtn: document.getElementById('run-btn'),
           resetBtn: document.getElementById('reset-btn'),
           clearConsoleBtn: document.getElementById('clear-console'),
           speedControl: document.getElementById('speed-control'),
           speedValue: document.getElementById('speed-value'),
       },

       // Initialize the simulator
       init: function() {
           this.generateMemoryCells();
           this.updateRegistersDisplay();
           this.updatePhaseDisplay();
           this.setupEventListeners();
           this.setupSpeedControl();
       },

       // Generate memory cells in the UI
       generateMemoryCells: function() {
           const memoryCells = this.elements.memoryCells;
           memoryCells.innerHTML = '';
           
           for (let i = 0; i < this.state.memory.length; i++) {
               const cell = document.createElement('div');
               cell.className = 'memory-cell';
               cell.id = `memory-${i}`;
               
               const address = document.createElement('span');
               address.className = 'memory-address';
               address.textContent = i.toString().padStart(2, '0');
               
               const value = document.createElement('span');
               value.className = 'memory-value';
               value.textContent = this.state.memory[i];
               
               cell.appendChild(address);
               cell.appendChild(value);
               memoryCells.appendChild(cell);
           }
       },

       // Update all register displays
       updateRegistersDisplay: function() {
           this.elements.pcValue.textContent = this.registers.pc;
           this.elements.irValue.textContent = this.registers.ir;
           this.elements.accValue.textContent = this.registers.acc;
           this.elements.r1Value.textContent = this.registers.r1;
           this.elements.r2Value.textContent = this.registers.r2;
           this.elements.r3Value.textContent = this.registers.r3;
       },

       // Update the CPU phase display
       updatePhaseDisplay: function() {
           this.elements.fetchPhase.classList.remove('active');
           this.elements.decodePhase.classList.remove('active');
           this.elements.executePhase.classList.remove('active');
           
           if (this.state.currentPhase === 'fetch') {
               this.elements.fetchPhase.classList.add('active');
           } else if (this.state.currentPhase === 'decode') {
               this.elements.decodePhase.classList.add('active');
           } else if (this.state.currentPhase === 'execute') {
               this.elements.executePhase.classList.add('active');
           }
       },

       // Update memory display
       updateMemoryDisplay: function() {
           for (let i = 0; i < this.state.memory.length; i++) {
               const cell = document.getElementById(`memory-${i}`);
               if (cell) {
                   const valueElement = cell.querySelector('.memory-value');
                   valueElement.textContent = this.state.memory[i];
                   
                   // Highlight active memory cell (current PC)
                   if (i === this.registers.pc) {
                       cell.classList.add('active');
                   } else {
                       cell.classList.remove('active');
                   }
               }
           }
       },

       // Load program into memory
       loadProgram: function() {
           // Reset the CPU
           this.resetCPU();
           
           // Parse program
           const programText = this.elements.programInput.value.trim();
           const programLines = programText.split('\n');
           
           // Store instructions
           this.state.instructions = programLines;
           
           // Load into memory
           for (let i = 0; i < programLines.length; i++) {
               this.state.memory[i] = programLines[i];
               this.state.memoryMap[i] = i; // Map line to memory address
           }
           
           this.updateMemoryDisplay();
           this.log('Program loaded into memory.');
       },

       // Execute one CPU cycle (fetch-decode-execute)
       cycle: function() {
           if (this.state.halted) {
               this.log('CPU is halted. Reset to continue.');
               return false;
           }
           
           if (this.registers.pc >= this.state.instructions.length) {
               this.log('End of program reached.');
               this.state.halted = true;
               return false;
           }
           
           // Fetch phase
           this.state.currentPhase = 'fetch';
           this.updatePhaseDisplay();
           this.log('FETCH: Getting instruction from memory address ' + this.registers.pc);
           const instruction = this.state.memory[this.registers.pc];
           this.registers.ir = instruction;
           this.updateRegistersDisplay();
           this.updateMemoryDisplay();
           
           if (this.state.running) {
               setTimeout(() => this.decode(), 1000 / this.state.speed);
           }
           
           return true;
       },

       // Decode the instruction
       decode: function() {
           this.state.currentPhase = 'decode';
           this.updatePhaseDisplay();
           const instruction = this.registers.ir;
           this.log('DECODE: Analyzing instruction "' + instruction + '"');
           
           if (this.state.running) {
               setTimeout(() => this.execute(), 1000 / this.state.speed);
           }
       },

       // Execute the instruction
       execute: function() {
           this.state.currentPhase = 'execute';
           this.updatePhaseDisplay();
           const instruction = this.registers.ir;
           const parts = instruction.split(' ');
           const opcode = parts[0].toUpperCase();
           const operand = parts.length > 1 ? parts[1] : null;
           
           this.log('EXECUTE: ' + opcode + (operand ? ' ' + operand : ''));
           
           // Execute based on opcode
           switch (opcode) {
               case 'LOAD':
                   if (operand.startsWith('R')) {
                       const regNum = operand.substring(1);
                       this.registers.acc = this.registers[`r${regNum}`];
                   } else {
                       this.registers.acc = parseInt(operand);
                   }
                   break;
               
               case 'STORE':
                   if (operand.startsWith('R')) {
                       const regNum = operand.substring(1);
                       this.registers[`r${regNum}`] = this.registers.acc;
                   }
                   break;
               
               case 'ADD':
                   if (operand.startsWith('R')) {
                       const regNum = operand.substring(1);
                       this.registers.acc += this.registers[`r${regNum}`];
                   } else {
                       this.registers.acc += parseInt(operand);
                   }
                   break;
               
               case 'SUB':
                   if (operand.startsWith('R')) {
                       const regNum = operand.substring(1);
                       this.registers.acc -= this.registers[`r${regNum}`];
                   } else {
                       this.registers.acc -= parseInt(operand);
                   }
                   break;
               
               case 'JUMP':
                   this.registers.pc = parseInt(operand) - 1; // -1 because we'll increment after
                   break;
               
               case 'JUMPZ':
                   if (this.registers.acc === 0) {
                       this.registers.pc = parseInt(operand) - 1; // -1 because we'll increment after
                   }
                   break;
               
               case 'PRINT':
                   if (operand.startsWith('R')) {
                       const regNum = operand.substring(1);
                       const value = this.registers[`r${regNum}`];
                       this.output(`Register R${regNum} = ${value}`);
                   } else if (operand.startsWith('"') && operand.endsWith('"')) {
                       // Handle quoted text
                       const text = operand.substring(1, operand.length - 1);
                       this.output(text);
                   } else {
                       this.output(operand);
                   }
                   break;
               
               case 'HALT':
                   this.state.halted = true;
                   this.log('CPU halted.');
                   break;
               
               default:
                   this.log('Unknown instruction: ' + opcode);
                   break;
           }
           
           // Increment PC for next instruction (unless HALT)
           if (!this.state.halted) {
               this.registers.pc++;
           }
           
           this.updateRegistersDisplay();
           this.updateMemoryDisplay();
           
           // Continue execution if running
           if (this.state.running && !this.state.halted) {
               setTimeout(() => this.cycle(), 1000 / this.state.speed);
           } else if (this.state.halted) {
               this.state.running = false;
               this.updateRunButton();
           }
       },

       // Step through one full cycle
       step: function() {
           if (this.state.currentPhase === 'fetch') {
               const success = this.cycle();
               if (success && !this.state.running) {
                   this.state.currentPhase = 'decode';
               }
           } else if (this.state.currentPhase === 'decode') {
               this.decode();
               if (!this.state.running) {
                   this.state.currentPhase = 'execute';
               }
           } else if (this.state.currentPhase === 'execute') {
               this.execute();
               if (!this.state.running) {
                   this.state.currentPhase = 'fetch';
               }
           }
           
           this.updatePhaseDisplay();
       },

       // Run the program continuously
       run: function() {
           if (this.state.halted) {
               this.log('CPU is halted. Reset to continue.');
               return;
           }
           
           this.state.running = true;
           this.updateRunButton();
           
           // Start the cycle
           this.cycle();
       },

       // Stop program execution
       stop: function() {
           this.state.running = false;
           this.updateRunButton();
       },

       // Reset the CPU
       resetCPU: function() {
           this.registers.pc = 0;
           this.registers.ir = '00000000';
           this.registers.acc = 0;
           this.registers.r1 = 0;
           this.registers.r2 = 0;
           this.registers.r3 = 0;
           
           this.state.running = false;
           this.state.halted = false;
           this.state.currentPhase = 'fetch';
           
           this.updateRegistersDisplay();
           this.updatePhaseDisplay();
           this.updateMemoryDisplay();
           this.updateRunButton();
           
           this.log('CPU reset. Ready to load program.');
       },

       // Update the Run/Stop button text
       updateRunButton: function() {
           if (this.state.running) {
               this.elements.runBtn.textContent = 'Stop';
           } else {
               this.elements.runBtn.textContent = 'Run';
           }
       },

       // Log message to the control unit log
       log: function(message) {
           const logElement = this.elements.controlUnitLog;
           const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
           logElement.innerHTML += `[${timestamp}] ${message}<br>`;
           logElement.scrollTop = logElement.scrollHeight;
       },

       // Output to the console
       output: function(message) {
           const outputElement = this.elements.consoleOutput;
           outputElement.innerHTML += `> ${message}<br>`;
           outputElement.scrollTop = outputElement.scrollHeight;
       },

       // Setup execution speed control
       setupSpeedControl: function() {
           const speedControl = this.elements.speedControl;
           const speedValue = this.elements.speedValue;
           
           speedControl.addEventListener('input', () => {
               const value = parseInt(speedControl.value);
               this.state.speed = value;
               
               // Update display
               if (value <= 3) {
                   speedValue.textContent = 'Slow';
               } else if (value <= 7) {
                   speedValue.textContent = 'Normal';
               } else {
                   speedValue.textContent = 'Fast';
               }
           });
       },

       // Setup event listeners
       setupEventListeners: function() {
           // Load program button
           this.elements.loadBtn.addEventListener('click', () => {
               this.loadProgram();
           });
           
           // Step button
           this.elements.stepBtn.addEventListener('click', () => {
               this.step();
           });
           
           // Run/Stop button
           this.elements.runBtn.addEventListener('click', () => {
               if (this.state.running) {
                   this.stop();
               } else {
                   this.run();
               }
           });
           
           // Reset button
           this.elements.resetBtn.addEventListener('click', () => {
               this.resetCPU();
           });
           
           // Clear console button
           this.elements.clearConsoleBtn.addEventListener('click', () => {
               this.elements.consoleOutput.innerHTML = '';
           });
       }
   };

   // Initialize the simulator
   cpuSimulator.init();
});
