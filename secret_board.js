// investment.js 로직을 재사용하지만 시크릿 보드에 맞게 수정됨
// 다수의 재사용 가능한 테이블: assetSummary, liabilitySummary, assetDetails

let activeBlockId = null;

// 새해 기본 구조
const defaultSecretBoard = {
    pageTitle: "시크릿 보드 🚩",
    subtitle: "자산 현황 및 부채 관리 (연도별 관리)",
    // 블록 1: 자산 내역 (요약)
    assetSummary: {
        cols: [
            { id: 'cat', name: '자산 항목', width: 150, type: 'text' },
            { id: 'amount', name: '금액', width: 150, type: 'number', sum: true }, // 자동 합계
            { id: 'ratio', name: '비중', width: 80, type: 'text' }, // 사용자 입력
            { id: 'note', name: '비고', width: 200, type: 'text' }
        ],
        rows: []
    },
    // 블록 2: 부채 내역 (요약)
    liabilitySummary: {
        cols: [
            { id: 'cat', name: '부채 항목', width: 150, type: 'text' },
            { id: 'amount', name: '금액', width: 150, type: 'number', sum: true },
            { id: 'rate', name: '이자율', width: 80, type: 'text' },
            { id: 'note', name: '비고', width: 200, type: 'text' }
        ],
        rows: []
    },
    // 블록 3: 자산 상세
    assetDetails: {
        cols: [
            { id: 'date', name: '기준일', width: 100, type: 'text' },
            { id: 'cat', name: '분류', width: 100, type: 'text' },
            { id: 'name', name: '자산명', width: 150, type: 'text' },
            { id: 'amount', name: '평가금액', width: 120, type: 'number', sum: true },
            { id: 'pl', name: '손익', width: 120, type: 'number' },
            { id: 'yield', name: '수익률', width: 80, type: 'text' },
            { id: 'note', name: '비고', width: 200, type: 'text' }
        ],
        rows: []
    },
    // 블록 4: 자산 상세 2 (복사본)
    assetDetails2: {
        cols: [
            { id: 'date', name: '기준일', width: 100, type: 'text' },
            { id: 'cat', name: '분류', width: 100, type: 'text' },
            { id: 'name', name: '자산명', width: 150, type: 'text' },
            { id: 'amount', name: '평가금액', width: 120, type: 'number', sum: true },
            { id: 'pl', name: '손익', width: 120, type: 'number' },
            { id: 'yield', name: '수익률', width: 80, type: 'text' },
            { id: 'note', name: '비고', width: 200, type: 'text' }
        ],
        rows: []
    }
};

