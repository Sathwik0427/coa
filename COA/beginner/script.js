/**
 * ComputerOrg Educational Platform
 * 
 * This script manages all interactive elements of the educational platform,
 * providing dynamic functionality for binary conversion and logic gate simulation.
 * 
 * @version 1.1.0
 */

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
   // Initialize all interactive components
   initBinaryConverter();
   initLogicGateSimulator();
   initSectionAnimations();
   
   // Enable smooth scrolling for navigation links
   initSmoothScrolling();
});

/**
* Binary Number Converter
* 
* Handles conversion between decimal and binary number systems with
* input validation and error handling.
*/
function initBinaryConverter() {
   // Get the convert button element
   const convertBtn = document.getElementById('convert-btn');
   
   // Add event listener if button exists
   if (convertBtn) {
       convertBtn.addEventListener('click', performConversion);
       
       // Also add event listeners for pressing Enter key in input field
       const numberInput = document.getElementById('number-input');
       if (numberInput) {
           numberInput.addEventListener('keypress', function(event) {
               if (event.key === 'Enter') {
                   performConversion();
               }
           });
       }
       
       // Initialize with default conversion
       performConversion();
   }
}

/**
* Performs the binary/decimal conversion based on user input
* Includes validation and error handling
*/
function performConversion() {
   // Get necessary elements
   const numberInput = document.getElementById('number-input');
   const conversionType = document.getElementById('conversion-type');
   const resultElement = document.getElementById('conversion-result');
   
   // Check if all required elements exist
   if (!numberInput || !conversionType || !resultElement) {
       console.error('Required elements for binary converter not found');
       return;
   }
   
   // Input validation
   if (numberInput.value.trim() === '') {
       displayResult(resultElement, 'Please enter a number', true);
       return;
   }
   
   try {
       if (conversionType.value === 'decimal-to-binary') {
           // Decimal to binary conversion
           const decimal = parseInt(numberInput.value, 10);
           
           if (isNaN(decimal) || decimal < 0) {
               displayResult(resultElement, 'Please enter a valid positive number', true);
               return;
           }
           
           // Format binary output with spacing for readability
           const binaryResult = decimal.toString(2);
           displayResult(resultElement, formatBinaryOutput(binaryResult));
           
       } else {
           // Binary to decimal conversion
           const binary = numberInput.value.trim();
           
           // Validate binary input (only 0s and 1s)
           if (!/^[01]+$/.test(binary)) {
               displayResult(resultElement, 'Please enter a valid binary number (0s and 1s only)', true);
               return;
           }
           
           // Perform conversion and display
           const decimalResult = parseInt(binary, 2);
           displayResult(resultElement, decimalResult.toString());
       }
   } catch (error) {
       console.error('Conversion error:', error);
       displayResult(resultElement, 'An error occurred during conversion', true);
   }
}

/**
* Formats a binary number for improved readability
* @param {string} binary - The binary number as a string
* @returns {string} - Formatted binary with spaces
*/
function formatBinaryOutput(binary) {
   // For longer binary numbers, add a space every 4 digits for readability
   if (binary.length > 4) {
       return binary.match(/.{1,4}/g).join(' ');
   }
   return binary;
}

/**
* Updates the result display with proper formatting
* @param {HTMLElement} element - The element to display the result in
* @param {string} text - The text to display
* @param {boolean} isError - Whether this is an error message
*/
function displayResult(element, text, isError = false) {
   if (element) {
       element.textContent = text;
       
       if (isError) {
           element.classList.add('error');
       } else {
           element.classList.remove('error');
       }
   }
}

/**
* Logic Gate Simulator
* 
* Simulates various logic gates (AND, OR, NOT, XOR) by showing
* their behavior with different input combinations.
*/
function initLogicGateSimulator() {
   // Get the simulator elements
   const gateSelector = document.getElementById('gate-selector');
   const inputA = document.getElementById('input-a');
   const inputB = document.getElementById('input-b');
   
   // Add event listeners to simulator controls if they exist
   if (gateSelector && inputA && inputB) {
       gateSelector.addEventListener('change', updateLogicGate);
       inputA.addEventListener('change', updateLogicGate);
       inputB.addEventListener('change', updateLogicGate);
       
       // Initialize the simulator with default values
       updateLogicGate();
   } else {
       console.warn('Logic gate simulator elements not found');
   }
}

