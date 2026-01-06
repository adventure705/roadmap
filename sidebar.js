const defaultMenuConfig = [
    { type: 'item', id: 'dashboard', label: '대시보드', icon: '📊', link: 'dashboard.html' },
    { type: 'item', id: 'roadmap', label: '단기 로드맵', icon: '📅', link: 'roadmap.html' },
    { type: 'item', id: 'moneyPlan', label: '머니 플랜', icon: '💰', link: 'money_plan.html' },
    { type: 'header', label: '지출 관리' },
    { type: 'item', id: 'fixed', label: '고정 지출', icon: '🔒', link: 'fixed_expenses.html' },
    { type: 'item', id: 'variable', label: '변동 지출', icon: '🛒', link: 'variable_expenses.html' },
    { type: 'item', id: 'installments', label: '할부', icon: '💳', link: 'installments.html' },
    { type: 'item', id: 'cash', label: '현금 지출', icon: '💸', link: 'cash_expenses.html' },
    { type: 'item', id: 'settlement', label: '지출 예정산', icon: '💰', link: 'settlement.html' },
    { type: 'header', label: '수입 관리' },
    { type: 'item', id: 'income', label: '수입', icon: '💰', link: 'income.html' },
    { type: 'item', id: 'investment', label: '투자 수입', icon: '📈', link: 'investment.html' },
    { type: 'item', id: 'secret_board', label: '시크릿 보드', icon: '🚩', link: 'secret_board.html' },
    { type: 'header', label: '사업 관리' },
    { type: 'item', id: 'business', label: '사업 관리', icon: '💼', link: 'business.html' },
    { type: 'header', label: '정보 관리' },
    { type: 'item', id: 'management', label: '정보 관리', icon: '📋', link: 'management.html' }
];

function getMenuConfig() {
    try {
        const saved = localStorage.getItem('sidebar_config');
        if (saved) {
            let config = JSON.parse(saved);
            if (!config.find(item => item.id === 'moneyPlan')) {
                const roadmapIdx = config.findIndex(item => item.id === 'roadmap');
                const newItem = { type: 'item', id: 'moneyPlan', label: '머니 플랜', icon: '💰', link: 'money_plan.html' };
                if (roadmapIdx !== -1) config.splice(roadmapIdx + 1, 0, newItem);
                else config.push(newItem);
            }
            if (!config.find(item => item.id === 'settlement')) {
                const cashIdx = config.findIndex(item => item.id === 'cash');
                const newItem = { type: 'item', id: 'settlement', label: '지출 예정산', icon: '💰', link: 'settlement.html' };
                if (cashIdx !== -1) config.splice(cashIdx + 1, 0, newItem);
                else config.push(newItem);
            }
            if (!config.find(item => item.id === 'business')) {
                config.push({ type: 'header', label: '사업 관리' });
                config.push({ type: 'item', id: 'business', label: '사업 관리', icon: '💼', link: 'business.html' });
            }
            if (!config.find(item => item.id === 'investment')) {
                const incomeIdx = config.findIndex(item => item.id === 'income');
                const newItem = { type: 'item', id: 'investment', label: '투자 수입', icon: '📈', link: 'investment.html' };
                if (incomeIdx !== -1) config.splice(incomeIdx + 1, 0, newItem);
                else config.push(newItem);
            }
            if (!config.find(item => item.id === 'secret_board')) {
                // Determine position: After 'Asset Management' or 'Investment'?
                // Let's put it after Investment
                const investIdx = config.findIndex(item => item.id === 'investment');
                const newItem = { type: 'item', id: 'secret_board', label: '시크릿 보드', icon: '🚩', link: 'secret_board.html' };
                if (investIdx !== -1) config.splice(investIdx + 1, 0, newItem);
                else config.push(newItem);
            }
            if (!config.find(item => item.id === 'management')) {
                config.push({ type: 'header', label: '정보 관리' });
                config.push({ type: 'item', id: 'management', label: '정보 관리', icon: '📋', link: 'management.html' });
            }
            return config;
        }
        return defaultMenuConfig;
    } catch (e) {
        return defaultMenuConfig;
    }
}

function saveMenuConfig(config) {
    localStorage.setItem('sidebar_config', JSON.stringify(config));
    location.reload();
}

function resetMenuConfig() {
    if (confirm('사이드바 설정을 초기화하시겠습니까?')) {
        localStorage.removeItem('sidebar_config');
        location.reload();
    }
}

