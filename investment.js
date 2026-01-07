const formatMoneyFull = (amount) => {
    if (amount === undefined || amount === null || amount === '') return '';
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
};

function initInvestmentPage() {
    loadData();
    // Default initial data if not exists (redundant with data.js but for safety)
    if (!roadmapData.investment) {
        roadmapData.investment = {
            block1: { rows: ["항목 1"], cols: ["구분 1"], data: {} },
            investors: [
                { id: 1, name: "기본 투자자", block2: { rows: ["세부 항목 1"], cols: ["구분 1"], data: {} } }
            ],
            selectedInvestorId: 1,
            currentYear: new Date().getFullYear()
        };
    }
    // Ensure currentYear exists if loading from old data
    if (!roadmapData.investment.currentYear) {
        roadmapData.investment.currentYear = new Date().getFullYear();
    }

    renderAll();
}

function renderAll() {
    window.currentPageType = 'investment';
    renderTitles();
    renderInvestorSelect();
    renderTable('block1');
    renderTable('block2');
    renderMemos();
}

function renderTitles() {
    const t1 = document.getElementById('titleBlock1');
    const t2 = document.getElementById('titleBlock2');
    const sub = document.getElementById('pageSubtitle');
    if (t1) t1.value = roadmapData.investment.block1.title || "투자 현황 (일반)";
    if (t2) t2.value = roadmapData.investment.block2Title || "투자자별 내역";
    if (sub) sub.value = roadmapData.investment.subtitle || "자유로운 형식으로 투자 내역과 수입을 관리하세요.";
}

function updateSubtitle(value) {
    roadmapData.investment.subtitle = value;
    saveData();
}

function updateBlockTitle(blockId, value) {
    if (blockId === 'block1') {
        roadmapData.investment.block1.title = value;
    } else {
        roadmapData.investment.block2Title = value;
    }
    saveData();
}

function renderInvestorSelect() {
    const select = document.getElementById('investorSelect');
    const investors = roadmapData.investment.investors;

    let html = '';
    investors.forEach(inv => {
        const isSelected = inv.id == roadmapData.investment.selectedInvestorId;
        html += `<option value="${inv.id}" ${isSelected ? 'selected' : ''} style="background: #1e293b; color: white;">${inv.name}</option>`;
    });
    select.innerHTML = html;

    // Update Year Display
    const yearDisp = document.getElementById('currentYearDisplay');
    if (yearDisp) yearDisp.innerText = roadmapData.investment.currentYear;
}

function changeInvestor(id) {
    roadmapData.investment.selectedInvestorId = id;
    renderTable('block2');
    saveData();
}

function changeYear(delta) {
    roadmapData.investment.currentYear += delta;
    renderInvestorSelect();
    renderTable('block2');
    saveData();

}

