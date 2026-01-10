let currentMemoSettingsTarget = null; // { type: 'common'|'yearly', id: '...' }

window.addEventListener('load', () => {
    // Initial load handled at the bottom
});

function initializeMemoData() {
    if (!roadmapData.memoPage) {
        roadmapData.memoPage = {
            common: [],
            yearly: {}
        };
    }
    if (!roadmapData.memoPage.yearly) {
        roadmapData.memoPage.yearly = {};
    }
    // Migration: If no yearly data for current year, init it
    if (!roadmapData.memoPage.yearly[currentYear]) {
        roadmapData.memoPage.yearly[currentYear] = [];
    }
}

function renderMemoPage() {
    renderCommonMemos();
    renderYearlyMemos();
    updateYearDisplay();
}

function updateYearDisplay() {
    const el = document.getElementById('currentYearDisplay');
    if (el) el.innerText = currentYear;
}

// --- Common Memos ---

function renderCommonMemos() {
    const listEl = document.getElementById('commonMemoList');
    listEl.innerHTML = '';

    if (!roadmapData.memoPage.common) roadmapData.memoPage.common = [];
    const memos = roadmapData.memoPage.common;

    memos.forEach(memo => {
        listEl.appendChild(createMemoBlockElement(memo, 'common'));
    });
}

// --- Yearly Memos ---

function renderYearlyMemos() {
    const listEl = document.getElementById('yearlyMemoList');
    listEl.innerHTML = '';

    if (!roadmapData.memoPage.yearly[currentYear]) roadmapData.memoPage.yearly[currentYear] = [];
    const memos = roadmapData.memoPage.yearly[currentYear];

    memos.forEach(memo => {
        listEl.appendChild(createMemoBlockElement(memo, 'yearly'));
    });
}

// --- Memo Block Component ---

function createMemoBlockElement(memo, type) {
    const div = document.createElement('div');
    div.className = 'glass-panel rounded-xl p-4 flex flex-col gap-2 group relative border border-white/10 bg-gray-800/40 hover:bg-gray-800/60 transition';
    div.setAttribute('data-id', memo.id);

    // Header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-1 cursor-grab active:cursor-grabbing handle';

    const leftHeader = document.createElement('div');
    leftHeader.className = 'flex items-center gap-2 flex-1 mr-2 min-w-0';

    // Drag Handle Icon
    const handleIcon = document.createElement('span');
    handleIcon.className = 'text-gray-500 text-lg select-none mr-2 flex-shrink-0';
    handleIcon.innerText = '⋮⋮';
    leftHeader.appendChild(handleIcon);

    // Editable Title
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = memo.title || '';
    titleInput.placeholder = '제목 없음';
    // Dynamic Title Size Class
    const titleSizeClass = memo.titleSize || 'text-base';
    titleInput.className = `bg-transparent font-bold text-white focus:outline-none focus:border-b focus:border-blue-500 w-full min-w-0 ${titleSizeClass}`;

    // Auto-save on input with debounce
    let titleDebounce;
    titleInput.addEventListener('input', (e) => {
        clearTimeout(titleDebounce);
        titleDebounce = setTimeout(() => {
            updateMemo(type, memo.id, { title: e.target.value });
        }, 500);
    });
    titleInput.onblur = (e) => updateMemo(type, memo.id, { title: e.target.value });

    leftHeader.appendChild(titleInput);

    header.appendChild(leftHeader);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0';

    // Settings Button
    const settingsBtn = document.createElement('button');
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.className = 'text-xs text-gray-400 hover:text-white p-1';
    settingsBtn.onclick = () => openMemoSettings(type, memo.id);
    actions.appendChild(settingsBtn);

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '×';
    deleteBtn.className = 'text-lg text-red-400 hover:text-red-300 p-1 leading-none';
    deleteBtn.onclick = () => deleteMemoBlock(type, memo.id);
    actions.appendChild(deleteBtn);

    header.appendChild(actions);
    div.appendChild(header);

    // Content
    const textarea = document.createElement('textarea');
    textarea.className = 'w-full bg-[#0f172a]/50 border border-white/5 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 resize-y custom-scrollbar';
    textarea.style.minHeight = '120px';
    textarea.style.maxHeight = '400px'; // Prevent it from becoming too huge, force scroll
    textarea.value = memo.content || '';
    textarea.placeholder = "내용을 입력하세요...";

    // Auto-save on input with debounce
    let contentDebounce;
    textarea.addEventListener('input', (e) => {
        clearTimeout(contentDebounce);
        contentDebounce = setTimeout(() => {
            updateMemo(type, memo.id, { content: e.target.value });
        }, 500);
    });
    textarea.onblur = (e) => updateMemo(type, memo.id, { content: e.target.value });

    div.appendChild(textarea);

    return div;
}

// --- Actions ---

function addNewMemoBlock(type) {
    const newMemo = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        title: '',
        content: '',
        titleSize: 'text-base',
        createdAt: Date.now()
    };

    if (type === 'common') {
        if (!roadmapData.memoPage.common) roadmapData.memoPage.common = [];
        roadmapData.memoPage.common.push(newMemo);
    } else {
        if (!roadmapData.memoPage.yearly[currentYear]) roadmapData.memoPage.yearly[currentYear] = [];
        roadmapData.memoPage.yearly[currentYear].push(newMemo);
    }

    saveData();
    renderMemoPage();
}