window.openSidebarManager = function () {
    const modal = document.getElementById('sidebarManagerModal');
    if (modal) {
        renderSidebarManagerList();
        modal.style.display = 'flex';
    }
};

window.closeSidebarManager = function () {
    const modal = document.getElementById('sidebarManagerModal');
    if (modal) modal.style.display = 'none';
};

window.moveSidebarItem = function (index, direction) {
    const config = getMenuConfig();
    if (direction === -1 && index > 0) {
        [config[index], config[index - 1]] = [config[index - 1], config[index]];
    } else if (direction === 1 && index < config.length - 1) {
        [config[index], config[index + 1]] = [config[index + 1], config[index]];
    }
    localStorage.setItem('sidebar_config', JSON.stringify(config));
    renderSidebarManagerList();
};

window.updateSidebarItemName = function (index, newName) {
    const config = getMenuConfig();
    config[index].label = newName;
    localStorage.setItem('sidebar_config', JSON.stringify(config));
};

function renderSidebarManagerList() {
    const listEl = document.getElementById('sidebarManagerList');
    const config = getMenuConfig();
    let html = '';
    config.forEach((item, idx) => {
        html += `<div class="flex items-center bg-gray-700 p-2 rounded mb-2 gap-2">`;
        if (item.type === 'header') html += `<span class="text-xs font-bold text-gray-400 w-6 text-center">HEAD</span>`;
        else html += `<span class="text-xl w-6 text-center">${item.icon}</span>`;
        html += `<input type="text" class="flex-1 bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1" value="${item.label}" onblur="updateSidebarItemName(${idx}, this.value)">`;
        html += `<div class="flex gap-1">
            <button onclick="moveSidebarItem(${idx}, -1)" class="text-gray-400 hover:text-white p-1">▲</button>
            <button onclick="moveSidebarItem(${idx}, 1)" class="text-gray-400 hover:text-white p-1">▼</button>
        </div></div>`;
    });
    listEl.innerHTML = html;
}

window.saveAndReloadSidebar = function () {
    location.reload();
}