function getActiveGrid(blockId) {
    if (blockId === 'block1') return roadmapData.investment.block1;

    const inv = roadmapData.investment.investors.find(i => i.id == roadmapData.investment.selectedInvestorId);
    if (!inv) return null;

    if (blockId === 'block2') {
        const curYear = roadmapData.investment.currentYear || new Date().getFullYear();

        // Ensure years storage exists
        if (!inv.years) inv.years = {};

        // If data for current year doesn't exist, initialize it
        if (!inv.years[curYear]) {
            // Restore legacy configuration
            const legacy = inv.block2 || {};
            const hasLegacyConfig = legacy.cols && legacy.cols.length > 0;
            const firstRowTitle = (legacy.rows && legacy.rows.length > 0) ? legacy.rows[0] : "합계";

            inv.years[curYear] = {
                rows: [firstRowTitle, "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
                cols: hasLegacyConfig ? [...legacy.cols] : ["내용", "금액", "비고"],
                data: {},
                corner: `${curYear}년`,
                rowColors: ['#1e293b', '', '', '', '', '', '', '', '', '', '', '', ''],
                colWidths: legacy.colWidths ? [...legacy.colWidths] : [],
                colColors: legacy.colColors ? [...legacy.colColors] : []
            };

            if (hasLegacyConfig && legacy.data) {
                legacy.cols.forEach((_, cIdx) => {
                    const val = legacy.data[`0-${cIdx}`];
                    if (val) inv.years[curYear].data[`0-${cIdx}`] = val;
                });
            }
        }
        return inv.years[curYear];
    }

    return null; // Should not reach here
}

function renderTable(blockId) {
    const table = document.getElementById(blockId === 'block1' ? 'tableBlock1' : 'tableBlock2');
    const grid = getActiveGrid(blockId);
    if (!grid) return;

    // Default colors if not present
    if (!grid.rowColors) grid.rowColors = [];
    if (!grid.colColors) grid.colColors = [];

    // Helper to get numeric value
    const getNum = (val) => {
        if (!val) return 0;
        const n = parseFloat(String(val).replace(/,/g, ''));
        return isNaN(n) ? 0 : n;
    };

    // Identify Sum Rows/Cols
    const sumRows = grid.rows.map(r => r.includes('합계'));
    const sumCols = grid.cols.map(c => c.includes('합계'));

    const colWidths = grid.colWidths || [];
    const rowHeights = grid.rowHeights || [];
    const hHeight = grid.headerHeight || 0;

    const isAllSelected = grid.allSelected || false;

    // Helper to determine if a column should be summed
    const isSummableCol = (colName) => {
        const raw = (colName || '').replace(/\s+/g, '');
        if (raw === '세후이자') return false;
        if (raw === '현황') return false;
        if (raw.includes('율') || raw.includes('비율')) return false; // Percentage/Interest Rate

        const keywords = ['금액', '원금', '비용', '수익', '배당', '입금', '이자', '세전', '납입', '수령', '합계', '잔액', '현금', '자산'];
        return keywords.some(k => raw.includes(k));
    };

    // [New] Investor Total Calculation
    const investorIdx = grid.cols.findIndex(c => c.trim() === '투자자');
    const investorTotals = {}; // Active Projects: { 'Name': { cIdx: sum } }
    const completedTotals = { total: {}, investors: {} }; // Completed Projects

    if (investorIdx > -1) {
        const curStatusIdx = grid.cols.findIndex(c => c.trim() === '현황');
        grid.rows.forEach((r, rIdx) => {
            if (sumRows[rIdx]) return; // Skip sum rows

            const isCompleted = (curStatusIdx > -1 && grid.data[`${rIdx}-${curStatusIdx}`] === '완료');
            const invName = (grid.data[`${rIdx}-${investorIdx}`] || '').trim();

            if (!isCompleted && invName && !investorTotals[invName]) investorTotals[invName] = {};
            if (isCompleted && invName && !completedTotals.investors[invName]) completedTotals.investors[invName] = {};

            // Calculate sums for all columns
            grid.cols.forEach((_, cIdx) => {
                const colNameRaw = (grid.cols[cIdx] || '').replace(/\s+/g, ''); // Normalize spaces
                // Skip if sum column OR not summable
                if (!sumCols[cIdx] && isSummableCol(grid.cols[cIdx])) {
                    const raw = String(grid.data[`${rIdx}-${cIdx}`] || '').replace(/,/g, '');
                    const num = parseFloat(raw);
                    if (!isNaN(num)) {
                        if (isCompleted) {
                            // Add to Total Completed
                            completedTotals.total[cIdx] = (completedTotals.total[cIdx] || 0) + num;
                            // Add to Investor Completed
                            if (invName) completedTotals.investors[invName][cIdx] = (completedTotals.investors[invName][cIdx] || 0) + num;
                        } else {
                            // Add to Investor Active
                            if (invName) investorTotals[invName][cIdx] = (investorTotals[invName][cIdx] || 0) + num;
                        }
                    }
                }
            });
        });
    }

    let html = `<thead><tr class="bg-gray-900/50" ${hHeight ? `style="height: ${hHeight}px"` : ''}>`;
    // Corner editable
    const cornerW = colWidths[0] ? `style="width: ${colWidths[0]}px; min-width: ${colWidths[0]}px"` : 'style="width: 160px; min-width: 160px"';
    html += `<th class="p-0 border border-white/10 relative cursor-pointer ${isAllSelected ? 'bg-blue-500/30' : 'bg-gray-800'}" 
                 ${cornerW} onclick="toggleSelectAll('${blockId}')">
                <div class="cell-wrapper">
                    <textarea class="header-input italic text-[10px] pointer-events-none" rows="1">${grid.corner || '전체 선택'}</textarea>
                </div>
                <div class="resizer-v" onmousedown="event.stopPropagation(); initResizing(event, '${blockId}', 'col', 0)"></div>
                <div class="resizer-h" onmousedown="event.stopPropagation(); initResizing(event, '${blockId}', 'header', 0)"></div>
                ${isAllSelected ? '<div class="absolute top-0 left-0 w-full h-full border-2 border-blue-500 pointer-events-none"></div>' : ''}
             </th>`;

    grid.cols.forEach((col, cIdx) => {
        const colColor = grid.colColors[cIdx] || 'transparent';
        const isSumCol = sumCols[cIdx];
        const wVal = colWidths[cIdx + 1] || 120;
        const style = `width: ${wVal}px; min-width: ${wVal}px; background-color: ${colColor}44;`;

        html += `
            <th class="p-0 border border-white/10 group relative text-center ${isSumCol ? 'bg-blue-500/10' : ''}" 
                style="${style}" onclick="this.querySelector('textarea')?.focus()">
                <div class="cell-wrapper">
                    <textarea class="header-input ${isSumCol ? 'font-bold text-blue-400' : ''}" rows="1" onchange="updateHeader('${blockId}', 'col', ${cIdx}, this.value)">${col}</textarea>
                </div>
                <button onclick="removeHeader('${blockId}', 'col', ${cIdx})" class="absolute -top-1 -right-1 hidden group-hover:flex bg-red-500/80 text-white rounded-full w-4 h-4 items-center justify-center text-[10px] z-20">×</button>
                <div class="resizer-v" onmousedown="initResizing(event, '${blockId}', 'col', ${cIdx + 1})"></div>
                <div class="resizer-h" onmousedown="initResizing(event, '${blockId}', 'header', 0)"></div>
            </th>`;
    });
    html += `</tr></thead>`;

    // Color Palette
    const investorColors = [
        '#3b82f6', // blue
        '#8b5cf6', // purple
        '#10b981', // green
        '#f59e0b', // amber
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#eab308', // yellow
        '#6366f1', // indigo
    ];
    const getColorForName = (name) => {
        if (!name) return '#94a3b8';
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return investorColors[Math.abs(hash) % investorColors.length];
    };

    html += `<tbody>`;
    grid.rows.forEach((row, rIdx) => {
        const rowColor = grid.rowColors[rIdx] || 'transparent';
        const isSumRow = sumRows[rIdx];
        const h = rowHeights[rIdx] ? `style="height: ${rowHeights[rIdx]}px; background-color: ${rowColor}44;"` : `style="background-color: ${rowColor}44;"`;
        html += `<tr ${h}>`;
        const statusIdx = grid.cols.findIndex(c => c.trim() === '현황');
        const isCompleted = statusIdx > -1 && grid.data[`${rIdx}-${statusIdx}`] === '완료';

        html += `
            <td class="p-0 bg-gray-900/30 border border-white/10 group relative ${isSumRow ? 'bg-blue-500/10' : ''} ${isCompleted ? 'row-completed' : ''}" 
                onclick="this.querySelector('textarea, select')?.focus()">
                <div class="cell-wrapper">
                    <textarea class="row-header-input ${isSumRow ? 'font-bold text-blue-400' : ''} ${isCompleted ? 'row-completed' : ''}" rows="1" onchange="updateHeader('${blockId}', 'row', ${rIdx}, this.value)">${row}</textarea>
                </div>
                <button onclick="removeHeader('${blockId}', 'row', ${rIdx})" class="absolute -top-1 -left-1 hidden group-hover:flex bg-red-500/80 text-white rounded-full w-4 h-4 items-center justify-center text-[10px] z-20">×</button>
                <div class="resizer-h" onmousedown="initResizing(event, '${blockId}', 'row', ${rIdx})"></div>
            </td>`;

        grid.cols.forEach((col, cIdx) => {
            const key = `${rIdx}-${cIdx}`;
            let val = grid.data[key] || '';
            let isReadOnly = false;
            const colColor = grid.colColors[cIdx] || '';
            const finalBgString = (rowColor && rowColor !== 'transparent') ? rowColor : (colColor && colColor !== 'transparent' ? colColor : '');

            // Formatting check
            const colNameRaw = (grid.cols[cIdx] || '').replace(/\s+/g, '');
            if (isSummableCol(colNameRaw) && !isSumRow && val) {
                const numVal = parseFloat(String(val).replace(/,/g, ''));
                if (!isNaN(numVal)) {
                    val = formatMoneyFull(numVal);
                }
            }

            // Specific styling for Investor column cells
            let cellStyle = '';
            if (cIdx === investorIdx && val && !isSumRow) {
                const iColor = getColorForName(val.trim());
                cellStyle = `color: ${iColor}; font-weight: bold;`;
            }

            if (sumRows[rIdx] || sumCols[cIdx]) {
                isReadOnly = true;
                let sum = 0;
                let hasValidNum = false;

                const checkAndAdd = (v) => {
                    // Pre-check for column name validity in scope of cIdx
                    if (!isSummableCol(grid.cols[cIdx])) return;

                    const raw = String(v || '').replace(/,/g, '').trim();
                    if (raw !== '' && !isNaN(parseFloat(raw))) {
                        sum += parseFloat(raw);
                        hasValidNum = true;
                    }
                };

                if (sumRows[rIdx] && !sumCols[cIdx]) {
                    // Vertical Sums
                    grid.rows.forEach((_, ri) => {
                        const rowStatus = statusIdx > -1 ? grid.data[`${ri}-${statusIdx}`] : '';
                        if (!sumRows[ri] && rowStatus !== '완료') checkAndAdd(grid.data[`${ri}-${cIdx}`]);
                    });

                    // NEW: If this is '세후 이자' column, force '-'.
                    const cName = (grid.cols[cIdx] || '').replace(/\s+/g, '');
                    if (cName === '세후이자') hasValidNum = false;

                } else if (!sumRows[rIdx] && sumCols[cIdx]) {
                    // Horizontal Sums
                    if (isCompleted) {
                        hasValidNum = false;
                    } else {
                        grid.cols.forEach((_, ci) => {
                            // Exclude '세후 이자' from horizontal sum if needed? 
                            // Usually "세후 이자" is a Result column, so maybe we keep it. 
                            // But user request was "세후 이자 열에서는 합계값은 나오지 않게 해줘".
                            // That implies Vertical columns totals.
                            // Wait, if "세후 이자" is a column, then the question is about the vertical sum at the bottom.
                            // So my change above handles it.
                            if (!sumCols[ci]) checkAndAdd(grid.data[`${rIdx}-${ci}`]);
                        });
                    }
                } else if (sumRows[rIdx] && sumCols[cIdx]) {
                    // Grand Total (Intersection)
                    grid.rows.forEach((_, ri) => {
                        const rowStatus = statusIdx > -1 ? grid.data[`${ri}-${statusIdx}`] : '';
                        if (!sumRows[ri] && rowStatus !== '완료') {
                            grid.cols.forEach((_, ci) => { if (!sumCols[ci]) checkAndAdd(grid.data[`${ri}-${ci}`]); });
                        }
                    });

                    // If calculating grand total, should we exclude '세후 이자' column from the horizontal sum that feeds into it?
                    // Usually yes if it's a derived value like Interest. 
                    // But effectively if I block specific column summing, I should be careful.
                    // The user ONLY asked "세후 이자 열에서는 합계값은 나오지 않게 해줘". 
                    // This implies the cell at (Total Row, After-tax Interest Col) should be empty/dash.
                    // My change in the first 'if' block handles that specific cell.

                    // BUT what about the cell at (Total Row, Total Col)? i.e., Grand Total.
                    // If 'After-tax Interest' is just a value (not formula), it might be part of the total.
                    // However, typically Interest is income. 
                    // Since I don't know if the user implies exclude from Grand Total, I will stick to "In the After-tax Interest column, do not show sum".

                    // So checking cIdx against '세후 이자' covers the vertical sum cell.
                    // Checking if cIdx is '세후 이자' covers the Investor Total rows too (handled in chunk 1).

                    // We also need to check if we are in the '세후 이자' column here for Grand Total?
                    // No, Grand Total is in 'Total' column.
                    // If '세후 이자' is a column, then `sumCols[cIdx]` is false. So we fall into the first block.
                    // If we ARE in a Sum Column (e.g. Total), we are in 2nd or 3rd block.

                    // Wait, if cIdx is the 'Total' column, we are iterating `ci`.
                    // If `grid.cols[ci]` is '세후 이자', should we include it in the horizontal sum?
                    // User didn't ask to exclude it from row totals.
                    // User asked "In the After-tax Interest COLUMN, don't show the total value".
                    // This confirms my first edit is correct: disable the vertical sum for that column.
                }

                // Final check for the specific cell being rendered
                const thisColName = (grid.cols[cIdx] || '').trim();
                if (thisColName === '세후 이자' && sumRows[rIdx]) {
                    hasValidNum = false;
                }

                val = hasValidNum ? formatMoneyFull(sum) : "-";
            }

            if (statusIdx === cIdx && !isSumRow) {
                html += `
                    <td class="p-0 border border-white/10 ${isReadOnly ? 'bg-blue-500/10' : ''}" 
                        style="background-color: ${finalBgString}22; text-align: center;">
                        <div class="cell-wrapper">
                            <select class="table-input ${isReadOnly ? 'font-bold text-blue-400' : ''} ${isCompleted ? 'row-completed' : ''}" 
                                style="appearance: none; -webkit-appearance: none; width: 100%; border: none; text-align: center; background: transparent; color: inherit;"
                                onchange="updateCell('${blockId}', ${rIdx}, ${cIdx}, this.value)">
                                <option value="진행중" ${val === '진행중' ? 'selected' : ''} style="background: #1e293b; color: white;">진행중</option>
                                <option value="완료" ${val === '완료' ? 'selected' : ''} style="background: #1e293b; color: white;">완료</option>
                            </select>
                        </div>
                    </td>`;
            } else {
                html += `
                <td class="p-0 border border-white/10 ${isReadOnly ? 'bg-blue-500/10' : ''} ${isCompleted ? 'row-completed' : ''}" 
                    style="background-color: ${finalBgString}22" onclick="this.querySelector('textarea')?.focus()">
                    <div class="cell-wrapper">
                        <textarea class="table-input ${isReadOnly ? 'font-bold text-blue-400' : ''} ${isCompleted ? 'row-completed' : ''}" rows="1" 
                            style="${cellStyle}"
                            ${isReadOnly ? 'readonly' : `onchange="updateCell('${blockId}', ${rIdx}, ${cIdx}, this.value)"`}
                            onfocus="${isReadOnly ? 'this.blur()' : 'this.select()'}">${val}</textarea>
                    </div>
                </td>`;
            }
        });
        html += `</tr>`;

        // [New] Render Investor Sub-totals
        if (sumRows[rIdx] && investorIdx > -1) {
            const sortedInv = Object.keys(investorTotals).sort();
            sortedInv.forEach(invName => {
                const invColor = getColorForName(invName);
                // Unique background per investor
                const hStyle = rowHeights[rIdx] ? `height: ${rowHeights[rIdx]}px;` : '';
                const rowStyle = `background-color: ${invColor}33; border-top: 1px dashed ${invColor}66; ${hStyle}`;
                const textStyle = `color: ${invColor}; font-weight: bold;`;

                html += `<tr style="${rowStyle}">`;

                // Row Header
                html += `<td class="p-0 border border-white/10 relative">
                            <div class="cell-wrapper justify-center">
                                <span class="text-sm font-bold" style="${textStyle}">↳ ${invName}</span>
                            </div>
                         </td>`;

                grid.cols.forEach((_, cIdx) => {
                    let disp = '-';
                    const cName = (grid.cols[cIdx] || '').replace(/\s+/g, '');
                    const isStatus = (grid.cols[cIdx] || '').trim() === '현황';

                    if (cIdx === investorIdx) {
                        disp = invName;
                    } else if (cName === '세후이자' || isStatus) {
                        disp = '-';
                    } else if (investorTotals[invName] && investorTotals[invName][cIdx] !== undefined) {
                        disp = formatMoneyFull(investorTotals[invName][cIdx]);
                    }

                    html += `<td class="p-0 border border-white/10 relative">
                                <div class="cell-wrapper justify-center text-sm font-bold pr-2" style="justify-content: center; ${textStyle}">
                                    ${disp}
                                </div>
                             </td>`;
                });
            });
        }
    });

    // [New] Render Completed Projects Summary
    if (Object.keys(completedTotals.total).length > 0) {
        // Find height of the main 'Total' row to match
        const sumRowIdx = grid.rows.findIndex(r => r.includes('합계'));
        const hStyle = (sumRowIdx > -1 && rowHeights[sumRowIdx]) ? `height: ${rowHeights[sumRowIdx]}px;` : '';

        // 1. Total (Completed) Row
        html += `<tr style="background-color: rgba(220, 38, 38, 0.15); border-top: 2px solid rgba(220, 38, 38, 0.3); ${hStyle}">`;

        // Match existing Total row structure. usually first col is corner/header
        // But here we are just appending cells. We need to match grid.cols layout.

        // Row Header (First Cell)
        html += `<td class="p-0 border border-white/10 relative">
                    <div class="cell-wrapper justify-center">
                        <span class="font-bold text-red-400">합계 (완료)</span>
                    </div>
                 </td>`;

        grid.cols.forEach((_, cIdx) => {
            const val = completedTotals.total[cIdx];
            const disp = (val !== undefined) ? formatMoneyFull(val) : '-';

            // Check for '세후이자' column or Status column
            const cName = (grid.cols[cIdx] || '').replace(/\s+/g, '');
            const isStatus = (grid.cols[cIdx] || '').trim() === '현황';
            const finalDisp = (cName === '세후이자' || isStatus) ? '-' : disp;

            html += `<td class="p-0 border border-white/10 relative">
                        <div class="cell-wrapper justify-center font-bold text-red-300 pr-2" style="justify-content: center;">
                            ${finalDisp}
                        </div>
                     </td>`;
        });
        html += `</tr>`;

        // 2. Investor Totals (Completed)
        const sortedInvComp = Object.keys(completedTotals.investors).sort();
        sortedInvComp.forEach(invName => {
            const invColor = getColorForName(invName);
            // Use Red-tinted background mixed with investor color? Or just distinct
            // User said: "Different color to distinguish".
            // Let's use a darker/reddish version of the investor style.
            // Blend investor color with red or just make it distinct.

            const rowStyle = `background-color: rgba(60, 20, 20, 0.4); border-top: 1px dashed ${invColor}66; ${hStyle}`;
            const textStyle = `color: ${invColor}; font-weight: bold; filter: brightness(0.9);`;

            html += `<tr style="${rowStyle}">`;

            html += `<td class="p-0 border border-white/10 relative">
                        <div class="cell-wrapper justify-center">
                            <span class="text-sm font-bold" style="${textStyle}">↳ ${invName} (완료)</span>
                        </div>
                      </td>`;

            grid.cols.forEach((_, cIdx) => {
                const val = completedTotals.investors[invName][cIdx];
                const disp = (val !== undefined) ? formatMoneyFull(val) : '-';
                const cName = (grid.cols[cIdx] || '').replace(/\s+/g, '');
                const isStatus = (grid.cols[cIdx] || '').trim() === '현황';
                const finalDisp = (cName === '세후이자' || isStatus) ? '-' : disp;

                html += `<td class="p-0 border border-white/10 relative">
                            <div class="cell-wrapper justify-center text-sm font-bold pr-2" style="justify-content: center; ${textStyle}">
                                ${finalDisp}
                            </div>
                         </td>`;
            });
            html += `</tr>`;
        });
    }

    html += `</tbody>`;

    table.innerHTML = html;
    // Auto-resize after rendering
    table.querySelectorAll('textarea').forEach(autoResize);
}

function initResizing(e, blockId, type, idx) {
    e.preventDefault();
    const grid = getActiveGrid(blockId);
    if (!grid) return;

    const startPos = type === 'col' ? e.pageX : e.pageY;
    const table = document.getElementById(blockId === 'block1' ? 'tableBlock1' : 'tableBlock2');

    let startDim;
    let targetElement;

    if (type === 'col') {
        targetElement = table.querySelectorAll('thead th')[idx];
        startDim = targetElement.offsetWidth;
    } else if (type === 'header') {
        targetElement = table.querySelector('thead tr');
        startDim = targetElement.offsetHeight;
    } else {
        targetElement = table.querySelectorAll('tbody tr')[idx];
        startDim = targetElement.offsetHeight;
    }

    const textareas = table.querySelectorAll('textarea');
    textareas.forEach(ta => ta.style.pointerEvents = 'none');

    const onMouseMove = (moveE) => {
        const currentPos = type === 'col' ? moveE.pageX : moveE.pageY;
        const diff = currentPos - startPos;
        const newDim = Math.max(type === 'col' ? 60 : 30, startDim + diff);

        if (type === 'col') {
            if (!grid.colWidths) grid.colWidths = [];
            if (grid.allSelected) {
                grid.cols.forEach((_, i) => grid.colWidths[i + 1] = newDim);
                grid.colWidths[0] = newDim;
                // Live update all headers if possible
                table.querySelectorAll('thead th').forEach(th => {
                    th.style.width = newDim + 'px';
                    th.style.minWidth = newDim + 'px';
                });
            } else {
                grid.colWidths[idx] = newDim;
                targetElement.style.width = newDim + 'px';
                targetElement.style.minWidth = newDim + 'px';
            }
        } else if (type === 'header') {
            grid.headerHeight = newDim;
            targetElement.style.height = newDim + 'px';
        } else {
            if (!grid.rowHeights) grid.rowHeights = [];
            if (grid.allSelected) {
                grid.rows.forEach((_, i) => grid.rowHeights[i] = newDim);
                table.querySelectorAll('tbody tr').forEach(tr => tr.style.height = newDim + 'px');
            } else {
                grid.rowHeights[idx] = newDim;
                targetElement.style.height = newDim + 'px';
            }
        }
    };

    const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        // Re-enable pointer events
        textareas.forEach(ta => ta.style.pointerEvents = '');
        saveData();
        renderTable(blockId); // Re-render to ensure all styles are applied consistently and sums are updated
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function autoFormatValue(val) {
    const raw = String(val).trim();
    if (!raw) return '';

    // 1. Date Check (Simple 6 or 8 digit pure number)
    // Only format as date if MM (1-12) and DD (1-31) are valid
    const pureDigits = raw.replace(/[^0-9]/g, '');
    if (raw === pureDigits && (pureDigits.length === 6 || pureDigits.length === 8)) {
        let m, d;
        if (pureDigits.length === 8) {
            m = parseInt(pureDigits.substring(4, 6));
            d = parseInt(pureDigits.substring(6, 8));
        } else {
            m = parseInt(pureDigits.substring(2, 4));
            d = parseInt(pureDigits.substring(4, 6));
        }

        if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
            if (pureDigits.length === 8) {
                return `${pureDigits.substring(0, 4)}.${pureDigits.substring(4, 6)}.${pureDigits.substring(6, 8)}`;
            } else {
                return `${pureDigits.substring(0, 2)}.${pureDigits.substring(2, 4)}.${pureDigits.substring(4, 6)}`;
            }
        }
    }

    // 2. Number Check (Add commas, remove decimals)
    const numRaw = raw.replace(/,/g, '');
    if (!isNaN(numRaw) && numRaw !== '') {
        return formatMoneyFull(numRaw);
    }

    return raw;
}

function updateColor(blockId, type, idx, color) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    if (type === 'row') {
        if (!grid.rowColors) grid.rowColors = [];
        grid.rowColors[idx] = color;
    } else {
        if (!grid.colColors) grid.colColors = [];
        grid.colColors[idx] = color;
    }
    saveData();
    renderTable(blockId);
}

