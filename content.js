let wordBank = {};
chrome.storage.local.get(null, (items) => { wordBank = items; });

function tokenize(el) {
    // SEGREDO: Se o texto atual for igual ao que já salvamos no atributo, para tudo.
    if (el.dataset.lastText === el.textContent) return;
    el.dataset.lastText = el.textContent;

    const words = el.textContent.split(/\s+/);
    let newHTML = '';

    for (let word of words) {
        // Limpa para a chave (case-insensitive)
        const clean = word.toLowerCase().replace(/[^a-zà-ú]/gi, "");
        
        if (clean.length > 0) {
            const isSaved = wordBank[clean];
            const style = isSaved ? `style="color: #90EE90 !important; font-weight: bold;"` : '';
            newHTML += `<span class="word-clickable" data-word="${clean}" ${style}>${word}</span> `;
        } else {
            newHTML += word + ' ';
        }
    }
    el.innerHTML = newHTML;
}

// Clique direto e simples
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('word-clickable')) {
        const clean = e.target.dataset.word; // Já está em lowercase
        wordBank[clean] = "#90EE90";
        chrome.storage.local.set({ [clean]: "#90EE90" });

        // Pinta na tela sem loop pesado
        document.querySelectorAll(`.word-clickable[data-word="${clean}"]`).forEach(s => {
            s.style.cssText = "color: #90EE90 !important; font-weight: bold;";
        });
    }
}, true);

// Observador ultra-focado (Apenas nos segmentos)
const observer = new MutationObserver(() => {
    const segments = document.getElementsByClassName('ytp-caption-segment');
    for (let i = 0; i < segments.length; i++) {
        tokenize(segments[i]);
    }
});

observer.observe(document.body, { childList: true, subtree: true });