function renderSidebar(activePage) {
    // 중복 방지: 이미 사이드바가 존재하면 기존 것을 제거
    const existingSidebar = document.getElementById('mainSidebar');
    if (existingSidebar) {
        // 기존 사이드바와 관련 요소들 제거
        const existingMobileHeader = document.querySelector('.lg\\:hidden.fixed.top-0');
        const existingOverlay = document.getElementById('sidebarOverlay');
        if (existingMobileHeader) existingMobileHeader.remove();
        if (existingSidebar) existingSidebar.remove();
        if (existingOverlay) existingOverlay.remove();
    }

    const config = getMenuConfig();
    let menuHTML = '';
    config.forEach(item => {
        if (item.type === 'header') {
            menuHTML += `<div class="pt-4 pb-1 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">${item.label}</div>`;
        } else {
            const isActive = activePage === item.id;
            menuHTML += `<a href="${item.link}" class="sidebar-link ${isActive ? 'active' : ''} w-full flex items-center gap-3 px-4 py-3 rounded-r-lg text-sm font-medium text-gray-400 focus:outline-none">
                <span class="w-5 text-center">${item.icon}</span> ${item.label}
            </a>`;
        }
    });

    const sidebarHTML = `
    <!-- Mobile Header -->
    <div class="lg:hidden fixed top-0 left-0 right-0 h-14 bg-dark border-b border-white/5 flex items-center px-4 justify-between z-[60]">
        <div class="flex items-center">
            <span class="text-xl mr-2">🚀</span>
            <span class="font-bold text-base tracking-tight text-white">슈퍼문</span>
        </div>
        <button id="mobileMenuToggle" class="p-2 text-gray-400 hover:text-white transition focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
        </button>
    </div>

    <!-- Sidebar -->
    <aside id="mainSidebar" class="fixed inset-y-0 left-0 w-64 bg-card border-r border-white/5 flex flex-col z-[70] transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out lg:relative lg:flex-shrink-0">
        <div class="h-16 flex items-center px-6 border-b border-white/5 justify-between">
            <div class="flex items-center">
                <span class="text-2xl mr-2">🚀</span>
                <span class="font-bold text-lg tracking-tight text-white">슈퍼문</span>
            </div>
            <button onclick="openSidebarManager()" class="text-gray-500 hover:text-white transition p-1" title="메뉴 설정">⚙️</button>
        </div>
        <div class="p-4 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
            ${menuHTML}
        </div>
        <div class="lg:hidden absolute top-4 right-[-40px]">
             <button id="closeSidebar" class="bg-gray-800 p-2 rounded-r-lg text-gray-400">✕</button>
        </div>
    </aside>

    <!-- Overlay -->
    <div id="sidebarOverlay" class="fixed inset-0 bg-black/60 z-[65] hidden lg:hidden backdrop-blur-sm transition-opacity duration-300"></div>

    <style>
        @media (max-width: 1023px) {
            body { padding-top: 56px; height: auto !important; overflow: auto !important; }
            main { height: auto !important; overflow: visible !important; width: 100% !important; padding: 16px !important; }
            .sidebar-open aside { transform: translateX(0); }
            .sidebar-open #sidebarOverlay { display: block; }
            #memoModal > div, #sidebarManagerModal > div { width: 90% !important; max-width: 450px; margin: 0 16px; }
            .glass-panel { padding: 16px !important; }
            
            /* Table responsiveness */
            .overflow-x-auto {
                -webkit-overflow-scrolling: touch;
            }
            .max-w-7xl { padding: 0 !important; }

            /* Grid responsiveness */
            .grid-cols-4 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
            .grid-cols-2 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        
        /* Global Modal Scale */
        .modal-active { overflow: hidden !important; }
    </style>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const toggle = document.getElementById('mobileMenuToggle');
            const close = document.getElementById('closeSidebar');
            const overlay = document.getElementById('sidebarOverlay');
            const body = document.body;

            const toggleSidebar = () => body.classList.toggle('sidebar-open');
            if(toggle) toggle.onclick = toggleSidebar;
            if(close) close.onclick = toggleSidebar;
            if(overlay) overlay.onclick = toggleSidebar;

            // Close sidebar on link click (mobile)
            document.querySelectorAll('.sidebar-link').forEach(link => {
                link.addEventListener('click', () => {
                    if(window.innerWidth < 1024) body.classList.remove('sidebar-open');
                });
            });
        });
    </script>
    `;
    // 안전한 DOM 삽입 방식 사용 (document.write는 페이지를 덮어씀)
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    // Move the shared modals outside aside to avoid translation issues
    const globalModals = `
    <!-- Sidebar Manager Modal -->
    <div id="sidebarManagerModal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-[100] backdrop-blur-sm">
        <div class="bg-card glass-panel p-6 rounded-2xl w-96 shadow-2xl border border-white/10 flex flex-col max-h-[85vh]">
            <h3 class="text-xl font-bold mb-4 flex justify-between items-center text-white">
                메뉴 설정
                <button onclick="resetMenuConfig()" class="text-xs text-red-400 hover:text-red-300">초기화</button>
            </h3>
            <div id="sidebarManagerList" class="flex-1 overflow-y-auto mb-4 border border-white/5 rounded p-2 custom-scrollbar">
                <!-- List populated by JS -->
            </div>
            <div class="mt-2 text-right">
                <button onclick="saveAndReloadSidebar()" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20">저장 및 닫기</button>
            </div>
        </div>
    </div>

    <!-- Global Memo Modal -->
    <div id="memoModal" class="fixed inset-0 bg-black/60 hidden items-center justify-center z-[100] backdrop-blur-sm">
        <div class="bg-[#1e293b] p-6 rounded-2xl w-[450px] shadow-2xl border border-white/10 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <h3 id="memoModalTitle" class="text-xl font-bold border-b border-white/5 pb-3 text-white">메모 추가</h3>
            <textarea id="memoModalContent" class="w-full h-40 bg-[#0f172a] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none shadow-inner" placeholder="내용을 입력하세요..."></textarea>
            <div class="flex justify-end gap-3 mt-2">
                <button onclick="closeMemoModal()" class="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors font-medium">취소</button>
                <button id="memoModalSubmit" class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20">저장</button>
            </div>
        </div>
    </div>
    `;
    // 안전한 DOM 삽입 방식 사용 (중복 방지)
    if (!document.getElementById('sidebarManagerModal')) {
        document.body.insertAdjacentHTML('beforeend', globalModals);
    }
}

// --- Global Memo Functions ---
window.currentPageType = window.currentPageType || '';