function initSecretBoard() {
    window.currentPageType = 'secret_board';
    loadData();
    checkLockStatus();
    const yearData = roadmapData.years[currentYear];
    if (!yearData.secretBoard) {
        yearData.secretBoard = JSON.parse(JSON.stringify(defaultSecretBoard));
        // Add default rows for demonstration?
        yearData.secretBoard.assetSummary.rows = [
            { id: Date.now() + '1', cells: { cat: '현금성 자산', amount: 0, ratio: '-', note: '' } },
            { id: Date.now() + '2', cells: { cat: '투자 자산', amount: 0, ratio: '-', note: '' } },
            { id: Date.now() + '3', cells: { cat: '부동산', amount: 0, ratio: '-', note: '' } }
        ];
        yearData.secretBoard.liabilitySummary.rows = [
            { id: Date.now() + '4', cells: { cat: '주택담보대출', amount: 0, rate: '-', note: '' } },
            { id: Date.now() + '5', cells: { cat: '신용대출', amount: 0, rate: '-', note: '' } }
        ];
        // Default Manual Status Summary
        yearData.secretBoard.statusSummary = {
            cols: [
                { id: 'date', name: '구분', width: 100, type: 'text' },
                { id: 'assets', name: '자산', width: 150, type: 'number' },
                { id: 'liabilities', name: '부채', width: 150, type: 'number' },
                { id: 'net_worth', name: '순자산', width: 150, type: 'number' },
                { id: 'equity_ratio', name: '자기자본비율', width: 120, type: 'text' }
            ],
            rows: [
                { id: Date.now() + '0', cells: { date: '현재', assets: 0, liabilities: 0, net_worth: 0, equity_ratio: '0%' } }
            ]
        };
        saveData();
    }
    // Ensure statusSummary exists (for migration)
    if (!yearData.secretBoard.statusSummary) {
        yearData.secretBoard.statusSummary = {
            cols: [
                { id: 'date', name: '구분', width: 100, type: 'text' },
                { id: 'assets', name: '자산', width: 150, type: 'number' },
                { id: 'liabilities', name: '부채', width: 150, type: 'number' },
                { id: 'net_worth', name: '순자산', width: 150, type: 'number' },
                { id: 'equity_ratio', name: '자기자본비율', width: 120, type: 'text' }
            ],
            rows: [
                { id: Date.now() + '0', cells: { date: '현재', assets: 0, liabilities: 0, net_worth: 0, equity_ratio: '0%' } }
            ]
        };
        saveData();
    }
    // Ensure assetDetails2 exists
    if (!yearData.secretBoard.assetDetails2) {
        yearData.secretBoard.assetDetails2 = JSON.parse(JSON.stringify(defaultSecretBoard.assetDetails2));
        saveData();
    }

    // Ensure titles exist
    if (!yearData.secretBoard.assetSummary.title) yearData.secretBoard.assetSummary.title = "💰 항목별 자산 (요약)";
    if (!yearData.secretBoard.liabilitySummary.title) yearData.secretBoard.liabilitySummary.title = "💳 항목별 부채 (요약)";
    if (!yearData.secretBoard.assetDetails.title) yearData.secretBoard.assetDetails.title = "📊 자산 상세 내역";
    if (!yearData.secretBoard.assetDetails2.title) yearData.secretBoard.assetDetails2.title = "📊 자산 상세 내역 2";
    if (!yearData.secretBoard.statusSummary.title) yearData.secretBoard.statusSummary.title = "📝 자산 현황 수동 입력";
    if (!yearData.secretBoard.pageTitle) yearData.secretBoard.pageTitle = "시크릿 보드 🚩";
    saveData();

    renderAllBlocks();
    renderTitles();
    renderSubtitle();
    renderMemos();
}

function renderTitles() {
    const sb = roadmapData.years[currentYear].secretBoard;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal('titleStatusSummary', sb.statusSummary.title || "📝 자산 현황 수동 입력");
    setVal('titleAssetSummary', sb.assetSummary.title || "💰 항목별 자산 (요약)");
    setVal('titleLiabilitySummary', sb.liabilitySummary.title || "💳 항목별 부채 (요약)");
    setVal('titleAssetDetails', sb.assetDetails.title || "📊 자산 상세 내역");
    setVal('titleAssetDetails2', sb.assetDetails2.title || "📊 자산 상세 내역 2");

    const pageTitleInput = document.getElementById('pageTitle');
    if (pageTitleInput) {
        pageTitleInput.value = sb.pageTitle || "시크릿 보드 🚩";
        pageTitleInput.classList.remove('opacity-0');
    }
}

function updatePageTitle(val) {
    const sb = roadmapData.years[currentYear].secretBoard;
    sb.pageTitle = val;
    saveData();
}


function updateBlockTitle(blockId, val) {
    const sb = roadmapData.years[currentYear].secretBoard;
    if (sb[blockId]) {
        sb[blockId].title = val;
        saveData();
    }
}

function renderSubtitle() {
    const sb = roadmapData.years[currentYear].secretBoard;
    const input = document.getElementById('pageSubtitle');
    if (input) input.value = sb.subtitle || "자산 현황 및 부채 관리 (연도별 관리)";
}

function updateSubtitle(val) {
    const sb = roadmapData.years[currentYear].secretBoard;
    sb.subtitle = val;
    saveData();
}

function renderAllBlocks() {
    renderBlock('statusSummary', 'tableStatusSummary');
    renderBlock('assetSummary', 'tableAssetSummary');
    renderBlock('liabilitySummary', 'tableLiabilitySummary');
    renderBlock('assetDetails', 'tableAssetDetails');
    renderBlock('assetDetails2', 'tableAssetDetails2');
    updateSummaryCards();
}



