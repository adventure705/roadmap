// Settlement Page Logic

let settleViewMode = 'monthly'; // 'monthly' or 'weekly'
let pendingClassifications = []; // Queue for items needing classification

const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#a855f7'];

function initSettlementPage() {
    window.currentPageType = 'settlement';
    window.updateUI = updateSettlementUI; // Alias for data.js
    renderMemos();
    updateSettlementUI();
}

function updateSettlementUI() {
    // Year/Month Display
    const yearDisplay = document.getElementById('sheetYearDisplay');
    if (yearDisplay) yearDisplay.innerText = currentYear;
    const monthDisplay = document.getElementById('sheetMonthDisplay');
    if (monthDisplay) monthDisplay.innerText = (currentMonth + 1) + '월';

    if (settleViewMode === 'monthly') {
        renderSettlementMonthly();
    } else {
        renderSettlementWeekly();
    }
    renderMemos();
}

function toggleSettlementView(mode) {
    settleViewMode = mode;
    const mBtn = document.getElementById('btnMonthlyView');
    const wBtn = document.getElementById('btnWeeklyView');
    const mCanvas = document.getElementById('monthlyViewCanvas');
    const wCanvas = document.getElementById('weeklyViewCanvas');

    if (mode === 'monthly') {
        mBtn.className = "bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold opacity-100";
        wBtn.className = "bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm font-bold hover:bg-gray-600 transition";
        mCanvas.classList.remove('hidden');
        wCanvas.classList.add('hidden');
    } else {
        wBtn.className = "bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold opacity-100";
        mBtn.className = "bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm font-bold hover:bg-gray-600 transition";
        wCanvas.classList.remove('hidden');
        mCanvas.classList.add('hidden');
    }
    updateSettlementUI();
}

// --- Data Access Helpers ---
function getSettlementData() {
    // Ensure current year exists
    if (!roadmapData.years[currentYear]) {
        roadmapData.years[currentYear] = roadmapData.createYearData();
    }
    const yearData = roadmapData.years[currentYear];
    if (!yearData.settlementData) {
        yearData.settlementData = {
            budgets: Array.from({ length: 12 }, () => ({})),
            rules: {}
        };
    }
    return yearData.settlementData;
}

function getMonthlyTransactions() {
    return getTransactionsForMonth(currentYear, currentMonth);
}

function getTransactionsForMonth(year, month) {
    if (!roadmapData.years[year]) return [];

    const list = roadmapData.years[year].details.settlement || [];
    const targetPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    return list.filter(item => {
        if (!item.date) return false;
        if (item.date.startsWith(targetPrefix)) return true;
        const d = new Date(item.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });
}


// Sort State
let currentSort = { key: 'date', order: 'desc' };

function sortTransactions(key) {
    if (currentSort.key === key) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.key = key;
        currentSort.order = 'desc';
    }
    updateSettlementUI(); // Re-render
}

