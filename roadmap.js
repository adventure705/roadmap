const formatMoneyFull = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
};

function updateUI() {
    window.currentPageType = 'roadmap';
    // Displays
    const yearDisplay = document.getElementById('sheetYearDisplay');
    if (yearDisplay) yearDisplay.innerText = currentYear;

    renderSheetTable();
    renderMemos();
}

function updateValue(category, monthIndex, value, isSettlement = false) {
    const yearData = roadmapData.years[currentYear];
    const strVal = String(value).replace(/,/g, '');
    const numValue = parseInt(strVal) || 0;

    if (isSettlement) {
        yearData.settlement[category][monthIndex] = numValue;
    } else {
        yearData[category][monthIndex] = numValue;
    }

    saveData();
    renderSheetTable();
}

function renderSheetTable() {
    const thead = document.getElementById('sheetHeaderRow');
    const tbody = document.getElementById('sheetBody');
    const yearData = roadmapData.years[currentYear];

    let headerHTML = '<th class="px-4 py-3 bg-gray-800 text-center min-w-[150px]">항목 (Category)</th>';
    roadmapData.months.forEach(m => headerHTML += `<th class="px-4 py-3 text-center min-w-[100px]">${m}</th>`); // Reduced min-width slightly
    headerHTML += '<th class="px-4 py-3 font-bold text-blue-400 text-right min-w-[100px] bg-gray-900 border-l border-white/10">합계 (Total)</th>';
    headerHTML += '<th class="px-4 py-3 font-bold text-green-400 text-right min-w-[100px] bg-gray-900 border-l border-white/10">평균</th>';
    headerHTML += '<th class="px-4 py-3 font-bold text-yellow-400 text-right min-w-[80px] sticky right-0 bg-gray-900 border-l border-white/10">달성률</th>';
    thead.innerHTML = headerHTML;

    const sum = (arr) => arr.reduce((a, b) => a + b, 0);
    const calcNet = (vArr, fArr, eArr) => vArr.map((v, i) => (v + fArr[i]) - eArr[i]);

    const budgetNet = calcNet(yearData.variableIncome, yearData.fixedIncome, yearData.expenses);
    const settleNet = calcNet(yearData.settlement.variableIncome, yearData.settlement.fixedIncome, yearData.settlement.expenses);

    const achievementRate = budgetNet.map((bNet, i) => {
        // Check if settlement data is all zero (not entered)
        if (yearData.settlement.variableIncome[i] === 0 &&
            yearData.settlement.fixedIncome[i] === 0 &&
            yearData.settlement.expenses[i] === 0) {
            return 0;
        }

        const sNet = settleNet[i];

        if (bNet === 0) return 0; // Avoid infinity

        if (bNet > 0) {
            // Original Positive Plan Logic
            return (sNet / bNet) * 100;
        } else {
            // Negative Plan Logic: Calculate improvement relative to deficit size
            const improvement = (sNet - bNet);
            const ratio = improvement / Math.abs(bNet);
            return 100 + (ratio * 100);
        }
    });

    // Calculate Totals for Rate Column
    const budgetTotals = {
        variableIncome: sum(yearData.variableIncome),
        fixedIncome: sum(yearData.fixedIncome),
        expenses: sum(yearData.expenses),
        net: sum(budgetNet)
    };

    // --- New Calculated Rows Logic ---
    const detailFixedArr = yearData.details.fixed || [];
    const detailVariableArr = yearData.details.variable || [];

    // 1. Fixed Expenses Sum (Loan Interest + Bank Fixed)
    const calcFixedSum = new Array(12).fill(0);
    detailFixedArr.forEach(item => {
        const cat = item.category || '';
        const card = item.card || '';
        // Logic matches financial.js renderFixedSummary
        if (cat.includes('대출이자')) {
            item.values.forEach((v, i) => calcFixedSum[i] += v);
        } else if ((cat === '고정비용' || cat === '구독') && !item.card && !(item.bankAccount || '').includes('카드')) { // Note: using !item.card to be safe
            item.values.forEach((v, i) => calcFixedSum[i] += v);
        }
    });

    // 2. Variable Expenses Sum (All Variable items)
    const calcVariableSum = new Array(12).fill(0);
    detailVariableArr.forEach(item => {
        item.values.forEach((v, i) => calcVariableSum[i] += v);
    });

    // 3. Total Expenses (1 + 2)
    const calcTotalExpense = calcFixedSum.map((v, i) => v + calcVariableSum[i]);

    // 4. Total Income (Variable + Fixed Income from Plan)
    // Actually, user wants detailed breakdown based on 'income' tab detailed list calculation in Summary

    // 4.1. "Fixed Income" (Interest Income)
    const detailIncomeArr = yearData.details.income || [];
    const calcIncomeFixed = new Array(12).fill(0); // For "이자수익"
    const calcIncomeVariable = new Array(12).fill(0); // For everything else

    detailIncomeArr.forEach(item => {
        const cat = item.category || '';
        item.values.forEach((v, i) => {
            if (cat === '이자수입') {
                calcIncomeFixed[i] += v;
            } else {
                calcIncomeVariable[i] += v;
            }
        });
    });

    // 4.2 Total Income (Sum of these two, which should equal calcTotalIncome derived from Budget Plan if plan matches detail)
    // NOTE: The user's request implies these sum rows come from the DETAILED list logic (like Expense Sums).
    // However, the original 'calcTotalIncome' came from 'yearData.variableIncome' + 'yearData.fixedIncome' arrays (Plan Data).
    // The user's request for "Variable Income" and "Fixed Income" rows SPECIFICALLY calls for 'income tab' logic.
    // So we should use the calculated arrays from `details.income`.
    // Let's redefine calcTotalIncome to be sum of these two to be consistent with the section purpose (Detailed Summary)
    const calcTotalIncomeDetailed = calcIncomeVariable.map((v, i) => v + calcIncomeFixed[i]);


    const rows = [
        { type: 'section', label: '📊 예산안' },
        { id: 'variableIncome', label: '변동 수입', data: yearData.variableIncome, editable: true, refTotal: budgetTotals.variableIncome },
        { id: 'fixedIncome', label: '고정 수입', data: yearData.fixedIncome, editable: true, refTotal: budgetTotals.fixedIncome },
        { id: 'expenses', label: '지출', data: yearData.expenses, editable: true, isCost: true, refTotal: budgetTotals.expenses },
        { type: 'calc', label: '순수익 (계획)', data: budgetNet, isBold: true, highlight: true, refTotal: budgetTotals.net },
        { type: 'spacer' },
        { type: 'section', label: '🧾 정산' },
        { id: 'variableIncome', label: '변동 수입', data: yearData.settlement.variableIncome, editable: true, isSettlement: true, refTotal: budgetTotals.variableIncome },
        { id: 'fixedIncome', label: '고정 수입', data: yearData.settlement.fixedIncome, editable: true, isSettlement: true, refTotal: budgetTotals.fixedIncome },
        { id: 'expenses', label: '지출', data: yearData.settlement.expenses, editable: true, isSettlement: true, isCost: true, refTotal: budgetTotals.expenses },
        { type: 'calc', label: '순수익 (실제)', data: settleNet, isBold: true, refTotal: budgetTotals.net },
        { type: 'spacer' },
        { type: 'calc', label: '월별 달성률', data: achievementRate, isPercent: true },
        { type: 'spacer' },
        { type: 'section', label: '📈 자동 계산 요약' },
        { type: 'calc', label: '변동 수입', data: calcIncomeVariable, isSummary: true },
        { type: 'calc', label: '고정 수입', data: calcIncomeFixed, isSummary: true },
        { type: 'calc', label: '수입 총합', data: calcTotalIncomeDetailed, isBold: true, isEmphasis: true, isSummary: true },
        { type: 'calc', label: '고정지출 합계', data: calcFixedSum, isSummary: true },
        { type: 'calc', label: '변동지출 합계', data: calcVariableSum, isSummary: true },
        { type: 'calc', label: '지출 총합', data: calcTotalExpense, isBold: true, isEmphasis: true, isSummary: true }
    ];

    let bodyHTML = '';
    rows.forEach(row => {
        // Spacer
        if (row.type === 'spacer') {
            bodyHTML += '<tr><td colspan="16" class="h-6 bg-transparent border-none"></td></tr>'; return;
        }
        // Section Header
        if (row.type === 'section') {
            bodyHTML += `<tr><td colspan="16" class="px-4 py-2 font-bold text-blue-300 bg-gray-800/50">${row.label}</td></tr>`; return;
        }

        const totalVal = sum(row.data);
        const totalDisplay = row.isPercent ? (sum(row.data) / 12).toFixed(1) + '%' : formatMoneyFull(totalVal) + '원';

        // Achievement Rate Calculation for column
        let rateDisplay = '-';
        if (!row.isPercent && row.refTotal && row.refTotal !== 0) {
            if (row.isSettlement || row.label.includes('실제')) {
                const rate = (totalVal / row.refTotal) * 100;
                const color = rate >= 100 ? 'text-red-400' : 'text-blue-400';
                rateDisplay = `<span class="${color}">${rate.toFixed(1)}%</span>`;
            } else if (row.type !== 'calc' || row.label.includes('계획')) {
                rateDisplay = '<span class="text-gray-600">-</span>';
            }
        }
        if (row.isPercent) rateDisplay = '-';

        bodyHTML += `<tr class="hover:bg-white/5 transition">`;
        bodyHTML += `<td class="px-4 py-2 font-medium ${row.isBold ? 'text-white' : 'text-gray-400'}">${row.label}</td>`;

        // 12 Months Data
        row.data.forEach((val, i) => {
            bodyHTML += `<td class="p-1">`;
            if (row.editable) {
                bodyHTML += `<input type="text" class="table-input" value="${formatMoneyFull(val)}" 
                onfocus="this.value = this.value.replace(/,/g, '')"
                onblur="updateValue('${row.id}', ${i}, this.value, ${row.isSettlement || false})" 
                onkeydown="if(event.key === 'Enter') this.blur();"
            />`;
            } else if (row.isPercent) {
                const color = val >= 100 ? 'text-red-400 font-bold' : (val >= 80 ? 'text-white' : 'text-blue-400');
                bodyHTML += `<div class="text-right px-3 py-1 ${color}">${val.toFixed(0)}%</div>`;
            } else {
                if (row.isEmphasis) {
                    // Emphasis: Yellowish background + neutral text color
                    bodyHTML += `<div class="text-right px-3 py-1 bg-yellow-500/20 text-gray-300 font-bold rounded">${formatMoneyFull(val)}</div>`;
                } else if (row.isSummary) {
                    // Other Summary rows: Standard background + neutral text color
                    bodyHTML += `<div class="text-right px-3 py-1 text-gray-300">${formatMoneyFull(val)}</div>`;
                } else {
                    let color = 'text-gray-300';
                    if (val > 0) color = 'text-red-400';
                    else if (val < 0) color = 'text-blue-400';
                    else if (row.highlight) color = 'text-red-400 font-bold';
                    bodyHTML += `<div class="text-right px-3 py-1 ${color}">${formatMoneyFull(val)}</div>`;
                }
            }
            bodyHTML += `</td>`;
        });

        // Total Column
        bodyHTML += `<td class="px-4 py-2 text-right font-bold text-white bg-gray-900 border-l border-white/10">${totalDisplay}</td>`;

        // Calculated Average
        const nonZeroCount = row.data.filter(v => v !== 0).length;
        const averageVal = nonZeroCount > 0 ? totalVal / nonZeroCount : 0;
        const averageDisplay = row.isPercent ?
            (nonZeroCount > 0 ? averageVal.toFixed(1) + '%' : '-') :
            formatMoneyFull(Math.round(averageVal)) + '원';

        // Average Column
        bodyHTML += `<td class="px-4 py-2 text-right font-bold text-green-400 bg-gray-900 border-l border-white/10">${averageDisplay}</td>`;

        // Rate Column
        bodyHTML += `<td class="px-4 py-2 text-right font-bold text-white bg-gray-900 border-l border-white/10 sticky right-0">${rateDisplay}</td>`;

        bodyHTML += `</tr>`;
    });
    tbody.innerHTML = bodyHTML;
}

// Init
window.addEventListener('load', () => {
    loadData();
    updateUI();
});
