const formatMoneyFull = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
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
            selectedInvestorId: 1
        };
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
}

function changeInvestor(id) {
    roadmapData.investment.selectedInvestorId = id;
    renderTable('block2');
    saveData();
}

function getActiveGrid(blockId) {
    if (blockId === 'block1') return roadmapData.investment.block1;

    const inv = roadmapData.investment.investors.find(i => i.id == roadmapData.investment.selectedInvestorId);
    return inv ? inv.block2 : null;
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

            if (sumRows[rIdx] || sumCols[cIdx]) {
                isReadOnly = true;
                let sum = 0;
                let hasValidNum = false;

                const checkAndAdd = (v) => {
                    const raw = String(v || '').replace(/,/g, '').trim();
                    if (raw !== '' && !isNaN(parseFloat(raw))) {
                        sum += parseFloat(raw);
                        hasValidNum = true;
                    }
                };

                if (sumRows[rIdx] && !sumCols[cIdx]) {
                    grid.rows.forEach((_, ri) => {
                        const rowStatus = statusIdx > -1 ? grid.data[`${ri}-${statusIdx}`] : '';
                        if (!sumRows[ri] && rowStatus !== '완료') checkAndAdd(grid.data[`${ri}-${cIdx}`]);
                    });
                } else if (!sumRows[rIdx] && sumCols[cIdx]) {
                    if (isCompleted) {
                        // Exclude completed row from its own total? 
                        // User said "exclude from sum", usually means vertical totals, 
                        // but let's also hide row total if it's completed for consistency.
                        hasValidNum = false;
                    } else {
                        grid.cols.forEach((_, ci) => { if (!sumCols[ci]) checkAndAdd(grid.data[`${rIdx}-${ci}`]); });
                    }
                } else if (sumRows[rIdx] && sumCols[cIdx]) {
                    grid.rows.forEach((_, ri) => {
                        const rowStatus = statusIdx > -1 ? grid.data[`${ri}-${statusIdx}`] : '';
                        if (!sumRows[ri] && rowStatus !== '완료') {
                            grid.cols.forEach((_, ci) => { if (!sumCols[ci]) checkAndAdd(grid.data[`${ri}-${ci}`]); });
                        }
                    });
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
                            ${isReadOnly ? 'readonly' : `onchange="updateCell('${blockId}', ${rIdx}, ${cIdx}, this.value)"`}
                            onfocus="${isReadOnly ? 'this.blur()' : 'this.select()'}">${val}</textarea>
                    </div>
                </td>`;
            }
        });
        html += `</tr>`;
    });
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
    const pureDigits = raw.replace(/[^0-9]/g, '');
    if (raw === pureDigits) {
        if (pureDigits.length === 8) {
            // YYYYMMDD -> YYYY.MM.DD
            return `${pureDigits.substring(0, 4)}.${pureDigits.substring(4, 6)}.${pureDigits.substring(6, 8)}`;
        } else if (pureDigits.length === 6) {
            // YYMMDD -> YY.MM.DD
            return `${pureDigits.substring(0, 2)}.${pureDigits.substring(2, 4)}.${pureDigits.substring(4, 6)}`;
        }
    }

    // 2. Number Check (If it's a numeric string, format with commas)
    // We check if it's a valid number after removing commas
    const numRaw = raw.replace(/,/g, '');
    if (!isNaN(numRaw) && numRaw !== '' && !raw.includes('.')) {
        // Integer Check
        return Number(numRaw).toLocaleString();
    } else if (!isNaN(numRaw) && numRaw !== '') {
        // Float Check
        const parts = numRaw.split('.');
        parts[0] = Number(parts[0]).toLocaleString();
        return parts.join('.');
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

window.addEventListener('load', initInvestmentPage);