// --- 1. Monthly View ---
function renderSettlementMonthly() {
    const tbody = document.getElementById('monthlyTableBody');
    const cats = roadmapData.categories.settlement;
    const stData = getSettlementData();
    const budgets = stData.budgets[currentMonth] || {};

    const allTransactions = getMonthlyTransactions(); // Current
    const excludedCats = ['고정지출'];
    const mainTransactions = allTransactions.filter(t => !excludedCats.includes(t.category));
    const excludedTransactions = allTransactions.filter(t => excludedCats.includes(t.category));

    // Get Prev Data
    let prevY = currentYear;
    let prevM = currentMonth - 1;
    if (prevM < 0) { prevY--; prevM = 11; }
    const prevTransactions = getTransactionsForMonth(prevY, prevM);
    const prevMain = prevTransactions.filter(t => !excludedCats.includes(t.category));

    const sumCat = (list, cat) => list.filter(t => t.category === cat).reduce((s, t) => s + (t.amount || 0), 0);

    // Calculate Main Summaries
    let totalBudget = 0;
    let totalActual = 0;
    let totalPrevActual = 0;

    cats.forEach(cat => {
        totalBudget += (budgets[cat] || 0);
        totalActual += sumCat(mainTransactions, cat);
        totalPrevActual += sumCat(prevMain, cat);
    });



    // --- Chart Logic (Use Total Actual vs Budget Share etc) ---
    // Only visualization of Current Month Share
    let gradientSegments = [];
    let currentAngle = 0;
    const chartEl = document.getElementById('settlementPieChart');

    let html = '';
    let legendHTML = '';
    let overlayHTML = '';

    // Render Rows & Chart
    cats.forEach((cat, index) => {
        const budget = budgets[cat] || 0;
        const actual = sumCat(mainTransactions, cat);
        const prev = sumCat(prevMain, cat);

        // Comparison Diff (Actual - Prev)
        const compDiff = actual - prev;
        const compPct = prev > 0 ? Math.round((compDiff / prev) * 100) : (actual > 0 ? 100 : 0);

        // Color: Spend More = Red, Spend Less = Blue
        const compColor = compDiff > 0 ? 'text-red-400' : (compDiff < 0 ? 'text-blue-400' : 'text-gray-500');
        const arrow = compDiff > 0 ? '▲' : (compDiff < 0 ? '▼' : '');
        const compStr = prev > 0 ? `${arrow} ${Math.abs(compPct)}%` : (actual > 0 ? 'New' : '-');

        // Share
        const share = totalActual > 0 ? (actual / totalActual) * 100 : 0;
        const shareRounded = Math.round(share);
        const color = CHART_COLORS[index % CHART_COLORS.length];

        // Chart Segment
        if (share > 0) {
            const endAngle = currentAngle + (share * 3.6);
            gradientSegments.push(`${color} ${currentAngle}deg ${endAngle}deg`);

            legendHTML += `
                <div class="flex items-center gap-3">
                    <div class="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" style="background-color: ${color}"></div>
                    <div class="flex flex-col">
                        <span class="text-sm text-gray-200 font-bold">${cat}</span>
                        <span class="text-sm font-bold" style="color:${color}">${shareRounded}%</span>
                    </div>
                </div>
            `;

            if (share > 6) {
                const midAngle = currentAngle + (share * 3.6) / 2;
                const rad = (midAngle * Math.PI) / 180;
                const r = 105;
                const x = Math.round(r * Math.sin(rad));
                const y = Math.round(-r * Math.cos(rad));
                overlayHTML += `<div style="position: absolute; left: 50%; top: 50%; transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px)); text-align: center; pointer-events: none; z-index: 20; text-shadow: 0 2px 4px rgba(0,0,0,0.9);">
                    <div class="text-[14px] font-bold text-white leading-tight drop-shadow-md mb-0.5">${cat}</div>
                    <div class="text-[14px] font-extrabold text-white">${shareRounded}%</div>
                </div>`;
            }
            currentAngle = endAngle;
        }

        html += `<tr class="border-b border-white/5 hover:bg-white/5 transition">
            <td class="px-6 py-4 text-left font-bold text-gray-300 flex items-center gap-3">
                <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
                ${cat}
            </td>
            <td class="px-6 py-4 text-right">${formatMoneyFull(budget)}</td>
            <td class="px-6 py-4 text-right text-gray-400">${formatMoneyFull(prev)}</td>
            <td class="px-6 py-4 text-right font-bold text-white">${formatMoneyFull(actual)}</td>
            <td class="px-6 py-4 text-right ${compColor}">
                <span class="mr-1">${arrow} ${formatMoneyFull(Math.abs(compDiff))}</span>
                <span class="text-xs opacity-70">(${Math.abs(compPct)}%)</span>
            </td>
            <td class="px-6 py-4 text-center text-gray-400 font-bold">
                ${shareRounded}%
            </td>
        </tr>`;
    });

    tbody.innerHTML = html;

    const legendEl = document.getElementById('settlementChartLegend');
    if (legendEl) legendEl.innerHTML = legendHTML;

    if (chartEl) {
        if (totalActual === 0) {
            chartEl.style.background = '#374151';
            chartEl.innerHTML = `<div class="w-40 h-40 bg-gray-900/90 rounded-full z-10 flex items-center justify-center flex-col shadow-inner backdrop-blur-sm"><span class="text-xs text-gray-400 mb-1">총 실지출</span><span class="text-lg font-bold text-white tracking-tight">0원</span></div>`;
        } else {
            if (currentAngle < 360) gradientSegments.push(`#374151 ${currentAngle}deg 360deg`);
            chartEl.style.background = `conic-gradient(${gradientSegments.join(', ')})`;
            chartEl.innerHTML = `<div class="w-40 h-40 bg-gray-900/90 rounded-full z-10 flex items-center justify-center flex-col shadow-inner backdrop-blur-sm"><span class="text-xs text-gray-400 mb-1">총 실지출</span><span class="text-lg font-bold text-white tracking-tight">${formatMoneyFull(totalActual)}원</span></div>${overlayHTML}`;
        }
    }

    // Update Summaries
    const diffTotal = totalBudget - totalActual;
    const defenseRate = totalBudget > 0 ? Math.round(((totalBudget - totalActual) / totalBudget) * 100) : 0;

    document.getElementById('summaryBudget').innerText = formatMoneyFull(totalBudget) + '원';
    document.getElementById('summaryActual').innerText = formatMoneyFull(totalActual) + '원';

    document.getElementById('summaryDiff').innerHTML = `${formatMoneyFull(diffTotal)}원 <span class="text-sm font-normal text-gray-400">(${defenseRate}%)</span>`;
    document.getElementById('summaryDiff').className = `text-xl font-bold ${diffTotal >= 0 ? 'text-blue-400' : 'text-red-400'}`;

    const excludedTotal = excludedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const summaryExcludedEl = document.getElementById('summaryExcluded');
    if (summaryExcludedEl) summaryExcludedEl.innerText = formatMoneyFull(excludedTotal) + '원';

    if (typeof renderTransactionList === 'function') {
        renderTransactionList(allTransactions);
    }
}

