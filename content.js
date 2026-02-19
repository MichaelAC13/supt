let wordBank = {};
chrome.storage.local.get(null, (items) => { wordBank = items; });

function updateStats(clean, isClick = false) {
    // Se não existe no banco e não é um clique, não fazemos nada
    if (!wordBank[clean] && !isClick) return;

    // Se é clique ou já existe, atualizamos
    let data = typeof wordBank[clean] === 'object' ? wordBank[clean] : { color: "#90EE90", hits: 0 };
    
    data.hits = Math.min((data.hits || 0) + 1, 9999);
    data.lastMatch = new Date().toLocaleString();
    data.color = "#90EE90";

    wordBank[clean] = data;
    chrome.storage.local.set({ [clean]: data });
}

function tokenize(el) {
    if (el.dataset.lastText === el.textContent) return;
    el.dataset.lastText = el.textContent;

    // REGEX: Agora aceita letras, apóstrofe (') e hífen (-)
    const words = el.textContent.split(/\s+/);
    let newHTML = '';

    for (let word of words) {
        const clean = word.toLowerCase().replace(/[^a-zà-ú'-]/gi, "");
        
        if (clean.length > 0) {
            const isSaved = wordBank[clean];
            
            if (isSaved) {
                updateStats(clean); // Soma +1 hit a cada vez que a palavra aparece
                const style = `style="color: #90EE90 !important; font-weight: bold;"`;
                newHTML += `<span class="word-clickable" data-word="${clean}" ${style}>${word}</span> `;
            } else {
                newHTML += `<span class="word-clickable" data-word="${clean}">${word}</span> `;
            }
        } else {
            newHTML += word + ' ';
        }
    }
    el.innerHTML = newHTML;
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('word-clickable')) {
        const clean = e.target.dataset.word;
        
        // Força a criação/atualização no banco no momento do clique
        updateStats(clean, true);

        document.querySelectorAll(`.word-clickable[data-word="${clean}"]`).forEach(s => {
            s.style.cssText = "color: #90EE90 !important; font-weight: bold;";
        });
    }
}, true);

const observer = new MutationObserver(() => {
    const segments = document.getElementsByClassName('ytp-caption-segment');
    for (let i = 0; i < segments.length; i++) {
        tokenize(segments[i]);
    }
});

observer.observe(document.body, { childList: true, subtree: true });