function moveHeader(blockId, type, idx, direction) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;

    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= (type === 'row' ? grid.rows.length : grid.cols.length)) return;

    reorderHeader(blockId, type, idx, targetIdx);
}

function reorderHeader(blockId, type, fromIdx, toIdx) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;

    if (fromIdx === toIdx) return;

    const list = type === 'row' ? grid.rows : grid.cols;
    const colorList = type === 'row' ? grid.rowColors : grid.colColors;

    // Save mapping of OLD index -> NEW index
    const indexMap = Array.from({ length: list.length }, (_, i) => i);
    const [moved] = indexMap.splice(fromIdx, 1);
    indexMap.splice(toIdx, 0, moved);

    // Reverse Map: New Index -> Old Index
    const reverseMap = new Array(list.length);
    indexMap.forEach((oldIdx, newIdx) => {
        reverseMap[newIdx] = oldIdx;
    });

    // Apply Move to Lists
    const [movedHeader] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, movedHeader);

    if (colorList && colorList.length > 0) {
        const [movedColor] = colorList.splice(fromIdx, 1);
        colorList.splice(toIdx, 0, movedColor);
    }

    const dimList = type === 'row' ? grid.rowHeights : grid.colWidths;
    const dimOffset = type === 'row' ? 0 : 1;
    if (dimList && dimList.length > 0) {
        const actualFrom = fromIdx + dimOffset;
        const actualTo = toIdx + dimOffset;
        if (actualFrom < dimList.length) {
            const [movedDim] = dimList.splice(actualFrom, 1);
            dimList.splice(Math.min(actualTo, dimList.length), 0, movedDim);
        }
    }

    // Remap Data
    const oldData = { ...grid.data };
    grid.data = {};

    grid.rows.forEach((_, rIdx) => {
        grid.cols.forEach((_, cIdx) => {
            const origR = (type === 'row') ? reverseMap[rIdx] : rIdx;
            const origC = (type === 'col') ? reverseMap[cIdx] : cIdx;
            const val = oldData[`${origR}-${origC}`];
            if (val !== undefined) grid.data[`${rIdx}-${cIdx}`] = val;
        });
    });

    saveData();
    renderAll();
}

