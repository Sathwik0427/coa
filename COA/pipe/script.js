 /**
 * CPU Pipeline Visualizer - Interactive Simulation
 * 
 * This script simulates a 5-stage pipelined processor execution with 
 * hazard detection, forwarding, and branch prediction capabilities.
 */

document.addEventListener('DOMContentLoaded', function() {
   /**
    * STATE MANAGEMENT
    * Core simulation state and configuration
    */
   const state = {
       instructions: [],       // Parsed instructions
       pipelineState: [],      // Pipeline state for each cycle
       currentCycle: 0,        // Current simulation cycle
       running: false,         // Whether simulation is running
       dataForwarding: true,   // Data forwarding enabled/disabled
       branchPrediction: 'always-not-taken', // Branch prediction strategy
       registers: new Array(32).fill(0),     // Register file
       memory: new Array(1024).fill(0),      // Data memory
       branchPredictionTable: new Map(),     // For dynamic prediction
       hazards: [],            // Tracked hazards
       forwarding: [],         // Tracked forwarding operations
       simulationSpeed: 500    // Milliseconds between cycles when running
   };

   /**
    * DOM ELEMENTS
    * References to DOM elements for interaction
    */
   const elements = {
       instructionTextarea: document.getElementById('instruction-textarea'),
       loadBtn: document.getElementById('load-btn'),
       resetBtn: document.getElementById('reset-btn'),
       stepBtn: document.getElementById('step-btn'),
       runBtn: document.getElementById('run-btn'),
       pauseBtn: document.getElementById('pause-btn'),
       pipelineGrid: document.getElementById('pipeline-grid'),
       cycleCount: document.getElementById('cycle-count'),
       dataForwarding: document.getElementById('data-forwarding'),
       branchPrediction: document.getElementById('branch-prediction'),
       explanationContent: document.getElementById('explanation-content')
   };

   /**
    * INSTRUCTION DEFINITIONS
    * Maps instruction types to their execution properties
    */
   const instructionTypes = {
       'add': { format: 'R', stages: { IF: 1, ID: 1, EX: 1, MEM: 1, WB: 1 }, writesReg: true },
       'sub': { format: 'R', stages: { IF: 1, ID: 1, EX: 1, MEM: 1, WB: 1 }, writesReg: true },
       'and': { format: 'R', stages: { IF: 1, ID: 1, EX: 1, MEM: 1, WB: 1 }, writesReg: true },
       'or':  { format: 'R', stages: { IF: 1, ID: 1, EX: 1, MEM: 1, WB: 1 }, writesReg: true },
       'slt': { format: 'R', stages: { IF: 1, ID: 1, EX: 1, MEM: 1, WB: 1 }, writesReg: true },
       'lw':  { format: 'I', stages: { IF: 1, ID: 1, EX: 1, MEM: 1, WB: 1 }, writesReg: true, accessesMemory: true },
       'sw':  { format: 'I', stages: { IF: 1, ID: 1, EX: 1, MEM: 1, WB: 0 }, writesReg: false, accessesMemory: true },
       'beq': { format: 'I', stages: { IF: 1, ID: 1, EX: 1, MEM: 0, WB: 0 }, writesReg: false, isBranch: true },
       'j':   { format: 'J', stages: { IF: 1, ID: 1, EX: 0, MEM: 0, WB: 0 }, writesReg: false, isJump: true }
   };
   
   /**
    * EVENT LISTENERS
    * Set up UI event handlers
    */
   function setupEventListeners() {
       elements.loadBtn.addEventListener('click', loadInstructions);
       elements.resetBtn.addEventListener('click', resetSimulation);
       elements.stepBtn.addEventListener('click', stepCycle);
       elements.runBtn.addEventListener('click', runSimulation);
       elements.pauseBtn.addEventListener('click', pauseSimulation);
       
       elements.dataForwarding.addEventListener('change', function() {
           state.dataForwarding = this.value === 'enabled';
           // Update UI to reflect the change if simulation is running
           if (state.currentCycle > 0) {
               updateUI();
               updateExplanationWithSettings();
           }
       });
       
       elements.branchPrediction.addEventListener('change', function() {
           state.branchPrediction = this.value;
           // Update UI to reflect the change if simulation is running
           if (state.currentCycle > 0) {
               updateUI();
               updateExplanationWithSettings();
           }
       });
       
       // Add keyboard shortcuts for better usability
       document.addEventListener('keydown', function(event) {
           // Step on right arrow or spacebar
           if ((event.key === 'ArrowRight' || event.key === ' ') && !elements.stepBtn.disabled) {
               event.preventDefault();
               stepCycle();
           }
           // Reset on 'R' key
           else if (event.key === 'r' && !event.ctrlKey && !event.metaKey) {
               resetSimulation();
           }
       });
   }
   
   /**
    * Updates the explanation panel to show current settings
    */
   function updateExplanationWithSettings() {
       let settingsText = `<strong>Current Settings:</strong> `;
       settingsText += `Data Forwarding: ${state.dataForwarding ? 'Enabled' : 'Disabled'}, `;
       settingsText += `Branch Prediction: ${state.branchPrediction.replace(/-/g, ' ')}`;
       
       // Append to the explanation content
       const currentExplanation = elements.explanationContent.innerHTML;
       elements.explanationContent.innerHTML = settingsText + '<br><br>' + currentExplanation;
   }

   /**
    * INSTRUCTION PARSING
    * Parses assembly instructions from the textarea
    */
   function loadInstructions() {
       const instructionText = elements.instructionTextarea.value.trim();
       const lines = instructionText.split('\n');
       
       state.instructions = [];
       
       let loadedCount = 0;
       let errorCount = 0;
       
       lines.forEach((line, index) => {
           // Remove comments
           const commentIndex = line.indexOf('#');
           if (commentIndex !== -1) {
               line = line.substring(0, commentIndex).trim();
           }
           
           if (line) {
               const parts = line.split(/\s+/);
               const opcode = parts[0].toLowerCase();
               
               if (instructionTypes[opcode]) {
                   let instruction = {
                       id: index,
                       opcode: opcode,
                       text: line.trim(),
                       completed: false,
                       cycleStart: -1,
                       position: -1,
                       stall: false
                   };
                   
                   // Parse arguments based on instruction format
                   const args = parts.slice(1).join('').split(',');
                   
                   try {
                       if (instructionTypes[opcode].format === 'R') {
                           // R-format: add $d, $s, $t
                           instruction.rd = parseRegister(args[0]);
                           instruction.rs = parseRegister(args[1]);
                           instruction.rt = parseRegister(args[2]);
                           
                           if (!instruction.rd || !instruction.rs || !instruction.rt) {
                               throw new Error('Invalid register format');
                           }
                       } else if (instructionTypes[opcode].format === 'I') {
                           if (opcode === 'beq') {
                               // beq $s, $t, label
                               instruction.rs = parseRegister(args[0]);
                               instruction.rt = parseRegister(args[1]);
                               instruction.label = args[2] ? args[2].trim() : null;
                               
                               if (!instruction.rs || !instruction.rt || !instruction.label) {
                                   throw new Error('Invalid branch format');
                               }
                           } else if (opcode === 'lw' || opcode === 'sw') {
                               // lw/sw $t, offset($s)
                               instruction.rt = parseRegister(args[0]);
                               const offsetRegex = /(-?\d+)\((\$\w+)\)/;
                               const match = args[1].match(offsetRegex);
                               
                               if (match) {
                                   instruction.offset = parseInt(match[1]);
                                   instruction.rs = parseRegister(match[2]);
                               } else {
                                   throw new Error('Invalid memory access format');
                               }
                               
                               if (!instruction.rt || !instruction.rs) {
                                   throw new Error('Invalid register format');
                               }
                           }
                       } else if (instructionTypes[opcode].format === 'J') {
                           // j label
                           instruction.label = args[0] ? args[0].trim() : null;
                           
                           if (!instruction.label) {
                               throw new Error('Invalid jump format');
                           }
                       }
                       
                       state.instructions.push(instruction);
                       loadedCount++;
                   } catch (error) {
                       errorCount++;
                       console.error(`Error parsing instruction at line ${index + 1}: ${error.message}`);
                   }
               } else {
                   errorCount++;
                   console.error(`Unknown instruction at line ${index + 1}: ${opcode}`);
               }
           }
       });
       
       // Reset simulation state but keep loaded instructions
       state.pipelineState = [];
       state.currentCycle = 0;
       state.running = false;
       state.hazards = [];
       state.forwarding = [];
       
       updateUI();
       
       // Update explanation with loading results
       let explanationText = '';
       if (loadedCount > 0) {
           explanationText = `<strong>Instructions Loaded:</strong> ${loadedCount} valid instruction${loadedCount !== 1 ? 's' : ''} ready for execution. `;
           if (errorCount > 0) {
               explanationText += `<span style="color: #f44336;">${errorCount} error${errorCount !== 1 ? 's' : ''} detected. Check console for details.</span><br><br>`;
           }
           explanationText += 'Press <strong>Step</strong> to execute one cycle at a time or <strong>Run</strong> to execute continuously.';
       } else {
           explanationText = '<span style="color: #f44336;">No valid instructions found. Please check your syntax.</span>';
       }
       
       elements.explanationContent.innerHTML = explanationText;
   }

   /**
    * Parse register names from instruction text
    */
   function parseRegister(reg) {
       if (!reg) return null;
       reg = reg.trim();
       if (reg.startsWith('$')) {
           return reg;
       }
       return null;
   }

   /**
    * SIMULATION CONTROL
    * Reset simulation to initial state
    */
   function resetSimulation() {
       // Clear simulation state but keep configuration
       state.instructions = [];
       state.pipelineState = [];
       state.currentCycle = 0;
       state.running = false;
       state.registers = new Array(32).fill(0);
       state.memory = new Array(1024).fill(0);
       state.hazards = [];
       state.forwarding = [];
       state.branchPredictionTable = new Map();
       
       // Update UI elements
       elements.cycleCount.textContent = state.currentCycle;
       elements.pauseBtn.disabled = true;
       elements.runBtn.disabled = false;
       elements.stepBtn.disabled = false;
       
       // Clear pipeline grid and update explanations
       updateUI();
       elements.explanationContent.innerHTML = '<p>Simulation reset. Load instructions and press <strong>Step</strong> or <strong>Run</strong> to begin.</p>';
   }

   /**
    * Advance simulation by one cycle
    */
   function stepCycle() {
       if (state.instructions.length === 0) {
           elements.explanationContent.innerHTML = '<p class="error">No instructions loaded. Please load instructions first.</p>';
           return;
       }
       
       // Increment cycle counter
       state.currentCycle++;
       elements.cycleCount.textContent = state.currentCycle;
       
       // Update pipeline state for current cycle
       updatePipelineState();
       
       // Update UI
       updateUI();
       
       // Check if all instructions have completed
       const allCompleted = state.instructions.every(instr => instr.completed);
       if (allCompleted && state.running) {
           pauseSimulation();
           elements.explanationContent.innerHTML = '<p><strong>Simulation Complete:</strong> All instructions have finished execution.</p>';
       }
   }

   /**
    * Run simulation continuously
    */
   function runSimulation() {
       if (state.instructions.length === 0) {
           elements.explanationContent.innerHTML = '<p class="error">No instructions loaded. Please load instructions first.</p>';
           return;
       }
       
       state.running = true;
       elements.pauseBtn.disabled = false;
       elements.runBtn.disabled = true;
       elements.stepBtn.disabled = true;
       
       let simulationInterval;
       
       function tick() {
           if (state.running) {
               stepCycle();
               const allCompleted = state.instructions.every(instr => instr.completed);
               if (!allCompleted) {
                   simulationInterval = setTimeout(tick, state.simulationSpeed);
               } else {
                   pauseSimulation();
                   elements.explanationContent.innerHTML = '<p><strong>Simulation Complete:</strong> All instructions have finished execution.</p>';
               }
           } else {
               clearTimeout(simulationInterval);
           }
       }
       
       tick();
   }

   /**
    * Pause simulation execution
    */
   function pauseSimulation() {
       state.running = false;
       elements.pauseBtn.disabled = true;
       elements.runBtn.disabled = false;
       elements.stepBtn.disabled = false;
   }

   /**
    * PIPELINE EXECUTION LOGIC
    * Update pipeline state for the current cycle
    */
   function updatePipelineState() {
       // Clear hazards and forwarding for this cycle
       state.hazards = state.hazards.filter(h => h.cycle !== state.currentCycle);
       state.forwarding = state.forwarding.filter(f => f.cycle !== state.currentCycle);
       
       // Pipeline state for this cycle
       let cycleState = {
           cycle: state.currentCycle,
           stages: {} // Will contain instructions in each stage
       };
       
       // Find instructions already issued
       const issuedInstructions = state.instructions.filter(instr => 
           instr.cycleStart !== -1 && !instr.completed);
       
       // Check for hazards and resolve them
       detectHazards(issuedInstructions);
       
       // Process instructions already in pipeline (from last to first)
       for (let i = issuedInstructions.length - 1; i >= 0; i--) {
           const instr = issuedInstructions[i];
           let currentStage = getCurrentStage(instr);
           
           // Skip if instruction is stalled
           if (instr.stall) {
               // Keep the instruction at the same stage
               cycleState.stages[currentStage] = { 
                   id: instr.id, 
                   text: instr.text,
                   stall: true 
               };
               continue;
           }
           
           // Get next stage
           const nextStage = getNextStage(currentStage);
           
           // If this is the last stage or stage doesn't exist for this instruction
           if (!nextStage || !instructionTypes[instr.opcode].stages[nextStage]) {
               instr.completed = true;
               continue;
           }
           
           // Check for stage conflicts (structural hazards)
           if (cycleState.stages[nextStage]) {
               instr.stall = true;
               cycleState.stages[currentStage] = { 
                   id: instr.id, 
                   text: instr.text,
                   stall: true 
               };
               
               // Record hazard
               state.hazards.push({
                   cycle: state.currentCycle,
                   type: 'structural',
                   stage: currentStage,
                   instructionId: instr.id,
                   description: `Structural hazard: ${instr.text} cannot advance to ${nextStage} stage because it's occupied`
               });
               
               continue;
           }
           
           // Advance to next stage
           cycleState.stages[nextStage] = { 
               id: instr.id, 
               text: instr.text
           };
       }
       
       // Issue new instruction if possible
       if (!cycleState.stages.IF) {
           const nextToIssue = state.instructions.find(instr => instr.cycleStart === -1);
           if (nextToIssue) {
               nextToIssue.cycleStart = state.currentCycle;
               cycleState.stages.IF = { 
                   id: nextToIssue.id, 
                   text: nextToIssue.text
               };
           }
       }
       
       // Add cycle state to pipeline state
       state.pipelineState.push(cycleState);
       
       // Generate explanation for this cycle
       updateExplanation(cycleState);
   }

   /**
    * Determine current stage of an instruction
    */
   function getCurrentStage(instruction) {
       const cyclesInPipeline = state.currentCycle - instruction.cycleStart;
       
       if (cyclesInPipeline === 0) return 'IF';
       if (cyclesInPipeline === 1) return 'ID';
       if (cyclesInPipeline === 2) return 'EX';
       if (cyclesInPipeline === 3) return 'MEM';
       if (cyclesInPipeline === 4) return 'WB';
       
       return null; // Should be completed
   }

   /**
    * Get next pipeline stage
    */
   function getNextStage(currentStage) {
       const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'];
       const currentIndex = stages.indexOf(currentStage);
       
       if (currentIndex < stages.length - 1) {
           return stages[currentIndex + 1];
       }
       
       return null; // No next stage
   }

   /**
    * Detect and handle data and control hazards
    */
   function detectHazards(issuedInstructions) {
       // Only process instructions that are in ID, EX, MEM stages
       const activeInstructions = issuedInstructions.filter(instr => {
           const stage = getCurrentStage(instr);
           return stage === 'ID' || stage === 'EX' || stage === 'MEM';
       });
       
       // Check each pair of instructions for dependencies
       for (let i = 0; i < activeInstructions.length; i++) {
           const consumerInstr = activeInstructions[i];
           const consumerStage = getCurrentStage(consumerInstr);
           
           // Skip if not in ID stage or already stalled
           if (consumerStage !== 'ID' || consumerInstr.stall) continue;
           
           for (let j = 0; j < i; j++) {
               const producerInstr = activeInstructions[j];
               const producerStage = getCurrentStage(producerInstr);
               
               // Skip if completed or in IF or ID stage
               if (producerInstr.completed || producerStage === 'IF' || producerStage === 'ID') continue;
               
               // Check for data hazards
               if (instructionTypes[producerInstr.opcode].writesReg) {
                   // RAW hazard: producer writes a register that consumer reads
                   const producerRd = producerInstr.rd;
                   
                   // For load instructions, destination is rt
                   const producerDest = producerInstr.opcode === 'lw' ? producerInstr.rt : producerRd;
                   
                   if (producerDest) {
                       // Check if consumer uses this register
                       const usesReg = consumerInstr.rs === producerDest || 
                                     consumerInstr.rt === producerDest ||
                                     (consumerInstr.opcode === 'sw' && consumerInstr.rt === producerDest);
                       
                       if (usesReg) {
                           // Load-use hazard: producer is a load and result isn't ready yet
                           if (producerInstr.opcode === 'lw' && producerStage === 'EX') {
                               // Must stall regardless of forwarding
                               consumerInstr.stall = true;
                               
                               // Record hazard
                               state.hazards.push({
                                   cycle: state.currentCycle,
                                   type: 'load-use',
                                   stage: consumerStage,
                                   instructionId: consumerInstr.id,
                                   sourceInstructionId: producerInstr.id,
                                   description: `Load-use hazard: ${consumerInstr.text} needs data from ${producerInstr.text} that's not ready yet`
                               });
                           } 
                           // Data hazard that can be resolved with forwarding
                           else if (state.dataForwarding) {
                               // Record forwarding
                               state.forwarding.push({
                                   cycle: state.currentCycle,
                                   from: producerInstr.id,
                                   to: consumerInstr.id,
                                   stage: producerStage,
                                   description: `Forwarding data from ${producerInstr.text} (${producerStage}) to ${consumerInstr.text} (ID)`
                               });
                           } 
                           // Data hazard without forwarding - must stall
                           else {
                               consumerInstr.stall = true;
                               
                               // Record hazard
                               state.hazards.push({
                                   cycle: state.currentCycle,
                                   type: 'data',
                                   stage: consumerStage,
                                   instructionId: consumerInstr.id,
                                   sourceInstructionId: producerInstr.id,
                                   description: `Data hazard: ${consumerInstr.text} needs data from ${producerInstr.text} (forwarding disabled)`
                               });
                           }
                       }
                   }
               }
               
               // Control hazards for branch instructions
               if (producerInstr.opcode === 'beq' && producerStage === 'EX') {
                   // Record control hazard - we'll handle different prediction strategies
                   state.hazards.push({
                       cycle: state.currentCycle,
                       type: 'control',
                       stage: 'ID',
                       instructionId: consumerInstr.id,
                       sourceInstructionId: producerInstr.id,
                       description: `Control hazard: ${consumerInstr.text} may need to be flushed depending on ${producerInstr.text}`
                   });
                   
                   // Implement branch prediction strategy
                   if (state.branchPrediction === 'always-not-taken') {
                       // No stall needed here - we assume branch is not taken
                   } else if (state.branchPrediction === 'always-taken') {
                       // In real hardware, we'd fetch from the branch target 
                       // For simplicity, we'll just stall until the branch is resolved
                       consumerInstr.stall = true;
                   } else if (state.branchPrediction === 'dynamic') {
                       // 1-bit dynamic prediction 
                       const branchPC = producerInstr.id;
                       if (!state.branchPredictionTable.has(branchPC)) {
                           // Initialize to not taken
                           state.branchPredictionTable.set(branchPC, false);
                       }
                       
                       // Predict based on last outcome
                       const predictTaken = state.branchPredictionTable.get(branchPC);
                       if (predictTaken) {
                           // If we predict taken, stall until resolved
                           consumerInstr.stall = true;
                       }
                   }
               }
           }
       }
   }

   /**
    * Update the explanation panel based on current cycle state
    */
   function updateExplanation(cycleState) {
       let explanation = `<strong>Cycle ${state.currentCycle}:</strong><br>`;
       
       // List instructions in each stage
       const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'];
       stages.forEach(stage => {
           if (cycleState.stages[stage]) {
               const instr = cycleState.stages[stage];
               explanation += `<strong>${stage}:</strong> ${instr.text}${instr.stall ? ' <span class="stall-indicator">(STALLED)</span>' : ''}<br>`;
           } else {
               explanation += `<strong>${stage}:</strong> <span class="empty-stage">-</span><br>`;
           }
       });
       
       // List hazards in this cycle
       const hazards = state.hazards.filter(h => h.cycle === state.currentCycle);
       if (hazards.length > 0) {
           explanation += '<br><strong>Hazards detected:</strong><br>';
           hazards.forEach(hazard => {
               explanation += `• ${hazard.description}<br>`;
           });
       }
       
       // List forwarding in this cycle
       const forwarding = state.forwarding.filter(f => f.cycle === state.currentCycle);
       if (forwarding.length > 0) {
           explanation += '<br><strong>Data forwarding:</strong><br>';
           forwarding.forEach(fwd => {
               explanation += `• ${fwd.description}<br>`;
           });
       }
       
       elements.explanationContent.innerHTML = explanation;
   }

   /**
    * Update the UI to reflect the current state
    */
   function updateUI() {
       // Clear pipeline grid except headers
       while (elements.pipelineGrid.children.length > 11) {
           elements.pipelineGrid.removeChild(elements.pipelineGrid.lastChild);
       }
       
       // Add instruction rows
       state.instructions.forEach((instruction, index) => {
           // Instruction label cell
           const instructionCell = document.createElement('div');
           instructionCell.className = 'pipeline-cell';
           instructionCell.textContent = instruction.text;
           elements.pipelineGrid.appendChild(instructionCell);
           
           // Add cells for each cycle
           for (let cycle = 1; cycle <= 10; cycle++) {
               const cell = document.createElement('div');
               cell.className = 'pipeline-cell';
               
               // Find stage for this instruction in this cycle
               if (cycle <= state.currentCycle) {
                   const cycleState = state.pipelineState.find(cs => cs.cycle === cycle);
                   if (cycleState) {
                       // Find which stage this instruction is in during this cycle
                       const stage = Object.keys(cycleState.stages).find(
                           stage => cycleState.stages[stage] && cycleState.stages[stage].id === instruction.id
                       );
                       
                       if (stage) {
                           cell.textContent = stage;
                           cell.classList.add(stage.toLowerCase());
                           
                           // Mark stalls
                           if (cycleState.stages[stage].stall) {
                               cell.classList.add('stall');
                               cell.textContent = 'STALL';
                           }
                           
                           // Mark hazards
                           const hazard = state.hazards.find(
                               h => h.cycle === cycle && h.instructionId === instruction.id
                           );
                           if (hazard) {
                               cell.classList.add('hazard');
                               const hazardIcon = document.createElement('div');
                               hazardIcon.className = 'hazard-icon';
                               hazardIcon.textContent = '!';
                               hazardIcon.title = hazard.description;
                               cell.appendChild(hazardIcon);
                           }
                           
                           // Mark forwarding
                           const forwarding = state.forwarding.find(
                               f => f.cycle === cycle && (f.from === instruction.id || f.to === instruction.id)
                           );
                           if (forwarding) {
                               cell.classList.add('forwarding');
                               if (forwarding.from === instruction.id) {
                                   const arrow = document.createElement('div');
                                   arrow.className = 'forwarding-arrow';
                                   arrow.textContent = '↓';
                                   arrow.title = forwarding.description;
                                   cell.appendChild(arrow);
                               }
                           }
                       }
                   }
               }
               
               elements.pipelineGrid.appendChild(cell);
           }
       });
   }

   /**
    * Simulate actual execution of instructions
    * This is a simplified version that mainly focuses on visualization
    * In a real implementation, we would actually update register values
    */
   function executeInstruction(instruction, stage) {
       // Only do actual execution for certain stages
       if (stage === 'EX') {
           // For branch instructions, update the branch prediction table
           if (instruction.opcode === 'beq' && state.branchPrediction === 'dynamic') {
               // In a real implementation, we would compare register values
               // For this simulation, we'll just randomly decide branch outcome
               const branchTaken = Math.random() > 0.5;
               state.branchPredictionTable.set(instruction.id, branchTaken);
           }
       }
       
       if (stage === 'MEM') {
           // For load/store, simulate memory access
           if (instruction.opcode === 'lw') {
               // In a real implementation, we would load from memory
               // For simulation, we'll just use a placeholder
               const address = instruction.offset; // Simplified
               const value = state.memory[address] || 0;
               // Would set the register value here
           } else if (instruction.opcode === 'sw') {
               // In a real implementation, we would store to memory
               const address = instruction.offset; // Simplified
               // Would get the register value and store it to memory
               state.memory[address] = 1; // Placeholder
           }
       }
       
       if (stage === 'WB') {
           // For instructions that write back to registers
           if (instructionTypes[instruction.opcode].writesReg) {
               // In a real implementation, we would update the register file
               // For simulation, we'll just use a placeholder
               const destReg = instruction.opcode === 'lw' ? instruction.rt : instruction.rd;
               const regIndex = parseInt(destReg.substring(1));
               state.registers[regIndex] = 1; // Placeholder
           }
       }
   }

   // Initialize simulation on page load
   setupEventListeners();
   resetSimulation();
});