function updateSummaryCards() {
    const sb = roadmapData.years[currentYear].secretBoard;

    // Default values
    let totalAssets = 0;
    let totalLiabilities = 0;
    let netWorth = 0;

    const statusData = sb.statusSummary;
    if (statusData && statusData.rows.length > 0) {
        // Find selected status row or default to the last one (most recent)
        // Or default to the FIRST one if that's preferred? user said "selected row".
        // If nothing selected, maybe last added is best?
        // Let's look for explicitly selected ID first.
        let targetRow = null;
        if (sb.selectedStatusRowId) {
            targetRow = statusData.rows.find(r => r.id === sb.selectedStatusRowId);
        }
        if (!targetRow) {
            targetRow = statusData.rows[statusData.rows.length - 1];
        }

        if (targetRow) {
            totalAssets = parseInt(String(targetRow.cells.assets || 0).replace(/,/g, '')) || 0;
            totalLiabilities = parseInt(String(targetRow.cells.liabilities || 0).replace(/,/g, '')) || 0;
            netWorth = parseInt(String(targetRow.cells.net_worth || 0).replace(/,/g, '')) || 0;
        }
    }

    document.getElementById('totalAssetsDisplay').innerText = new Intl.NumberFormat('ko-KR').format(totalAssets) + '원';
    document.getElementById('totalLiabilitiesDisplay').innerText = new Intl.NumberFormat('ko-KR').format(totalLiabilities) + '원';
    document.getElementById('netWorthDisplay').innerText = new Intl.NumberFormat('ko-KR').format(netWorth) + '원';

    // Color logic
    document.getElementById('netWorthDisplay').className = `text-3xl font-bold mt-2 ${netWorth >= 0 ? 'text-green-400' : 'text-red-400'}`;
}


// --- Generic Block Rendering (Reused from investment.js logic mostly) ---