function updateCell(blockId, rIdx, cIdx, value) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;

    // Auto Format (Exclude status column from money formatting)
    const statusIdx = grid.cols.findIndex(c => c.trim() === '현황');
    const formatted = (statusIdx === cIdx) ? value : autoFormatValue(value);
    grid.data[`${rIdx}-${cIdx}`] = formatted;

    if (statusIdx === cIdx) {
        sortByStatus(blockId);
    } else {
        saveData();
        renderTable(blockId);
    }
}

function sortByStatus(blockId) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    const statusIdx = grid.cols.findIndex(c => c.trim() === '현황');
    if (statusIdx === -1) {
        saveData();
        renderTable(blockId);
        return;
    }

    const originalRows = grid.rows.map((r, ri) => ({
        header: r,
        color: grid.rowColors ? grid.rowColors[ri] : 'transparent',
        height: grid.rowHeights ? grid.rowHeights[ri] : 0,
        status: grid.data[`${ri}-${statusIdx}`] || '진행중',
        isSum: r.includes('합계'),
        originalRi: ri
    }));

    // Separating projects and sums
    const projects = originalRows.filter(r => !r.isSum);
    projects.sort((a, b) => {
        if (a.status !== '완료' && b.status === '완료') return -1;
        if (a.status === '완료' && b.status !== '완료') return 1;
        return 0;
    });

    // Reconstruct with sums fixed at their original positions
    const newRowsData = new Array(originalRows.length);
    let pIdx = 0;
    originalRows.forEach((r, i) => {
        if (r.isSum) {
            newRowsData[i] = r;
        } else {
            newRowsData[i] = projects[pIdx++];
        }
    });

    // Check if change needed
    const needsChange = newRowsData.some((d, i) => d.originalRi !== i);
    if (!needsChange) {
        saveData();
        renderTable(blockId);
        return;
    }

    const oldData = { ...grid.data };
    grid.rows = newRowsData.map(d => d.header);
    grid.rowColors = newRowsData.map(d => d.color);
    grid.rowHeights = newRowsData.map(d => d.height);
    grid.data = {};

    grid.rows.forEach((_, newRi) => {
        const oldRi = newRowsData[newRi].originalRi;
        grid.cols.forEach((_, ci) => {
            const key = `${oldRi}-${ci}`;
            if (oldData[key] !== undefined) grid.data[`${newRi}-${ci}`] = oldData[key];
        });
    });

    saveData();
    renderTable(blockId);
}