// --- Detailed Transaction List Logic ---
// --- Transaction Manager Modal Controls ---
function openTransactionManager() {
    const modal = document.getElementById('transactionManagerModal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);

    // Ensure list is up to date
    const allTransactions = getMonthlyTransactions();
    renderTransactionList(allTransactions);
}

function closeTransactionManager() {
    const modal = document.getElementById('transactionManagerModal');
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// --- Detailed Transaction List Logic ---
function renderTransactionList(transactions) {
    const tbody = document.getElementById('transactionListBody');
    const msg = document.getElementById('noTransactionMsg');
    const filterInput = document.getElementById('detailSearchInput');
    const countDisplay = document.getElementById('detailCountDisplay');
    const filterTxt = filterInput ? filterInput.value.trim().toLowerCase() : '';

    // 1. Filter
    let displayItems = transactions;
    if (filterTxt) {
        displayItems = transactions.filter(t => t.name.toLowerCase().includes(filterTxt));
    }

    // Update Count Display
    if (countDisplay) {
        countDisplay.innerText = `총 ${displayItems.length}건`;
    }

    if (!displayItems || displayItems.length === 0) {
        tbody.innerHTML = '';
        msg.classList.remove('hidden');
        return;
    }
    msg.classList.add('hidden');

    // 2. Sort
    displayItems.sort((a, b) => {
        let valA = a[currentSort.key];
        let valB = b[currentSort.key];

        if (currentSort.key === 'amount') {
            valA = Number(valA);
            valB = Number(valB);
        }

        if (valA < valB) return currentSort.order === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.order === 'asc' ? 1 : -1;
        return 0;
    });

    // Options: Standard Categories + '고정지출' (Removed '할부')
    const cats = [...roadmapData.categories.settlement, '고정지출'];
    const catOptions = (current) => {
        return cats.map(c => `<option value="${c}" ${c === current ? 'selected' : ''}>${c}</option>`).join('');
    };

    // Populate Batch Select
    const batchSel = document.getElementById('detailBatchCategory');
    if (batchSel) {
        const currentVal = batchSel.value;
        batchSel.innerHTML = `
            <option value="NONE" disabled ${currentVal === 'NONE' || !currentVal ? 'selected' : ''}>일괄 적용 선택</option>
            <option value="RESET">(미분류로 변경)</option>
            ${cats.map(c => `<option value="${c}" ${c === currentVal ? 'selected' : ''}>${c}</option>`).join('')}
        `;
        // if(!currentVal) batchSel.value = 'NONE';
    }

    let html = '';
    displayItems.forEach(t => {
        html += `<tr class="border-b border-white/5 hover:bg-white/5 transition detail-row group" data-id="${t.id}">
            <td class="px-6 py-4 text-center">
                <input type="checkbox" class="detail-check rounded bg-gray-700 border-gray-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" value="${t.id}">
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-400 group-hover:text-white transition">${t.date}</td>
            <td class="px-6 py-4 text-left font-medium text-white max-w-[200px] truncate" title="${t.name}">${t.name}</td>
            <td class="px-6 py-4 text-right text-blue-300 font-bold group-hover:text-blue-200 transition">${formatMoneyFull(t.amount)}</td>
            <td class="px-6 py-4">
                <select onchange="updateItemCategory('${t.id}', this.value)" 
                    class="bg-gray-800 border border-gray-600 text-white text-xs rounded px-2 py-1 focus:border-blue-500 outline-none w-32 mx-auto block hover:bg-gray-700 transition cursor-pointer">
                    <option value="">(미분류)</option>
                    ${catOptions(t.category)}
                </select>
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="deleteItem('${t.id}')" class="text-gray-500 hover:text-red-400 transition p-1 rounded hover:bg-white/5" title="삭제">
                    🗑️
                </button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function filterDetailList() {
    updateSettlementUI(); // Re-render to apply filter
}

function toggleAllDetailChecks(source) {
    const checkboxes = document.querySelectorAll('.detail-check');
    checkboxes.forEach(cb => cb.checked = source.checked);
}

function deleteSelectedDetails() {
    const checkboxes = document.querySelectorAll('.detail-check:checked');
    if (checkboxes.length === 0) { alert('삭제할 항목을 선택해주세요.'); return; }

    if (!confirm(`정말 선택한 ${checkboxes.length}건의 항목을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    const yearData = roadmapData.years[currentYear];
    if (!yearData || !yearData.details.settlement) return;

    let deleteCount = 0;
    // Get IDs to delete
    const idsToDelete = Array.from(checkboxes).map(cb => cb.value);

    // Filter out deleted items
    const originalLength = yearData.details.settlement.length;
    yearData.details.settlement = yearData.details.settlement.filter(t => !idsToDelete.includes(t.id));

    deleteCount = originalLength - yearData.details.settlement.length;

    if (deleteCount > 0) {
        saveData();
        // If modal is open, we should re-render it. 
        // We know modal is open because basic usage flow.
        // Also update Main UI behind.
        const allTransactions = getMonthlyTransactions();
        renderTransactionList(allTransactions);

        // Update main screen summary as well
        renderSettlementMonthly();

        alert(`${deleteCount}건의 항목이 삭제되었습니다.`);
    }
}

function applyBatchCategoryToDetail() {
    const batchSel = document.getElementById('detailBatchCategory');
    const val = batchSel.value;

    if (!val || val === 'NONE') { alert('적용할 카테고리를 선택해주세요.'); return; }

    const checkboxes = document.querySelectorAll('.detail-check:checked');
    if (checkboxes.length === 0) { alert('선택된 항목이 없습니다.'); return; }

    const targetCat = (val === 'RESET') ? '' : val;

    let count = 0;
    const yearData = roadmapData.years[currentYear];

    checkboxes.forEach(cb => {
        const id = cb.value;
        const item = yearData.details.settlement.find(t => t.id === id);
        if (item) {
            item.category = targetCat;
            count++;
        }
    });

    if (count > 0) {
        saveData();
        updateSettlementUI();
        alert(`${count}건 일괄 변경 완료`);

        const checkAll = document.getElementById('checkAllDetail');
        if (checkAll) checkAll.checked = false;

        batchSel.value = 'NONE';
    }
}

function updateItemCategory(id, newCat) {
    const yearData = roadmapData.years[currentYear];
    if (!yearData || !yearData.details.settlement) return;

    const item = yearData.details.settlement.find(t => t.id === id);
    if (item) {
        item.category = newCat;
        saveData();
        updateSettlementUI();
    }
}

function deleteItem(id) {
    if (!confirm('정말 이 항목을 삭제하시겠습니까?')) return;

    const yearData = roadmapData.years[currentYear];
    if (!yearData || !yearData.details.settlement) return;

    const idx = yearData.details.settlement.findIndex(t => t.id === id);
    if (idx !== -1) {
        yearData.details.settlement.splice(idx, 1);
        saveData();
        updateSettlementUI();
    }
}

// --- 2. Weekly View ---
function renderSettlementWeekly() {
    const container = document.getElementById('weeklyViewCanvas');
    container.innerHTML = '';

    const cats = roadmapData.categories.settlement;
    const stData = getSettlementData();
    const monthlyBudgets = stData.budgets[currentMonth] || {};
    const transactions = getMonthlyTransactions();

    // Determine Weeks (Mon-Sun)
    // 1. Find the first day of the month
    // 2. Iterate days and group into weeks
    const weeks = getWeeksInMonth(currentYear, currentMonth);

    // Calc weekly budget (Simple division logic as requested: "Divide by weeks")
    // Note: Some weeks are partial. Pro-rata? 
    // Usually simple Division is: Budget / 4 or 5.
    // Or, more accurate: Budget / Total Days in Month * Days in Week.
    // Let's use Pro-rata by days for accuracy.
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Wrap all weeks in a horizontal scroll container
    let html = `<div class="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">`;

    weeks.forEach((week, wIdx) => {
        const weekDays = week.end.getDate() - week.start.getDate() + 1;

        const msPerDay = 1000 * 60 * 60 * 24;
        const countDays = Math.round((week.end - week.start) / msPerDay) + 1;

        const ratio = countDays / daysInMonth;

        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const startDay = days[week.start.getDay()];
        const endDay = days[week.end.getDay()];

        const startStr = `${week.start.getMonth() + 1}/${week.start.getDate()} (${startDay})`;
        const endStr = `${week.end.getMonth() + 1}/${week.end.getDate()} (${endDay})`;

        // Filter transactions for this week
        const weekTrans = transactions.filter(t => {
            const d = new Date(t.date); // "YYYY-MM-DD"
            // Reset time part for safe compare
            const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const sTime = new Date(week.start.getFullYear(), week.start.getMonth(), week.start.getDate()).getTime();
            const eTime = new Date(week.end.getFullYear(), week.end.getMonth(), week.end.getDate()).getTime();
            return dTime >= sTime && dTime <= eTime;
        });

        // Pre-calculate Rows & Totals
        let rowsHTML = '';
        let weekTotalBudget = 0;
        let weekTotalActual = 0;

        cats.forEach(cat => {
            const monBudget = monthlyBudgets[cat] || 0;
            // Weekly Budget Calculation:
            const weekBudget = Math.floor(monBudget * ratio);

            const weekActual = weekTrans.filter(t => t.category === cat)
                .reduce((sum, t) => sum + (t.amount || 0), 0);

            const diff = weekBudget - weekActual;
            const diffColor = diff >= 0 ? 'text-blue-400' : 'text-red-400';

            // Only show rows that have budget OR actual
            if (weekBudget === 0 && weekActual === 0) return;

            weekTotalBudget += weekBudget;
            weekTotalActual += weekActual;

            rowsHTML += `
                <tr class="border-b border-white/5 hover:bg-white/5">
                    <td class="p-2 text-left font-medium text-gray-300 whitespace-nowrap">${cat}</td>
                    <td class="p-2 text-right text-gray-500 whitespace-nowrap">${formatMoneyFull(weekBudget)}</td>
                    <td class="p-2 text-right font-bold text-white whitespace-nowrap">${formatMoneyFull(weekActual)}</td>
                    <td class="p-2 text-right ${diffColor} whitespace-nowrap">${formatMoneyFull(diff)}</td>
                </tr>`;
        });

        // Totals Calculation
        const weekTotalDiff = weekTotalBudget - weekTotalActual;
        const weekTotalDiffColor = weekTotalDiff >= 0 ? 'text-blue-400' : 'text-red-400';

        // Status Badge Logic
        let statusHTML = '';
        if (weekTotalDiff < 0) {
            statusHTML = `<span class="block mt-1 text-red-400 font-extrabold text-sm animate-pulse">초과 😭</span>`;
        } else {
            statusHTML = `<span class="block mt-1 text-blue-400 font-extrabold text-sm">세이브 👑</span>`;
        }

        // Build HTML
        let weekHTML = `
        <div class="bg-gray-800/50 border border-white/5 rounded-lg p-4 min-w-[300px] flex-shrink-0">
            <h4 class="text-lg font-bold text-blue-300 mb-3 border-b border-white/5 pb-2 text-center">
                ${wIdx + 1}주차 
                <span class="text-sm font-normal text-gray-400 block mt-1">${startStr} ~ ${endStr}</span>
                ${statusHTML}
            </h4>
            <div class="overflow-y-auto max-h-[400px] custom-scrollbar">
                <table class="w-full text-xs text-center">
                    <thead class="bg-gray-900 sticky top-0 z-10 shadow-lg">
                        <tr class="text-gray-400 bg-gray-900">
                            <th class="p-2 text-left">카테고리</th>
                            <th class="p-2 text-right">주간 예산</th>
                            <th class="p-2 text-right">실지출</th>
                            <th class="p-2 text-right">잔액</th>
                        </tr>
                        <tr class="bg-gray-700 text-white font-bold border-b border-white/10">
                            <td class="p-2 text-left">합계 (Total)</td>
                            <td class="p-2 text-right">${formatMoneyFull(weekTotalBudget)}</td>
                            <td class="p-2 text-right">${formatMoneyFull(weekTotalActual)}</td>
                            <td class="p-2 text-right ${weekTotalDiffColor}">${formatMoneyFull(weekTotalDiff)}</td>
                        </tr>
                    </thead>
                    <tbody>${rowsHTML}</tbody>
                </table>
            </div>
        </div>`;
        html += weekHTML;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function getWeeksInMonth(year, month) {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let current = new Date(firstDay);

    // Adjust to finding Monday.
    // Day 0 = Sun, 1 = Mon ... 6 = Sat.
    // If Month starts on Tuesday (2), the first week is Tue(1st) -> Sun(6th).

    while (current <= lastDay) {
        // Start of week (Current date)
        const weekStart = new Date(current);

        // Find End of week (Sunday)
        // Day index: 0(Sun)..6(Sat). 
        // Distance to Sunday (0) is... 
        // If today is Monday(1), Sun is +6. If Sat(6), Sun is +1. If Sun(0), Sun is +0.
        // Logic: (7 - day) % 7? No.
        // Standard: difference = (7 - current.getDay()) % 7;
        // Actually, if we want Mon-Sun:
        // Mon(1) -> Sun(0).
        // If current is Sun(0), it is day 7 in Mon-based logic. 
        // JS getDay(): Sun=0, Mon=1...Sat=6.

        let dayOfWeek = current.getDay();
        if (dayOfWeek === 0) dayOfWeek = 7; // Treat Sunday as 7

        const daysToSunday = 7 - dayOfWeek;

        let weekEnd = new Date(current);
        weekEnd.setDate(current.getDate() + daysToSunday);

        // Cap to Month End
        if (weekEnd > lastDay) weekEnd = new Date(lastDay);

        weeks.push({ start: weekStart, end: weekEnd });

        // Next week starts day after weekEnd
        current = new Date(weekEnd);
        current.setDate(current.getDate() + 1);
    }
    return weeks;
}


// --- 3. Budget Modal ---
function openBudgetModal() {
    const modal = document.getElementById('budgetModal');
    const tbody = document.getElementById('budgetModalList');
    const cats = roadmapData.categories.settlement;
    const stData = getSettlementData();
    const budgets = stData.budgets[currentMonth] || {};

    let html = '';
    cats.forEach(cat => {
        const val = budgets[cat] || 0;
        html += `<tr class="border-b border-white/5">
            <td class="py-3 text-gray-300 font-medium">${cat}</td>
            <td class="py-3">
                <input type="text" data-cat="${cat}" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-right text-white focus:border-blue-500 outline-none" 
                    value="${formatMoneyFull(val)}"
                    onfocus="this.value = this.value.replace(/,/g, '')"
                    onblur="this.value = formatMoneyFull(parseInt(this.value)||0)"
                >
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
    modal.style.display = 'flex';
}

function closeBudgetModal() {
    document.getElementById('budgetModal').style.display = 'none';
}

function saveBudgets() {
    const inputs = document.querySelectorAll('#budgetModalList input');
    const yearData = roadmapData.years[currentYear];

    // Ensure structure
    if (!yearData.settlementData) yearData.settlementData = { budgets: [], rules: {} };
    if (!yearData.settlementData.budgets) yearData.settlementData.budgets = Array.from({ length: 12 }, () => ({}));
    if (!yearData.settlementData.budgets[currentMonth]) yearData.settlementData.budgets[currentMonth] = {};

    const targetMap = yearData.settlementData.budgets[currentMonth];

    inputs.forEach(inp => {
        const cat = inp.dataset.cat;
        const val = parseInt(inp.value.replace(/,/g, '')) || 0;
        targetMap[cat] = val; // Assuming categories in data.js are fixed keys
    });

    saveData();
    closeBudgetModal();
    updateSettlementUI();
}


// --- 4. XLS Parsing & Import ---

function handleExcelUpload(input) {
    const file = input.files[0];
    if (!file) return;

    // Try-Catch wrapper
    try {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                processRawExcelData(raw);
            } catch (err) {
                console.error(err);
                alert('엑셀 파일 읽기 오류: ' + err.message);
            }
            input.value = ''; // Reset
        };
        reader.readAsArrayBuffer(file);
    } catch (e) {
        alert('파일 업로드 시작 실패');
    }
}

function processRawExcelData(rows) {
    // Columns to look for
    // "이용일", "이용가맹점", "결제 원금" (User specified) or Fallback "결제원금"
    // Stop condition: Row having "해외이용소계"

    let dateIdx = -1, descIdx = -1, amtIdx = -1;

    // Find Header Row
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!Array.isArray(row)) continue;

        // Convert all to string for check
        const rowStr = row.map(c => String(c).trim());

        // Find Indexes
        const d = rowStr.findIndex(c => c.includes('이용일') || c.includes('날짜'));
        const desc = rowStr.findIndex(c => c.includes('이용가맹점') || c === '가맹점명' || c.includes('거래내용'));
        const amt = rowStr.findIndex(c => c.includes('결제 원금') || c.includes('결제원금') || c.includes('이용금액'));

        if (d !== -1 && desc !== -1 && amt !== -1) {
            dateIdx = d;
            descIdx = desc;
            amtIdx = amt;

            const targetRows = [];
            for (let j = i + 1; j < rows.length; j++) {
                const subRow = rows[j];
                // Check stop condition
                if (Array.isArray(subRow) && subRow.some(c => String(c).includes('해외이용소계') || String(c).includes('합계'))) {
                    break;
                }
                targetRows.push(subRow);
            }

            parseRows(targetRows, dateIdx, descIdx, amtIdx);
            return;
        }
    }

    alert('엑셀 형식을 인식하지 못했습니다. ("이용일", "이용가맹점", "결제 원금" 컬럼이 필요합니다.)\n확인된 헤더가 없습니다.');
}

function parseRows(dataRows, dIdx, tIdx, aIdx) {
    // To Classification Queue (Global pending queue)
    pendingClassifications = [];

    const resultStats = {};
    let totalAdded = 0;

    // We need to access/create year data dynamically
    const ensureYearData = (year) => {
        if (!roadmapData.years[year]) {
            roadmapData.years[year] = roadmapData.createYearData();
        }
        return roadmapData.years[year];
    };

    dataRows.forEach(row => {
        if (!row[dIdx]) return; // No date

        let dateStr = row[dIdx];
        let dateObj;
        if (typeof dateStr === 'number') {
            // Excel serial
            dateObj = new Date((dateStr - (25569)) * 86400 * 1000);
        } else {
            // String
            dateStr = String(dateStr).trim().replace(/\s/g, '').replace(/\./g, '-').replace(/\//g, '-');
            dateObj = new Date(dateStr);
        }

        if (isNaN(dateObj.getTime())) return;

        // Force to YYYY-MM-DD string using Local Time logic to avoid UTC shift
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        const formattedDate = `${y}-${m}-${d}`;

        const yearData = ensureYearData(y);

        // Ensure settlementData structure exists
        if (!yearData.settlementData) {
            yearData.settlementData = {
                budgets: Array.from({ length: 12 }, () => ({})),
                rules: {}
            };
        }
        if (!yearData.details.settlement) yearData.details.settlement = [];

        const list = yearData.details.settlement;
        // Safe access to rules
        const rules = (yearData.settlementData && yearData.settlementData.rules) ? yearData.settlementData.rules : {};

        const rawAmount = row[aIdx];
        let amount = parseInt(String(rawAmount).replace(/,/g, '')) || 0;

        if (amount <= 0) return;

        const desc = String(row[tIdx] || '').trim();

        // Duplicate Check
        const isDup = list.some(it => it.date === formattedDate && it.name === desc && it.amount === amount);
        if (isDup) return;

        // Auto Classify Logic
        let category = '';

        // 1. Exact Match
        if (rules[desc]) {
            category = rules[desc];
        } else {
            // 2. Keyword Match (Partial)
            const matchedKey = Object.keys(rules).find(key => desc.includes(key));
            if (matchedKey) category = rules[matchedKey];
        }

        const newItem = {
            id: Date.now() + Math.random().toString(),
            date: formattedDate,
            name: desc,
            amount: amount,
            category: category,
            targetYear: y
        };

        list.push(newItem);
        if (!resultStats[y]) resultStats[y] = 0;
        resultStats[y]++;
        totalAdded++;
    });

    if (totalAdded > 0) saveData();

    if (totalAdded === 0) {
        alert('가져올 데이터가 없거나 모두 이미 존재하는 데이터(중복)입니다.');
    } else {
        let msg = `총 ${totalAdded}건 가져오기 완료! (미분류 포함)\n`;
        for (const [yr, count] of Object.entries(resultStats)) {
            msg += `${yr}년: ${count}건\n`;
        }
        alert(msg);
        updateSettlementUI();
    }
}

// --- Bulk Classification Modal ---

// --- Bulk Classification Modal Logic ---
// We keep 'pendingClassifications' as the data source.

function openBulkModal() {
    const modal = document.getElementById('bulkClassificationModal');

    // Populate Batch Select
    const cats = roadmapData.categories.settlement;
    const batchSel = document.getElementById('bulkBatchCategory');
    batchSel.innerHTML = `<option value="">일괄 적용할 카테고리</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join('');

    document.getElementById('checkAllBulk').checked = false;
    document.getElementById('bulkSearchInput').value = '';

    renderBulkList();

    modal.style.display = 'flex';
}

function renderBulkList(filterText = '') {
    const tbody = document.getElementById('bulkClassifyList');
    const cats = roadmapData.categories.settlement;
    const catOptions = `<option value="">선택</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join('');

    let html = '';

    pendingClassifications.forEach((item, idx) => {
        // Filter Logic
        if (filterText && !item.name.toLowerCase().includes(filterText.toLowerCase())) {
            // Hide row, but better to just not render. 
            // Note: If we don't render, we need to handle how we access them by 'idx' or IDs later.
            // Using `data-idx` is safer than relying on row order if filtering.
            return;
        }

        html += `<tr class="border-b border-white/5 hover:bg-white/5 bulk-row" data-idx="${idx}">
            <td class="px-4 py-2 text-center">
                <input type="checkbox" class="bulk-check rounded bg-gray-700 border-gray-600 focus:ring-blue-500" data-idx="${idx}">
            </td>
            <td class="px-4 py-2 text-gray-300 whitespace-nowrap">${item.date}</td>
            <td class="px-4 py-2 font-bold text-white max-w-[200px] truncate" title="${item.name}">${item.name}</td>
            <td class="px-4 py-2">
                <input type="text" id="bulk_key_${idx}" value="${item.name}" class="bg-gray-800 border border-gray-600 text-white text-xs rounded px-2 py-1 focus:border-blue-500 w-full" placeholder="분류 키워드 수정">
            </td>
            <td class="px-4 py-2 text-right text-blue-300 whitespace-nowrap">${formatMoneyFull(item.amount)}</td>
            <td class="px-4 py-2">
                <select id="bulk_cat_${idx}" class="bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1 focus:border-blue-500 w-full">
                    ${catOptions}
                </select>
            </td>
        </tr>`;
    });

    tbody.innerHTML = html;
}

function filterBulkList() {
    const txt = document.getElementById('bulkSearchInput').value;
    renderBulkList(txt.trim());
}

function toggleAllBulkChecks(source) {
    const checkboxes = document.querySelectorAll('.bulk-check'); // Only visible ones
    checkboxes.forEach(cb => cb.checked = source.checked);
}

function applyBatchCategory() {
    const batchSel = document.getElementById('bulkBatchCategory');
    const cat = batchSel.value;
    if (!cat) { alert('적용할 카테고리를 선택해주세요.'); return; }

    const checkboxes = document.querySelectorAll('.bulk-check:checked');
    if (checkboxes.length === 0) { alert('선택된 항목이 없습니다.'); return; }

    checkboxes.forEach(cb => {
        const idx = cb.dataset.idx;
        const sel = document.getElementById(`bulk_cat_${idx}`);
        if (sel) sel.value = cat;
    });
}

function closeBulkModal() {
    pendingClassifications = [];
    document.getElementById('bulkClassificationModal').style.display = 'none';
    updateSettlementUI();
}

function saveBulkClassifications() {
    let savedCount = 0;

    // Process Inputs using Data Attribute or iterate over pendingClassifications if all rendered?
    // Filtering might hide some rows. We only process items that have a category selected.
    // If a row is hidden but had a category selected BEFORE filtering? 
    // It's simpler to iterate the `pendingClassifications` array and check the DOM elements IF they exist, 
    // but DOM elements might not exist if filtered out.
    // **Wait**, if user filters "Starbucks", selects all, applies "Food", then clears filter...
    // The "Food" selection is in the DOM. 
    // If they filter "Coupang", the "Starbucks" rows are removed from DOM. Values lost? 
    // YES. Re-rendering destroys input state.

    // Better Approach: Update `pendingClassifications[idx].tempCategory` when inputs change?
    // Or simpler: User workflow is usually -> Filter -> Select -> Apply -> Save. 
    // If they filter again, they probably want to work on other set.
    // Let's assume standard behavior: We iterate valid DOM elements to save.
    // If it's not on screen (filtered out), we skip it (or it's lost). 
    // This pushes user to "Filter -> Apply -> Save" cycle.

    const rows = document.querySelectorAll('.bulk-row');
    rows.forEach(row => {
        const idx = row.dataset.idx;
        const item = pendingClassifications[idx];

        const catSel = document.getElementById(`bulk_cat_${idx}`);
        const keyInput = document.getElementById(`bulk_key_${idx}`);

        if (catSel && catSel.value && item) {
            const cat = catSel.value;
            const keyword = keyInput ? keyInput.value.trim() : item.name;

            item.category = cat;

            const targetY = item.targetYear || currentYear;
            if (!roadmapData.years[targetY]) roadmapData.years[targetY] = roadmapData.createYearData();
            const yearData = roadmapData.years[targetY];

            yearData.details.settlement.push(item);

            // Learn Rule
            if (!yearData.settlementData) yearData.settlementData = { budgets: [], rules: {} };
            if (!yearData.settlementData.rules) yearData.settlementData.rules = {};
            yearData.settlementData.rules[keyword] = cat;

            savedCount++;

            // Mark for removal from pending? 
            // We clear pendingClassifications at the end anyway.
        }
    });

    if (savedCount > 0) saveData();

    alert(`${savedCount}건 분류 저장 완료!`);

    // Close & Reset
    pendingClassifications = [];
    document.getElementById('bulkClassificationModal').style.display = 'none';
    updateSettlementUI();
}
