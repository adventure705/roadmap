/* Annual read-only dashboards for income, fixed expenses, and variable expenses. */
(function (root) {
    'use strict';
    const names = { income: '총 수입', fixed: '고정지출', variable: '변동지출' };
    const colors = ['#506447','#a4473e','#376b86','#806033','#78577c','#a3476d','#545d92','#31736b','#97532d','#486b6e','#747432','#885c59','#4c5964','#765443','#5d6a32'];
    let active = false, lastKey = null, selected = new Set();
    const money = value => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value);
    const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
    function buildFinancialDashboard(yearData, type, categories) {
        const groups = new Map();
        const ensure = name => { if (!groups.has(name)) groups.set(name, { name, months:Array(12).fill(0), total:0 }); return groups.get(name); };
        (categories || []).forEach(name => { if (typeof name === 'string' && name) ensure(name); });
        for (const item of yearData?.details?.[type] || []) {
            const row = ensure(typeof item.category === 'string' && item.category.trim() ? item.category : '미분류');
            for (let month=0; month<12; month++) {
                const raw=item.values?.[month];
                const amount=typeof raw==='number'?raw:Number(String(raw??'').replace(/,/g,''));
                if (Number.isFinite(amount)) { row.months[month]+=amount; row.total+=amount; }
            }
        }
        const rows=Array.from(groups.values());
        const monthlyTotals=Array.from({length:12},(_,month)=>rows.reduce((sum,row)=>sum+row.months[month],0));
        return {rows,monthlyTotals,total:monthlyTotals.reduce((sum,value)=>sum+value,0)};
    }
    function renderFinancialDashboard() {
        const panel=document.getElementById('financialDashboardView');
        if (!panel || !names[root.currentPageType]) return;
        const type=root.currentPageType, year=currentYear, key=`${type}:${year}`;
        if (lastKey!==key) selected=new Set();
        lastKey=key;
        const model=buildFinancialDashboard(roadmapData.years?.[year],type,roadmapData.categories?.[type]);
        const cells=values=>values.map(value=>`<td>${money(value)}</td>`).join('');
        const tail=row=>`<td class="trend-total">${money(Math.round(row.total/12))}</td><td class="trend-total">${money(row.total)}</td>`;
        const heading='<tr><th scope="col">카테고리</th>'+Array.from({length:12},(_,month)=>`<th scope="col">${month+1}월</th>`).join('')+'<th scope="col">월평균</th><th scope="col">연간 합계</th></tr>';
        panel.innerHTML=`<div class="settlement-dashboard-heading"><div><h3>${year}년 ${names[type]} 대시보드</h3><p>월평균(12개월) ${money(Math.round(model.total/12))}원 · 연간 합계 ${money(model.total)}원</p></div></div><div class="settlement-dashboard-scroll" tabindex="0" role="region" aria-label="월별 카테고리 금액표"><table id="settlementDashboardTable"><caption>기존 ${names[type]} 항목의 월별 금액 기준 · 단위: 원 · 월평균은 12개월 기준, 원 단위 반올림</caption><thead>${heading}</thead><tbody><tr class="dashboard-total-row"><th scope="row">합계</th>${cells(model.monthlyTotals)}${tail(model)}</tr>${model.rows.map((row,index)=>`<tr><th scope="row"><span class="trend-swatch" style="background:${colors[index%colors.length]}"></span>${escape(row.name)}</th>${cells(row.months)}${tail(row)}</tr>`).join('')}</tbody></table></div><p class="settlement-dashboard-note">분류 없는 항목은 미분류로 포함하며, 값이 없는 월은 0원으로 표시합니다. 아래에서 카테고리를 선택하면 연간 추이를 볼 수 있습니다.</p><h4 class="settlement-dashboard-chart-heading">월별 카테고리 ${type==='income'?'수입':'지출'} 추이</h4><div id="settlementTrendLegend" role="group" aria-label="그래프에 표시할 카테고리"></div><div id="settlementTrendChart"></div>`;
        const draw=()=>{document.getElementById('settlementTrendChart').innerHTML=root.buildDashboardTrendSVG(model.rows,selected,year);};
        const legend=document.getElementById('settlementTrendLegend');
        model.rows.forEach((row,index)=>{
            const label=document.createElement('label');label.className='trend-category';
            const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=selected.has(row.name);
            checkbox.addEventListener('change',()=>{if(checkbox.checked)selected.add(row.name);else selected.delete(row.name);draw();});
            const swatch=document.createElement('span');swatch.className='trend-swatch';swatch.style.backgroundColor=colors[index%colors.length];
            label.append(checkbox,swatch,document.createTextNode(row.name));legend.append(label);
        });
        draw();
    }
    root.isFinancialDashboardActive=()=>active;
    root.renderFinancialDashboard=renderFinancialDashboard;
    root.toggleFinancialDashboard=show=>{
        active=Boolean(show);
        document.getElementById('financialDashboardView').classList.toggle('hidden',!active);
        document.getElementById('financialStandardView').classList.toggle('hidden',active);
        ['financialDetailsButton','financialDashboardButton'].forEach((id,index)=>{
            const button=document.getElementById(id),pressed=index===Number(active);
            button.setAttribute('aria-pressed',String(pressed));
            button.className=pressed?'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold':'bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-bold';
        });
        root.updateUI();
    };
    if(typeof module!=='undefined'&&module.exports)module.exports={buildFinancialDashboard};
})(typeof window!=='undefined'?window:globalThis);
