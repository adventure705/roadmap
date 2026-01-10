window.currentPageType = window.currentPageType || '';
let viewMode = 'yearly'; // 'yearly' or 'monthly'

// Sorting State
let sortState = {
    column: null,
    direction: 'asc' // or 'desc'
};

const formatMoneyFull = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
};

function initFinancialPage(type, mode = 'yearly') {
    window.currentPageType = type;
    viewMode = mode;
    loadData();
    renderMemos();
    updateUI();
    renderPageTitle();
}

function renderPageTitle() {
    const titleEl = document.getElementById('pageTitle');
    if (!titleEl) return;

    // Default titles mapping
    const defaultTitles = {
        'fixed': '고정 지출 관리',
        'variable': '변동 지출 관리',
        'income': '수입 관리',
        'cash': '현금 지출 관리',
        'installment': '할부 관리',
        'business': '사업자 통합 관리'
    };

    const savedTitle = (roadmapData.pageTitles && roadmapData.pageTitles[window.currentPageType])
        ? roadmapData.pageTitles[window.currentPageType]
        : defaultTitles[window.currentPageType];

    titleEl.innerText = savedTitle || '지출 관리';
    titleEl.onclick = togglePageTitleEdit;
}

function togglePageTitleEdit() {
    const titleEl = document.getElementById('pageTitle');
    if (!titleEl) return;

    const currentText = titleEl.innerText;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'text-2xl font-bold bg-transparent text-white border-b border-blue-500 focus:outline-none';

    input.onblur = function () {
        finishPageTitleEdit(this.value);
    };
    input.onkeydown = function (e) {
        if (e.key === 'Enter') this.blur();
    };

    titleEl.replaceWith(input);
    input.focus();
}

function finishPageTitleEdit(newTitle) {
    if (!roadmapData.pageTitles) roadmapData.pageTitles = {};
    roadmapData.pageTitles[window.currentPageType] = newTitle;
    saveData();

    const h2 = document.createElement('h2');
    h2.id = 'pageTitle';
    h2.className = 'text-2xl font-bold mb-1 cursor-pointer hover:text-blue-400 transition';
    h2.innerText = newTitle;
    h2.onclick = togglePageTitleEdit;

    // Find the input (it replaced the h2, so we need to find the input that is now in DOM)
    // We can't rely on ID because input doesn't have ID 'pageTitle'
    // But this function is called from onblur of that input, so we effectively replace 'this' in DOM if we had reference.
    // 'this' in onblur is the input element.
    // However, here we are inside a separate function.
    // Simplest way is to find the input in the header container or pass element reference.
    // But since onblur calls this, we need to locate the input.
    // Actually, simple way: we assume the input is where title should be.
    // Let's pass 'inputEl' to this function.

    // Re-implementation:
    // togglePageTitleEdit creates input with onblur calling save function.
    // save function rebuilds h2.
    // To rebuild, we need to know WHERE to put it.
    // The input is currently in the DOM. "this" in onblur refers to input.
    // So let's attach the logic directly in togglePageTitleEdit's onblur.
}

// Redefining togglePageTitleEdit to include save logic directly to avoid reference issues
window.togglePageTitleEdit = function () {
    const titleEl = document.getElementById('pageTitle');
    if (!titleEl) return;

    const currentText = titleEl.innerText;
    const parent = titleEl.parentNode;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'text-2xl font-bold bg-gray-800 text-white border border-blue-500 rounded px-2 py-0.5 focus:outline-none w-auto inline-block mb-1';

    input.onblur = function () {
        const val = this.value;
        if (!roadmapData.pageTitles) roadmapData.pageTitles = {};
        roadmapData.pageTitles[window.currentPageType] = val;
        saveData();

        const h2 = document.createElement('h2');
        h2.id = 'pageTitle';
        h2.className = 'text-2xl font-bold mb-1 cursor-pointer hover:text-blue-400 transition select-none';
        h2.innerText = val;
        h2.onclick = window.togglePageTitleEdit;
        h2.title = '클릭하여 제목 수정';

        this.replaceWith(h2);
    };

    input.onkeydown = function (e) {
        if (e.key === 'Enter') this.blur();
    };

    titleEl.replaceWith(input);
    input.focus();
};

function updateUI() {
    // Year Display
    const yearDisplay = document.getElementById('sheetYearDisplay');
    if (yearDisplay) yearDisplay.innerText = currentYear;

    // Month Display (Only for monthly mode)
    const monthDisplay = document.getElementById('sheetMonthDisplay');
    if (monthDisplay && (typeof currentMonth !== 'undefined')) {
        monthDisplay.innerText = (currentMonth + 1) + '월';
    }

    // Memo Monthly Refresh (Title or anything else?)
    renderMemos();

    if (window.currentPageType === 'fixed') {
        renderFixedSummary();
    } else if (window.currentPageType === 'income') {
        renderIncomeSummary();
    }

    if (viewMode === 'monthly') {
        renderMonthlyTable();
    } else {
        renderYearlyTable();
    }
}

function renderFixedSummary() {
    const container = document.getElementById('fixedSummaryContainer');
    if (!container) return; // Should be in fixed_expenses.html

    if (currentPageType !== 'fixed') {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'grid'; // Restore grid
    container.classList.remove('hidden');

    const yearData = roadmapData.years[currentYear];
    const list = yearData.details['fixed'];
    const curM = currentMonth;

    let loanInterestSum = 0;
    let bankFixedSum = 0;
    let cardFixedSubSum = 0;

    // Filter active items for this month
    const activeList = list.filter(item => item.values[curM] > 0);

    activeList.forEach(item => {
        const val = item.values[curM];
        const cat = item.category || '';
        const card = item.card || '';
        const bank = item.bankAccount || '';
        const isCard = card || bank.includes('카드');

        // Logic 1: Loan Interest (Category includes '대출이자')
        if (cat.includes('대출이자')) {
            loanInterestSum += val;
        }

        // Logic 2: Bank Fixed Costs (Category '고정비용' or '구독' AND Not Card)
        if ((cat === '고정비용' || cat === '구독') && !isCard) {
            bankFixedSum += val;
        }

        // Logic 3: Card Fixed/Sub Costs (Category '고정비용' or '구독' AND Is Card)
        if ((cat === '고정비용' || cat === '구독') && isCard) {
            cardFixedSubSum += val;
        }
    });

    container.innerHTML = `
        <div class="bg-gray-800/80 p-4 rounded-lg border-l-4 border-yellow-500">
            <p class="text-xs text-gray-400 mb-1">대출이자 합계</p>
            <p class="text-xl font-bold text-white">${formatMoneyFull(loanInterestSum)}원</p>
        </div>
        <div class="bg-gray-800/80 p-4 rounded-lg border-l-4 border-blue-500">
            <p class="text-xs text-gray-400 mb-1">은행 고정비 합계</p>
            <p class="text-xl font-bold text-white">${formatMoneyFull(bankFixedSum)}원</p>
        </div>
        <div class="bg-gray-800/80 p-4 rounded-lg border-l-4 border-purple-500">
            <p class="text-xs text-gray-400 mb-1">카드 고정비 합계</p>
            <p class="text-xl font-bold text-white">${formatMoneyFull(cardFixedSubSum)}원</p>
        </div>
    `;
}

function renderIncomeSummary() {
    const container = document.getElementById('incomeSummaryContainer');
    if (!container) return;

    if (currentPageType !== 'income') {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'grid';
    container.classList.remove('hidden');

    const yearData = roadmapData.years[currentYear];
    const list = yearData.details['income'] || [];
    const curM = currentMonth;
    const catSums = {};

    // Calculate Sums
    list.forEach(item => {
        const val = item.values[curM];
        if (val > 0) {
            const cat = item.category || '기타';
            catSums[cat] = (catSums[cat] || 0) + val;
        }
    });

    let html = '';
    const colors = ['border-green-500', 'border-blue-500', 'border-yellow-500', 'border-purple-500', 'border-red-500', 'border-indigo-500'];
    let colorIdx = 0;

    // Render Blocks
    const sortedCats = Object.keys(catSums).sort();
    if (sortedCats.length === 0) {
        html = `<p class="text-gray-500 text-sm col-span-full">이번 달 수입 내역이 없습니다.</p>`;
    } else {
        sortedCats.forEach(cat => {
            const sum = catSums[cat];
            const borderColor = colors[colorIdx % colors.length];
            colorIdx++;

            html += `
            <div class="bg-gray-800/80 p-4 rounded-lg border-l-4 ${borderColor}">
                <p class="text-xs text-gray-400 mb-1">${cat}</p>
                <p class="text-xl font-bold text-white">${formatMoneyFull(sum)}원</p>
            </div>`;
        });
    }

    container.innerHTML = html;
}

function addItem() {
    if (viewMode === 'monthly') {
        openAddItemModal();
        return;
    }

    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];

    // Yearly mode: add empty row
    const newItem = {
        id: Date.now().toString(),
        name: '새 항목',
        values: new Array(12).fill(0),
        category: '',
        content: '', // Added for business
        bankAccount: '',
        card: '',
        date: '' // For Cash Expenses
    };
    list.push(newItem);
    saveData();
    updateUI();
}

function deleteItem(id) {
    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];

    if (viewMode === 'monthly') {
        if (!confirm('이번 달 목록에서 제외하시겠습니까? (데이터는 유지되며 금액이 0이 됩니다)')) return;
        const item = list.find(it => it.id === id);
        if (item) {
            item.values[currentMonth] = 0;
            saveData();
            updateUI();
        }
    } else {
        // Yearly mode: Permanently delete
        if (!confirm('항목을 완전히 삭제하시겠습니까? 모든 월의 데이터가 사라집니다.')) return;

        if (currentPageType === 'installment') {
            for (const y in roadmapData.years) {
                const yearList = roadmapData.years[y].details['installment'] || [];
                const idx = yearList.findIndex(it => it.id === id);
                if (idx > -1) yearList.splice(idx, 1);
            }
        } else {
            const idx = list.findIndex(item => item.id === id);
            if (idx > -1) {
                list.splice(idx, 1);
            }
        }
        saveData();
        updateUI();
    }
}

function sortList(column) {
    if (sortState.column === column) {
        if (sortState.direction === 'asc') {
            sortState.direction = 'desc';
        } else {
            // Turn off sorting
            sortState.column = null;
            sortState.direction = 'asc';
        }
    } else {
        sortState.column = column;
        sortState.direction = 'asc';
    }
    updateUI();
}