/**
* Updates the logic gate simulation based on current inputs and selected gate
*/
function updateLogicGate() {
   // Get simulator elements
   const gateSelector = document.getElementById('gate-selector');
   const inputA = document.getElementById('input-a');
   const inputAValue = document.getElementById('input-a-value');
   const inputB = document.getElementById('input-b');
   const inputBValue = document.getElementById('input-b-value');
   const inputBContainer = document.getElementById('input-b-container');
   const gateSymbol = document.getElementById('gate-symbol');
   const outputValue = document.getElementById('output-value');
   
   // Check if all elements exist
   if (!gateSelector || !inputA || !inputB || !inputAValue || !inputBValue || 
       !inputBContainer || !gateSymbol || !outputValue) {
       console.error('Required elements for logic gate simulator not found');
       return;
   }
   
   // Get current values
   const gateType = gateSelector.value;
   const inputAState = inputA.checked ? 1 : 0;
   const inputBState = inputB.checked ? 1 : 0;
   
   // Update input value displays
   inputAValue.textContent = inputAState;
   inputBValue.textContent = inputBState;
   
   // Update gate symbol text
   gateSymbol.textContent = gateType;
   
   // Handle special case for NOT gate (single input)
   if (gateType === 'NOT') {
       inputBContainer.style.display = 'none';
   } else {
       inputBContainer.style.display = 'flex';
   }
   
   // Calculate and display output
   const output = calculateLogicOutput(gateType, inputAState, inputBState);
   outputValue.textContent = output;
   
   // Visual feedback based on output (green for 1, red for 0)
   if (output === 1) {
       outputValue.style.backgroundColor = '#4caf50'; // Success color
       outputValue.style.color = 'white';
   } else {
       outputValue.style.backgroundColor = '#f44336'; // Error color
       outputValue.style.color = 'white';
   }
}

/**
* Calculates the output of a logic gate based on inputs and gate type
* @param {string} gateType - The type of logic gate
* @param {number} inputA - First input (0 or 1)
* @param {number} inputB - Second input (0 or 1)
* @returns {number} - The calculated output (0 or 1)
*/
function calculateLogicOutput(gateType, inputA, inputB) {
   switch(gateType) {
       case 'AND':
           return (inputA && inputB) ? 1 : 0;
           
       case 'OR':
           return (inputA || inputB) ? 1 : 0;
           
       case 'NOT':
           return inputA ? 0 : 1;
           
       case 'XOR':
           return (inputA !== inputB) ? 1 : 0;
           
       default:
           console.error('Unknown gate type:', gateType);
           return 0;
   }
}

/**
* Gets the value of a CSS variable
* @param {string} varName - The CSS variable name (without --) 
* @param {string} fallback - Fallback value if variable isn't defined
* @returns {string} - The variable value or fallback
*/
function getCSSVariable(varName, fallback) {
   const style = getComputedStyle(document.documentElement);
   return style.getPropertyValue(`--${varName}`).trim() || fallback;
}

/**
* Adds subtle animations when sections scroll into view
* Enhances the learning experience with visual feedback
*/
function initSectionAnimations() {
   // Check if Intersection Observer API is supported
   if ('IntersectionObserver' in window) {
       const sections = document.querySelectorAll('.section');
       
       // If no sections are found, exit quietly
       if (!sections.length) {
           console.warn('No sections found to animate');
           return;
       }
       
       // Configuration for the observer
       const observerOptions = {
           root: null, // viewport is the root
           rootMargin: '0px',
           threshold: 0.15 // trigger when 15% of the section is visible
       };
       
       // Create the observer
       const sectionObserver = new IntersectionObserver((entries) => {
           entries.forEach(entry => {
               if (entry.isIntersecting) {
                   // Add the visible class to trigger animations
                   entry.target.classList.add('visible');
               }
           });
       }, observerOptions);
       
       // Start observing each section
       sections.forEach(section => {
           section.style.opacity = '0.4';
           section.style.transform = 'translateY(20px)';
           section.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
           sectionObserver.observe(section);
       });
   }
}

/**
* Enables smooth scrolling for navigation links
* Improves user experience when navigating between sections
*/
function initSmoothScrolling() {
   // Get all links that point to IDs on the same page
   const links = document.querySelectorAll('a[href^="#"]');
   
   if (!links.length) {
       return; // No links to process
   }
   
   links.forEach(link => {
       link.addEventListener('click', function(e) {
           // Get the target section
           const targetId = this.getAttribute('href');
           
           // Skip if it's just "#" (empty link)
           if (targetId === '#') return;
           
           const targetElement = document.querySelector(targetId);
           
           if (targetElement) {
               e.preventDefault();
               
               // Smooth scroll to the target
               targetElement.scrollIntoView({
                   behavior: 'smooth',
                   block: 'start'
               });
           }
       });
   });
}

/**
* Compatibility fix for the original convertNumber function
* This ensures backward compatibility with the original HTML
*/
function convertNumber() {
   performConversion();
}
