const formatMoneyFull = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
};

function initManagementPage() {
    loadData();
    if (!roadmapData.management) {
        roadmapData.management = {
            block1: {
                title: "정보 관리 리스트",
                rows: ["계좌 1", "카드 1"],
                cols: ["구분", "번호/내용", "메모"],
                data: {}
            },
            subtitle: "계좌번호, 카드번호 등 주요 정보를 안전하게 기록하세요."
        };
    }
    renderAll();
}

function renderAll() {
    window.currentPageType = 'management';
    renderTitles();
    renderTable('block1');
    renderMemos();
}

function renderTitles() {
    const t1 = document.getElementById('titleBlock1');
    const sub = document.getElementById('pageSubtitle');
    if (t1) t1.value = roadmapData.management.block1.title || "정보 관리 리스트";
    if (sub) sub.value = roadmapData.management.subtitle || "계좌번호, 카드번호 등 주요 정보를 안전하게 기록하세요.";
}

function updateSubtitle(value) {
    roadmapData.management.subtitle = value;
    saveData();
}

function updateBlockTitle(blockId, value) {
    roadmapData.management.block1.title = value;
    saveData();
}

function getActiveGrid(blockId) {
    return roadmapData.management.block1;
}

function renderTable(blockId) {
    const table = document.getElementById('tableBlock1');
    const grid = getActiveGrid(blockId);
    if (!grid) return;

    if (!grid.rowColors) grid.rowColors = [];
    if (!grid.colColors) grid.colColors = [];

    const sumRows = grid.rows.map(r => r.includes('합계'));
    const sumCols = grid.cols.map(c => c.includes('합계'));

    const colWidths = grid.colWidths || [];
    const rowHeights = grid.rowHeights || [];
    const hHeight = grid.headerHeight || 0;

    const isAllSelected = grid.allSelected || false;

    let html = `<thead><tr class="bg-gray-900/50" ${hHeight ? `style="height: ${hHeight}px"` : ''}>`;
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
        const wVal = colWidths[cIdx + 1] || 150;
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
        html += `
            <td class="p-0 bg-gray-900/30 border border-white/10 group relative ${isSumRow ? 'bg-blue-500/10' : ''}" 
                onclick="this.querySelector('textarea')?.focus()">
                <div class="cell-wrapper">
                    <textarea class="row-header-input ${isSumRow ? 'font-bold text-blue-400' : ''}" rows="1" onchange="updateHeader('${blockId}', 'row', ${rIdx}, this.value)">${row}</textarea>
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
                    grid.rows.forEach((_, ri) => { if (!sumRows[ri]) checkAndAdd(grid.data[`${ri}-${cIdx}`]); });
                } else if (!sumRows[rIdx] && sumCols[cIdx]) {
                    grid.cols.forEach((_, ci) => { if (!sumCols[ci]) checkAndAdd(grid.data[`${rIdx}-${ci}`]); });
                } else if (sumRows[rIdx] && sumCols[cIdx]) {
                    grid.rows.forEach((_, ri) => {
                        if (!sumRows[ri]) {
                            grid.cols.forEach((_, ci) => { if (!sumCols[ci]) checkAndAdd(grid.data[`${ri}-${ci}`]); });
                        }
                    });
                }
                val = hasValidNum ? formatMoneyFull(sum) : "-";
            }

            html += `
                <td class="p-0 border border-white/10 ${isReadOnly ? 'bg-blue-500/10' : ''}" 
                    style="background-color: ${finalBgString}22" onclick="this.querySelector('textarea')?.focus()">
                    <div class="cell-wrapper">
                        <textarea class="table-input ${isReadOnly ? 'font-bold text-blue-400' : ''}" rows="1" 
                            ${isReadOnly ? 'readonly' : `onchange="updateCell('${blockId}', ${rIdx}, ${cIdx}, this.value)"`}
                            onfocus="${isReadOnly ? 'this.blur()' : 'this.select()'}">${val}</textarea>
                    </div>
                </td>`;
        });
        html += `</tr>`;
    });
    html += `</tbody>`;

    table.innerHTML = html;
    table.querySelectorAll('textarea').forEach(autoResize);
}

function initResizing(e, blockId, type, idx) {
    e.preventDefault();
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    const startPos = type === 'col' ? e.pageX : e.pageY;
    const table = document.getElementById('tableBlock1');
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
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        textareas.forEach(ta => ta.style.pointerEvents = 'auto');
        saveData();
        renderTable(blockId);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function autoFormatValue(value) {
    const raw = String(value || '').replace(/,/g, '').trim();
    if (raw === '') return '';
    if (!isNaN(parseFloat(raw)) && isFinite(raw)) {
        return parseFloat(raw).toLocaleString();
    }
    return value;
}

function updateCell(blockId, rIdx, cIdx, value) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    const formatted = autoFormatValue(value);
    grid.data[`${rIdx}-${cIdx}`] = formatted;
    saveData();
    renderTable(blockId);
}

function updateHeader(blockId, type, idx, value) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    if (type === 'row') grid.rows[idx] = value;
    else grid.cols[idx] = value;
    saveData();
    renderTable(blockId);
}

function addRow(blockId) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    grid.rows.push(`새 항목 ${grid.rows.length + 1}`);

    // Maintain default height if others are set
    if (grid.rowHeights && grid.rowHeights.length > 0) {
        grid.rowHeights.push(35);
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
    grid.cols.push(`새 열 ${grid.cols.length + 1}`);

    // Maintain default width if others are set
    if (grid.colWidths && grid.colWidths.length > 0) {
        grid.colWidths.push(120);
    }

    renderTable(blockId);
    saveData();
}

function removeHeader(blockId, type, idx) {
    if (!confirm('정말 삭제하시겠습니까? 데이터가 소실될 수 있습니다.')) return;
    const grid = getActiveGrid(blockId);
    if (!grid) return;
    const oldData = { ...grid.data };
    if (type === 'row') grid.rows.splice(idx, 1);
    else grid.cols.splice(idx, 1);
    grid.data = {};
    grid.rows.forEach((r, rIdx) => {
        grid.cols.forEach((c, cIdx) => {
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

    let rowHtml = '';
    grid.rows.forEach((row, idx) => {
        rowHtml += `
            <div class="flex items-center gap-2 bg-gray-800 p-2 rounded border border-white/5 cursor-grab active:cursor-grabbing hover:bg-gray-700/50 transition" 
                draggable="true" 
                ondragstart="handleDragStart(event, 'row', ${idx})"
                ondragover="handleDragOver(event)"
                ondrop="handleDrop(event, 'row', ${idx})">
                <span class="text-xs text-gray-500 w-4 select-none">⠿</span>
                <input type="text" class="flex-1 bg-transparent text-xs text-white focus:outline-none pointer-events-auto" value="${row}" onchange="updateHeader('${currentManagingBlock}', 'row', ${idx}, this.value)">
                <input type="color" value="${grid.rowColors[idx] || '#00000000'}" onchange="gridColorChange('${currentManagingBlock}', 'row', ${idx}, this.value)" class="w-6 h-6 rounded bg-transparent border-none cursor-pointer">
                <button onclick="removeHeader('${currentManagingBlock}', 'row', ${idx}); renderStructureList();" class="text-gray-500 hover:text-red-400 p-1">✕</button>
            </div>`;
    });
    document.getElementById('rowManagerList').innerHTML = rowHtml || '<p class="text-gray-500 text-xs text-center p-4">행이 없습니다.</p>';

    let colHtml = '';
    grid.cols.forEach((col, idx) => {
        colHtml += `
            <div class="flex items-center gap-2 bg-gray-800 p-2 rounded border border-white/5 cursor-grab active:cursor-grabbing hover:bg-gray-700/50 transition" 
                draggable="true" 
                ondragstart="handleDragStart(event, 'col', ${idx})"
                ondragover="handleDragOver(event)"
                ondrop="handleDrop(event, 'col', ${idx})">
                <span class="text-xs text-gray-500 w-4 select-none">⠿</span>
                <input type="text" class="flex-1 bg-transparent text-xs text-white focus:outline-none pointer-events-auto" value="${col}" onchange="updateHeader('${currentManagingBlock}', 'col', ${idx}, this.value)">
                <input type="color" value="${grid.colColors[idx] || '#00000000'}" onchange="gridColorChange('${currentManagingBlock}', 'col', ${idx}, this.value)" class="w-6 h-6 rounded bg-transparent border-none cursor-pointer">
                <button onclick="removeHeader('${currentManagingBlock}', 'col', ${idx}); renderStructureList();" class="text-gray-500 hover:text-red-400 p-1">✕</button>
            </div>`;
    });
    document.getElementById('colManagerList').innerHTML = colHtml || '<p class="text-gray-500 text-xs text-center p-4">열이 없습니다.</p>';
}

function handleDragStart(e, type, idx) {
    e.dataTransfer.setData('type', type);
    e.dataTransfer.setData('idx', idx);
    e.currentTarget.style.opacity = '0.4';
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e, type, toIdx) {
    e.preventDefault();
    const fromType = e.dataTransfer.getData('type');
    const fromIdx = parseInt(e.dataTransfer.getData('idx'));

    if (type === fromType && fromIdx !== toIdx) {
        moveHeader(currentManagingBlock, type, fromIdx, toIdx);
    }
    renderStructureList();
}

function moveHeader(blockId, type, fromIdx, toIdx) {
    const grid = getActiveGrid(blockId);
    if (!grid) return;

    const list = type === 'row' ? grid.rows : grid.cols;
    const colorList = type === 'row' ? grid.rowColors : grid.colColors;

    // Reorder lists
    const [movedItem] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, movedItem);

    if (colorList && colorList.length > 0) {
        const [movedColor] = colorList.splice(fromIdx, 1);
        colorList.splice(toIdx, 0, movedColor);
    }

    // Remap dimensions
    const dims = type === 'row' ? grid.rowHeights : grid.colWidths;
    const offset = type === 'row' ? 0 : 1;
    if (dims && dims.length > 0) {
        const actualFrom = fromIdx + offset;
        const actualTo = toIdx + offset;
        if (actualFrom < dims.length) {
            const [movedDim] = dims.splice(actualFrom, 1);
            dims.splice(actualTo, 0, movedDim);
        }
    }

    // Remap Data
    const oldData = { ...grid.data };
    grid.data = {};

    // Create mapping to update keys
    grid.rows.forEach((_, rIdx) => {
        grid.cols.forEach((_, cIdx) => {
            let oldR = rIdx;
            let oldC = cIdx;

            if (type === 'row') {
                if (rIdx === toIdx) oldR = fromIdx;
                else if (fromIdx < toIdx && rIdx >= fromIdx && rIdx < toIdx) oldR = rIdx + 1;
                else if (fromIdx > toIdx && rIdx > toIdx && rIdx <= fromIdx) oldR = rIdx - 1;
            } else {
                if (cIdx === toIdx) oldC = fromIdx;
                else if (fromIdx < toIdx && cIdx >= fromIdx && cIdx < toIdx) oldC = cIdx + 1;
                else if (fromIdx > toIdx && cIdx > toIdx && cIdx <= fromIdx) oldC = cIdx - 1;
            }

            const val = oldData[`${oldR}-${oldC}`];
            if (val !== undefined) grid.data[`${rIdx}-${cIdx}`] = val;
        });
    });

    saveData();
    renderAll();
}

function gridColorChange(blockId, type, idx, value) {
    const grid = getActiveGrid(blockId);
    if (type === 'row') grid.rowColors[idx] = value;
    else grid.colColors[idx] = value;
    saveData();
    renderTable(blockId);
}

window.addEventListener('load', initManagementPage);