function updateHeader(blockId, type, idx, value) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    if (type === 'row') grid.rows[idx] = value;
    else grid.cols[idx] = value;
    saveData();
    renderTable(blockId); // Re-render for sum activation
}

function updateCorner(blockId, value) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    grid.corner = value;
    saveData();
    renderTable(blockId);
}

function addRow(blockId) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    grid.rows.push(`새 항목 ${grid.rows.length + 1}`);

    // Maintain default height if others are set
    if (grid.rowHeights && grid.rowHeights.length > 0) {
        grid.rowHeights.push(40);
    }

    renderTable(blockId);
    saveData();
}

function toggleSelectAll(blockId) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    grid.allSelected = !grid.allSelected;
    renderTable(blockId);
}

function addColumn(blockId) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    grid.cols.push(`새 구분 ${grid.cols.length + 1}`);
    renderTable(blockId);
    saveData();
}

function removeHeader(blockId, type, idx) {
    if (!confirm('정말 삭제하시겠습니까? 데이터가 소실될 수 있습니다.')) return;
    const grid = getActiveGrid(blockId);
    if (!grid) return;

    const oldRows = [...grid.rows];
    const oldCols = [...grid.cols];
    const oldData = { ...grid.data };

    if (type === 'row') {
        grid.rows.splice(idx, 1);
    } else {
        grid.cols.splice(idx, 1);
    }

    // Remap data
    grid.data = {};
    grid.rows.forEach((r, rIdx) => {
        grid.cols.forEach((c, cIdx) => {
            // Find old index
            const origR = (type === 'row' && rIdx >= idx) ? rIdx + 1 : rIdx;
            const origC = (type === 'col' && cIdx >= idx) ? cIdx + 1 : cIdx;
            const val = oldData[`${origR}-${origC}`];
            if (val !== undefined) grid.data[`${rIdx}-${cIdx}`] = val;
        });
    });

    renderTable(blockId);
    saveData();
}

