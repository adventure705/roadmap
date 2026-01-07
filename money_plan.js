const formatMoneyFull = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
};

function initMoneyPlan() {
    loadData();
    if (!roadmapData.moneyPlan) {
        roadmapData.moneyPlan = {
            birthdays: [
                { name: "아버지", lunarType: "음력", lunarDate: "3월 6일" },
                { name: "이모", lunarType: "음력", lunarDate: "9월 17일" },
                { name: "어머니", lunarType: "음력", lunarDate: "11월 8일" }
            ],
            categories: ["생일", "명절", "경조금", "세금", "병원", "기타"],
            title: "Money Plan 💰",
            subtitle: "연간 주요 일정 및 지출 계획을 관리하세요."
        };
    }


    // Set Page Type for Sidebar/Memos
    window.currentPageType = 'moneyPlan';

    // Check global categories
    if (!roadmapData.moneyPlan.categories) {
        roadmapData.moneyPlan.categories = ["생일", "명절", "경조금", "세금", "병원", "기타"];
    }

    // Check Common Memos
    if (!roadmapData.commonMemos) roadmapData.commonMemos = {};
    if (!roadmapData.commonMemos.moneyPlan) roadmapData.commonMemos.moneyPlan = [];

    const yearData = roadmapData.years[currentYear];
    if (!yearData.moneyPlan) {
        yearData.moneyPlan = {
            plan: { reserve: {}, monthly: {} },
            details: { monthly: {} },
            settlement: { monthly: {} },
            rowHeights: [],
            colWidths: [],
            headerHeight: 0
        };
    }
    renderAll();
}

function updateUI() {
    renderAll();
}

function renderAll() {
    window.currentPageType = 'moneyPlan';

    // Titles
    const titleInput = document.getElementById('mainTitle');
    const subtitleInput = document.getElementById('mainSubtitle');
    const yearDisplay = document.getElementById('yearDisplay');

    if (titleInput) titleInput.value = roadmapData.moneyPlan.title || "Money Plan 💰";
    if (subtitleInput) subtitleInput.value = roadmapData.moneyPlan.subtitle || "연간 주요 일정 및 지출 계획을 관리하세요.";
    if (yearDisplay) yearDisplay.innerText = currentYear;

    renderBirthdays();
    renderMainTable();
    renderMemos();
}

function updateMoneyPlanTitle(key, value) {
    roadmapData.moneyPlan[key] = value;
    saveData();
}