window.renderMemos = function (containerId = 'memoContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const yearData = (roadmapData && roadmapData.years) ? (roadmapData.years[currentYear] || {}) : {};
    let commonMemos = (roadmapData && roadmapData.commonMemos) ? roadmapData.commonMemos : [];
    if (!Array.isArray(commonMemos)) {
        commonMemos = commonMemos[currentPageType] || [];
    }

    let html = '<div class="flex flex-col lg:flex-row gap-4 w-full">';
    // 1. Common Memo
    const isFullWidthCommon = (currentPageType === 'secret_board');
    html += `
    <div class="bg-gray-800/50 p-4 rounded-lg border border-white/5 flex-1 min-w-0 ${isFullWidthCommon ? 'w-full' : 'lg:min-w-[300px]'}">
        <div class="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
            <span class="text-sm font-bold text-yellow-500 flex items-center gap-2">📌 공통 메모</span>
            <button onclick="addMemo('common')" class="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md transition text-gray-300 font-medium ml-4">+ 추가</button>
        </div>
        <div class="space-y-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">`;

    if (commonMemos.length === 0) {
        html += '<p class="text-xs text-gray-500 italic py-2 text-center">등록된 공통 메모가 없습니다.</p>';
    } else {
        commonMemos.forEach((memo, idx) => {
            const text = typeof memo === 'object' ? memo.text : memo;
            const idParam = typeof memo === 'object' ? `'${memo.id}'` : idx;
            html += `
            <div class="group bg-gray-900/50 p-2.5 rounded border border-white/5 text-xs flex justify-between items-start gap-2 hover:bg-gray-800/50 transition">
                <p class="text-gray-300 whitespace-pre-wrap break-all flex-1 leading-relaxed">${text}</p>
                <div class="opacity-0 group-hover:opacity-100 flex gap-1 shrink-0 transition-opacity">
                    <button onclick="editMemo('common', ${idParam})" class="text-gray-400 hover:text-white p-1">✎</button>
                    <button onclick="deleteMemo('common', ${idParam})" class="text-red-400 hover:text-red-300 p-1">×</button>
                </div>
            </div>`;
        });
    }
    html += '</div></div>';

    // 2. Monthly Memo (Exclude some types)
    if (currentPageType !== 'installment' && currentPageType !== 'business' && currentPageType !== 'investment' && currentPageType !== 'roadmap' && currentPageType !== 'management' && currentPageType !== 'secret_board') {
        const monthKey = roadmapData.months[currentMonth];
        const monthlyMemosMap = yearData.monthlyMemos || {};
        let monthlyMemos = [];
        const memosForMonth = monthlyMemosMap[monthKey];
        if (Array.isArray(memosForMonth)) {
            monthlyMemos = memosForMonth;
        } else if (memosForMonth && typeof memosForMonth === 'object') {
            monthlyMemos = memosForMonth[currentPageType] || [];
        }

        html += `
        <div class="bg-gray-800/50 p-4 rounded-lg border border-white/5 flex-1 min-w-0 lg:min-w-[300px]">
            <div class="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                <span class="text-sm font-bold text-blue-400 flex items-center gap-2">📅 ${monthKey} 메모</span>
                <button onclick="addMemo('monthly')" class="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md transition text-gray-300 font-medium ml-4">+ 추가</button>
            </div>
            <div class="space-y-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">`;

        if (monthlyMemos.length === 0) {
            html += '<p class="text-xs text-gray-500 italic py-2 text-center">이번 달 메모가 없습니다.</p>';
        } else {
            monthlyMemos.forEach((memo, idx) => {
                const text = typeof memo === 'object' ? memo.text : memo;
                const idParam = typeof memo === 'object' ? `'${memo.id}'` : idx;
                html += `
                <div class="group bg-gray-900/50 p-2.5 rounded border border-white/5 text-xs flex justify-between items-start gap-2 hover:bg-gray-800/50 transition">
                    <p class="text-gray-300 whitespace-pre-wrap break-all flex-1 leading-relaxed">${text}</p>
                    <div class="opacity-0 group-hover:opacity-100 flex gap-1 shrink-0 transition-opacity">
                        <button onclick="editMemo('monthly', ${idParam})" class="text-gray-400 hover:text-white p-1">✎</button>
                        <button onclick="deleteMemo('monthly', ${idParam})" class="text-red-400 hover:text-red-300 p-1">×</button>
                    </div>
                </div>`;
            });
        }
        html += '</div></div>';
    }
    html += '</div>';
    container.innerHTML = html;
};