// Separate Structure Management
let currentManagingBlock = null;

function openStructureManager(blockId) {
    currentManagingBlock = blockId;
    document.getElementById('structureModal').style.display = 'flex';
    renderStructureList();
}

function closeStructureManager() {
    document.getElementById('structureModal').style.display = 'none';
    currentManagingBlock = null;
}

function renderStructureList() {
    const grid = getActiveGrid(currentManagingBlock);
    if (!grid) return;

    // Render Rows
    let rowHtml = '';
    grid.rows.forEach((row, idx) => {
        rowHtml += `
            <div class="flex items-center gap-2 bg-gray-800 p-2 rounded border border-white/5 cursor-grab active:cursor-grabbing hover:bg-gray-700/50 transition" 
                draggable="true" 
                ondragstart="handleDragStart(event, 'row', ${idx})"
                ondragover="handleDragOver(event)"
                ondrop="handleDrop(event, 'row', ${idx})">
                <span class="text-xs text-gray-500 w-4 select-none">⠿</span>
                <span class="flex-1 text-sm font-medium truncate">${row}</span>
                <input type="color" value="${grid.rowColors[idx] || '#1e293b'}" 
                    onchange="updateColor('${currentManagingBlock}', 'row', ${idx}, this.value); renderStructureList();"
                    class="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer">
                <button onclick="removeHeader('${currentManagingBlock}', 'row', ${idx}); renderStructureList();" 
                    class="text-gray-500 hover:text-red-400 p-1">✕</button>
            </div>`;
    });
    document.getElementById('rowManagerList').innerHTML = rowHtml || '<p class="text-gray-500 text-xs text-center p-4">행이 없습니다.</p>';

    // Render Cols
    let colHtml = '';
    grid.cols.forEach((col, idx) => {
        colHtml += `
            <div class="flex items-center gap-2 bg-gray-800 p-2 rounded border border-white/5 cursor-grab active:cursor-grabbing hover:bg-gray-700/50 transition" 
                draggable="true" 
                ondragstart="handleDragStart(event, 'col', ${idx})"
                ondragover="handleDragOver(event)"
                ondrop="handleDrop(event, 'col', ${idx})">
                <span class="text-xs text-gray-500 w-4 select-none">⠿</span>
                <span class="flex-1 text-sm font-medium truncate">${col}</span>
                <input type="color" value="${grid.colColors[idx] || '#1e293b'}" 
                    onchange="updateColor('${currentManagingBlock}', 'col', ${idx}, this.value); renderStructureList();"
                    class="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer">
                <button onclick="removeHeader('${currentManagingBlock}', 'col', ${idx}); renderStructureList();" 
                    class="text-gray-500 hover:text-red-400 p-1">✕</button>
            </div>`;
    });
    document.getElementById('colManagerList').innerHTML = colHtml || '<p class="text-gray-500 text-xs text-center p-4">열이 없습니다.</p>';
}

