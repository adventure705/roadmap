document.addEventListener('DOMContentLoaded', () => {
    try {
        updateUI();
    } catch (e) {
        console.error('Initialization failed:', e);
    }
    // Always try to show dashboard even if data update failed
    showTab('dashboard');
});

let cashFlowChart;
let overviewChart;

// --- Core Logic ---

function changeYear(delta) {
    currentYear += delta;
    if (!roadmapData.years[currentYear]) {
        roadmapData.years[currentYear] = roadmapData.createYearData();
    }
    updateUI();
}

function updateUI() {
    // Update Year Displays
    document.getElementById('dashboardYearDisplay').innerText = currentYear;
    document.getElementById('sheetYearDisplay').innerText = currentYear;

    // Refresh Data & Charts
    renderSheetTable();
    updateDashboard();
}

// Data Updater
function updateValue(category, monthIndex, value, isSettlement = false) {
    const yearData = roadmapData.years[currentYear];
    const numValue = parseInt(value.replace(/,/g, '')) || 0;

    if (isSettlement) {
        yearData.settlement[category][monthIndex] = numValue;
    } else {
        yearData[category][monthIndex] = numValue;
    }

    saveData();
    // Re-render to update calculated fields (Net, Rate, Totals)
    renderSheetTable();
    // Don't full re-render dashboard every keystroke, but maybe when leaving tab? 
    // For now, simple re-render is safer for consistency
    // Optimization: Only update totals row if needed
}

// --- Formatting ---
// Full format: 1,500,000 (No 'M' abbreviation requested)
const formatMoneyFull = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
};