function updateMemo(type, id, updates) {
    let list;
    if (type === 'common') list = roadmapData.memoPage.common;
    else list = roadmapData.memoPage.yearly[currentYear];

    const memo = list.find(m => m.id === id);
    if (memo) {
        Object.assign(memo, updates);
        saveData();
    }
}

function deleteMemoBlock(type, id) {
    if (!confirm('정말로 이 메모를 삭제하시겠습니까?')) return;

    let list;
    if (type === 'common') list = roadmapData.memoPage.common;
    else list = roadmapData.memoPage.yearly[currentYear];

    const idx = list.findIndex(m => m.id === id);
    if (idx !== -1) {
        list.splice(idx, 1);
        saveData();
        renderMemoPage();
    }
}

// --- Drag and Drop ---

function setupSortables() {
    const commonList = document.getElementById('commonMemoList');
    const yearlyList = document.getElementById('yearlyMemoList');

    new Sortable(commonList, {
        handle: '.handle',
        animation: 150,
        ghostClass: 'opacity-50',
        onEnd: (evt) => {
            const newOrderIds = Array.from(commonList.children).map(child => child.getAttribute('data-id'));
            reorderMemos('common', newOrderIds);
        }
    });

    new Sortable(yearlyList, {
        handle: '.handle',
        animation: 150,
        ghostClass: 'opacity-50',
        onEnd: (evt) => {
            const newOrderIds = Array.from(yearlyList.children).map(child => child.getAttribute('data-id'));
            reorderMemos('yearly', newOrderIds);
        }
    });
}

function reorderMemos(type, newIds) {
    let list;
    if (type === 'common') list = roadmapData.memoPage.common;
    else list = roadmapData.memoPage.yearly[currentYear];

    // Create a map for quick lookup
    const memoMap = new Map(list.map(m => [m.id, m]));

    // Rebuild list in new order
    const newList = newIds.map(id => memoMap.get(id)).filter(Boolean);

    if (type === 'common') roadmapData.memoPage.common = newList;
    else roadmapData.memoPage.yearly[currentYear] = newList;

    saveData();
}

// --- Settings ---

function openMemoSettings(type, id) {
    currentMemoSettingsTarget = { type, id };
    document.getElementById('memoSettingsModal').style.display = 'flex';
}

function closeMemoSettings() {
    document.getElementById('memoSettingsModal').style.display = 'none';
    currentMemoSettingsTarget = null;
}

function setMemoTitleSize(sizeClass) {
    if (!currentMemoSettingsTarget) return;
    updateMemo(currentMemoSettingsTarget.type, currentMemoSettingsTarget.id, { titleSize: sizeClass });
    renderMemoPage(); // Re-render to show change
    // closeMemoSettings(); // Optional: close or keep open. User might want to try multiple.
}

// --- Year Navigation override ---
// Typically changeYear is in data.js, but we need to refresh THIS page's UI
// wrapper around global changeYear

const originalChangeYear = window.changeYear;
window.changeYear = function (delta) {
    if (typeof originalChangeYear === 'function') {
        originalChangeYear(delta);
    } else {
        // Fallback if data.js wasn't loaded correctly or something
        currentYear += delta;
        if (typeof updateUI === 'function') updateUI();
    }
};
// Actually, data.js's changeYear is defined globally.
// We just need to define `window.updateUI` in memo.js to rerender memos.

// --- Subtitle Editing ---

function renderPageSubtitle() {
    const subtitleEl = document.getElementById('pageSubtitle');
    if (!subtitleEl) return;
    const text = (roadmapData.memoPage && roadmapData.memoPage.subtitle)
        ? roadmapData.memoPage.subtitle
        : "공통 메모와 연도별 메모를 자유롭게 관리하세요.";
    subtitleEl.innerText = text;
}

function togglePageSubtitleEdit() {
    const subtitleEl = document.getElementById('pageSubtitle');
    if (!subtitleEl) return;

    const currentText = subtitleEl.innerText;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'w-full max-w-2xl bg-gray-800 text-gray-400 text-sm border border-blue-500 rounded px-2 py-0.5 focus:outline-none';

    input.onblur = function () {
        const val = this.value;
        if (!roadmapData.memoPage) roadmapData.memoPage = { common: [], yearly: {} };
        roadmapData.memoPage.subtitle = val;
        saveData();

        const p = document.createElement('p');
        p.id = 'pageSubtitle';
        p.className = 'text-gray-400 text-sm cursor-pointer hover:text-blue-400 transition';
        p.innerText = val;
        p.onclick = togglePageSubtitleEdit;
        p.title = '클릭하여 설명 수정';

        this.replaceWith(p);
    };

    input.onkeydown = function (e) {
        if (e.key === 'Enter') this.blur();
    };

    subtitleEl.replaceWith(input);
    input.focus();
}

window.updateUI = function () {
    initializeMemoData();
    renderPageTitle('memo'); // Ensure global title render is called
    renderPageSubtitle();
    renderMemoPage();
};

window.addEventListener('load', () => {
    window.currentPageType = 'memo'; // For sidebar highlighting if we add it
    if (typeof loadData === 'function') loadData(); // Load data from local storage
    initializeMemoData();
    // Render initially
    if (typeof renderPageTitle === 'function') renderPageTitle('memo');
    renderPageSubtitle();
    renderMemoPage();
    setupSortables();
});