let dragSourceIdx = null;
let dragSourceType = null;

function handleDragStart(e, type, idx) {
    dragSourceIdx = idx;
    dragSourceType = type;
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e, type, targetIdx) {
    e.preventDefault();
    if (dragSourceType !== type || dragSourceIdx === targetIdx) return;

    reorderHeader(currentManagingBlock, type, dragSourceIdx, targetIdx);
    renderStructureList();
}

// Investor Management
function openInvestorManager() {
    document.getElementById('investorModal').style.display = 'flex';
    renderInvestorList();
}

function closeInvestorManager() {
    document.getElementById('investorModal').style.display = 'none';
    renderInvestorSelect();
}

function renderInvestorList() {
    const container = document.getElementById('investorList');
    let html = '';
    roadmapData.investment.investors.forEach(inv => {
        html += `
            <div class="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-white/5">
                <input type="text" value="${inv.name}" onchange="renameInvestor(${inv.id}, this.value)" 
                    class="bg-transparent font-bold focus:outline-none focus:text-blue-400 flex-1">
                <button onclick="removeInvestor(${inv.id})" class="text-red-500 hover:text-red-400 text-sm ml-2">삭제</button>
            </div>`;
    });
    container.innerHTML = html;
}

function addInvestor() {
    const input = document.getElementById('newInvestorInput');
    const name = input.value.trim();
    if (!name) return;

    const newInv = {
        id: Date.now(),
        name: name,
        block2: { rows: ["항목 1"], cols: ["구분 1"], data: {} }
    };

    roadmapData.investment.investors.push(newInv);
    input.value = '';
    renderInvestorList();
    saveData();
}

