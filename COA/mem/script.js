/**
 * Memory Hierarchy Simulator
 * 
 * This script provides a visual and interactive demonstration of how data
 * flows through different levels of computer memory hierarchy, including CPU,
 * cache levels, and main memory. It illustrates fundamental concepts like
 * cache hits, misses, and various replacement policies.
 * 
 * Author: Perplexity AI
 * Last Updated: April 19, 2025
 */

document.addEventListener('DOMContentLoaded', function() {
   /**
    * Simulator Configuration
    * Defines the parameters for cache sizes, replacement policies, and simulation behavior
    */
   const config = {
       l1Size: 4,    // Number of L1 cache blocks
       l2Size: 8,    // Number of L2 cache blocks
       ramSize: 16,  // RAM blocks to display (actual size would be 256)
       replacement: 'lru', // Default replacement policy
       autoPattern: 'sequential', // Default access pattern
       autoSpeed: 1000, // Milliseconds between auto accesses
       autoRunning: false // Auto access state
   };

   /**
    * Statistics Tracking
    * Tracks and displays cache hits, misses, and other performance metrics
    */
   const stats = {
       totalAccesses: 0,
       l1Hits: 0,
       l2Hits: 0,
       misses: 0,
       
       /**
        * Updates the statistics display on the UI
        */
       updateStats: function() {
           document.getElementById('total-accesses').textContent = this.totalAccesses;
           document.getElementById('l1-hits').textContent = this.l1Hits;
           document.getElementById('l2-hits').textContent = this.l2Hits;
           document.getElementById('misses').textContent = this.misses;
           
           const hitRatio = this.totalAccesses > 0 
               ? Math.round(((this.l1Hits + this.l2Hits) / this.totalAccesses) * 100)
               : 0;
           document.getElementById('hit-ratio').textContent = hitRatio + '%';
       }
   };

   /**
    * Memory Structure
    * Manages the memory hierarchy including caches and main memory
    */
   const memory = {
       // Memory hierarchy data structures
       l1Cache: [],
       l2Cache: [],
       ram: new Array(256).fill(null),
       
       /**
        * Initializes the memory hierarchy with starting values
        */
       init: function() {
           // Initialize RAM with random data
           for (let i = 0; i < 256; i++) {
               this.ram[i] = {
                   address: i,
                   data: '0x' + Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0')
               };
           }
           
           // Create empty L1 cache
           this.l1Cache = new Array(config.l1Size).fill(null);
           
           // Create empty L2 cache
           this.l2Cache = new Array(config.l2Size).fill(null);
           
           // Update the UI
           this.updateUI();
       },
       
       /**
        * Updates the UI to represent the current state of the memory hierarchy
        */
       updateUI: function() {
           // Update L1 cache blocks
           const l1Blocks = document.getElementById('l1-blocks');
           l1Blocks.innerHTML = '';
           
           for (let i = 0; i < this.l1Cache.length; i++) {
               const block = document.createElement('div');
               block.className = 'memory-block';
               
               if (this.l1Cache[i] === null) {
                   block.innerHTML = `
                       <span class="block-address">Block ${i}</span>
                       <span class="block-data">Empty</span>
                   `;
               } else {
                   block.innerHTML = `
                       <span class="block-address">Addr ${this.l1Cache[i].address}</span>
                       <span class="block-data">${this.l1Cache[i].data}</span>
                   `;
               }
               
               l1Blocks.appendChild(block);
           }
           
           // Update L2 cache blocks
           const l2Blocks = document.getElementById('l2-blocks');
           l2Blocks.innerHTML = '';
           
           for (let i = 0; i < this.l2Cache.length; i++) {
               const block = document.createElement('div');
               block.className = 'memory-block';
               
               if (this.l2Cache[i] === null) {
                   block.innerHTML = `
                       <span class="block-address">Block ${i}</span>
                       <span class="block-data">Empty</span>
                   `;
               } else {
                   block.innerHTML = `
                       <span class="block-address">Addr ${this.l2Cache[i].address}</span>
                       <span class="block-data">${this.l2Cache[i].data}</span>
                   `;
               }
               
               l2Blocks.appendChild(block);
           }
           
           // Update RAM blocks (we'll only show a sample)
           const ramBlocks = document.getElementById('ram-blocks');
           ramBlocks.innerHTML = '';
           
           for (let i = 0; i < config.ramSize; i++) {
               const visibleIndex = i * Math.floor(256 / config.ramSize);
               const block = document.createElement('div');
               block.className = 'memory-block';
               
               block.innerHTML = `
                   <span class="block-address">Addr ${visibleIndex}</span>
                   <span class="block-data">${this.ram[visibleIndex].data}</span>
               `;
               
               ramBlocks.appendChild(block);
           }
       },
       
       /**
        * Simulates memory access with specified address and operation
        * @param {number} address - The memory address to access
        * @param {boolean} isWrite - Whether this is a write operation
        * @param {string} newData - New data value for write operations
        */
       accessMemory: function(address, isWrite = false, newData = null) {
           // Update stats
           stats.totalAccesses++;
           
           // Update status
           document.getElementById('current-status').textContent = `Status: Accessing memory address ${address}...`;
           
           // Show the address in the CPU register
           const cpuRegister = document.getElementById('cpu-register');
           cpuRegister.querySelector('.block-data').textContent = address;
           cpuRegister.classList.add('active');
           
           // Check L1 cache
           const l1Index = this.findInCache(this.l1Cache, address);
           
           if (l1Index !== -1) {
               // L1 cache hit
               stats.l1Hits++;
               this.handleCacheHit('l1', l1Index, address, isWrite, newData);
           } else {
               // L1 cache miss, check L2
               const l2Index = this.findInCache(this.l2Cache, address);
               
               if (l2Index !== -1) {
                   // L2 cache hit
                   stats.l2Hits++;
                   this.handleCacheHit('l2', l2Index, address, isWrite, newData);
               } else {
                   // Complete miss, fetch from RAM
                   stats.misses++;
                   this.handleCacheMiss(address, isWrite, newData);
               }
           }
           
           // Update the statistics display
           stats.updateStats();
       },
       
       /**
        * Searches for an address in a cache level
        * @param {Array} cache - The cache array to search in
        * @param {number} address - The address to find
        * @returns {number} The index if found, -1 otherwise
        */
       findInCache: function(cache, address) {
           for (let i = 0; i < cache.length; i++) {
               if (cache[i] !== null && cache[i].address === address) {
                   return i;
               }
           }
           return -1;
       },
       
       /**
        * Handles a cache hit scenario
        * @param {string} level - The cache level ('l1' or 'l2')
        * @param {number} index - Index of the hit in the cache
        * @param {number} address - The memory address
        * @param {boolean} isWrite - Whether this is a write operation
        * @param {string} newData - New data for write operations
        */
       handleCacheHit: function(level, index, address, isWrite, newData) {
           const statusEl = document.getElementById('current-status');
           
           if (level === 'l1') {
               // Highlight the L1 cache block
               const l1Blocks = document.getElementById('l1-blocks').children;
               l1Blocks[index].classList.add('hit');
               
               statusEl.textContent = `Status: L1 Cache HIT at address ${address}!`;
               
               // Update LRU order if using LRU
               if (config.replacement === 'lru') {
                   // Move this block to the end of the usage order (most recently used)
                   const block = this.l1Cache[index];
                   this.l1Cache.splice(index, 1);
                   this.l1Cache.push(block);
                   setTimeout(() => this.updateUI(), 500);
               }
               
               // If write operation, update the data
               if (isWrite && newData) {
                   this.l1Cache[index].data = newData;
                   
                   // Also update L2 and RAM to maintain consistency
                   const l2Index = this.findInCache(this.l2Cache, address);
                   if (l2Index !== -1) {
                       this.l2Cache[l2Index].data = newData;
                   }
                   
                   this.ram[address].data = newData;
                   
                   setTimeout(() => this.updateUI(), 500);
               }
               
               // Show the data in the CPU register
               setTimeout(() => {
                   const cpuRegister = document.getElementById('cpu-register');
                   cpuRegister.querySelector('.block-data').textContent = this.l1Cache[this.findInCache(this.l1Cache, address)].data;
               }, 500);
               
               // Animate data transfer
               this.animateDataTransfer('l1-to-cpu');
               
           } else if (level === 'l2') {
               // Highlight the L2 cache block
               const l2Blocks = document.getElementById('l2-blocks').children;
               l2Blocks[index].classList.add('hit');
               
               statusEl.textContent = `Status: L2 Cache HIT at address ${address}!`;
               
               // Copy data from L2 to L1
               this.promoteBlockToL1(this.l2Cache[index]);
               
               // Update LRU order if using LRU
               if (config.replacement === 'lru') {
                   // Move this block to the end of the usage order
                   const block = this.l2Cache[index];
                   this.l2Cache.splice(index, 1);
                   this.l2Cache.push(block);
                   setTimeout(() => this.updateUI(), 1000);
               }
               
               // If write operation, update the data
               if (isWrite && newData) {
                   this.l2Cache[index].data = newData;
                   this.ram[address].data = newData;
                   setTimeout(() => this.updateUI(), 1000);
               }
               
               // Show the data in the CPU register
               setTimeout(() => {
                   const cpuRegister = document.getElementById('cpu-register');
                   cpuRegister.querySelector('.block-data').textContent = this.l2Cache[index].data;
               }, 1000);
               
               // Animate data transfer
               this.animateDataTransfer('l2-to-l1');
               setTimeout(() => this.animateDataTransfer('l1-to-cpu'), 500);
           }
           
           // Reset highlighting after animation
           setTimeout(() => {
               const blocks = document.querySelectorAll('.memory-block');
               blocks.forEach(block => {
                   block.classList.remove('hit', 'miss', 'active', 'transferring');
               });
           }, 1500);
       },
       
       /**
        * Handles a cache miss scenario
        * @param {number} address - The memory address
        * @param {boolean} isWrite - Whether this is a write operation
        * @param {string} newData - New data for write operations
        */
       handleCacheMiss: function(address, isWrite, newData) {
           const statusEl = document.getElementById('current-status');
           statusEl.textContent = `Status: Cache MISS! Fetching address ${address} from RAM`;
           
           // Highlight the RAM block
           const ramBlocks = document.getElementById('ram-blocks').children;
           const visibleRamIndex = Math.floor(address / (256 / config.ramSize));
           if(visibleRamIndex < ramBlocks.length) {
               ramBlocks[visibleRamIndex].classList.add('miss');
           }
           
           // If write operation, update RAM data first
           if (isWrite && newData) {
               this.ram[address].data = newData;
           }
           
           // Create a new cache block from RAM data
           const newBlock = {
               address: address,
               data: this.ram[address].data
           };
           
           // Load block into L2 cache first
           this.loadBlockToCache(newBlock, this.l2Cache);
           
           // Then promote to L1 cache
           setTimeout(() => {
               this.promoteBlockToL1(newBlock);
           }, 700);
           
           // Show the data in the CPU register after loading
           setTimeout(() => {
               const cpuRegister = document.getElementById('cpu-register');
               cpuRegister.querySelector('.block-data').textContent = newBlock.data;
           }, 1400);
           
           // Animate data transfers
           this.animateDataTransfer('ram-to-l2');
           setTimeout(() => this.animateDataTransfer('l2-to-l1'), 700);
           setTimeout(() => this.animateDataTransfer('l1-to-cpu'), 1200);
           
           // Reset highlighting after animation
           setTimeout(() => {
               const blocks = document.querySelectorAll('.memory-block');
               blocks.forEach(block => {
                   block.classList.remove('hit', 'miss', 'active', 'transferring');
               });
           }, 1800);
       },
       
       /**
        * Loads a block into a cache level using the current replacement policy
        * @param {Object} block - The memory block to load
        * @param {Array} cache - The cache to load into
        */
       loadBlockToCache: function(block, cache) {
           // Check if there's space in the cache
           const emptyIndex = cache.findIndex(item => item === null);
           
           if (emptyIndex !== -1) {
               // If there's an empty spot, use it
               cache[emptyIndex] = block;
           } else {
               // No empty spot, need to replace an existing block
               switch(config.replacement) {
                   case 'lru':
                       // Replace the least recently used (first item)
                       cache.shift();
                       cache.push(block);
                       break;
                       
                   case 'fifo':
                       // Replace the oldest block (first in)
                       cache.shift();
                       cache.push(block);
                       break;
                       
                   case 'random':
                       // Replace a random block
                       const randomIndex = Math.floor(Math.random() * cache.length);
                       cache[randomIndex] = block;
                       break;
               }
           }
           
           // Update the UI after a short delay
           setTimeout(() => this.updateUI(), 300);
       },
       
       /**
        * Promotes a block from L2 cache to L1 cache
        * @param {Object} block - The memory block to promote
        */
       promoteBlockToL1: function(block) {
           // Create a copy of the block
           const blockCopy = { ...block };
           
           // Add to L1 cache
           this.loadBlockToCache(blockCopy, this.l1Cache);
       },
       
       /**
        * Animates data transfer between memory levels
        * @param {string} path - The data transfer path to animate
        */
       animateDataTransfer: function(path) {
           let packet;
           
           switch(path) {
               case 'ram-to-l2':
                   packet = document.getElementById('packet-l2-ram');
                   packet.style.left = '50px';
                   packet.style.opacity = '1';
                   
                   setTimeout(() => {
                       packet.style.left = '0px';
                       setTimeout(() => {
                           packet.style.opacity = '0';
                       }, 300);
                   }, 300);
                   break;
                   
               case 'l2-to-l1':
                   packet = document.getElementById('packet-l1-l2');
                   packet.style.left = '50px';
                   packet.style.opacity = '1';
                   
                   setTimeout(() => {
                       packet.style.left = '0px';
                       setTimeout(() => {
                           packet.style.opacity = '0';
                       }, 300);
                   }, 300);
                   break;
                   
               case 'l1-to-cpu':
                   packet = document.getElementById('packet-cpu-l1');
                   packet.style.left = '50px';
                   packet.style.opacity = '1';
                   
                   setTimeout(() => {
                       packet.style.left = '0px';
                       setTimeout(() => {
                           packet.style.opacity = '0';
                       }, 300);
                   }, 300);
                   break;
           }
       }
   };

   /**
    * Sets up all event handlers for user interaction
    */
   function setupEventHandlers() {
       // Memory access button
       document.getElementById('access-btn').addEventListener('click', function() {
           const addressInput = document.getElementById('address-input');
           const address = parseInt(addressInput.value);
           
           if (isNaN(address) || address < 0 || address > 255) {
               alert('Please enter a valid address between 0 and 255');
               return;
           }
           
           const operationType = document.getElementById('operation-type').value;
           
           if (operationType === 'write') {
               const dataInput = document.getElementById('data-input').value;
               memory.accessMemory(address, true, dataInput);
           } else {
               memory.accessMemory(address, false);
           }
       });
       
       // Reset button
       document.getElementById('clear-btn').addEventListener('click', function() {
           memory.init();
           stats.totalAccesses = 0;
           stats.l1Hits = 0;
           stats.l2Hits = 0;
           stats.misses = 0;
           stats.updateStats();
           document.getElementById('current-status').textContent = 'Status: Cache cleared. Ready to simulate.';
       });
       
       // Operation type change
       document.getElementById('operation-type').addEventListener('change', function() {
           const dataInputGroup = document.getElementById('data-input-group');
           if (this.value === 'write') {
               dataInputGroup.style.display = 'block';
           } else {
               dataInputGroup.style.display = 'none';
           }
       });
       
       // Replacement policy change
       document.getElementById('replacement-policy').addEventListener('change', function() {
           config.replacement = this.value;
       });
       
       // Access pattern change
       document.getElementById('access-pattern').addEventListener('change', function() {
           const autoSpeedGroup = document.getElementById('auto-speed-group');
           if (this.value !== 'manual') {
               autoSpeedGroup.style.display = 'block';
               config.autoPattern = this.value;
           } else {
               autoSpeedGroup.style.display = 'none';
           }
       });
       
       // Auto speed change
       document.getElementById('auto-speed').addEventListener('change', function() {
           switch(this.value) {
               case 'slow':
                   config.autoSpeed = 2000;
                   break;
               case 'medium':
                   config.autoSpeed = 1000;
                   break;
               case 'fast':
                   config.autoSpeed = 500;
                   break;
           }
       });
       
       // Auto run buttons
       document.getElementById('auto-btn').addEventListener('click', function() {
           if (config.autoRunning) return;
           
           config.autoRunning = true;
           this.disabled = true;
           document.getElementById('stop-btn').disabled = false;
           
           runAutoAccess();
       });
       
       document.getElementById('stop-btn').addEventListener('click', function() {
           config.autoRunning = false;
           this.disabled = true;
           document.getElementById('auto-btn').disabled = false;
       });
   }
   
   /**
    * Auto access patterns for automated demonstration
    * Manages different memory access patterns for educational purposes
    */
   let autoAddressCounter = 0;
   function runAutoAccess() {
       if (!config.autoRunning) return;
       
       let address;
       const operationType = Math.random() > 0.7 ? 'write' : 'read';
       
       switch(config.autoPattern) {
           case 'sequential':
               // Sequential access pattern
               address = autoAddressCounter % 256;
               autoAddressCounter++;
               break;
               
           case 'random':
               // Random access pattern
               address = Math.floor(Math.random() * 256);
               break;
               
           case 'locality':
               // Spatial locality pattern - stays in regions
               if (autoAddressCounter % 10 === 0) {
                   // Occasionally jump to a new region
                   autoAddressCounter = Math.floor(Math.random() * 230);
               }
               address = (autoAddressCounter + Math.floor(Math.random() * 5)) % 256;
               autoAddressCounter++;
               break;
       }
       
       // Update UI to show current address
       document.getElementById('address-input').value = address;
       document.getElementById('operation-type').value = operationType;
       
       // Handle data input for write operations
       if (operationType === 'write') {
           document.getElementById('data-input').value = '0x' + 
               Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0');
           document.getElementById('data-input-group').style.display = 'block';
       } else {
           document.getElementById('data-input-group').style.display = 'none';
       }
       
       // Trigger the memory access
       if (operationType === 'write') {
           memory.accessMemory(address, true, document.getElementById('data-input').value);
       } else {
           memory.accessMemory(address, false);
       }
       
       // Schedule the next access
       setTimeout(runAutoAccess, config.autoSpeed);
   }

   /**
    * Helper function to add tooltips for educational explanations
    * @param {string} elementId - The element to attach the tooltip to
    * @param {string} tooltipText - The explanation text
    */
   function addTooltip(elementId, tooltipText) {
       const element = document.getElementById(elementId);
       if (element) {
           element.setAttribute('title', tooltipText);
       }
   }

   // Initialize the simulator
   setupEventHandlers();
   memory.init();
   
   // Add educational tooltips
   addTooltip('l1-hits', 'A cache hit occurs when requested data is found in the L1 cache, providing fastest access');
   addTooltip('l2-hits', 'An L2 cache hit occurs when data is not in L1 but is found in the L2 cache');
   addTooltip('misses', 'A cache miss occurs when data must be retrieved from main memory, which is much slower');
   addTooltip('hit-ratio', 'The percentage of memory accesses that resulted in cache hits. Higher ratios indicate better performance');
   addTooltip('replacement-policy', 'Determines which cache block to replace when the cache is full and a new block needs to be loaded');
});
