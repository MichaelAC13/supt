let wordBank = {};

// Função de Toast (Substitui o Alert)
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'yt-toast';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function safeStorage(data) {
    if (chrome.runtime && chrome.runtime.id) {
        chrome.storage.local.set(data);
    }
}

chrome.storage.local.get(null, (items) => { 
    wordBank = items; 
    updateCountDisplay();
});

function updateStats(clean, isClick = false) {
    if (!wordBank[clean] && !isClick) return;
    let data = typeof wordBank[clean] === 'object' ? wordBank[clean] : { hits: 0 };
    data.hits = Math.min((data.hits || 0) + 1, 9999);
    data.lastMatch = new Date().toLocaleString();
    data.color = "#90EE90";
    wordBank[clean] = data;
    safeStorage({ [clean]: data });
    updateCountDisplay();
}

function tokenize(el) {
    if (el.dataset.lastText === el.textContent) return;
    el.dataset.lastText = el.textContent;
    const words = el.textContent.split(/\s+/);
    let newHTML = '';
    for (let word of words) {
        const clean = word.toLowerCase().replace(/[^a-zà-ú'-]/gi, "");
        if (clean.length > 0) {
            const isSaved = wordBank[clean];
            const style = isSaved ? `style="color: #90EE90 !important; font-weight: bold;"` : '';
            newHTML += `<span class="word-clickable" data-word="${clean}" ${style}>${word}</span> `;
            if (isSaved) updateStats(clean);
        } else { newHTML += word + ' '; }
    }
    el.innerHTML = newHTML;
}

// --- INTERFACE ---
function injectUI() {
    const container = document.createElement('div');
    container.id = 'yt-dash-container';
    container.innerHTML = `
        <div id="yt-dash-toggle" title="Arraste ou Clique">🧊</div>
        <div id="yt-dash-panel">
            <input type="text" id="manual-word" placeholder="Add word...">
            <div class="dash-row">
                <div id="export-btn" class="dash-btn-sq" title="Exportar Backup">📤</div>
                <div id="import-btn" class="dash-btn-sq" title="Importar Backup">📥</div>
                <div id="dash-status">0 w</div>
            </div>
            <input type="file" id="file-input" style="display:none">
        </div>
    `;
    document.body.appendChild(container);

    const panel = document.getElementById('yt-dash-panel');
    const toggle = document.getElementById('yt-dash-toggle');

    // Toggle Expand/Collapse (O ícone fica fixo no topo da pilha)
    toggle.onclick = (e) => {
        if (e.target.dataset.dragging === "true") return;
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    };

    // Exportar
    document.getElementById('export-btn').onclick = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(wordBank, null, 2));
        const dl = document.createElement('a');
        dl.setAttribute("href", dataStr);
        dl.setAttribute("download", "vocab.json");
        dl.click();
        showToast("Backup exportado!");
    };

    // Importar
    const fileInput = document.getElementById('file-input');
    document.getElementById('import-btn').onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (re) => {
            wordBank = JSON.parse(re.target.result);
            safeStorage(wordBank);
            showToast("Banco Importado!");
            setTimeout(() => location.reload(), 1000);
        };
        reader.readAsText(e.target.files[0]);
    };

    // Input Manual
    document.getElementById('manual-word').onkeypress = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            const val = e.target.value.toLowerCase().replace(/[^a-zà-ú'-]/gi, "");
            updateStats(val, true);
            e.target.value = '';
            showToast(`"${val}" salva!`);
        }
    };

    makeDraggable(container, toggle);
}

function updateCountDisplay() {
    const status = document.getElementById('dash-status');
    if (status) status.innerText = `${Object.keys(wordBank).length} words`;
}

function makeDraggable(container, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = (e) => {
        handle.style.cursor = 'grabbing';
        handle.dataset.dragging = "false";
        pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
            handle.style.cursor = 'grab';
        };
        document.onmousemove = (e) => {
            handle.dataset.dragging = "true";
            pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
            pos3 = e.clientX; pos4 = e.clientY;
            container.style.top = (container.offsetTop - pos2) + "px";
            container.style.left = (container.offsetLeft - pos1) + "px";
            container.style.right = 'auto';
        };
    };
}

// --- OBSERVER ---
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('word-clickable')) {
        const clean = e.target.dataset.word;
        updateStats(clean, true);
        document.querySelectorAll(`.word-clickable[data-word="${clean}"]`).forEach(s => {
            s.style.cssText = "color: #90EE90 !important; font-weight: bold;";
        });
        showToast(`Match: ${clean}`);
    }
}, true);

const observer = new MutationObserver(() => {
    const segments = document.getElementsByClassName('ytp-caption-segment');
    for (let i = 0; i < segments.length; i++) tokenize(segments[i]);
});
observer.observe(document.body, { childList: true, subtree: true });

injectUI();