function renderBlock(blockId, tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const sb = roadmapData.years[currentYear].secretBoard;
    const data = sb[blockId];
    if (!data) return;

    let html = '';

    // Header
    html += '<thead><tr class="bg-gray-800/50 text-gray-400">';
    html += `<th class="w-10 text-center border border-white/10">#</th>`;
    data.cols.forEach((col, idx) => {
        const wStyle = `width:${col.width}px; min-width:${col.width}px`;
        html += `<th class="border border-white/10 px-2 py-3 text-center relative group" style="${wStyle}">
            <input type="text" class="header-input w-full bg-transparent text-center font-bold text-gray-300 focus:text-white transition"
                   value="${col.name}" onchange="updateColName('${blockId}', ${idx}, this.value)">
            <div class="resizer-v" onmousedown="initResizing(event, '${blockId}', 'col', ${idx})"></div>
        </th>`;
    });
    html += `<th class="w-10 border border-white/10"></th>`; // Delete Col
    html += '</tr></thead>';

    // Pre-calculate sums
    let totalSum = {};
    data.rows.forEach(row => {
        data.cols.forEach(col => {
            if ((col.sum || col.name.includes('금액')) && (col.type === 'number' || col.name.includes('금액'))) {
                const val = row.cells[col.id];
                const num = parseInt(String(val || 0).replace(/,/g, '')) || 0;
                totalSum[col.id] = (totalSum[col.id] || 0) + num;
            }
        });
    });

    // --- Auto-Calculation Logic ---
    if (blockId === 'statusSummary') {
        data.rows.forEach(row => {
            const assets = parseInt(String(row.cells.assets || 0).replace(/,/g, '')) || 0;
            const liabilities = parseInt(String(row.cells.liabilities || 0).replace(/,/g, '')) || 0;
            const netWorth = assets - liabilities;
            row.cells.net_worth = netWorth;
            const ratio = assets ? ((netWorth / assets) * 100).toFixed(1) + '%' : '0%';
            row.cells.equity_ratio = ratio;
        });
    } else if (['assetSummary', 'liabilitySummary', 'assetDetails', 'assetDetails2'].includes(blockId)) {
        // Iterate all columns to find Ratio columns and pair them with Amount columns
        const ratioCols = data.cols.filter(c => c.name.includes('비중') || ['ratio', 'rate'].includes(c.id));
        const defaultAmountCol = data.cols.find(c => c.name.includes('금액')) || data.cols.find(c => c.id === 'amount') || data.cols.find(c => c.type === 'number' && c.sum);

        if (ratioCols.length > 0) {
            data.rows.forEach(row => {
                ratioCols.forEach(rCol => {
                    let targetAmountCol = defaultAmountCol;
                    if (rCol.name.includes('비중')) {
                        const targetName = rCol.name.replace('비중', '금액');
                        const match = data.cols.find(c => c.name === targetName);
                        if (match) targetAmountCol = match;
                    }

                    if (targetAmountCol) {
                        const total = totalSum[targetAmountCol.id] || 0;
                        const val = parseInt(String(row.cells[targetAmountCol.id] || 0).replace(/,/g, '')) || 0;
                        const pct = total ? ((val / total) * 100).toFixed(1) + '%' : '0%';
                        row.cells[rCol.id] = pct;
                    }
                });
            });
        }
    }

    // Total Row (Top of body)
    html += '<tbody>';

    const hasSum = data.cols.some(c => c.sum || c.name.includes('금액'));
    // Show sum row for specific blocks regardless of hasSum (to ensure layout consistency), but strictly exclude statusSummary
    if (hasSum || (['assetSummary', 'liabilitySummary', 'assetDetails', 'assetDetails2'].includes(blockId) && data.rows.length > 0)) {
        html += `<tr class="bg-gray-800/30 font-bold text-blue-300" style="height: 40px;">`;
        html += `<td class="border border-white/10 p-0"><div class="w-full h-full flex items-center justify-center">∑</div></td>`;
        data.cols.forEach(col => {
            const wStyle = `width:${col.width}px; min-width:${col.width}px`;
            if (col.sum || col.name.includes('금액')) {
                const s = totalSum[col.id] || 0;
                // Wrap in div to handle padding/alignment despite table cell padding:0 rules
                html += `<td class="border border-white/10 p-0" style="${wStyle}">
                    <div class="w-full h-full flex items-center justify-center px-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        ${s.toLocaleString()}
                    </div>
                </td>`;
            } else {
                html += `<td class="border border-white/10" style="${wStyle}"></td>`;
            }
        });
        html += `<td class="border border-white/10"></td></tr>`;
    }

    // Body Rows
    data.rows.forEach((row, rIdx) => {
        const hStyle = row.height ? `height:${row.height}px` : '';
        // Add selection highlight logic for statusSummary
        const isSelected = (blockId === 'statusSummary' && (row.id === (roadmapData.years[currentYear].secretBoard.selectedStatusRowId || data.rows[0]?.id)));
        const selectClass = isSelected ? 'bg-blue-900/40' : (blockId === 'statusSummary' ? 'hover:bg-white/5 cursor-pointer' : 'hover:bg-white/5');

        html += `<tr data-row-id="${row.id}" class="${selectClass} transition" style="${hStyle}" onclick="selectStatusRow('${blockId}', '${row.id}')">`;


        // Row Header (Index or Name?)
        html += `<td class="text-center text-xs text-gray-500 border border-white/10 relative">
             ${rIdx + 1}
             <div class="resizer-h" onmousedown="initResizing(event, '${blockId}', 'row', ${rIdx})"></div>
         </td>`;

        data.cols.forEach((col, cIdx) => {
            const val = row.cells[col.id] === undefined ? '' : row.cells[col.id];
            // Force center alignment
            const inputClass = "table-input w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden text-center";

            // For display
            let displayVal = val;
            if (col.type === 'number' && val !== '' && !isNaN(parseInt(String(val).replace(/,/g, '')))) {
                displayVal = parseInt(String(val).replace(/,/g, '')).toLocaleString();
            }

            html += `<td class="border border-white/10 px-1 relative">
                 <textarea class="${inputClass}" onchange="updateCell('${blockId}', ${rIdx}, '${col.id}', this.value)" rows="1" style="height:100%">${displayVal}</textarea>
             </td>`;
        });

        // Delete Row Btn
        html += `<td class="text-center border border-white/10">
             <button onclick="deleteRow('${blockId}', ${rIdx})" class="text-gray-600 hover:text-red-400 font-bold">×</button>
         </td>`;
        html += '</tr>';
    });

    html += '</tbody>';
    table.innerHTML = html;
}