window.openMemoModal = function (title, initialText, onSave) {
    const modal = document.getElementById('memoModal');
    const titleEl = document.getElementById('memoModalTitle');
    const contentEl = document.getElementById('memoModalContent');
    const submitBtn = document.getElementById('memoModalSubmit');
    if (!modal || !titleEl || !contentEl || !submitBtn) return;
    titleEl.innerText = title;
    contentEl.value = initialText || '';
    modal.style.display = 'flex';
    contentEl.focus();
    submitBtn.onclick = () => {
        const text = contentEl.value;
        if (text && text.trim()) {
            onSave(text.trim());
            closeMemoModal();
        } else {
            alert('내용을 입력해주세요.');
        }
    };
};

window.closeMemoModal = function () {
    const modal = document.getElementById('memoModal');
    if (modal) modal.style.display = 'none';
};

window.addMemo = function (type) {
    const title = (type === 'common' ? '📌 공통 메모 추가' : '📅 월별 메모 추가');
    openMemoModal(title, '', (text) => {
        if (roadmapData.commonMemos && !Array.isArray(roadmapData.commonMemos) && type === 'common') {
            if (!roadmapData.commonMemos[currentPageType]) roadmapData.commonMemos[currentPageType] = [];
            roadmapData.commonMemos[currentPageType].push(text);
        } else if (type === 'common') {
            if (!roadmapData.commonMemos) roadmapData.commonMemos = [];
            roadmapData.commonMemos.push({ id: Date.now().toString(), text: text });
        } else {
            const yearData = roadmapData.years[currentYear];
            const monthKey = roadmapData.months[currentMonth];
            if (!yearData.monthlyMemos[monthKey]) yearData.monthlyMemos[monthKey] = {};
            if (Array.isArray(yearData.monthlyMemos[monthKey])) {
                yearData.monthlyMemos[monthKey] = { [currentPageType]: [] };
            }
            if (!yearData.monthlyMemos[monthKey][currentPageType]) yearData.monthlyMemos[monthKey][currentPageType] = [];
            yearData.monthlyMemos[monthKey][currentPageType].push({ id: Date.now().toString(), text: text });
        }
        saveData();
        renderMemos();
    });
};

window.editMemo = function (type, idx) {
    let list;
    if (type === 'common') {
        list = (roadmapData.commonMemos && !Array.isArray(roadmapData.commonMemos)) ? roadmapData.commonMemos[currentPageType] : roadmapData.commonMemos;
    } else {
        const monthKey = roadmapData.months[currentMonth];
        list = roadmapData.years[currentYear].monthlyMemos[monthKey][currentPageType];
    }
    let itemIdx = (typeof idx === 'string') ? list.findIndex(it => (typeof it === 'object' ? it.id === idx : false)) : idx;
    if (itemIdx === -1 && typeof idx === 'string' && !isNaN(parseInt(idx))) itemIdx = parseInt(idx);
    if (itemIdx === -1 || !list[itemIdx]) return;
    const oldText = typeof list[itemIdx] === 'object' ? list[itemIdx].text : list[itemIdx];
    const title = (type === 'common' ? '📌 공통 메모 수정' : '📅 월별 메모 수정');
    openMemoModal(title, oldText, (newText) => {
        if (typeof list[itemIdx] === 'object') {
            list[itemIdx].text = newText;
        } else {
            list[itemIdx] = newText;
        }
        saveData();
        renderMemos();
    });
};

window.deleteMemo = function (type, idx) {
    if (!confirm('메모를 삭제하시겠습니까?')) return;
    let list;
    if (type === 'common') {
        list = (roadmapData.commonMemos && !Array.isArray(roadmapData.commonMemos)) ? roadmapData.commonMemos[currentPageType] : roadmapData.commonMemos;
    } else {
        const monthKey = roadmapData.months[currentMonth];
        list = roadmapData.years[currentYear].monthlyMemos[monthKey][currentPageType];
    }
    let itemIdx = (typeof idx === 'string') ? list.findIndex(it => (typeof it === 'object' ? it.id === idx : false)) : idx;
    if (itemIdx === -1 && typeof idx === 'string' && !isNaN(parseInt(idx))) itemIdx = parseInt(idx);
    if (itemIdx > -1) {
        list.splice(itemIdx, 1);
        saveData();
        renderMemos();
    }
};