function renameInvestor(id, newName) {
    const inv = roadmapData.investment.investors.find(i => i.id == id);
    if (inv) {
        inv.name = newName;
        saveData();
    }
}

function removeInvestor(id) {
    if (roadmapData.investment.investors.length <= 1) {
        alert('최소 한 명의 투자자는 있어야 합니다.');
        return;
    }
    if (!confirm('투자자를 삭제하시겠습니까? 관련 데이터가 모두 사라집니다.')) return;

    roadmapData.investment.investors = roadmapData.investment.investors.filter(i => i.id != id);
    if (roadmapData.investment.selectedInvestorId == id) {
        roadmapData.investment.selectedInvestorId = roadmapData.investment.investors[0].id;
    }
    renderInvestorList();
    renderTable('block2');
    saveData();
}


// Grid Copy/Paste
let gridClipboard = null;

function copyGrid(blockId) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    gridClipboard = JSON.parse(JSON.stringify(grid));
    alert('현재 테이블의 모든 설정(구조, 색상, 데이터)이 복사되었습니다.\n다른 년도나 다른 투자자를 선택한 후 [붙여넣기]를 눌러주세요.');
}

function pasteGrid(blockId) {
    if (!gridClipboard) {
        alert('복사된 그리드 데이터가 없습니다. 먼저 [복사] 버튼을 눌러주세요.');
        return;
    }
    const grid = getActiveGrid(blockId);
    if (!grid) return;

    if (!confirm('복사한 데이터를 현재 테이블에 덮어쓰시겠습니까?\n이 작업은 취소할 수 없으며 현재 데이터는 모두 삭제됩니다.')) return;

    const targetCorner = grid.corner;

    grid.rows = [...gridClipboard.rows];
    grid.cols = [...gridClipboard.cols];
    grid.data = { ...gridClipboard.data };
    grid.colWidths = gridClipboard.colWidths ? [...gridClipboard.colWidths] : [];
    grid.colColors = gridClipboard.colColors ? [...gridClipboard.colColors] : [];
    grid.rowColors = gridClipboard.rowColors ? [...gridClipboard.rowColors] : [];
    grid.headerHeight = gridClipboard.headerHeight || 0;
    grid.rowHeights = gridClipboard.rowHeights ? [...gridClipboard.rowHeights] : [];

    if (blockId === 'block2' && targetCorner) {
        grid.corner = targetCorner;
    }

    saveData();
    renderTable(blockId);
    alert('성공적으로 붙여넣기 되었습니다.');
}

window.addEventListener('load', initInvestmentPage);