// --- Data Management ---

function updateCell(blockId, rIdx, colId, val) {
    const sb = roadmapData.years[currentYear].secretBoard;
    const col = sb[blockId].cols.find(c => c.id === colId);
    let value = val;
    if (col.type === 'number') {
        value = parseInt(val.replace(/,/g, '')) || 0;
    }
    sb[blockId].rows[rIdx].cells[colId] = value;
    saveData();
    // Re-render blocks to update sums and Summary Cards
    renderAllBlocks();
}

function addRow(blockId) {
    const sb = roadmapData.years[currentYear].secretBoard;
    sb[blockId].rows.push({
        id: Date.now().toString(),
        cells: {}
    });
    saveData();
    renderAllBlocks();
}

// --- Modal Logic ---
let pendingModalAction = null;

function deleteRow(blockId, rIdx) {
    pendingModalAction = () => {
        const sb = roadmapData.years[currentYear].secretBoard;
        sb[blockId].rows.splice(rIdx, 1);
        saveData();
        renderAllBlocks();
        // Also update structure list if open?
        renderStructureLists(); // Safe to call if not open check handles inside
    };
    openConfirmModal("행을 삭제하시겠습니까?");
}

function addColumn(blockId) {
    pendingModalAction = (name, isNumber) => {
        if (!name) return;
        const type = isNumber ? 'number' : 'text';
        const sb = roadmapData.years[currentYear].secretBoard;
        const newId = 'col_' + Date.now();
        sb[blockId].cols.push({
            id: newId,
            name: name,
            width: 120,
            type: type,
            sum: (type === 'number')
        });
        saveData();
        renderAllBlocks();
    };
    openInputModal("새 열 추가");
}


// --- Modal UI Functions ---

function openInputModal(title) {
    const modal = document.getElementById('inputModal');
    if (!modal) return;
    document.getElementById('inputModalTitle').innerText = title;
    document.getElementById('inputModalValue').value = '';
    document.getElementById('inputModalCheck').checked = false;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.getElementById('inputModalValue').focus();
}

function closeInputModal() {
    const modal = document.getElementById('inputModal');
    if (modal) modal.style.display = 'none';
    pendingModalAction = null;
}

function confirmInputModal() {
    const val = document.getElementById('inputModalValue').value;
    const checked = document.getElementById('inputModalCheck').checked;
    if (pendingModalAction) pendingModalAction(val, checked);
    closeInputModal();
}

function openConfirmModal(msg) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    document.getElementById('confirmModalMessage').innerText = msg;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'none';
    pendingModalAction = null;
}

function executeConfirmModal() {
    if (pendingModalAction) pendingModalAction();
    closeConfirmModal();
}

function selectStatusRow(blockId, rowId) {
    if (blockId !== 'statusSummary') return;
    const sb = roadmapData.years[currentYear].secretBoard;

    if (sb.selectedStatusRowId === rowId) return;

    sb.selectedStatusRowId = rowId;
    saveData();

    // Update DOM directly to preserve focus and avoid full re-render
    const table = document.getElementById('tableStatusSummary');
    if (table) {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(tr => {
            if (tr.dataset.rowId === rowId) {
                tr.className = 'bg-blue-900/40 transition';
            } else {
                tr.className = 'hover:bg-white/5 cursor-pointer transition';
            }
        });
    }
    updateSummaryCards();
}



function updateColName(blockId, cIdx, val) {
    const sb = roadmapData.years[currentYear].secretBoard;
    sb[blockId].cols[cIdx].name = val;
    saveData();
}

function updateDateRow(blockId, colId, val) {
    const sb = roadmapData.years[currentYear].secretBoard;
    if (!sb[blockId].dateRow) sb[blockId].dateRow = {};
    sb[blockId].dateRow[colId] = val;
    saveData();
}

// --- Structure Manager (Similar to Investment) ---
let activeStructBlock = null;