function moveItem(id, direction) {
    if (sortState.column) {
        alert('정렬 중에는 순서를 변경할 수 없습니다. 항목 헤더를 클릭하여 정렬을 해제해주세요.');
        return;
    }

    const yearData = roadmapData.years[currentYear];
    const fullList = yearData.details[currentPageType];
    const curM = currentMonth;

    // For sorting/moving, we usually operate on the visible list.
    // However, moving logic is index-based in the MAIN list.
    // If we only see filtered items, swapping by index in main list is tricky if they are far apart.
    // For now, let's assume we swap adjacent visible items in the filtered view, but we need to map that back to the real list.

    // Simple approach: Find the two items in the real list and swap them there? 
    // BUT the real list acts as the source of truth order. 
    // If the user sees Item A and Item B adjacent, but in the real list they are far apart (due to filtering), swapping them in the real list might not make sense or might be what is desired.
    // Given the simple requirement, let's swap their positions in the main list directly.

    const activeList = fullList.filter(item => item.values[curM] > 0);
    const currentIndex = activeList.findIndex(it => it.id === id);
    if (currentIndex === -1) return;

    if (direction === -1 && currentIndex > 0) {
        // Move Up
        const prevItem = activeList[currentIndex - 1];
        swapItemsInList(fullList, id, prevItem.id);
    } else if (direction === 1 && currentIndex < activeList.length - 1) {
        // Move Down
        const nextItem = activeList[currentIndex + 1];
        swapItemsInList(fullList, id, nextItem.id);
    }
}

function swapItemsInList(list, id1, id2) {
    const idx1 = list.findIndex(it => it.id === id1);
    const idx2 = list.findIndex(it => it.id === id2);
    if (idx1 > -1 && idx2 > -1) {
        [list[idx1], list[idx2]] = [list[idx2], list[idx1]];
        saveData();
        updateUI();
    }
}



// Drag and Drop for Rows
let draggedRowId = null;

window.onRowDragStart = function (e, id) {
    draggedRowId = id;
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('opacity-50');
};

window.onRowDragOver = function (e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
};

window.onRowDrop = function (e, targetId) {
    if (e.stopPropagation) e.stopPropagation();
    if (draggedRowId !== targetId) {
        const yearData = roadmapData.years[currentYear];
        const list = yearData.details[currentPageType];
        const idx1 = list.findIndex(it => it.id === draggedRowId);
        const idx2 = list.findIndex(it => it.id === targetId);
        if (idx1 > -1 && idx2 > -1) {
            const temp = list[idx1];
            list.splice(idx1, 1);
            list.splice(idx2, 0, temp);
            saveData();
            updateUI();
        }
    }
    return false;
};

