/**
 * Controlador del Centro de Ayuda
 * Búsqueda, FAQ y navegación
 */

const Help = {
    init() {
        // Bind search input
        const searchInput = document.getElementById('help-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.search(e.target.value));
        }
    },

    // Buscar en ayuda
    search(query) {
        const faqItems = document.querySelectorAll('.faq-item');

        if (!query || query.trim() === '') {
            faqItems.forEach(item => {
                item.style.display = 'block';
                item.classList.remove('open');
                const answer = item.querySelector('.faq-answer');
                if (answer) answer.style.display = 'none';
            });
            return;
        }

        const q = query.toLowerCase();

        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question span')?.textContent.toLowerCase() || '';
            const answer = item.querySelector('.faq-answer')?.textContent.toLowerCase() || '';

            if (question.includes(q) || answer.includes(q)) {
                item.style.display = 'block';
                item.classList.add('open');
                const answerEl = item.querySelector('.faq-answer');
                if (answerEl) answerEl.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    },

    // Toggle FAQ item
    toggleFaq(element) {
        const answer = element.querySelector('.faq-answer');
        const arrow = element.querySelector('.faq-arrow');

        if (answer) {
            const isOpen = answer.style.display === 'block';
            answer.style.display = isOpen ? 'none' : 'block';
            if (arrow) {
                arrow.textContent = isOpen ? '▼' : '▲';
            }
            element.classList.toggle('open', !isOpen);
        }
    },

    // Scroll a sección
    scrollTo(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    // Toast
    showToast(message) {
        const container = document.getElementById('toastContainer') || document.body;

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(26, 26, 26, 0.95);
            color: #F0EDE5;
            padding: 12px 24px;
            border-radius: 8px;
            border: 1px solid rgba(197, 160, 88, 0.3);
            z-index: 9999;
            animation: fadeIn 0.3s ease;
        `;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }
};

// Añadir estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    .faq-item.open .faq-arrow {
        transform: rotate(180deg);
    }
    .faq-arrow {
        transition: transform 0.2s ease;
    }
`;
document.head.appendChild(style);

// Make available globally
window.Help = Help;