function openStructureManager(blockId) {
    activeStructBlock = blockId;
    const modal = document.getElementById('structureModal');
    if (!modal) return;

    renderStructureLists();
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function closeStructureManager() {
    const modal = document.getElementById('structureModal');
    if (modal) modal.style.display = 'none';
    renderAllBlocks(); // Refresh view
}

function renderStructureLists() {
    if (!activeStructBlock) return;
    const sb = roadmapData.years[currentYear].secretBoard;
    const data = sb[activeStructBlock];

    // Col List
    const colList = document.getElementById('colManagerList');
    colList.innerHTML = '';
    data.cols.forEach((col, idx) => {
        colList.innerHTML += `
        <div class="flex items-center bg-gray-700 p-2 rounded gap-2 text-xs"
             draggable="true" 
             ondragstart="handleDragStart(event, 'col', ${idx})"
             ondragover="handleDragOver(event)"
             ondrop="handleDrop(event, 'col', ${idx})">
            <span class="text-gray-400 font-bold w-4">${idx + 1}</span>
            <input type="text" class="flex-1 bg-gray-800 border border-gray-600 rounded px-1 text-white" value="${col.name}" onchange="updateStructCol(${idx}, 'name', this.value)">
            <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" ${col.sum ? 'checked' : ''} onchange="updateStructCol(${idx}, 'sum', this.checked)">
                <span class="text-[10px] text-blue-300">합계</span>
            </label>
             <button onclick="deleteStructCol(${idx})" class="text-red-400 hover:text-red-300">×</button>
        </div>`;
    });

    // Row List
    const rowList = document.getElementById('rowManagerList');
    rowList.innerHTML = '';
    data.rows.forEach((row, idx) => {
        rowList.innerHTML += `
        <div class="flex items-center bg-gray-700 p-2 rounded gap-2 text-xs"
            draggable="true" 
            ondragstart="handleDragStart(event, 'row', ${idx})"
            ondragover="handleDragOver(event)"
            ondrop="handleDrop(event, 'row', ${idx})">
            <span class="text-gray-400 font-bold w-6 text-center">${idx + 1}</span>
            <div class="flex-1 text-gray-500 truncate">${idx + 1}행</div>
             <button onclick="deleteRow('${activeStructBlock}', ${idx}); renderStructureLists();" class="text-red-400 hover:text-red-300">×</button>
        </div>`;
    });
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
    e.target.style.opacity = '1'; // Reset opacity
    if (dragSourceType !== type || dragSourceIdx === targetIdx) return;

    // Perform reorder
    const sb = roadmapData.years[currentYear].secretBoard;
    const list = type === 'col' ? sb[activeStructBlock].cols : sb[activeStructBlock].rows;

    // Remove from old index, insert at new index
    const [movedItem] = list.splice(dragSourceIdx, 1);
    list.splice(targetIdx, 0, movedItem);

    saveData();
    renderStructureLists();
}

function updateStructCol(idx, key, val) {
    const sb = roadmapData.years[currentYear].secretBoard;
    sb[activeStructBlock].cols[idx][key] = val;
    saveData();
}

function moveStructCol(idx, dir) {
    const sb = roadmapData.years[currentYear].secretBoard;
    const cols = sb[activeStructBlock].cols;
    if (dir === -1 && idx > 0) {
        [cols[idx], cols[idx - 1]] = [cols[idx - 1], cols[idx]];
    } else if (dir === 1 && idx < cols.length - 1) {
        [cols[idx], cols[idx + 1]] = [cols[idx + 1], cols[idx]];
    }
    saveData();
    renderStructureLists();
}

function deleteStructCol(idx) {
    if (!confirm('열을 삭제하시겠습니까? 데이터가 손실됩니다.')) return;
    const sb = roadmapData.years[currentYear].secretBoard;
    sb[activeStructBlock].cols.splice(idx, 1);
    saveData();
    renderStructureLists();
}

function moveStructRow(idx, dir) {
    const sb = roadmapData.years[currentYear].secretBoard;
    const rows = sb[activeStructBlock].rows;
    if (dir === -1 && idx > 0) {
        [rows[idx], rows[idx - 1]] = [rows[idx - 1], rows[idx]];
    } else if (dir === 1 && idx < rows.length - 1) {
        [rows[idx], rows[idx + 1]] = [rows[idx + 1], rows[idx]];
    }
    saveData();
    renderStructureLists();
}

// Resizing (Reused pattern)
// Resizing (Optimized Pattern)
function initResizing(e, blockId, type, idx) {
    e.preventDefault(); e.stopPropagation();
    const sb = roadmapData.years[currentYear].secretBoard;
    const tableId = (blockId === 'assetSummary' ? 'tableAssetSummary' : (blockId === 'liabilitySummary' ? 'tableLiabilitySummary' : (blockId === 'statusSummary' ? 'tableStatusSummary' : 'tableAssetDetails')));
    const table = document.getElementById(tableId);

    let targetElement;
    let startDim = 0;
    const startPos = type === 'col' ? e.pageX : e.pageY;

    if (type === 'col') {
        const ths = table.querySelectorAll('thead th');
        // idx passed is index in data.cols. The table has '#' column at index 0.
        // So target is idx + 1.
        targetElement = ths[idx + 1];
        startDim = targetElement ? targetElement.offsetWidth : 100;
    } else {
        const trs = table.querySelectorAll('tbody tr');
        // There might be a total row at the bottom, but idx is row index, so it matches.
        targetElement = trs[idx];
        startDim = targetElement ? targetElement.offsetHeight : 40;
    }

    if (!targetElement) return;

    // Temporarily disable textarea interaction for smooth dragging
    const textareas = table.querySelectorAll('textarea');
    textareas.forEach(ta => ta.style.pointerEvents = 'none');

    const onMouseMove = (moveE) => {
        const diff = (type === 'col' ? moveE.pageX : moveE.pageY) - startPos;
        const newDim = Math.max(30, startDim + diff);

        if (type === 'col') {
            targetElement.style.width = newDim + 'px';
            targetElement.style.minWidth = newDim + 'px';
            sb[blockId].cols[idx].width = newDim;
        } else {
            targetElement.style.height = newDim + 'px';
            sb[blockId].rows[idx].height = newDim;
        }
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        textareas.forEach(ta => ta.style.pointerEvents = '');
        saveData();
        // Optional: Re-render to ensure precise alignment if needed, but usually redundant if style set.
        // However, restoring 'textarea' pointer events is key.
        // renderBlock(blockId, tableId); 
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}


function changeYear(offset) {
    currentYear += offset;
    document.getElementById('sheetYearDisplay').innerText = currentYear;
    // Switch to new year data without reload
    initSecretBoard();
}

// --- Lock Screen Logic ---

function checkLockStatus() {
    const lockScreen = document.getElementById('lockScreen');
    const msg = document.getElementById('lockMessage');
    const passInput = document.getElementById('lockPasswordInput');

    if (!lockScreen) return;

    // Initialize Default Password '0705' if not set
    if (!localStorage.getItem('secret_board_pw')) {
        localStorage.setItem('secret_board_pw', '0705');
    }

    // Check Session (is unlocked?)
    const unlocked = sessionStorage.getItem('secret_board_unlocked');
    if (unlocked === 'true') {
        lockScreen.classList.add('hidden');
    } else {
        // lockScreen.classList.remove('hidden'); // Default is visible now
        // Always show login prompt since default exists
        msg.innerText = "접근하려면 비밀번호를 입력하세요.";
        msg.classList.remove('text-blue-400');
        msg.classList.add('text-gray-400');
        passInput.placeholder = "비밀번호 입력";
        passInput.value = '';
        passInput.focus();
    }
}

function checkLockPassword() {
    const input = document.getElementById('lockPasswordInput');
    const val = input.value;
    if (!val) return;

    const savedPw = localStorage.getItem('secret_board_pw');

    // Mode: Login
    if (val === savedPw) {
        sessionStorage.setItem('secret_board_unlocked', 'true');
        document.getElementById('lockScreen').classList.add('hidden');
    } else {
        alert('비밀번호가 일치하지 않습니다.');
        input.value = '';
        input.focus();
    }
}

function updateUI() {
    renderTitles();
    renderSubtitle();
    renderMemos();
    renderAllBlocks();
}
window.updateUI = updateUI;

// Call checkLockStatus immediately to prevent flash
document.addEventListener('DOMContentLoaded', checkLockStatus);
window.addEventListener('load', initSecretBoard);