function renderBirthdays() {
    const tbody = document.getElementById('birthdayBody');
    if (!tbody) return;

    let html = '';
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

    roadmapData.moneyPlan.birthdays.forEach((b, i) => {
        const lunarMatch = (b.lunarDate || "1월 1일").match(/(\d+)월\s*(\d+)일/);
        const lMonth = lunarMatch ? parseInt(lunarMatch[1]) : 1;
        const lDay = lunarMatch ? parseInt(lunarMatch[2]) : 1;
        let solarInfo = "-";

        if (typeof solarlunar !== 'undefined') {
            try {
                const result = solarlunar.lunar2solar(currentYear, lMonth, lDay);
                if (result && result.cYear) {
                    const d = new Date(result.cYear, result.cMonth - 1, result.cDay);
                    const dayName = weekdays[d.getDay()];
                    solarInfo = `${result.cMonth}월 ${result.cDay}일 (${dayName})`;
                }
            } catch (e) {
                console.error(e);
                solarInfo = "날짜 확인 필요";
            }
        }

        html += `
            <tr class="hover:bg-white/5 transition">
                <td class="px-4 py-2 border border-white/5 font-bold text-center">
                    <input type="text" class="bg-transparent text-center w-full focus:outline-none focus:bg-white/10 rounded" value="${b.name}" onchange="updateBirthdayName(${i}, this.value)">
                </td>
                <td class="px-4 py-2 border border-white/5 text-gray-400 text-center">음력</td>
                <td class="px-4 py-2 border border-white/5 text-blue-300 pointer-events-auto">
                    <div class="flex items-center gap-1 justify-center">
                        <select class="bg-card border border-white/10 rounded text-[11px] p-1 focus:outline-none cursor-pointer" onchange="updateBirthdayDate(${i}, 'month', this.value)">
                            ${Array.from({ length: 12 }, (_, k) => `<option value="${k + 1}" ${lMonth === k + 1 ? 'selected' : ''}>${k + 1}월</option>`).join('')}
                        </select>
                        <select class="bg-card border border-white/10 rounded text-[11px] p-1 focus:outline-none cursor-pointer" onchange="updateBirthdayDate(${i}, 'day', this.value)">
                            ${Array.from({ length: 31 }, (_, k) => `<option value="${k + 1}" ${lDay === k + 1 ? 'selected' : ''}>${k + 1}일</option>`).join('')}
                        </select>
                    </div>
                </td>
                <td class="px-4 py-2 border border-white/5 text-gray-400 text-center">양력</td>
                <td class="px-4 py-2 border border-white/5 text-purple-400 font-bold text-center min-w-[120px]">${solarInfo}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function updateBirthdayDate(idx, part, val) {
    const b = roadmapData.moneyPlan.birthdays[idx];
    const match = (b.lunarDate || "1월 1일").match(/(\d+)월\s*(\d+)일/);
    let m = match ? match[1] : "1";
    let d = match ? match[2] : "1";

    if (part === 'month') m = val;
    else d = val;

    b.lunarDate = `${m}월 ${d}일`;
    saveData();
    renderBirthdays();
}

function updateBirthdayName(idx, newName) {
    if (idx >= 0 && idx < roadmapData.moneyPlan.birthdays.length) {
        roadmapData.moneyPlan.birthdays[idx].name = newName;
        saveData();
    }
}

function getActiveGrid() {
    const yearData = roadmapData.years[currentYear];
    if (!yearData.moneyPlan) {
        yearData.moneyPlan = {
            plan: { reserve: {}, monthly: {} },
            details: { monthly: {} },
            settlement: { monthly: {} },
            rowHeights: [],
            colWidths: [],
            headerHeight: 0
        };
    }
    return yearData.moneyPlan;
}

function renderMainTable() {
    const thead = document.getElementById('tableHeader');
    const tbody = document.getElementById('tableBody');
    const grid = getActiveGrid();
    const months = roadmapData.months;

    const colWidths = grid.colWidths || [];
    const rowHeights = grid.rowHeights || [];
    const hHeight = grid.headerHeight || 35; // Default header height
    const isAllSelected = grid.allSelected || false;

    // Helper function
    const getColW = (idx, def) => {
        const w = colWidths[idx] || def;
        return `style="width: ${w}px; min-width: ${w}px"`;
    };

    // Header
    const toggleStyle = isAllSelected ? 'bg-blue-500/30' : 'bg-gray-800';

    let headerHTML = `<tr class="bg-card text-gray-400" style="height: ${hHeight}px">
        <th class="p-0 border border-white/10 relative cursor-pointer ${toggleStyle}" ${getColW(0, 40)} onclick="toggleSelectAll()">
            <div class="flex items-center justify-center h-full font-bold italic text-[10px] select-none">ALL</div>
            <div class="resizer-v" onmousedown="event.stopPropagation(); initResizing(event, 'col', 0)"></div>
            <div class="resizer-h" onmousedown="event.stopPropagation(); initResizing(event, 'header', 0)"></div>
            ${isAllSelected ? '<div class="absolute top-0 left-0 w-full h-full border-2 border-blue-500 pointer-events-none"></div>' : ''}
        </th>
        <th class="p-0 border border-white/10 relative text-center" ${getColW(1, 80)}>
            <div class="flex items-center justify-center h-full">분류</div>
             <!-- Add Button in Header (Optional) -->
            <button onclick="addCategory()" class="absolute right-1 top-1 bg-blue-500/80 hover:bg-blue-400 text-white rounded w-4 h-4 flex items-center justify-center text-xs z-20" title="항목 추가">+</button>
            <div class="resizer-v" onmousedown="initResizing(event, 'col', 1)"></div>
        </th>
        <th class="p-0 border border-white/10 relative text-center" ${getColW(2, 80)}>
            <div class="flex items-center justify-center h-full">예비금</div>
            <div class="resizer-v" onmousedown="initResizing(event, 'col', 2)"></div>
        </th>`;

    months.forEach((m, mIdx) => {
        headerHTML += `
            <th class="p-0 border border-white/10 relative text-center" ${getColW(mIdx + 3, 80)}>
                <div class="flex items-center justify-center h-full">${m}</div>
                <div class="resizer-v" onmousedown="initResizing(event, 'col', ${mIdx + 3})"></div>
            </th>`;
    });

    headerHTML += `
        <th class="p-0 border border-white/10 relative font-bold text-blue-400 text-center" ${getColW(15, 100)}>
            <div class="flex items-center justify-center h-full">Total</div>
            <div class="resizer-v" onmousedown="initResizing(event, 'col', 15)"></div>
        </th>
    </tr>`;
    thead.innerHTML = headerHTML;

    // Body
    let bodyHTML = '';
    const groupTypes = [
        { key: 'plan', label: '계획', isNumeric: true },
        { key: 'details', label: '내역', isNumeric: false },
        { key: 'settlement', label: '정산', isNumeric: true }
    ];

    let globalRowIdx = 0;
    const categories = roadmapData.moneyPlan.categories;
    const rowCount = categories.length + 1; // +1 for Add/Sum row logic if needed, but here categories + sum row is handled differently. 
    // Wait, rowCount for rowspan is categories.length + 1 (Sum row)

    groupTypes.forEach(group => {
        categories.forEach((cat, cIdx) => {
            const h = rowHeights[globalRowIdx] ? `style="height: ${rowHeights[globalRowIdx]}px"` : '';
            bodyHTML += `<tr ${h}>`;

            if (cIdx === 0) {
                // Determine rowspan: categories + 1 (sum row)
                bodyHTML += `<td class="p-0 border border-white/10 bg-gray-900/80 text-center relative" rowspan="${rowCount}">
                                <div class="group-header h-full flex items-center justify-center leading-none font-bold">${group.label}</div>
                             </td>`;
            }

            // Editable Category Name
            bodyHTML += `<td class="p-0 border border-white/10 bg-gray-900/30 relative group">
                            <input type="text" class="input-plain text-center font-medium w-full h-full" value="${cat}" onchange="updateCategoryName(${cIdx}, this.value)">
                             <!-- Delete Button -->
                            <button onclick="deleteCategory(${cIdx})" class="absolute -left-1 -top-1 hidden group-hover:flex bg-red-500 text-white rounded-full w-4 h-4 items-center justify-center text-[10px] z-30">×</button>
                            <div class="resizer-h" onmousedown="initResizing(event, 'row', ${globalRowIdx})"></div>
                         </td>`;

            // Reserve
            // Enable reserve input for Plan, Details, and Settlement
            const resData = grid[group.key].reserve || {};
            const resVal = resData[cIdx];

            // Determine if reserve input should be numeric based on group type
            // Plan: Numeric, Settlement: Numeric, Details: Text
            const isReserveNumeric = (group.key === 'plan' || group.key === 'settlement');

            let displayRes = "";
            if (isReserveNumeric) {
                displayRes = (resVal === undefined || resVal === 0) ? "" : resVal.toLocaleString();
            } else {
                displayRes = (resVal === undefined) ? "" : resVal;
            }

            bodyHTML += `<td class="p-0 border border-white/10 h-full">`;

            if (group.isNumeric) {
                bodyHTML += `<input type="text" class="input-plain text-right" 
                                value="${displayRes}" 
                                onchange="updateMoneyValue('${group.key}', 'reserve', ${cIdx}, null, this.value)">`;
            } else {
                bodyHTML += `<textarea class="input-plain text-center" 
                                onchange="updateMoneyValue('${group.key}', 'reserve', ${cIdx}, null, this.value)">${displayRes}</textarea>`;
            }
            bodyHTML += `</td>`;

            // Months
            let rowTotal = 0;
            months.forEach((m, mIdx) => {
                const val = (grid[group.key].monthly[mIdx] || {})[cIdx] || (group.isNumeric ? 0 : "");
                const displayVal = group.isNumeric ? (val === 0 ? "" : val.toLocaleString()) : val;
                if (group.isNumeric && typeof val === 'number') rowTotal += val;

                bodyHTML += `<td class="p-0 border border-white/10 h-full">`;
                if (group.isNumeric) {
                    bodyHTML += `<input type="text" class="input-plain text-right" value="${displayVal}" 
                                    onchange="updateMoneyValue('${group.key}', 'monthly', ${cIdx}, ${mIdx}, this.value)">`;
                } else {
                    bodyHTML += `<textarea class="input-plain text-left" 
                                    onchange="updateMoneyValue('${group.key}', 'monthly', ${cIdx}, ${mIdx}, this.value)">${displayVal}</textarea>`;
                }
                bodyHTML += `</td>`;
            });

            // Total Column
            bodyHTML += `<td class="p-0 border border-white/10 bg-blue-500/5">
                            <div class="flex items-center justify-end h-full px-3 font-bold">
                                ${group.isNumeric ? (rowTotal === 0 ? "-" : rowTotal.toLocaleString()) : "-"}
                            </div>
                         </td>`;
            bodyHTML += `</tr>`;
            globalRowIdx++;
        });

        // Group Sum Row
        const sumH = rowHeights[globalRowIdx] ? `style="height: ${rowHeights[globalRowIdx]}px"` : '';
        if (group.isNumeric) {
            bodyHTML += `<tr class="bg-yellow-500/5 font-bold text-yellow-500/80" ${sumH}>
                            <!-- Note: First column is rowspan'd above -->
                            <td class="p-0 border border-white/10 relative">
                                <div class="flex items-center justify-center h-full">합계</div>
                                <div class="resizer-h" onmousedown="initResizing(event, 'row', ${globalRowIdx})"></div>
                            </td>
                            <td class="p-0 border border-white/10">
                                <div class="flex items-center justify-end h-full px-3">
                                    ${(group.key === 'plan' || group.key === 'settlement') ? calculateGroupSum(group.key, 'reserve').toLocaleString() : ""}
                                </div>
                            </td>`;

            let totalOfTotals = 0;
            months.forEach((m, mIdx) => {
                const s = calculateGroupSum(group.key, 'monthly', mIdx);
                totalOfTotals += s;
                bodyHTML += `<td class="p-0 border border-white/10">
                                <div class="flex items-center justify-end h-full px-3">${s === 0 ? "-" : s.toLocaleString()}</div>
                             </td>`;
            });
            bodyHTML += `<td class="p-0 border border-white/10 text-blue-400 font-extrabold bg-blue-400/5">
                            <div class="flex items-center justify-end h-full px-3">${totalOfTotals === 0 ? "-" : totalOfTotals.toLocaleString()}</div>
                         </td></tr>`;
        } else {
            bodyHTML += `<tr class="bg-gray-800/10" ${sumH}>
                            <td class="p-0 border border-white/10 relative">
                                <div class="flex items-center justify-center h-full">-</div>
                                <div class="resizer-h" onmousedown="initResizing(event, 'row', ${globalRowIdx})"></div>
                            </td>
                            <td class="p-0 border border-white/10 text-center">-</td>`;
            months.forEach(() => bodyHTML += `<td class="p-0 border border-white/10 text-center">-</td>`);
            bodyHTML += `<td class="p-0 border border-white/10 text-center">-</td></tr>`;
        }
        globalRowIdx++;
    });

    tbody.innerHTML = bodyHTML;
}

// Category Management Functions
function updateCategoryName(idx, newName) {
    if (!newName.trim()) return; // preventing empty names
    roadmapData.moneyPlan.categories[idx] = newName;
    saveData();
    renderMainTable();
}

function addCategory() {
    roadmapData.moneyPlan.categories.push("새 항목");
    saveData();
    renderMainTable();
}

function deleteCategory(idx) {
    if (!confirm("이 항목을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) return;

    // 1. Remove from categories list
    roadmapData.moneyPlan.categories.splice(idx, 1);

    // 2. Remove data associated with this index for ALL Years
    // Since categories are global, we must update all years to keep indices in sync.
    // However, for simplicity and safety, we focus on currentYear or iterate if possible.
    // The user data structure: roadmapData.years[year].moneyPlan... 
    // Data is keyed by index: plan.reserve[catIdx], monthly[mIdx][cIdx]

    // Helper to shift object keys
    const shiftDataKeys = (obj) => {
        if (!obj) return;
        // Shift keys down for anything > idx
        // We need to process keys in numeric order to avoid overwriting
        // Actually, easiest is to reconstruct the object
        const newObj = {};
        Object.keys(obj).forEach(k => {
            const kInt = parseInt(k);
            if (kInt < idx) newObj[kInt] = obj[kInt];
            else if (kInt > idx) newObj[kInt - 1] = obj[kInt];
            // if kInt === idx, skip (delete)
        });
        // Clear original and copy back
        for (let k in obj) delete obj[k];
        Object.assign(obj, newObj);
    };

    // Iterate all years
    Object.values(roadmapData.years).forEach(yearData => {
        if (!yearData.moneyPlan) return;
        const mp = yearData.moneyPlan;

        // Plan Reserve
        if (mp.plan && mp.plan.reserve) shiftDataKeys(mp.plan.reserve);

        // Monthly Data (Plan, Details, Settlement)
        ['plan', 'details', 'settlement'].forEach(type => {
            if (mp[type] && mp[type].monthly) {
                // mp[type].monthly is { 0: {0:val, 1:val}, 1: {...} } where keys are month index
                // We need to go into EACH month and shift category indices
                Object.values(mp[type].monthly).forEach(monthObj => {
                    shiftDataKeys(monthObj);
                });
            }
        });
    });

    saveData();
    renderMainTable();
}

function calculateGroupSum(groupKey, type, monthIndex = null) {
    const grid = getActiveGrid();
    let sum = 0;
    const catCount = roadmapData.moneyPlan.categories.length;
    if (type === 'reserve') {
        const reserveData = grid[groupKey].reserve || {};
        for (let i = 0; i < catCount; i++) {
            const val = reserveData[i];
            // Only sum numeric values
            if (typeof val === 'number') sum += val;
        }
    } else {
        const monthData = grid[groupKey].monthly[monthIndex] || {};
        for (let i = 0; i < catCount; i++) {
            sum += (monthData[i] || 0);
        }
    }
    return sum;
}

function updateMoneyValue(groupKey, type, catIdx, monthIdx, value) {
    const grid = getActiveGrid();
    const isNumeric = (groupKey === 'plan' || groupKey === 'settlement');
    let val = value;
    if (isNumeric) {
        val = parseInt(String(value).replace(/,/g, '')) || 0;
    }

    if (type === 'reserve') {
        if (!grid[groupKey].reserve) grid[groupKey].reserve = {};
        grid[groupKey].reserve[catIdx] = val;
    } else {
        if (!grid[groupKey].monthly[monthIdx]) {
            grid[groupKey].monthly[monthIdx] = {};
        }
        grid[groupKey].monthly[monthIdx][catIdx] = val;
    }
    saveData();
    renderMainTable();
}

// Resizing logic - matching investment.js pattern
function initResizing(e, type, idx) {
    e.preventDefault();
    e.stopPropagation();

    const grid = getActiveGrid();
    const startPos = type === 'col' ? e.pageX : e.pageY;
    const table = document.getElementById('mainMoneyPlanTable');

    let startDim;
    let targetElement;

    if (type === 'col') {
        const allThs = table.querySelectorAll('thead th');
        targetElement = allThs[idx];
        startDim = targetElement ? targetElement.offsetWidth : 100;
    } else if (type === 'header') {
        targetElement = table.querySelector('thead tr');
        startDim = targetElement ? targetElement.offsetHeight : 40;
    } else if (type === 'row') {
        const allTrs = table.querySelectorAll('tbody tr');
        targetElement = allTrs[idx];
        startDim = targetElement ? targetElement.offsetHeight : 35;
    }

    const onMouseMove = (moveE) => {
        const currentPos = type === 'col' ? moveE.pageX : moveE.pageY;
        const diff = currentPos - startPos;
        const newDim = Math.max(type === 'col' ? 40 : 25, startDim + diff);

        if (type === 'col') {
            if (!grid.colWidths) grid.colWidths = [];
            if (grid.allSelected) {
                // Resize ALL columns
                for (let i = 0; i <= 15; i++) {
                    grid.colWidths[i] = newDim;
                }
                renderMainTable();
            } else {
                grid.colWidths[idx] = newDim;
                if (targetElement) {
                    targetElement.style.width = newDim + 'px';
                    targetElement.style.minWidth = newDim + 'px';
                }
            }
        } else if (type === 'header') {
            grid.headerHeight = newDim;
            if (targetElement) {
                targetElement.style.height = newDim + 'px';
            }
        } else if (type === 'row') {
            if (!grid.rowHeights) grid.rowHeights = [];
            if (grid.allSelected) {
                const rowCount = table.querySelectorAll('tbody tr').length;
                for (let i = 0; i < rowCount; i++) {
                    grid.rowHeights[i] = newDim;
                }
                renderMainTable();
            } else {
                grid.rowHeights[idx] = newDim;
                if (targetElement) {
                    targetElement.style.height = newDim + 'px';
                }
            }
        }
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        saveData();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function toggleSelectAll() {
    const grid = getActiveGrid();
    grid.allSelected = !grid.allSelected;
    renderAll();
}

// --- Common Memos ---
// Using global renderMemos from sidebar.js


// --- Copy Data Modal Logic ---
// --- Copy Data Modal Logic ---
function openCopyDataModal() {
    const modal = document.getElementById('copyDataModal');
    const srcSel = document.getElementById('copySourceYear');
    const tgtSel = document.getElementById('copyTargetYear');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const years = Object.keys(roadmapData.years).sort().map(y => parseInt(y));
    // Ensure currentYear is in list
    if (!years.includes(currentYear)) years.push(currentYear);
    // Ensure next year is in list for copying to future
    if (!years.includes(currentYear + 1)) years.push(currentYear + 1);
    years.sort((a, b) => a - b);

    // Filter unique
    const uniqueYears = [...new Set(years)];
    const opts = uniqueYears.map(y => `<option value="${y}">${y}년</option>`).join('');

    if (srcSel) {
        srcSel.innerHTML = opts;
        srcSel.value = currentYear;
    }
    if (tgtSel) {
        tgtSel.innerHTML = opts;
        tgtSel.value = currentYear + 1;
    }
}

function closeCopyDataModal() {
    const modal = document.getElementById('copyDataModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function confirmCopyData() {
    const srcYear = parseInt(document.getElementById('copySourceYear').value);
    const tgtYear = parseInt(document.getElementById('copyTargetYear').value);
    const overwrite = document.getElementById('copyOverwrite').checked;

    if (isNaN(srcYear) || isNaN(tgtYear)) return;
    if (srcYear === tgtYear) {
        alert("원본과 대상 연도가 같습니다.");
        return;
    }

    if (overwrite && !confirm(`${srcYear}년 데이터를 ${tgtYear}년으로 복사하시겠습니까?\n대상 연도의 기존 데이터(머니플랜)는 모두 덮어씌워집니다.`)) return;

    // Ensure Target Year Data Exists
    if (!roadmapData.years[tgtYear]) {
        roadmapData.years[tgtYear] = roadmapData.createYearData();
    }

    const srcData = roadmapData.years[srcYear] ? roadmapData.years[srcYear].moneyPlan : null;
    const tgtYearData = roadmapData.years[tgtYear];

    if (!srcData) {
        alert(`${srcYear}년의 머니플랜 데이터가 없습니다.`);
        return;
    }

    // Prepare structure if missing
    if (!tgtYearData.moneyPlan) {
        tgtYearData.moneyPlan = {
            plan: { reserve: {}, monthly: {} },
            details: { monthly: {} },
            settlement: { monthly: {} },
            rowHeights: [],
            colWidths: [],
            headerHeight: 0
        };
    }

    // Deep Copy Logic
    const clone = JSON.parse(JSON.stringify(srcData));

    if (overwrite) {
        tgtYearData.moneyPlan = clone;
    } else {
        // Simple Merge: Copy if target is empty
        const tgtPlan = tgtYearData.moneyPlan;

        // Merge Plan
        ['plan', 'details', 'settlement'].forEach(key => {
            const sGroup = clone[key] || {};
            const tGroup = tgtPlan[key] || {};

            // Reserve
            if (sGroup.reserve) {
                if (!tGroup.reserve) tGroup.reserve = {};
                Object.keys(sGroup.reserve).forEach(k => {
                    if (tGroup.reserve[k] === undefined || tGroup.reserve[k] === "") {
                        tGroup.reserve[k] = sGroup.reserve[k];
                    }
                });
            }

            // Monthly
            if (sGroup.monthly) {
                if (!tGroup.monthly) tGroup.monthly = {};
                Object.keys(sGroup.monthly).forEach(mIdx => {
                    if (!tGroup.monthly[mIdx]) tGroup.monthly[mIdx] = {};
                    const sMonth = sGroup.monthly[mIdx];
                    const tMonth = tGroup.monthly[mIdx];
                    Object.keys(sMonth).forEach(cIdx => {
                        if (tMonth[cIdx] === undefined || tMonth[cIdx] === "") {
                            tMonth[cIdx] = sMonth[cIdx];
                        }
                    });
                });
            }
        });

        // Copy Layout info if missing
        if (!tgtPlan.rowHeights || tgtPlan.rowHeights.length === 0) tgtPlan.rowHeights = clone.rowHeights;
        if (!tgtPlan.colWidths || tgtPlan.colWidths.length === 0) tgtPlan.colWidths = clone.colWidths;
    }

    saveData();
    closeCopyDataModal();
    renderMainTable();
    alert("연도별 데이터 복사가 완료되었습니다.");

    // If we copied TO a different year, ask to switch
    if (tgtYear !== currentYear && confirm(`${tgtYear}년으로 이동하시겠습니까?`)) {
        changeYear(tgtYear - currentYear); // Reuse existing changeYear logic
    }
}

window.addEventListener('load', initMoneyPlan);
