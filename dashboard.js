let comparisonChart;

const formatMoneyFull = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
};

function updateUI() {
    window.currentPageType = 'dashboard';
    // Displays
    const yearDisplay = document.getElementById('dashboardYearDisplay');
    const monthDisplay = document.getElementById('dashboardMonthDisplay');

    if (yearDisplay) yearDisplay.innerText = currentYear;
    if (monthDisplay) monthDisplay.innerText = (currentMonth + 1) + '월';

    updateDashboard();
    renderMemos();
}

function updateDashboard() {
    const yearData = roadmapData.years[currentYear];
    if (!yearData) return;

    // 1. Calculate Monthly & Yearly Logic
    // 1. Calculate Monthly & Yearly Logic
    // Budget Data (Plan)
    const planNetIncomes = yearData.variableIncome.map((v, i) => (v + yearData.fixedIncome[i]) - yearData.expenses[i]);

    // Settlement Data (Actual)
    const sRevArr = yearData.settlement.variableIncome.map((v, i) => v + yearData.settlement.fixedIncome[i]);
    const sExpArr = yearData.settlement.expenses;
    const sNetArr = yearData.settlement.variableIncome.map((v, i) => (v + yearData.settlement.fixedIncome[i]) - yearData.settlement.expenses[i]);

    const planNet = planNetIncomes[currentMonth];

    // Current Month Actuals
    const curNet = sNetArr[currentMonth];
    const curRev = sRevArr[currentMonth];
    const curExp = sExpArr[currentMonth];

    // Rate: Actual / Plan with Negative Plan Logic
    let curRate = 0;
    if (planNet > 0) {
        curRate = (curNet / planNet) * 100;
    } else if (planNet < 0) {
        // Negative Plan Logic
        const improvement = (curNet - planNet);
        const ratio = improvement / Math.abs(planNet);
        curRate = 100 + (ratio * 100);
    } else {
        curRate = 0;
    }

    // 2. Update KPI Cards
    document.getElementById('kpi-title-net').innerText = `${currentMonth + 1}월 순수익`;
    document.getElementById('kpi-net-income').innerText = formatMoneyFull(curNet) + '원';

    document.getElementById('kpi-title-rev').innerText = `${currentMonth + 1}월 총 수입`;
    document.getElementById('kpi-revenue').innerText = formatMoneyFull(curRev) + '원';

    document.getElementById('kpi-title-exp').innerText = `${currentMonth + 1}월 총 지출`;
    document.getElementById('kpi-expense').innerText = formatMoneyFull(curExp) + '원';

    document.getElementById('kpi-title-rate').innerText = `${currentMonth + 1}월 달성률`;
    document.getElementById('kpi-rate').innerText = curRate.toFixed(1) + '%';

    // Placeholder to read file first KPIs
    // Color Logic for KPIs
    document.getElementById('kpi-net-income').className = `text-2xl font-bold tracking-tight ${curNet >= 0 ? 'text-red-400' : 'text-blue-400'}`;
    document.getElementById('kpi-rate').className = `text-2xl font-bold tracking-tight ${curRate >= 100 ? 'text-red-400' : (curRate >= 80 ? 'text-white' : 'text-blue-400')}`;

    // 3. Render Comparison Chart
    renderComparisonChart();
}



function renderComparisonChart() {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Ensure categories
    const cats = roadmapData.categories.settlement || ['식비', '교통/차량', '문화생활', '패션/미용', '생활용품', '주거/통신', '건강', '교육', '경조사/회비', '기타'];

    const getTrans = (y, m) => {
        if (!roadmapData.years[y]) return [];
        const prefix = `${y}-${String(m + 1).padStart(2, '0')}`;
        return (roadmapData.years[y].details.settlement || []).filter(t => {
            if (!t.date) return false;
            if (t.category === '고정지출') return false;

            if (t.date.startsWith(prefix)) return true;
            const d = new Date(t.date);
            return d.getFullYear() === y && d.getMonth() === m;
        });
    };

    let prevY = currentYear, prevM = currentMonth - 1;
    if (prevM < 0) { prevY--; prevM = 11; }

    const curTrans = getTrans(currentYear, currentMonth);
    const prevTrans = getTrans(prevY, prevM);

    const curData = [];
    const prevData = [];

    cats.forEach(cat => {
        const sumVal = (list) => list.filter(t => t.category === cat).reduce((acc, t) => acc + (t.amount || 0), 0);
        curData.push(sumVal(curTrans));
        prevData.push(sumVal(prevTrans));
    });

    if (comparisonChart) comparisonChart.destroy();

    // Custom Plugin for Data Labels (Amount & % Change)
    const customDataLabelPlugin = {
        id: 'customDataLabel',
        afterDatasetsDraw: (chart) => {
            const { ctx } = chart;
            ctx.save();
            ctx.font = 'bold 10px Pretendard';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            const metaCurr = chart.getDatasetMeta(1); // "This Month" dataset

            metaCurr.data.forEach((bar, index) => {
                const currVal = chart.data.datasets[1].data[index];
                const prevVal = chart.data.datasets[0].data[index];

                if (currVal === 0 && prevVal === 0) return;

                const diff = currVal - prevVal;
                if (diff === 0) return;

                const isUp = diff > 0;
                const color = isUp ? '#f87171' : '#60a5fa'; // Bright red/blue
                const arrow = isUp ? '▲' : '▼';

                let pctStr = '';
                if (prevVal > 0) {
                    const pct = Math.round((diff / prevVal) * 100);
                    pctStr = ` (${Math.abs(pct)}%)`;
                } else if (currVal > 0) {
                    pctStr = ' (New)';
                }

                const diffAbs = Math.abs(diff);
                let amtStr = formatMoneyFull(diffAbs);
                if (diffAbs >= 10000) {
                    amtStr = (diffAbs / 10000).toFixed(1).replace('.0', '') + '만';
                }

                const text = `${arrow} ${amtStr}${pctStr}`;

                ctx.fillStyle = color;
                ctx.fillText(text, bar.x, bar.y - 5);
            });
            ctx.restore();
        }
    };

    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cats,
            datasets: [
                {
                    label: '지난달',
                    data: prevData,
                    backgroundColor: 'rgba(148, 163, 184, 0.3)',
                    hoverBackgroundColor: 'rgba(148, 163, 184, 0.5)',
                    borderWidth: 0,
                    borderRadius: 4,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                },
                {
                    label: '이번달',
                    data: curData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    hoverBackgroundColor: '#3b82f6',
                    borderWidth: 0,
                    borderRadius: 4,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: 30 } // Space for on-bar labels
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: { color: '#cbd5e1', font: { family: 'Pretendard', size: 12 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            return ' ' + context.dataset.label + ': ' + formatMoneyFull(context.raw) + '원';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { color: '#64748b', font: { size: 11 }, callback: (v) => formatMoneyFull(v) }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#94a3b8', font: { size: 12, weight: '500' } }
                }
            }
        },
        plugins: [customDataLabelPlugin]
    });
}

// Init
window.addEventListener('load', () => {
    loadData();
    updateUI();
});
