// Mobile Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const navbar = document.getElementById('navbar');

menuToggle.addEventListener('click', () => {
    navbar.classList.toggle('active');
    
    // Change icon based on menu state
    if (navbar.classList.contains('active')) {
        menuToggle.innerHTML = '<i class="fas fa-times"></i>';
    } else {
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
});

// Handle dropdown menus in mobile view
const dropdowns = document.querySelectorAll('.dropdown');

dropdowns.forEach(dropdown => {
    dropdown.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            dropdown.classList.toggle('active');
        }
    });
});

// Topic toggles
function toggleTopic(topicId) {
    const content = document.getElementById(topicId);
    content.classList.toggle('active');
    
    // Toggle icon
    const parent = content.previousElementSibling;
    const icon = parent.querySelector('.toggle-icon i');
    
    if (content.classList.contains('active')) {
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

// Tab functionality
function changeTab(tabId) {
    // Hide all tab content
    const tabContents = document.querySelectorAll('.tab-pane');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content and activate button
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[onclick="changeTab('${tabId}')"]`).classList.add('active');
}

// Binary converter functionality
function convertNumber() {
    const decimal = document.getElementById('decimal-input').value;
    
    if (decimal === '' || isNaN(decimal)) {
        alert('Please enter a valid number');
        return;
    }
    
    const num = parseInt(decimal);
    
    document.getElementById('binary-result').textContent = num.toString(2);
    document.getElementById('hex-result').textContent = num.toString(16).toUpperCase();
    document.getElementById('octal-result').textContent = num.toString(8);
}

// Quiz functionality
function checkAnswer() {
    const options = document.querySelectorAll('input[name="quiz"]');
    let selectedAnswer = '';
    
    for (const option of options) {
        if (option.checked) {
            selectedAnswer = option.value;
            break;
        }
    }
    
    if (selectedAnswer === '') {
        alert('Please select an answer');
        return;
    }
    
    const resultContainer = document.getElementById('result-container');
    
    if (selectedAnswer === 'Harvard') {
        resultContainer.textContent = 'Correct! Harvard architecture uses separate memory for instructions and data.';
        resultContainer.className = 'correct';
    } else {
        resultContainer.textContent = 'Incorrect. Harvard architecture is the one that uses separate memory for instructions and data.';
        resultContainer.className = 'incorrect';
    }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if (this.getAttribute('href') !== '#') {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (navbar.classList.contains('active')) {
                    navbar.classList.remove('active');
                    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        }
    });
});

// Set first topic as active by default
window.addEventListener('DOMContentLoaded', () => {
    toggleTopic('basics-content');
    
    // Handle active menu item based on scroll position
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav ul li a');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});

// Animation on scroll
window.addEventListener('scroll', () => {
    const pathCards = document.querySelectorAll('.path-card');
    const simulatorCards = document.querySelectorAll('.simulator-card');
    
    // Animate path cards
    pathCards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (cardTop < windowHeight - 100) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    });
    
    // Animate simulator cards
    simulatorCards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (cardTop < windowHeight - 100) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    });
});

// Initialize cards with 0 opacity
document.addEventListener('DOMContentLoaded', () => {
    const pathCards = document.querySelectorAll('.path-card');
    const simulatorCards = document.querySelectorAll('.simulator-card');
    
    pathCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    simulatorCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // Trigger scroll event to check initial visibility
    window.dispatchEvent(new Event('scroll'));
});