// --- Dashboard ---
function updateDashboard() {
    const yearData = roadmapData.years[currentYear];

    // Calculate Arrays for Charts
    // Using Budget Data for Dashboard projections
    const netIncomeData = yearData.variableIncome.map((v, i) => (v + yearData.fixedIncome[i]) - yearData.expenses[i]);
    const totalRevenueData = yearData.variableIncome.map((v, i) => v + yearData.fixedIncome[i]);
    const expenseData = yearData.expenses;

    // Calculate Totals
    const totalRev = totalRevenueData.reduce((a, b) => a + b, 0);
    const totalExp = expenseData.reduce((a, b) => a + b, 0);
    const totalNet = netIncomeData.reduce((a, b) => a + b, 0);

    // Calculate Achievement Rate (Avg of non-zero months or just simple comparison?)
    // Request says: "Average Rate" or "Rate per month". Let's calc global rate based on Settlement Net vs Budget Net
    // But sheet has "Achievement Rate" per month.
    // Let's iterate months to find Avg Rate for months that have passed (or all). 
    // Logic: If budget Net is 0, rate is undefined? Assuming Budget Net > 0.
    // Let's stick to the sheet logic: Rate row in Sheet table.
    // Here for KPI, let's show simple Profit Margin or Avg Rate.
    // Let's show Profit Margin = Net / Revenue
    const margin = totalRev > 0 ? ((totalNet / totalRev) * 100).toFixed(1) : 0;

    // KPI Updates
    document.getElementById('kpi-net-income').innerText = formatMoneyFull(totalNet) + '원';
    document.getElementById('kpi-revenue').innerText = formatMoneyFull(totalRev) + '원';
    document.getElementById('kpi-expense').innerText = formatMoneyFull(totalExp) + '원';
    document.getElementById('profit-margin-display').innerText = margin + '%';
    document.getElementById('kpi-rate').innerText = margin + '%'; // Using margin as placeholder for generic rate if not specified

    // Charts Update
    const ctxFlow = document.getElementById('cashFlowChart').getContext('2d');
    const ctxOverview = document.getElementById('overviewChart').getContext('2d');

    if (cashFlowChart) cashFlowChart.destroy();
    if (overviewChart) overviewChart.destroy();

    cashFlowChart = new Chart(ctxFlow, {
        type: 'line',
        data: {
            labels: roadmapData.months,
            datasets: [
                {
                    label: '순수익',
                    data: netIncomeData,
                    borderColor: '#3b82f6',
                    backgroundColor: (ctx) => {
                        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
                        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 3
                },
                {
                    label: '총 매출',
                    data: totalRevenueData,
                    borderColor: '#a855f7',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + formatMoneyFull(context.parsed.y) + '원';
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8', callback: (v) => formatMoneyFull(v) }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    overviewChart = new Chart(ctxOverview, {
        type: 'doughnut',
        data: {
            labels: ['순수익', '지출'],
            datasets: [{
                data: [totalNet > 0 ? totalNet : 0, totalExp],
                backgroundColor: ['#3b82f6', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '75%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

// --- Sheet Table Render ---
function renderSheetTable() {
    const thead = document.getElementById('sheetHeaderRow');
    const tbody = document.getElementById('sheetBody');
    const yearData = roadmapData.years[currentYear];

    // Headers
    let headerHTML = '<th scope="col" class="px-4 py-3 bg-gray-800 text-center min-w-[150px]">항목 (Category)</th>';
    roadmapData.months.forEach(m => {
        headerHTML += `<th scope="col" class="px-4 py-3 text-center min-w-[120px]">${m}</th>`;
    });
    headerHTML += '<th scope="col" class="px-4 py-3 font-bold text-blue-400 text-right min-w-[120px] sticky right-0 bg-gray-900 border-l border-white/10">합계 (Total)</th>';
    thead.innerHTML = headerHTML;

    // Body Rows
    let bodyHTML = '';

    // Calculations
    const calcNet = (vArr, fArr, eArr) => vArr.map((v, i) => (v + fArr[i]) - eArr[i]);
    const budgetNet = calcNet(yearData.variableIncome, yearData.fixedIncome, yearData.expenses);
    const settleNet = calcNet(yearData.settlement.variableIncome, yearData.settlement.fixedIncome, yearData.settlement.expenses);

    // Achievement Rate: Settle Net / Budget Net * 100 (handle div by zero)
    // Updated Logic: Handle negative planned net income.
    const achievementRate = budgetNet.map((bNet, i) => {
        const sNet = settleNet[i];

        // If settlement not started (all zeros), maybe return 0? 
        // Or strictly strictly compare? Let's check if settlement has data first.
        // Assuming if settlement vars are 0, it might be uninitialized month.
        if (yearData.settlement.variableIncome[i] === 0 && yearData.settlement.fixedIncome[i] === 0 && yearData.settlement.expenses[i] === 0) {
            // Check if it's really 0 or just not entered. Ideally we treat as 0 achievement until proven otherwise?
            // Existing logic checked income only. Let's keep it lenient.
            return 0;
        }

        if (bNet === 0) return 0; // Avoid infinity

        if (bNet > 0) {
            // Original Logic for positive plan
            return (sNet / bNet) * 100;
        } else {
            // Negative Plan Logic:
            // Improve relative to the deficit.
            // Rate = 100 + ((Actual - Plan) / |Plan| * 100)
            const improvement = (sNet - bNet);
            const ratio = improvement / Math.abs(bNet);
            return 100 + (ratio * 100);
        }
    });

    // Helper to sum
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);

    // Row Definitions
    const rows = [
        { type: 'section', label: '📊 예산안 (Plan)' },
        { id: 'variableIncome', label: '변동 수입', data: yearData.variableIncome, editable: true },
        { id: 'fixedIncome', label: '고정 수입', data: yearData.fixedIncome, editable: true },
        { id: 'expenses', label: '지출', data: yearData.expenses, editable: true, isCost: true },
        { type: 'calc', label: '순수익 (계획)', data: budgetNet, isBold: true, highlight: true },

        { type: 'spacer' },

        { type: 'section', label: '🧾 정산 (Actual)' },
        { id: 'variableIncome', label: '변동 수입 (실제)', data: yearData.settlement.variableIncome, editable: true, isSettlement: true },
        { id: 'fixedIncome', label: '고정 수입 (실제)', data: yearData.settlement.fixedIncome, editable: true, isSettlement: true },
        { id: 'expenses', label: '지출 (실제)', data: yearData.settlement.expenses, editable: true, isSettlement: true, isCost: true },
        { type: 'calc', label: '순수익 (실제)', data: settleNet, isBold: true },

        { type: 'spacer' },

        { type: 'calc', label: '달성률 (%)', data: achievementRate, isPercent: true }
    ];

    rows.forEach(row => {
        if (row.type === 'spacer') {
            bodyHTML += '<tr><td colspan="14" class="h-6 bg-transparent border-none"></td></tr>';
            return;
        }
        if (row.type === 'section') {
            bodyHTML += `<tr><td colspan="14" class="px-4 py-2 font-bold text-blue-300 bg-gray-800/50">${row.label}</td></tr>`;
            return;
        }

        const totalVal = sum(row.data);
        const totalDisplay = row.isPercent ? (sum(row.data) / 12).toFixed(1) + '%' : formatMoneyFull(totalVal) + '원';

        bodyHTML += `<tr class="hover:bg-white/5 transition">`;
        bodyHTML += `<td class="px-4 py-2 font-medium ${row.isBold ? 'text-white' : 'text-gray-400'}">${row.label}</td>`;

        row.data.forEach((val, i) => {
            bodyHTML += `<td class="p-1">`;
            if (row.editable) {
                // Input Field
                bodyHTML += `
                    <input type="text" 
                        class="table-input" 
                        value="${formatMoneyFull(val)}" 
                        onfocus="this.value = this.value.replace(/,/g, '')"
                        onblur="updateValue('${row.id}', ${i}, this.value, ${row.isSettlement || false})" 
                        onkeypress="if(event.key === 'Enter') this.blur();"
                    />
                `;
            } else if (row.isPercent) {
                // Rate Display
                const color = val >= 100 ? 'text-green-400' : (val >= 80 ? 'text-blue-400' : 'text-gray-500');
                bodyHTML += `<div class="text-right px-3 py-1 ${color}">${val.toFixed(1)}%</div>`;
            } else {
                // Calculated Value Display
                const color = val < 0 ? 'text-red-400' : (row.highlight ? 'text-blue-400 font-bold' : 'text-gray-300');
                bodyHTML += `<div class="text-right px-3 py-1 ${color}">${formatMoneyFull(val)}</div>`;
            }
            bodyHTML += `</td>`;
        });

        // Total Column
        bodyHTML += `<td class="px-4 py-2 text-right font-bold text-white bg-gray-900 border-l border-white/10 sticky right-0">${totalDisplay}</td>`;
        bodyHTML += `</tr>`;
    });

    tbody.innerHTML = bodyHTML;
}