// --- Add Item Modal (Monthly Mode) ---
function openAddItemModal(itemId = null) {
    const modal = document.getElementById('addItemModal');
    if (modal) {
        modal.style.display = 'flex';

        const saveBtn = modal.querySelector('button[onclick="confirmAddItem()"]');
        const title = modal.querySelector('h3');

        // Reset Inputs
        document.getElementById('addItemName').value = '';
        if (document.getElementById('addItemContent')) document.getElementById('addItemContent').value = '';
        document.getElementById('addItemAmount').value = '';

        // Date Input
        const dateDiv = document.getElementById('addItemDateDiv');
        const dateInput = document.getElementById('addItemDate');

        // Default View State
        if (dateDiv) dateDiv.style.display = (currentPageType === 'cash' || currentPageType === 'other_income') ? 'block' : 'none';

        if (cardSelect && cardSelect.parentElement) {
            cardSelect.parentElement.style.display = (currentPageType === 'income' || currentPageType === 'other_income' || currentPageType === 'fixed' || currentPageType === 'variable' || currentPageType === 'cash') ? 'none' : 'block';
        }

        // Bank Label
        const bankSelect = document.getElementById('addItemBank');
        if (bankSelect && bankSelect.previousElementSibling && bankSelect.previousElementSibling.tagName === 'LABEL') {
            bankSelect.previousElementSibling.innerText = (currentPageType === 'income' || currentPageType === 'other_income') ? '입금계좌' : '출금계좌';
        }

        // Re-populate Dropdowns (Always refreshing is safer to ensure sync)
        // Re-populate Dropdowns
        const catSelect = document.getElementById('addItemCategory');
        if (catSelect) {
            const defaults = {
                income: ['월급', '부수입'],
                fixed: ['구독', '고정비용', '대출이자'],
                variable: ['식비', '교통비', '쇼핑'],
                cash: ['용돈'],
                installment: ['가전', '가구'],
                other_income: ['기타 수입'],
                settlement: ['식자재', '배달', '외식', '대중교통', '택시', '물품구입비', '자기계발비', '꾸밈비', '의료건강비', '사회생활비', '문화생활비', '경조사', '예비비']
            };

            let cats = (roadmapData.categories && roadmapData.categories[currentPageType]) ? roadmapData.categories[currentPageType] : [];

            if (!cats || cats.length === 0) {
                cats = defaults[currentPageType] || [];
            }

            catSelect.innerHTML = `<option value="">선택(없음)</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join('');
            if (!itemId) catSelect.value = "";
        }

        if (bankSelect) {
            const defaults = {
                income: ['국민은행'],
                fixed: ['국민은행', '신한은행'],
                variable: ['국민은행', '카카오뱅크'],
                other_income: ['국민은행'],
                installment: ['현대카드', '삼성카드']
            };

            let banks = (roadmapData.bankAccounts && roadmapData.bankAccounts[currentPageType]) ? roadmapData.bankAccounts[currentPageType] : [];

            if (!banks || banks.length === 0) {
                banks = defaults[currentPageType] || [];
            }

            bankSelect.innerHTML = `<option value="">선택(없음)</option>` + banks.map(b => `<option value="${b}">${b}</option>`).join('');
            if (!itemId) bankSelect.value = "";
        }

        const cardEl = document.getElementById('addItemCard');
        if (cardEl && (currentPageType !== 'income' && currentPageType !== 'other_income')) {
            let cards = roadmapData.cards[currentPageType] || [];

            // Fallback Defaults
            if (cards.length === 0) {
                if (currentPageType === 'fixed' || currentPageType === 'variable' || currentPageType === 'installment' || currentPageType === 'settlement') {
                    cards = ['현대카드', '삼성카드'];
                }
            }

            cardEl.innerHTML = `<option value="">선택(없음)</option>` + cards.map(c => `<option value="${c}">${c}</option>`).join('');
        }

        if (itemId) {
            // Edit Mode
            const yearData = roadmapData.years[currentYear];
            const list = yearData.details[currentPageType];
            const item = list.find(it => it.id === itemId);
            if (!item) { closeAddItemModal(); return; }

            modal.dataset.editId = itemId;
            if (saveBtn) saveBtn.innerText = '수정 완료';
            if (title) title.innerText = '항목 수정';

            document.getElementById('addItemName').value = item.name;
            document.getElementById('addItemAmount').value = formatMoneyFull(item.values[currentMonth]); // Current month value
            if (document.getElementById('addItemContent')) {
                document.getElementById('addItemContent').value = item.content || '';
            }
            if (catSelect) catSelect.value = item.category || '';
            if (bankSelect) bankSelect.value = item.bankAccount || '';
            if (cardSelect && (currentPageType !== 'income' && currentPageType !== 'other_income')) cardSelect.value = item.card || '';

            if (currentPageType === 'cash' && dateInput) {
                dateInput.value = item.date || '';
            }

        } else {
            // New Mode
            delete modal.dataset.editId;
            if (saveBtn) saveBtn.innerText = '저장';
            let defaultTitle = '변동 지출 내역 추가';
            if (currentPageType === 'income') defaultTitle = '수입 내역 추가';
            else if (currentPageType === 'other_income') defaultTitle = '기타 수입 내역 추가';
            else if (currentPageType === 'cash') defaultTitle = '현금 지출 내역 추가';
            else if (currentPageType === 'fixed') defaultTitle = '고정 지출 내역 추가';
            if (title) title.innerText = defaultTitle;

            // Default Dater
            if ((currentPageType === 'cash' || currentPageType === 'other_income') && dateInput) {
                const today = new Date();
                const year = currentYear;
                const month = String(currentMonth + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                if (today.getFullYear() === year && today.getMonth() === currentMonth) {
                    dateInput.value = `${year}-${month}-${day}`;
                } else {
                    dateInput.value = `${year}-${month}-01`;
                }
            }
        }

        document.getElementById('addItemName').focus();
    }
}

function closeAddItemModal() {
    const modal = document.getElementById('addItemModal');
    if (modal) modal.style.display = 'none';
}

function confirmAddItem() {
    const modal = document.getElementById('addItemModal');
    const editId = modal.dataset.editId;

    const name = document.getElementById('addItemName').value.trim();
    const amountStr = document.getElementById('addItemAmount').value.replace(/,/g, '');
    const amount = parseInt(amountStr) || 0;
    const category = document.getElementById('addItemCategory') ? document.getElementById('addItemCategory').value : '';
    const bankAccount = document.getElementById('addItemBank') ? document.getElementById('addItemBank').value : '';
    const card = document.getElementById('addItemCard') ? document.getElementById('addItemCard').value : '';
    const content = document.getElementById('addItemContent') ? document.getElementById('addItemContent').value.trim() : '';
    const dateInput = document.getElementById('addItemDate');
    const date = (dateInput && (currentPageType === 'cash' || currentPageType === 'other_income')) ? dateInput.value : '';

    if (!name) { alert('항목 이름을 입력해주세요.'); return; }
    if (amount <= 0 && !editId) { alert('금액은 0보다 커야 합니다.'); return; } // Allow 0 edits? maybe not.

    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];

    if (editId) {
        // Edit Existing
        const item = list.find(it => it.id === editId);
        if (item) {
            item.name = name;
            item.values[currentMonth] = amount;
            item.category = category;
            item.bankAccount = bankAccount;
            if (currentPageType !== 'income' && currentPageType !== 'other_income') item.card = card;
            if (currentPageType === 'cash' || currentPageType === 'other_income') {
                item.date = date;
                item.content = content;
            }
            // alert skipped for smoother UX
        }
    } else {
        // Create New (Check name dup? Maybe allow dup for cash/variable)
        // Generally names are unique for row-based tracking, BUT in monthly view list could assume unique rows.
        // Let's stick to unique name if desired, or allow dup. 
        // Original logic checked dup and updated. Let's keep distinct rows by name "if exists update" logic was weird for monthly add.
        // Let's assume Add always adds new row unless specifically logical not to.
        // Actually, previous logic was: find by name -> update. That means ONE row per name.
        // If we want multiple entries with same name (e.g. coffee twice), we need unique ID rows.
        // The previous logic forced unique names. I will Respect previous logic's intent but now we have explicit Edit.
        // If it is New Mode, and name exists, should we update? Or block?
        // Let's act as "Add New Row". 

        // However, if we want row-based aggregation, maybe unique name is key.
        // But user might want "Lunch" today and "Lunch" tomorrow.
        // Let's act as "Add New Row". 

        let item = {
            id: Date.now().toString(),
            name: name,
            values: new Array(12).fill(0),
            category: category,
            content: content,
            bankAccount: bankAccount,
            card: (currentPageType !== 'income' && currentPageType !== 'other_income') ? card : '',
            date: date
        };
        item.values[currentMonth] = amount;
        list.push(item);
    }

    saveData();
    closeAddItemModal();
    updateUI();
}

function updateItemName(id, val) {
    if (currentPageType === 'installment') {
        for (const y in roadmapData.years) {
            const list = roadmapData.years[y].details['installment'] || [];
            const item = list.find(it => it.id === id);
            if (item) item.name = val;
        }
    } else {
        const yearData = roadmapData.years[currentYear];
        const list = yearData.details[currentPageType];
        const item = list.find(it => it.id === id);
        if (item) item.name = val;
    }
    saveData();
}

function updateItemCategory(id, val) {
    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];
    const item = list.find(it => it.id === id);
    if (item) {
        item.category = val;
        saveData();
        updateUI();
    }
}

function updateItemContent(id, val) {
    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];
    const item = list.find(it => it.id === id);
    if (item) {
        item.content = val;
        saveData();
        updateUI();
    }
}

function updateItemBankAccount(id, val) {
    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];
    const item = list.find(it => it.id === id);
    if (item) {
        item.bankAccount = val;
        saveData();
        updateUI();
    }
}

function updateItemCard(id, val) {
    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];
    const item = list.find(it => it.id === id);
    if (item) {
        item.card = val;
        saveData();
        updateUI();
    }
}

function updateItemValue(id, monthIndex, val) {
    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];
    const item = list.find(it => it.id === id);
    if (item) {
        const numVal = parseInt(val.replace(/,/g, '')) || 0;
        item.values[monthIndex] = numVal;
        saveData();
        updateUI();
    }
}

function updateItemDate(id, val) {
    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];
    const item = list.find(it => it.id === id);
    if (item) {
        item.date = val;
        saveData();
        updateUI();
    }
}

function updateItemContent(id, val) {
    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];
    const item = list.find(it => it.id === id);
    if (item) {
        item.content = val;
        saveData();
        // UI update might not be needed if inline, but for safety
    }
}

function renderMonthlyTable() {
    const thead = document.getElementById('sheetHeaderRow');
    const tbody = document.getElementById('sheetBody');
    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];
    const curM = currentMonth; // from data.js

    const getSortIndicator = (col) => {
        if (sortState.column === col) {
            return sortState.direction === 'asc' ? ' ▲' : ' ▼';
        }
        return '';
    };

    const isCash = currentPageType === 'cash';
    const showDateContent = currentPageType === 'cash' || currentPageType === 'other_income';
    const isIncome = currentPageType === 'income' || currentPageType === 'other_income';

    // Header Construction
    let headerHTML = '';

    if (showDateContent) {
        headerHTML += `<th class="px-6 py-4 bg-gray-800 text-left w-1/6 cursor-pointer" onclick="sortList('date')">날짜${getSortIndicator('date')}</th>`;
    }

    headerHTML += `
        <th class="px-6 py-2 bg-gray-800 text-left w-1/6 cursor-pointer hover:bg-gray-700 transition select-none" onclick="sortList('name')">
            항목명 ${getSortIndicator('name')}
        </th>`;

    if (showDateContent) {
        headerHTML += `<th class="px-6 py-2 bg-gray-800 text-left w-1/6 cursor-pointer hover:bg-gray-700 transition select-none" onclick="sortList('content')">
            내용 ${getSortIndicator('content')}
        </th>`;
    }

    headerHTML += `
        <th class="px-6 py-2 bg-gray-800 text-left w-1/6 cursor-pointer hover:bg-gray-700 transition select-none" onclick="sortList('category')">
            분류 ${getSortIndicator('category')}
        </th>`;

    if (!isIncome && currentPageType !== 'fixed' && currentPageType !== 'variable' && currentPageType !== 'cash') {
        headerHTML += `
        <th class="px-6 py-4 bg-gray-800 text-left w-1/6 cursor-pointer hover:bg-gray-700 transition select-none" onclick="sortList('card')">
            카드 ${getSortIndicator('card')}
        </th>`;
    }

    headerHTML += `
        <th class="px-6 py-2 bg-gray-800 text-left w-1/6 cursor-pointer hover:bg-gray-700 transition select-none" onclick="sortList('bankAccount')">
            ${isIncome ? '입금계좌' : '출금계좌'} ${getSortIndicator('bankAccount')}
        </th>
        <th class="px-6 py-2 bg-gray-800 text-right w-1/6 cursor-pointer hover:bg-gray-700 transition select-none" onclick="sortList('amount')">
            금액 (${(curM + 1)}월) ${getSortIndicator('amount')}
        </th>
        <th class="px-6 py-2 bg-gray-800 text-center w-[140px]">관리</th>
    `;
    thead.innerHTML = headerHTML;

    let bodyHTML = '';

    // Filter items
    let activeList = list.filter(item => item.values[curM] > 0);

    // Apply Sorting
    if (sortState.column) {
        activeList.sort((a, b) => {
            let valA = '', valB = '';

            if (sortState.column === 'amount') {
                valA = a.values[curM];
                valB = b.values[curM];
            } else if (sortState.column === 'date') {
                valA = a.date || '';
                valB = b.date || '';
            } else if (sortState.column === 'name') {
                valA = a.name;
                valB = b.name;
            } else if (sortState.column === 'category') {
                valA = a.category || '';
                valB = b.category || '';
            } else if (sortState.column === 'content') {
                valA = a.content || '';
                valB = b.content || '';
            } else if (sortState.column === 'card') {
                valA = a.card || '';
                valB = b.card || '';
            } else if (sortState.column === 'bankAccount') {
                valA = a.bankAccount || '';
                valB = b.bankAccount || '';
            }

            if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    const monthlyTotal = activeList.reduce((sum, item) => sum + item.values[curM], 0);

    const labelColSpan = showDateContent ? 5 : ((isIncome || currentPageType === 'fixed' || currentPageType === 'variable') ? 3 : 4);

    // Total Row (Top)
    bodyHTML += `<tr class="bg-gray-800/80 font-bold border-b-2 border-white/10">`;
    bodyHTML += `<td class="px-6 py-4 text-blue-300" colspan="${labelColSpan}">합계</td>`;
    bodyHTML += `<td class="px-6 py-4 text-right text-yellow-400 text-xl">${formatMoneyFull(monthlyTotal)}원</td>`;
    bodyHTML += `<td></td>`;
    bodyHTML += `</tr>`;

    // Calc ColSpan (moved total row up, now render loop)
    if (activeList.length === 0) {
        const totalCols = labelColSpan + 2;
        bodyHTML += `<tr><td colspan="${totalCols}" class="px-6 py-8 text-center text-gray-500">이번 달 내역이 없습니다. (0원 항목 제외)</td></tr>`;
    } else {
        activeList.forEach((item, index) => {
            const val = item.values[curM];
            const currentCat = item.category || '';
            const currentBank = item.bankAccount || '';
            const currentCard = item.card || '';
            const currentDate = item.date || '';

            const catColor = (roadmapData.categoryColors && roadmapData.categoryColors[currentPageType]) ? roadmapData.categoryColors[currentPageType][currentCat] : '';
            const rowStyle = catColor ? `style="background-color: ${catColor}33; border-left: 4px solid ${catColor};"` : 'class="border-b border-white/5"';

            bodyHTML += `<tr ${rowStyle.startsWith('class') ? rowStyle : `style="${catColor ? `background-color: ${catColor}22;` : ''} border-left: 4px solid ${catColor || 'transparent'}; border-bottom: 1px solid rgba(255,255,255,0.05);"`} 
                class="hover:bg-white/5 transition group" 
                draggable="true" 
                ondragstart="onRowDragStart(event, '${item.id}')" 
                ondragover="onRowDragOver(event)" 
                ondrop="onRowDrop(event, '${item.id}')">`;

            // Date (if cash or other_income)
            if (showDateContent) {
                bodyHTML += `<td class="px-6 py-3">
        <input type="date" class="bg-transparent text-white text-sm font-medium focus:outline-none focus:border-b focus:border-blue-500"
            value="${currentDate}" onchange="updateItemDate('${item.id}', this.value)">
        </td>`;
            }

            // Name
            bodyHTML += `<td class="px-6 py-1">
        <input type="text" class="w-full bg-transparent text-white font-medium focus:outline-none focus:border-b focus:border-blue-500 transition px-1 py-0.5"
            value="${item.name}" onblur="updateItemName('${item.id}', this.value)" placeholder="항목 이름">
        </td>`;

            // Content (if cash or other_income)
            if (showDateContent) {
                bodyHTML += `<td class="px-6 py-1">
        <input type="text" class="w-full bg-transparent text-white text-sm focus:outline-none focus:border-b focus:border-blue-500 transition px-1"
            value="${item.content || ''}" onblur="updateItemContent('${item.id}', this.value)" placeholder="상세 내용">
        </td>`;
            }

            // Category (Select)
            bodyHTML += `<td class="px-6 py-1">
        <select class="bg-gray-900 border border-gray-700 text-white text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
            onchange="updateItemCategory('${item.id}', this.value)">
            <option value="" disabled ${!currentCat ? 'selected' : ''}>선택</option>
            ${(roadmapData.categories[currentPageType] || []).map(c => `<option value="${c}" ${c === currentCat ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
            </td>`;

            // Card (Select) - Skip for Income, Fixed, Variable, and Cash
            if (!isIncome && currentPageType !== 'fixed' && currentPageType !== 'variable' && currentPageType !== 'cash') {
                bodyHTML += `<td class="px-6 py-1">
            <select class="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
                onchange="updateItemCard('${item.id}', this.value)">
                <option value="" disabled ${!currentCard ? 'selected' : ''}>선택</option>
                ${(roadmapData.cards[currentPageType] || []).map(c => `<option value="${c}" ${c === currentCard ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
                </td>`;
            }

            // Bank Account (Select)
            bodyHTML += `<td class="px-6 py-1">
        <select class="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
            onchange="updateItemBankAccount('${item.id}', this.value)">
            <option value="" disabled ${!currentBank ? 'selected' : ''}>선택</option>
            ${(roadmapData.bankAccounts[currentPageType] || []).map(b => `<option value="${b}" ${b === currentBank ? 'selected' : ''}>${b}</option>`).join('')}
        </select>
         </td>`;

            // Value (Current MonthOnly)
            bodyHTML += `<td class="px-6 py-1">
        <input type="text" class="table-input text-lg font-bold text-white bg-gray-900/50 rounded-lg px-2 py-1" value="${formatMoneyFull(val)}"
            onfocus="this.value = this.value.replace(/,/g, '')"
            onblur="updateItemValue('${item.id}', ${curM}, this.value)"
            onkeydown="if(event.key === 'Enter') this.blur();">
        </td>`;

            // Manage Buttons (Move & Delete & Edit)
            bodyHTML += `<td class="px-6 py-1">
                <div class="cell-wrapper">
                    <div class="flex items-center justify-center gap-1">`;

            // ... (rest of management row contents) ...
            bodyHTML += `<button onclick="openAddItemModal('${item.id}')" class="text-blue-400 hover:text-white p-2 rounded-full hover:bg-white/10" title="수정">✎</button>`;

            if (sortState.column) {
                bodyHTML += `<span class="text-xs text-gray-500 italic mr-2">정렬됨</span>`;
            }

            bodyHTML += `<button onclick="deleteItem('${item.id}')" class="text-gray-400 hover:text-red-500 transition p-2 rounded-full hover:bg-white/10" title="이번 달 제외">🗑️</button>`;

            bodyHTML += `</div></div></td>`;
            bodyHTML += `</tr>`;
        });
    }


    tbody.innerHTML = bodyHTML;
}

function renderYearlyTable() {
    const thead = document.getElementById('sheetHeaderRow');
    const tbody = document.getElementById('sheetBody');
    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];

    const isInstallment = currentPageType === 'installment';
    const isBusiness = currentPageType === 'business';

    // Header
    let headerHTML = '';

    if (isBusiness) {
        // Sticky Business Name First
        headerHTML += '<th class="px-4 py-3 text-center min-w-[120px] sticky left-0 bg-gray-900 border-r border-white/10 z-20">사업자명</th>';
        headerHTML += '<th class="px-4 py-3 text-center min-w-[80px]">구분</th>';
        headerHTML += '<th class="px-4 py-3 text-center min-w-[150px]">내용</th>';
    } else {
        headerHTML += '<th class="px-4 py-3 text-left min-w-[150px] sticky left-0 bg-gray-900 border-r border-white/10 z-20">항목명</th>';
    }

    // Dates
    roadmapData.months.forEach((m, i) => {
        headerHTML += `<th class="px-4 py-3 text-center min-w-[100px]">${m}</th>`;
    });
    headerHTML += '<th class="px-4 py-3 font-bold text-blue-400 text-right min-w-[100px] bg-gray-900 border-l border-white/10">합계</th>';
    headerHTML += '<th class="px-4 py-3 text-center min-w-[130px] bg-gray-900 border-l border-white/10">관리</th>';
    thead.innerHTML = headerHTML;

    // Body
    let bodyHTML = '';
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);

    const totalRowValues = new Array(12).fill(0);
    const exchangeRates = new Array(12).fill(1); // For Business Exchange Rate logic

    list.forEach(item => {
        const itemTotal = sum(item.values);
        const rowStyle = item.rowColor ? `background-color: ${item.rowColor};` : '';
        bodyHTML += `<tr class="hover:bg-white/5 transition group" style="${rowStyle}" 
            draggable="true" 
            ondragstart="onRowDragStart(event, '${item.id}')" 
            ondragover="onRowDragOver(event)" 
            ondrop="onRowDrop(event, '${item.id}')"
            ondragend="this.classList.remove('opacity-50')">`;

        let nameHtml = `<input type="text" class="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-blue-500"
    value="${item.name}" onblur="updateItemName('${item.id}', this.value)">`;

        // If installment, show card name as well
        if (isInstallment && item.card) {
            nameHtml = `<div class="flex flex-col"><span class="text-xs text-blue-400 mb-0.5">${item.card}</span>${nameHtml}</div>`;
        }

        // Body Render Order
        if (isBusiness) {
            const businesses = roadmapData.businessNames || [];
            // 2. Business Name (Sticky needs row color)
            bodyHTML += `<td class="p-2 min-w-[120px] sticky left-0 bg-card z-10 border-r border-white/10" style="${rowStyle}">
                <div class="flex items-center gap-1">
                    <span class="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 p-1 select-none opacity-0 group-hover:opacity-100 transition">⠿</span>
                    <select class="w-full bg-gray-900 border border-gray-700 text-white text-xs rounded p-1 business-name-select"
                        onchange="updateItemBusinessName('${item.id}', this.value)">
                        <option value="">(직접 입력/선택)</option>
                        ${businesses.map(b => `<option value="${b}" ${b === item.businessName ? 'selected' : ''}>${b}</option>`).join('')}
                    </select>
                </div>
            </td>`;
        } else {
            // 1. Name (Sticky)
            bodyHTML += `<td class="p-2 min-w-[150px] sticky left-0 bg-card z-10 border-r border-white/10" style="${rowStyle}">
                <div class="flex items-center gap-1">
                    <span class="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 p-1 select-none opacity-0 group-hover:opacity-100 transition">⠿</span>
                    ${nameHtml}
                </div>
            </td>`;
        }

        // Note: For Business, we skipped Name column. Business Name is now the first/sticky column.

        // 3. Category (if isBusiness) - Moved before Name in Header logic? No, Name is sticky left.
        // Wait, Header order was: Name (Sticky), then Business specific, then Dates.
        // My replacement above put Business Name BEFORE Name in DOM order if I write it here?
        // No, headerHTML construction determines order.
        // I changed headerHTML to: Business Name, Cat, Content, Name(Sticky).
        // Sticky needs to be left-most usually or handled carefully with `left`.
        // If Name is Sticky Left=0, and Business Name is NOT sticky, Business Name scrolls away.
        // User probably wants Business Name near Name.
        // Let's stick with: Sticky Name is first column visually?
        // Or make Business Name Sticky too?
        // Let's make "Business Name" the first column (Select), then "Name" (Input, Sticky), then "Category", "Content".
        // Actually, if Business Name is effectively the "Entity", maybe IT should be sticky?
        // But Name is the calculation key.
        // Let's try: [Business Name (Select)] [Name (Input, Sticky? No, usually sticky is first)]
        // If Name is Sticky Left, it must be the first or have defined 'left' offset.
        // Let's put Name FIRST (Sticky), then Business Name, then Category. 
        // Reverting Header Logic slightly in next thought?
        // Current proposed Header: BusinessName, Cat, Content, Name(Sticky). 
        // Name(Sticky) at end of metadata columns?
        // Visually: <Table> <Thead> <Tr>
        // Th(Name, Sticky) | Th(BizName) | Th(Cat) | Th(Content) | Th(Dates)...
        // If I write HTML sequentially:
        // Name (Sticky) must be written first in HTML if possible for standard flow, or just positioned.



        // Business Extra Columns
        if (isBusiness) {
            // 3. Category Select
            const cats = roadmapData.categories[currentPageType] || [];
            const colors = (roadmapData.categoryColors && roadmapData.categoryColors[currentPageType]) || {};
            const curColor = colors[item.category] || '#ffffff';

            bodyHTML += `<td class="p-2">
                <select class="w-full bg-transparent border border-gray-700 text-xs rounded p-1 font-bold"
                    style="color: ${curColor};"
                    onchange="updateItemCategory('${item.id}', this.value)">
                    <option value="" class="bg-gray-900" style="color: #ffffff">선택</option>
                    ${cats.map(c => {
                const cColor = colors[c] || '#ffffff';
                return `<option value="${c}" class="bg-gray-900" style="color: ${cColor}" ${c === item.category ? 'selected' : ''}>${c}</option>`;
            }).join('')}
                </select>
            </td>`;

            // 4. Content Input
            const ops = (roadmapData.categoryOperators && roadmapData.categoryOperators[currentPageType]) || {};
            const op = ops[item.category] || '+';

            bodyHTML += `<td class="p-2">
                <div class="flex items-center gap-1">
                <input type="text" class="w-full bg-transparent text-gray-300 text-xs focus:outline-none border-b border-white/10 focus:border-blue-500"
                    placeholder="내용 입력..."
                    value="${item.content || ''}" onblur="updateItemContent('${item.id}', this.value)">
                ${op === 'calc' ? `<button onclick="openFormulaModal('${item.id}')" class="shrink-0 text-xs bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white px-1.5 py-0.5 rounded transition font-mono border border-purple-500/30" title="수식 편집">ƒ</button>` : ''}
                </div>
            </td>`;
        }

        const cat = item.category;

        // Visual Indicator for Business Type (e.g. coloring based on cat)
        // ... (Optional)

        // Render 12 Months Data
        item.values.forEach((val, i) => {
            // Calculation Logic is now handled in finalTotalValues loop for Business
            // Only non-business uses simple accumulation inside this loop usually
            // BUT renderYearlyTable was designed to accumulate as it goes.
            // For Business, we moved logic to 'finalTotalValues' calc.
            // So for Business, totalRowValues[i] is just simple sum for now?
            // Actually, for display purposes of the "Total" column on the right, we still need itemTotal.
            // itemTotal is calculated above: `const itemTotal = sum(item.values);` -> This is just sum of numbers.

            // For the Bottom "Total" Row:
            if (!isBusiness) {
                totalRowValues[i] += val;
            } else {
                // If business, we need to pass values to the final loop differently or just store them?
                // Actually, the final loop iterates 'list', so it accesses all items again.
                // So we don't need to accumulate 'totalRowValues' inside this loop for Business.
            }


            let displayVal = formatMoneyFull(val);
            if (val === 0) displayVal = '<span class="text-gray-600">-</span>';

            if (isInstallment) {
                // Installment: Click to View Detail
                bodyHTML += `<td class="p-1 cursor-pointer hover:bg-blue-500/20 transition" onclick="renderInstallmentDetails('${item.id}', ${i})">
        <div class="text-right px-2 py-1">${displayVal}</div>
                 </td>`;
            } else {
                // Normal Edit
                bodyHTML += `<td class="p-1"><input type="text" class="table-input" value="${val === 0 ? '' : formatMoneyFull(val)}" placeholder="-" onfocus="this.value = this.value.replace(/,/g, '')" onblur="updateItemValue('${item.id}', ${i}, this.value)" onkeydown="if(event.key === 'Enter') this.blur();"></td>`;
            }
        });

        if (isInstallment) {
            bodyHTML += `<td class="px-4 py-2 text-right font-bold text-gray-300 bg-gray-900 border-l border-white/10 cursor-pointer hover:bg-blue-500/20" onclick="renderInstallmentDetails('${item.id}', -1)">${formatMoneyFull(itemTotal)}</td>`;
        } else {
            bodyHTML += `<td class="px-4 py-2 text-right font-bold text-gray-300 bg-gray-900 border-l border-white/10">${formatMoneyFull(itemTotal)}</td>`;
        }
        bodyHTML += `<td class="px-2 py-2 text-center bg-gray-900 border-l border-white/10 flex items-center justify-center gap-2">`;
        if (isInstallment) {
            bodyHTML += `<button onclick="openInstallmentModal('${item.id}')" class="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition p-1">✎</button>`;
        }
        // Move Buttons
        if (!isBusiness && !isInstallment) {
            bodyHTML += `<button onclick="moveItem('${item.id}', -1)" class="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition p-1 text-xs">▲</button>`;
            bodyHTML += `<button onclick="moveItem('${item.id}', 1)" class="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition p-1 text-xs">▼</button>`;
        }

        // Row Color Picker (Hex support)
        const rColor = item.rowColor || '#1f2937';
        bodyHTML += `<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <input type="color" value="${rColor}" class="w-5 h-5 p-0 border-none bg-transparent cursor-pointer" 
                onchange="updateRowColor('${item.id}', this.value)" title="색상 선택">
            <input type="text" value="${item.rowColor || ''}" placeholder="#" 
                class="w-14 h-5 text-[10px] bg-gray-800 text-white border border-gray-600 rounded px-1 focus:outline-none focus:border-blue-500"
                onblur="updateRowColor('${item.id}', this.value)" title="색상 코드 입력">
        </div>`;

        bodyHTML += `<button onclick="deleteItem('${item.id}')" class="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1">✕</button></td>`;
        bodyHTML += `</tr>`;
    });


    // Apply Exchange Rates and Custom Operators for Business
    let finalTotalValues = totalRowValues;

    if (isBusiness) {
        // Advanced Block-based Logic with Variables
        finalTotalValues = new Array(12).fill(0).map((_, i) => {
            let currentBlockSum = 0;
            let variableMap = {}; // Stores { 'SalesTotal': 100, ... }

            // Pre-fill variableMap (Keys: BusinessName + Content, Normalized)
            if (i === 0) console.log('--- DEBUG: Pre-fill Start (Month 1) ---');
            list.forEach(item => {
                // Key is strictly based on Content (user handles uniqueness in Content field: e.g. "A Sales")
                // Fallback to item.name only if content is missing
                const rawKey = item.content || item.name;
                let cleanName = rawKey.replace(/\s+/g, '').toLowerCase();

                let rawVal = item.values[i];
                if (typeof rawVal === 'string') rawVal = rawVal.replace(/,/g, '');
                let parsedVal = Number(rawVal) || 0;

                // Duplicate Check
                if (i === 0 && variableMap.hasOwnProperty(cleanName)) {
                    console.warn(`DEBUG: Duplicate Item Detected! Key '${cleanName}' (from '${rawKey}')`);
                    console.warn(`   -> Overwritten: Old ${variableMap[cleanName]} => New ${parsedVal}`);
                }

                variableMap[cleanName] = parsedVal;
            });
            if (i === 0) console.log('--- DEBUG: Pre-fill End ---');
            if (i === 0) console.log('DEBUG: Full VariableMap', variableMap);

            list.forEach(item => {
                let rawVal = item.values[i];
                if (typeof rawVal === 'string') rawVal = rawVal.replace(/,/g, '');
                let val = Number(rawVal) || 0;

                const catOp = (roadmapData.categoryOperators && roadmapData.categoryOperators[currentPageType] && roadmapData.categoryOperators[currentPageType][item.category]) || '+';
                const itemName = (item.businessName || '') + ' ' + (item.content || ''); // Display Name

                // Logic Key
                const rawKey = item.content || item.name;
                const cleanName = rawKey.replace(/\s+/g, '').toLowerCase();

                if (catOp === 'sum') {
                    // Subtotal Logic
                    if (i === 0) {
                        console.log(`DEBUG: [Sum] Processing '${itemName}'`);
                        console.log(`   -> Current Block Sum: ${currentBlockSum}`);
                        console.log(`   -> Overwriting VariableMap['${cleanName}']: was ${variableMap[cleanName]} => now ${currentBlockSum}`);
                    }
                    variableMap[cleanName] = currentBlockSum;
                    item.values[i] = currentBlockSum;
                    currentBlockSum = 0;
                } else if (catOp === 'calc') {
                    // Formula Logic
                    let formula = item.formula || item.content || '';
                    if (i === 0 && formula) console.log(`DEBUG: [Calc] '${itemName}' Formula:`, formula);

                    // Replace [Name] with values
                    formula = formula.replace(/\[([^\]]+)\]/g, (match, p1) => {
                        const key = p1.replace(/\s+/g, '').toLowerCase(); // Normalization must match above
                        const v = variableMap.hasOwnProperty(key) ? variableMap[key] : 0;
                        if (i === 0) console.log(`   -> Replace [${p1}] (key:'${key}') -> Val ${v}`);
                        return v;
                    });

                    // Evaluate safely
                    try {
                        // Allow digits, operators, parens, decimal, spaces only
                        if (/^[\d+\-*/().\s]+$/.test(formula)) {
                            const result = new Function('return ' + formula)();
                            item.values[i] = Math.round(result || 0);
                            variableMap[cleanName] = item.values[i]; // Store result for chaining
                            if (i === 0) console.log(`DEBUG: Result for '${itemName}':`, item.values[i]);
                        } else {
                            console.warn('DEBUG: Unsafe characters in formula:', formula);
                            item.values[i] = 0;
                        }
                    } catch (e) {
                        console.error('DEBUG: Formula Error', e);
                        item.values[i] = 0;
                    }
                    // Calc rows do NOT affect currentBlockSum usually

                } else {
                    // Normal Operation
                    if (catOp === '+') {
                        currentBlockSum += val;
                    } else if (catOp === '-') {
                        currentBlockSum -= val;
                    } else if (catOp === '*') {
                        if (val !== 0) currentBlockSum *= val;
                    } else if (catOp === '/') {
                        if (val !== 0) currentBlockSum /= val;
                    }
                    // Capture value for Formula reference
                    // Capture value for Formula reference - Already done in Pre-fill for raw values.
                    // If we want to support chaining where a normal item's value is modified by something else?
                    // Currently normal items are just inputs.
                    // variableMap[itemName] = val; // Removed redundant assignment
                }
            });
            // What to return for "Grand Total" at the bottom?
            // If we use blocks, the bottom total is meaningless if we sums atomic items.
            // Let's just return 0 or sum of atomic items.
            // Returning 0 effectively hides the bottom total if we want user to rely on 'Calc' rows.
            // But let's return the final residual block sum just in case.
            return Math.round(currentBlockSum);
        });
    }

    const grandTotal = sum(finalTotalValues);

    // User requested to remove "Total" (총계) row, likely for Business page or general.
    // "총 계는 삭제해줘"
    // I will hide it if isBusiness, or global?
    // Let's hide it for Business as requested in that context.
    if (!isBusiness) {
        bodyHTML += `<tr class="bg-gray-800/80 font-bold border-t-2 border-white/10">`;
        let labelColSpan = 1;
        bodyHTML += `<td class="px-4 py-3 sticky left-0 bg-gray-800/90 z-10 text-blue-300" colspan="${labelColSpan}">총계</td>`;
        finalTotalValues.forEach(val => { bodyHTML += `<td class="px-4 py-3 text-right text-blue-300">${formatMoneyFull(val)}</td>`; });
        bodyHTML += `<td class="px-4 py-3 text-right text-yellow-400 bg-gray-900 border-l border-white/10 main-total">${formatMoneyFull(grandTotal)}</td>`;
        bodyHTML += `<td class="bg-gray-900 border-l border-white/10"></td>`;
        bodyHTML += `</tr>`;
    }

    tbody.innerHTML = bodyHTML;
}

function renderInstallmentDetails(itemId, monthIndex) {
    const detailView = document.getElementById('detailView');
    const detailContent = document.getElementById('detailContent');
    const detailTitle = document.getElementById('detailTitle');

    if (!detailView || !detailContent) return;

    // Store current state for re-rendering
    window.lastDetailItemId = itemId;
    window.lastDetailMonthIndex = monthIndex;

    const yearData = roadmapData.years[currentYear];
    const list = yearData.details['installment'];
    const item = list.find(it => it.id === itemId);

    if (!item || !item.installmentInfo) {
        detailContent.innerHTML = '<p class="text-gray-500">할부 상세 정보가 없거나 단순히 추가된 항목입니다.</p>';
        detailView.classList.remove('hidden');
        return;
    }

    const info = item.installmentInfo;
    const totalPayment = (info.total || 0) + (info.totalInterest || 0);

    // Migration: If schedule is missing, generate it now
    if (!info.schedule) {
        info.schedule = calcInstallmentSchedule(info.total, info.months, info.rate, info.type).schedule;
    }

    const clickMonthTitle = (monthIndex === -1) ? '전체 요약' : `${currentYear}년 ${monthIndex + 1}월 상세`;
    detailTitle.innerText = `${item.name} - ${clickMonthTitle} `;

    let html = `<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-800 rounded-lg">
        <div><span class="block text-gray-500 text-xs">카드사</span><span class="font-bold text-blue-300">${item.card}</span></div>
        <div><span class="block text-gray-500 text-xs">총 할부원금</span><span class="font-bold text-white">${formatMoneyFull(info.total)}원</span></div>
        <div><span class="block text-gray-500 text-xs">총 이자액</span><span class="font-bold text-yellow-500">${formatMoneyFull(info.totalInterest)}원</span></div>
        <div><span class="block text-gray-500 text-xs">총 납부금액</span><span class="font-bold text-red-400">${formatMoneyFull(totalPayment)}원</span></div>
        <div><span class="block text-gray-500 text-xs">할부 조건</span><span class="font-bold text-green-400">${info.type === 'free' ? '무이자' : `${info.months}개월 (${info.rate}%)`}</span></div>
    </div>`;

    // Specific Month Detail
    if (monthIndex !== -1) {
        const diffYears = currentYear - info.startYear;
        const absMonthIndex = (diffYears * 12) + monthIndex - (info.startMonth - 1);

        if (absMonthIndex >= 0 && absMonthIndex < info.months) {
            const step = info.schedule[absMonthIndex];

            html += `<h4 class="font-bold text-lg mb-2 text-white border-b border-white/10 pb-2">${absMonthIndex + 1}회차 납부 내역 (수동 수정 가능)</h4>
            <div class="flex justify-between items-center bg-gray-700/50 p-4 rounded-lg">
                <div class="text-center flex-1">
                    <p class="text-xs text-gray-400 mb-1">납부 원금</p>
                    <input type="text" class="bg-gray-900 border border-gray-600 text-white font-bold text-center rounded p-1 w-24" 
                        value="${formatMoneyFull(step.principal)}" 
                        onfocus="this.value = this.value.replace(/,/g, '')"
                        onblur="updateInstallmentStep('${itemId}', ${absMonthIndex}, 'principal', this.value)">
                </div>
                <div class="text-2xl text-gray-600 px-2">+</div>
                <div class="text-center flex-1">
                    <p class="text-xs text-gray-400 mb-1">할부 이자</p>
                    <input type="text" class="bg-gray-900 border border-gray-600 text-yellow-500 font-bold text-center rounded p-1 w-24" 
                        value="${formatMoneyFull(step.interest)}" 
                        onfocus="this.value = this.value.replace(/,/g, '')"
                        onblur="updateInstallmentStep('${itemId}', ${absMonthIndex}, 'interest', this.value)">
                </div>
                <div class="text-2xl text-gray-600 px-2">=</div>
                <div class="text-center flex-1">
                    <p class="text-xs text-gray-400 text-blue-300">총 납부액</p>
                    <p class="text-xl font-bold text-blue-300">${formatMoneyFull(step.payment)}원</p>
                </div>
            </div>`;
        } else {
            html += `<p class="text-gray-500 py-4">이 달은 할부 납부 기간이 아닙니다.</p>`;
        }
    } else {
        // Full Schedule Summary (Simple list)
        html += `<h4 class="font-bold text-lg mb-2 text-white border-b border-white/10 pb-2">전체 상환 스케줄 (수동 수정 가능)</h4>
            <div class="max-h-80 overflow-y-auto">
                <table class="w-full text-xs text-left">
                    <thead class="bg-gray-700 text-gray-300 text-center sticky top-0 font-bold">
                        <tr><th class="p-2">회차</th><th class="p-2">원금</th><th class="p-2">이자</th><th class="p-2">합계</th><th class="p-2">잔액</th></tr>
                    </thead>
                    <tbody class="text-center">`;

        info.schedule.forEach((s, idx) => {
            html += `<tr class="border-b border-white/5 hover:bg-white/5">
                <td class="p-2">${s.monthIndex}</td>
                <td class="p-2">
                    <input type="text" class="bg-transparent border border-white/10 text-gray-300 text-right rounded px-1 w-20" 
                        value="${formatMoneyFull(s.principal)}" 
                        onfocus="this.value = this.value.replace(/,/g, '')"
                        onblur="updateInstallmentStep('${itemId}', ${idx}, 'principal', this.value)">
                </td>
                <td class="p-2">
                    <input type="text" class="bg-transparent border border-white/10 text-yellow-500 text-right rounded px-1 w-16" 
                        value="${formatMoneyFull(s.interest)}" 
                        onfocus="this.value = this.value.replace(/,/g, '')"
                        onblur="updateInstallmentStep('${itemId}', ${idx}, 'interest', this.value)">
                </td>
                <td class="p-2 font-bold text-white">${formatMoneyFull(s.payment)}</td>
                <td class="p-2 text-gray-500">${formatMoneyFull(s.balanceAfter)}</td>
             </tr>`;
        });
        html += `</tbody></table></div>`;
    }

    detailContent.innerHTML = html;
    detailView.classList.remove('hidden');
}

function updateInstallmentStep(itemId, absMonthIndex, field, value) {
    const numVal = parseInt(String(value).replace(/,/g, '')) || 0;

    // Update across ALL years for this item ID
    for (const y in roadmapData.years) {
        const list = roadmapData.years[y].details['installment'] || [];
        const item = list.find(it => it.id === itemId);
        if (item && item.installmentInfo) {
            const info = item.installmentInfo;
            if (!info.schedule) {
                info.schedule = calcInstallmentSchedule(info.total, info.months, info.rate, info.type).schedule;
            }

            const step = info.schedule[absMonthIndex];
            if (step) {
                step[field] = numVal;
                step.payment = step.principal + step.interest;
            }

            // Recalculate totals
            let newTotalInterest = 0;
            let newTotalPrincipal = 0;
            info.schedule.forEach(s => {
                newTotalInterest += s.interest;
                newTotalPrincipal += s.principal;
            });
            info.totalInterest = newTotalInterest;
            info.total = newTotalPrincipal;

            // Sync the values array for THIS year
            const startYear = parseInt(info.startYear);
            const startMonth = parseInt(info.startMonth);
            const newValues = new Array(12).fill(0);

            info.schedule.forEach((s, idx) => {
                const monthOffset = (startMonth - 1) + idx;
                const targetYear = startYear + Math.floor(monthOffset / 12);
                const targetMonthIdx = monthOffset % 12;

                if (String(targetYear) === String(y)) {
                    newValues[targetMonthIdx] += s.payment;
                }
            });
            item.values = newValues;
        }
    }

    saveData();
    updateUI();
    // Re-render detail view to show calculated payment total
    if (window.lastDetailItemId === itemId) {
        renderInstallmentDetails(itemId, window.lastDetailMonthIndex);
    }
}

function openCopyMonthModal() {
    const modal = document.getElementById('copyMonthModal');
    if (modal) {
        modal.style.display = 'flex';
        const yearSelect = document.getElementById('copyTargetYear');
        if (yearSelect) yearSelect.innerHTML = Object.keys(roadmapData.years).map(y => `<option value="${y}" ${y == currentYear ? 'selected' : ''}>${y}년</option>`).join('');
        const monthSelect = document.getElementById('copyTargetMonth');
        if (monthSelect) monthSelect.innerHTML = roadmapData.months.map((m, i) => `<option value="${i}" ${i === (currentMonth + 1) % 12 ? 'selected' : ''}>${m}</option>`).join('');
    }
}
function closeCopyMonthModal() { document.getElementById('copyMonthModal').style.display = 'none'; }
function confirmCopyMonth() {
    // ... Copy logic ...
    const tY = parseInt(document.getElementById('copyTargetYear').value);
    const tM = parseInt(document.getElementById('copyTargetMonth').value);
    if (isNaN(tY) || isNaN(tM)) return;
    if (!roadmapData.years[tY]) { alert('No data'); return; }
    if (!confirm('복사하시겠습니까?')) return;
    const srcList = roadmapData.years[currentYear].details[currentPageType];
    const tgtList = roadmapData.years[tY].details[currentPageType];
    srcList.forEach(src => {
        let tgt = tgtList.find(t => t.name === src.name);
        if (tgt) {
            tgt.values[tM] = src.values[currentMonth];
            if (!tgt.category) tgt.category = src.category;
            if (!tgt.bankAccount) tgt.bankAccount = src.bankAccount;
            if (!tgt.card) tgt.card = src.card;
            // Date not copied usually as it is specific
        } else {
            tgtList.push({
                id: Date.now() + Math.random().toString(), name: src.name, values: Object.assign([], new Array(12).fill(0), { [tM]: src.values[currentMonth] }),
                category: src.category || '', bankAccount: src.bankAccount || '', card: src.card || ''
            });
        }
    });
    saveData(); closeCopyMonthModal(); updateUI();
}

// --- Installment Calculator Logic ---

function openCategoryManager() {
    const modal = document.getElementById('categoryModal');
    const listEl = document.getElementById('catManagerList');
    if (!modal || !listEl) return;
    let html = '';
    const list = roadmapData.categories[currentPageType] || [];

    // Initialize operators map if needed
    if (!roadmapData.categoryOperators) roadmapData.categoryOperators = {};
    if (!roadmapData.categoryOperators[currentPageType]) roadmapData.categoryOperators[currentPageType] = {};

    // Initialize colors map if needed
    if (!roadmapData.categoryColors) roadmapData.categoryColors = {};
    if (!roadmapData.categoryColors[currentPageType]) roadmapData.categoryColors[currentPageType] = {};

    // Default migration for Business (if empty)
    if (currentPageType === 'business' && Object.keys(roadmapData.categoryOperators[currentPageType]).length === 0) {
        roadmapData.categoryOperators[currentPageType] = { '매출': '+', '비용': '-', '환율': '*' };
    }

    const operators = roadmapData.categoryOperators[currentPageType];
    const colors = roadmapData.categoryColors[currentPageType];

    list.forEach((cat, idx) => {
        const op = operators[cat] || '+'; // Default
        const color = colors[cat] || '#ffffff';
        let opDisplay = op;
        let opColor = 'text-gray-400';

        if (op === '+') { opDisplay = '+'; opColor = 'text-green-400'; }
        else if (op === '-') { opDisplay = '-'; opColor = 'text-red-400'; }
        else if (op === '*') { opDisplay = '×'; opColor = 'text-yellow-400'; }
        else if (op === '/') { opDisplay = '÷'; opColor = 'text-yellow-400'; }
        else if (op === 'sum') { opDisplay = 'Σ'; opColor = 'text-blue-400'; }
        else if (op === 'calc') { opDisplay = 'ƒ'; opColor = 'text-purple-400'; }

        html += `<div class="flex justify-between items-center bg-gray-700 p-2 rounded mb-2 gap-2">
            <span class="font-bold w-6 text-center ${opColor}">${opDisplay}</span>
            <input type="color" value="${color}" class="w-6 h-6 p-0 border-none bg-transparent cursor-pointer" 
                   onchange="updateCatColor('${cat}', this.value)" title="색상 변경">
            <span class="flex-1 font-medium ml-2" style="color:${color}">${cat}</span>
            <div class="flex gap-2">
                <button onclick="editCategory(${idx})" class="text-blue-400 p-1">✏️</button>
                <button onclick="deleteCategory(${idx})" class="text-red-400 p-1">🗑️</button>
            </div>
        </div>`;
    });
    listEl.innerHTML = html;
    modal.style.display = 'flex';
}

function updateCatColor(catName, newColor) {
    if (!roadmapData.categoryColors) roadmapData.categoryColors = {};
    if (!roadmapData.categoryColors[currentPageType]) roadmapData.categoryColors[currentPageType] = {};

    roadmapData.categoryColors[currentPageType][catName] = newColor;
    saveData();
    // No need to full re-render list if we just changed color, but let's update UI to reflect in table
    updateUI();
    // Re-open/Refresh manager to confirm visual? Not strictly needed if input keeps state.
    // openCategoryManager(); 
}

function editCategory(idx) {
    const list = roadmapData.categories[currentPageType] || [];
    const oldName = list[idx];
    const operators = roadmapData.categoryOperators ? roadmapData.categoryOperators[currentPageType] : {};
    const oldOp = operators[oldName] || '+';

    // Simple prompt is not enough for Op + Name. Just prompt for Name, cycle Op? Or separated?
    // Let's us prompt for Name, and if changed, ask for Operator? Or just reuse Name prompt and separate Op logic?
    // User requested "Select formula". 
    // Let's toggle operator on click? No, edit button should ideally open a mini form or just prompt.
    // For simplicity: Prompt for Name, then Prompt for Operator.

    const newName = prompt('수정할 이름을 입력하세요:', oldName);
    if (newName && newName.trim() !== '') {
        const trimmed = newName.trim();
        if (trimmed !== oldName && list.includes(trimmed)) { alert('중복된 이름입니다.'); return; }

        let newOp = oldOp;
        const opInput = prompt('연산자를 입력하세요 (+, -, *, /, sum, calc)', oldOp);
        if (opInput) {
            const t = opInput.trim().toLowerCase();
            if (['+', '-', '*', '/', 'sum', 'calc'].includes(t)) {
                newOp = t;
            }
        }

        list[idx] = trimmed;

        // Update Op Map
        if (trimmed !== oldName) delete operators[oldName];
        operators[trimmed] = newOp;
        roadmapData.categoryOperators[currentPageType] = operators;

        // Update usages
        for (const y in roadmapData.years) {
            const items = roadmapData.years[y].details[currentPageType];
            if (items) {
                items.forEach(it => { if (it.category === oldName) it.category = trimmed; });
            }
        }
        saveData(); openCategoryManager(); updateUI();
    }
}

function addCategory() {
    const val = document.getElementById('newCatInput').value.trim();
    const op = document.getElementById('newCatOp') ? document.getElementById('newCatOp').value : '+';
    const color = document.getElementById('newCatColor') ? document.getElementById('newCatColor').value : '#ffffff';

    if (!roadmapData.categories[currentPageType]) roadmapData.categories[currentPageType] = [];
    const list = roadmapData.categories[currentPageType];

    if (!roadmapData.categoryOperators) roadmapData.categoryOperators = {};
    if (!roadmapData.categoryOperators[currentPageType]) roadmapData.categoryOperators[currentPageType] = {};

    if (!roadmapData.categoryColors) roadmapData.categoryColors = {};
    if (!roadmapData.categoryColors[currentPageType]) roadmapData.categoryColors[currentPageType] = {};

    if (val && !list.includes(val)) {
        list.push(val);
        roadmapData.categoryOperators[currentPageType][val] = op;
        roadmapData.categoryColors[currentPageType][val] = color;
        saveData();
        document.getElementById('newCatInput').value = '';
        openCategoryManager(); updateUI();
    } else {
        alert('이름을 입력하거나 이미 존재하는 구분입니다.');
    }
}

function deleteCategory(idx) {
    if (confirm('삭제하시겠습니까?')) {
        if (roadmapData.categories[currentPageType]) {
            const name = roadmapData.categories[currentPageType][idx];
            roadmapData.categories[currentPageType].splice(idx, 1);

            if (roadmapData.categoryOperators && roadmapData.categoryOperators[currentPageType]) {
                delete roadmapData.categoryOperators[currentPageType][name];
            }

            saveData(); openCategoryManager(); updateUI();
        }
    }
}
function closeCategoryManager() { document.getElementById('categoryModal').style.display = 'none'; }


function openBankManager() {
    const modal = document.getElementById('bankModal');
    const listEl = document.getElementById('bankManagerList');
    if (!modal || !listEl) return;
    if (!roadmapData.bankAccounts) roadmapData.bankAccounts = {};
    if (!roadmapData.bankAccounts[currentPageType]) roadmapData.bankAccounts[currentPageType] = [];

    const list = roadmapData.bankAccounts[currentPageType];
    let html = '';
    list.forEach((bank, idx) => {
        html += `<div class="flex justify-between items-center bg-gray-700 p-2 rounded mb-2">
            <span class="flex-1 ml-2 font-medium">${bank}</span>
            <div class="flex gap-2"><button onclick="editBankAccount(${idx})" class="text-blue-400 p-1">✏️</button><button onclick="deleteBankAccount(${idx})" class="text-red-400 p-1">🗑️</button></div></div>`;
    });
    listEl.innerHTML = html;
    modal.style.display = 'flex';
}
function editBankAccount(idx) {
    const list = roadmapData.bankAccounts[currentPageType];
    const oldName = list[idx];
    const newName = prompt('수정:', oldName);
    if (newName && newName.trim() !== '' && newName !== oldName) {
        if (list.includes(newName)) { alert('중복'); return; }
        const trimmed = newName.trim();
        list[idx] = trimmed;
        // Update usages loop...
        for (const y in roadmapData.years) {
            const items = roadmapData.years[y].details[currentPageType];
            if (items) {
                items.forEach(it => { if (it.bankAccount === oldName) it.bankAccount = trimmed; });
            }
        }
        saveData(); openBankManager(); updateUI();
    }
}
function addBankAccount() {
    const val = document.getElementById('newBankInput').value.trim();
    if (!roadmapData.bankAccounts[currentPageType]) roadmapData.bankAccounts[currentPageType] = [];
    const list = roadmapData.bankAccounts[currentPageType];

    if (val && !list.includes(val)) {
        list.push(val); saveData();
        document.getElementById('newBankInput').value = ''; openBankManager(); updateUI();
    }
}
function deleteBankAccount(idx) {
    if (confirm('삭제?')) {
        if (roadmapData.bankAccounts[currentPageType]) {
            roadmapData.bankAccounts[currentPageType].splice(idx, 1);
            saveData(); openBankManager(); updateUI();
        }
    }
}
function closeBankManager() { document.getElementById('bankModal').style.display = 'none'; }


function openCardManager() {
    const modal = document.getElementById('cardModal');
    const listEl = document.getElementById('cardManagerList');
    if (!modal || !listEl) return;
    if (!roadmapData.cards) roadmapData.cards = {};
    if (!roadmapData.cards[currentPageType]) roadmapData.cards[currentPageType] = [];

    const list = roadmapData.cards[currentPageType];
    let html = '';
    list.forEach((card, idx) => {
        html += `<div class="flex justify-between items-center bg-gray-700 p-2 rounded mb-2">
            <span class="flex-1 ml-2 font-medium">${card}</span>
            <div class="flex gap-2"><button onclick="editCard(${idx})" class="text-blue-400 p-1">✏️</button><button onclick="deleteCard(${idx})" class="text-red-400 p-1">🗑️</button></div></div>`;
    });
    listEl.innerHTML = html;
    modal.style.display = 'flex';
}
function editCard(idx) {
    const list = roadmapData.cards[currentPageType];
    const oldName = list[idx];
    const newName = prompt('수정:', oldName);
    if (newName && newName.trim() !== '' && newName !== oldName) {
        if (list.includes(newName)) { alert('중복'); return; }
        const trimmed = newName.trim();
        list[idx] = trimmed;
        // Update usages loop...
        for (const y in roadmapData.years) {
            const items = roadmapData.years[y].details[currentPageType];
            if (items) {
                items.forEach(it => { if (it.card === oldName) it.card = trimmed; });
            }
        }
        saveData(); openCardManager(); updateUI();
    }
}
function addCard() {
    const val = document.getElementById('newCardInput').value.trim();
    if (!roadmapData.cards[currentPageType]) roadmapData.cards[currentPageType] = [];
    const list = roadmapData.cards[currentPageType];

    if (val && !list.includes(val)) {
        list.push(val); saveData();
        document.getElementById('newCardInput').value = ''; openCardManager(); updateUI();
    }
}
function deleteCard(idx) {
    if (confirm('삭제?')) {
        if (roadmapData.cards[currentPageType]) {
            roadmapData.cards[currentPageType].splice(idx, 1);
            saveData(); openCardManager(); updateUI();
        }
    }
}
function closeCardManager() { document.getElementById('cardModal').style.display = 'none'; }

// --- Installment Calculator Logic ---

function openInstallmentModal(itemId = null) {
    const modal = document.getElementById('installmentModal');
    if (!modal) return;
    modal.style.display = 'flex';

    const cardSelect = document.getElementById('instCard');
    if (cardSelect) {
        cardSelect.innerHTML = `<option value="">선택</option>` +
            (roadmapData.cards[currentPageType] || []).map(c => `<option value="${c}">${c}</option>`).join('');
    }

    const saveBtn = modal.querySelector('button[onclick="confirmAddInstallment()"]');
    if (itemId) {
        // Edit Mode
        const yearData = roadmapData.years[currentYear];
        const list = yearData.details['installment'];
        const item = list.find(it => it.id === itemId);
        if (!item) {
            closeInstallmentModal();
            return;
        }

        modal.dataset.editId = itemId;
        if (saveBtn) saveBtn.innerText = '수정 완료';

        const info = item.installmentInfo || {};

        // Set Date
        const y = info.startYear || currentYear;
        const m = String(info.startMonth || (currentMonth + 1)).padStart(2, '0');
        document.getElementById('instDate').value = `${y}-${m}`;

        document.getElementById('instCard').value = item.card || '';
        document.getElementById('instName').value = item.name || '';
        document.getElementById('instAmount').value = formatMoneyFull(info.total || 0); // Need to use utility or simple replace
        document.getElementById('instMonths').value = info.months || 3;
        document.getElementById('instType').value = info.type || 'free';
        document.getElementById('instRate').value = info.rate || 19.3;

        if (info.type === 'partial-custom' && info.customMonths) {
            document.getElementById('instPayMonths').value = info.customMonths.join(',');
        }
    } else {
        // New Mode
        delete modal.dataset.editId;
        if (saveBtn) saveBtn.innerText = '저장';

        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        document.getElementById('instDate').value = `${yyyy}-${mm}`;

        document.getElementById('instName').value = '';
        document.getElementById('instAmount').value = '';
        document.getElementById('instMonths').value = '3';
        document.getElementById('instType').value = 'free';
        document.getElementById('instRate').value = '19.3';
        document.getElementById('instPayMonths').value = ''; // Reset custom field

        // Defaults
        document.getElementById('instCard').value = '';
    }

    toggleInstOptions();
    calculatePreview();
}

// --- Business Name Manager ---
function openBusinessNameManager() {
    const modal = document.getElementById('businessNameModal');
    const listEl = document.getElementById('businessNameList');
    if (!modal || !listEl) return;

    if (!roadmapData.businessNames) roadmapData.businessNames = [];
    const list = roadmapData.businessNames;

    let html = '';
    list.forEach((name, idx) => {
        html += `<div class="flex justify-between items-center bg-gray-700 p-2 rounded mb-2">
            <span class="flex-1 ml-2 font-medium">${name}</span>
            <div class="flex gap-2">
                <button onclick="editBusinessName(${idx})" class="text-blue-400 p-1">✏️</button>
                <button onclick="deleteBusinessName(${idx})" class="text-red-400 p-1">🗑️</button>
            </div>
        </div>`;
    });
    listEl.innerHTML = html;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function addBusinessName() {
    const input = document.getElementById('newBusinessNameInput');
    if (!input) return;
    const name = input.value.trim();

    if (!roadmapData.businessNames) roadmapData.businessNames = [];

    if (name && !roadmapData.businessNames.includes(name)) {
        roadmapData.businessNames.push(name);
        input.value = '';
        saveData();
        openBusinessNameManager();
        updateUI(); // Reflect in dropdowns
    } else if (name) {
        alert('이미 존재하는 사업자명입니다.');
    }

    function updateColumnColor(colKey, color) {
        if (!roadmapData.columnColors) roadmapData.columnColors = {};
        roadmapData.columnColors[colKey] = color;
        saveData();
        updateUI();
    }
}

function updateRowColor(id, color) {
    if (currentPageType === 'installment') {
        for (const y in roadmapData.years) {
            const list = roadmapData.years[y].details['installment'] || [];
            const item = list.find(it => it.id === id);
            if (item) item.rowColor = color;
        }
    } else {
        const yearData = roadmapData.years[currentYear];
        const list = yearData.details[currentPageType];
        const item = list.find(it => it.id === id);
        if (item) item.rowColor = color;
    }
    saveData();
    updateUI();
}

function editBusinessName(idx) {
    const oldName = roadmapData.businessNames[idx];
    const newName = prompt('수정할 사업자명을 입력하세요:', oldName);
    if (newName && newName.trim() !== '' && newName !== oldName) {
        if (roadmapData.businessNames.includes(newName.trim())) { alert('중복된 이름입니다.'); return; }

        roadmapData.businessNames[idx] = newName.trim();

        // Update usages in data
        for (const y in roadmapData.years) {
            if (roadmapData.years[y].details.business) {
                roadmapData.years[y].details.business.forEach(item => {
                    if (item.businessName === oldName) item.businessName = newName.trim();
                });
            }
        }

        saveData();
        openBusinessNameManager();
        updateUI();
    }
}

function deleteBusinessName(idx) {
    if (confirm('삭제하시겠습니까? 관련 항목의 사업자명 선택이 해제될 수 있습니다.')) {
        roadmapData.businessNames.splice(idx, 1);
        saveData();
        openBusinessNameManager();
        updateUI();
    }
}
function closeBusinessNameManager() {
    const modal = document.getElementById('businessNameModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}
function updateItemBusinessName(id, val) {
    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];
    const item = list.find(it => it.id === id);
    if (item) {
        item.businessName = val;
        saveData();
        // No updateUI needed if it's just a select change, strictly speaking, but safer to re-render
        // updateUI(); 
    }
}

function confirmAddInstallment() {
    const modal = document.getElementById('installmentModal');
    const editId = modal.dataset.editId;

    const dateVal = document.getElementById('instDate').value; // yyyy-mm
    const card = document.getElementById('instCard').value;
    const name = document.getElementById('instName').value.trim();
    const amountStr = document.getElementById('instAmount').value.replace(/,/g, '');
    const total = parseInt(amountStr) || 0;
    const months = parseInt(document.getElementById('instMonths').value) || 2;
    const type = document.getElementById('instType').value;
    const rate = parseFloat(document.getElementById('instRate').value) || 19.3;

    // Custom Partial Months
    const customStr = document.getElementById('instPayMonths').value;
    let customMonths = [];
    if (type === 'partial-custom') {
        customMonths = customStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }

    if (!dateVal) { alert('결제 시작일을 선택하세요'); return; }
    if (!name) { alert('항목명을 입력하세요'); return; }
    if (total <= 0) { alert('금액을 입력하세요'); return; }

    const [startYear, startMonth] = dateVal.split('-').map(Number);
    const scheduleRes = calcInstallmentSchedule(total, months, rate, type);

    // Prepare Info Object
    const installmentInfo = {
        startYear,
        startMonth,
        total,
        months,
        type,
        rate,
        customMonths,
        totalInterest: scheduleRes.totalInterest,
        schedule: scheduleRes.schedule // Store the computed schedule
    };

    // 1. Group schedule by year
    const yearToValues = {};
    scheduleRes.schedule.forEach(step => {
        const stepAbsMonth = step.monthIndex - 1;
        const monthOffset = (startMonth - 1) + stepAbsMonth;
        const targetYear = String(startYear + Math.floor(monthOffset / 12));
        const targetMonthIdx = monthOffset % 12;

        if (!yearToValues[targetYear]) {
            yearToValues[targetYear] = new Array(12).fill(0);
        }
        yearToValues[targetYear][targetMonthIdx] += step.payment;
    });

    const finalId = editId || Date.now().toString();
    console.log(`[InstallmentSync] ID: ${finalId}, Years:`, Object.keys(yearToValues));

    // 2. Identify all years that need sync (newly affected + existingly affected)
    const affectedYears = new Set(Object.keys(yearToValues));
    for (const y in roadmapData.years) {
        const list = roadmapData.years[y].details['installment'] || [];
        if (list.some(it => it.id === finalId)) {
            affectedYears.add(y);
        }
    }

    // 3. Sync across all affected years
    affectedYears.forEach(y => {
        // Create year data if it doesn't exist but has payments
        if (!roadmapData.years[y] && yearToValues[y]) {
            console.log(`[InstallmentSync] Creating new year object for ${y}`);
            roadmapData.years[y] = roadmapData.createYearData();
        }
        if (!roadmapData.years[y]) return;

        const list = roadmapData.years[y].details['installment'];
        let item = list.find(it => it.id === finalId);

        if (yearToValues[y]) {
            // This year has installment payments
            if (!item) {
                console.log(`[InstallmentSync] Adding to year ${y}`);
                item = {
                    id: finalId,
                    name: name,
                    category: '할부',
                    card: card,
                    bankAccount: '',
                    values: yearToValues[y],
                    installmentInfo: installmentInfo
                };
                list.push(item);
            } else {
                console.log(`[InstallmentSync] Updating year ${y}`);
                item.name = name;
                item.card = card;
                item.installmentInfo = installmentInfo;
                item.values = yearToValues[y];
            }
        } else {
            // This year no longer has payments (due to edit date/months change)
            console.log(`[InstallmentSync] Removing from year ${y} (no more payments)`);
            const idx = list.findIndex(it => it.id === finalId);
            if (idx > -1) {
                list.splice(idx, 1);
            }
        }
    });

    saveData();
    closeInstallmentModal();
    updateUI();
}

function closeInstallmentModal() {
    const modal = document.getElementById('installmentModal');
    if (modal) modal.style.display = 'none';
}

function toggleInstOptions() {
    const type = document.getElementById('instType').value;
    const detailDiv = document.getElementById('instDetailOptions');
    const customDiv = document.getElementById('customPartialDiv');

    if (type === 'free') {
        detailDiv.classList.add('hidden');
    } else {
        detailDiv.classList.remove('hidden');
        if (type === 'partial-custom') customDiv.classList.remove('hidden');
        else customDiv.classList.add('hidden');
    }
}

function getInterestMonths(type, months) {
    // Returns array of 1-based indices that require interest payment
    if (type === 'free') return [];
    if (type === 'interest') return Array.from({ length: months }, (_, i) => i + 1);

    // Predetermined Logic for Standard Partial Interest Free (Matching Labels)
    if (type === 'partial-10') return [1, 2, 3, 4, 5]; // 1~5회차 회원 부담
    if (type === 'partial-12') return [1, 2, 3, 4, 5, 6]; // 1~6회차 회원 부담

    if (type === 'partial-custom') {
        const val = document.getElementById('instPayMonths').value;
        if (!val) return [];
        return val.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }
    return [];
}

function calcInstallmentSchedule(total, months, rateAnnual, type) {
    const schedule = [];
    const intMonths = getInterestMonths(type, months);

    let balance = total;
    const basePrincipal = Math.floor(total / months);
    const firstPrincipal = total - (basePrincipal * (months - 1)); // Handle remainder

    let totalInterest = 0;

    for (let i = 1; i <= months; i++) {
        const principal = (i === 1) ? firstPrincipal : basePrincipal;
        let interest = 0;

        if (intMonths.includes(i)) {
            // Calculate interest on remaining balance
            // Monthly Rate = Annual / 12 / 100
            interest = Math.floor(balance * (rateAnnual / 100 / 12));
        }

        const payment = principal + interest;

        schedule.push({
            monthIndex: i, // 1-based
            principal: principal,
            interest: interest,
            payment: payment,
            balanceAfter: balance - principal
        });

        totalInterest += interest;
        balance -= principal;
    }

    return { schedule, totalInterest };
}

function calculatePreview() {
    const amountStr = document.getElementById('instAmount').value.replace(/,/g, '');
    const total = parseInt(amountStr) || 0;
    const months = parseInt(document.getElementById('instMonths').value) || 2;
    const type = document.getElementById('instType').value;
    const rate = parseFloat(document.getElementById('instRate').value) || 19.0;

    if (total <= 0) {
        document.getElementById('previewFirstMonth').innerText = '0원';
        document.getElementById('previewTotalInterest').innerText = '0원';
        return;
    }

    const res = calcInstallmentSchedule(total, months, rate, type);

    // Update Preview UI
    const firstPay = res.schedule[0].payment;
    document.getElementById('previewFirstMonth').innerText = formatMoneyFull(firstPay) + '원';
    document.getElementById('previewTotalInterest').innerText = formatMoneyFull(res.totalInterest) + '원';

    return res;
}

// --- Formula Modal Functions ---
let currentFormulaItemId = null;

function openFormulaModal(id) {
    currentFormulaItemId = id;
    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];
    const item = list.find(it => it.id === id);
    if (!item) return;

    const modal = document.getElementById('formulaModal');
    const input = document.getElementById('formulaInput');
    if (modal && input) {
        input.value = item.formula || ((item.category === 'calc' || (roadmapData.categoryOperators && roadmapData.categoryOperators[currentPageType] && roadmapData.categoryOperators[currentPageType][item.category] === 'calc')) ? item.content : '') || '';
        // If content is used as formula, and contains brackets, assume it's formula.
        // User said "Just write content in content".
        // Default to item.formula.
        input.value = item.formula || '';

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        input.focus();
    }
}

function closeFormulaModal() {
    const modal = document.getElementById('formulaModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    currentFormulaItemId = null;
}

function saveFormula() {
    if (!currentFormulaItemId) return;
    const input = document.getElementById('formulaInput');
    const val = input.value;

    const yearData = roadmapData.years[currentYear];
    const list = yearData.details[currentPageType];
    const item = list.find(it => it.id === currentFormulaItemId);

    if (item) {
        item.formula = val;
        saveData();
        // Recalculate and update
        // We need to trigger re-calculation. openFormulaModal just edits data.
        // The updateUI calls renderYearlyTable which calls calculation logic?
        // Yes, renderYearlyTable recalculates everything.
        updateUI();
        closeFormulaModal();
    }
}
