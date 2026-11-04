/* Read-only annual spending dashboard. No storage or synchronization writes. */
(function (root) {
    'use strict';
    const COLORS = ['#506447', '#a4473e', '#376b86', '#806033', '#78577c', '#a3476d', '#545d92', '#31736b', '#97532d', '#486b6e', '#747432', '#885c59', '#4c5964', '#765443', '#5d6a32'];
    let visibleCategories = null;
    let knownCategories = new Set();
    let lastYear = null;
    const money = value => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value);
    const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

    function monthOf(date, year) {
        if (!date) return -1;
        const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/);
        if (match) {
            const y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
            const check = new Date(Date.UTC(y, m - 1, d));
            return y === Number(year) && m >= 1 && m <= 12 && check.getUTCMonth() === m - 1 && check.getUTCDate() === d ? m - 1 : -1;
        }
        const parsed = new Date(date);
        return Number.isFinite(parsed.getTime()) && parsed.getFullYear() === Number(year) ? parsed.getMonth() : -1;
    }

    function buildDashboard(yearData, configuredCategories, year, includeFixed) {
        const categories = new Map();
        const ensure = name => {
            if (!categories.has(name)) categories.set(name, { name, months: Array(12).fill(0), total: 0 });
            return categories.get(name);
        };
        for (const name of configuredCategories || []) {
            if (typeof name === 'string' && name && (includeFixed || name !== '고정지출')) ensure(name);
        }
        let count = 0;
        const transactions = yearData?.details?.settlement || [];
        for (const item of transactions) {
            const month = monthOf(item?.date, year);
            if (month < 0) continue;
            const name = typeof item.category === 'string' && item.category.trim() ? item.category : '미분류';
            if (!includeFixed && name === '고정지출') continue;
            const amount = typeof item.amount === 'number' ? item.amount : Number(String(item.amount ?? '').replace(/,/g, '').trim());
            if (!Number.isFinite(amount)) continue;
            const row = ensure(name);
            row.months[month] += amount;
            row.total += amount;
            count++;
        }
        const rows = Array.from(categories.values());
        const monthlyTotals = Array.from({ length: 12 }, (_, month) => rows.reduce((sum, row) => sum + row.months[month], 0));
        return { rows, monthlyTotals, total: monthlyTotals.reduce((sum, value) => sum + value, 0), count };
    }

    function renderChart(model) {
        const selected = model.rows.filter(row => visibleCategories.has(row.name));
        const host = document.getElementById('settlementTrendChart');
        if (!selected.length) {
            host.innerHTML = '<p class="settlement-dashboard-empty">추이를 볼 카테고리를 선택하세요.</p>';
            return;
        }
        const width = 1080, height = 350, left = 100, right = 28, top = 28, bottom = 48;
        const values = selected.flatMap(row => row.months);
        const min = Math.min(0, ...values), max = Math.max(0, ...values);
        const span = max - min || 1;
        const low = min < 0 ? min - span * .08 : 0;
        const high = max > 0 ? max + span * .12 : (min < 0 ? 0 : 1);
        const x = month => left + month * (width - left - right) / 11;
        const y = value => top + (high - value) * (height - top - bottom) / (high - low);
        let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="settlementTrendTitle settlementTrendDesc"><title id="settlementTrendTitle">${escapeHTML(lastYear)}년 카테고리별 월별 지출 추이</title><desc id="settlementTrendDesc">가로축은 1월부터 12월, 세로축은 원 단위 지출액입니다. 정확한 금액은 위 표에서도 확인할 수 있습니다.</desc>`;
        for (let tick = 0; tick <= 4; tick++) {
            const value = low + (high - low) * tick / 4;
            svg += `<line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}" stroke="#ded9cc"/><text x="${left - 12}" y="${y(value) + 4}" text-anchor="end" class="trend-axis">${money(Math.round(value))}</text>`;
        }
        if (min < 0) svg += `<line x1="${left}" y1="${y(0)}" x2="${width - right}" y2="${y(0)}" stroke="#746f62" stroke-dasharray="4 4"/>`;
        for (let month = 0; month < 12; month++) svg += `<text x="${x(month)}" y="${height - 16}" text-anchor="middle" class="trend-axis">${month + 1}월</text>`;
        selected.forEach(row => {
            const index = model.rows.indexOf(row), color = COLORS[index % COLORS.length];
            const dash = index >= COLORS.length ? ' stroke-dasharray="6 4"' : '';
            svg += `<polyline points="${row.months.map((value, month) => `${x(month)},${y(value)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5"${dash}/>`;
            row.months.forEach((value, month) => {
                const label = `${row.name} · ${month + 1}월 · ${money(value)}원`;
                svg += `<circle cx="${x(month)}" cy="${y(value)}" r="4" fill="${color}" stroke="#fcfaf5" stroke-width="1.5" tabindex="0" role="img" aria-label="${escapeHTML(label)}"><title>${escapeHTML(label)}</title></circle>`;
            });
        });
        host.innerHTML = svg + '</svg>';
    }

    function renderSettlementDashboard() {
        const panel = document.getElementById('settlementDashboardView');
        if (!panel || typeof roadmapData === 'undefined') return;
        const year = currentYear;
        const model = buildDashboard(roadmapData.years?.[year], roadmapData.categories?.settlement, year, document.getElementById('settlementDashboardFixed').checked);
        if (lastYear !== year || visibleCategories === null) visibleCategories = new Set(model.rows.map(row => row.name));
        else model.rows.forEach(row => { if (!knownCategories.has(row.name)) visibleCategories.add(row.name); });
        knownCategories = new Set(model.rows.map(row => row.name));
        lastYear = year;
        document.getElementById('settlementDashboardYear').textContent = `${year}년`;
        document.getElementById('settlementDashboardSummary').textContent = `연간 합계 ${money(model.total)}원 · ${money(model.count)}건`;
        const head = '<tr><th scope="col">카테고리</th>' + Array.from({ length: 12 }, (_, month) => `<th scope="col">${month + 1}월</th>`).join('') + '<th scope="col">연간 합계</th></tr>';
        const cells = values => values.map(value => `<td>${money(value)}</td>`).join('');
        const body = model.rows.map((row, index) => `<tr><th scope="row"><span class="trend-swatch" style="background:${COLORS[index % COLORS.length]}"></span>${escapeHTML(row.name)}</th>${cells(row.months)}<td class="trend-total">${money(row.total)}</td></tr>`).join('');
        document.getElementById('settlementDashboardTable').innerHTML = `<caption>${year}년 카테고리별 월별 지출 · 단위: 원</caption><thead>${head}</thead><tbody>${body || '<tr><td colspan="14">등록된 지출 내역이 없습니다.</td></tr>'}</tbody><tfoot><tr><th scope="row">합계</th>${cells(model.monthlyTotals)}<td>${money(model.total)}</td></tr></tfoot>`;
        document.getElementById('settlementDashboardEmpty').hidden = model.count > 0;
        const legend = document.getElementById('settlementTrendLegend');
        legend.replaceChildren();
        model.rows.forEach((row, index) => {
            const label = document.createElement('label');
            label.className = 'trend-category';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = visibleCategories.has(row.name);
            input.addEventListener('change', () => {
                if (input.checked) visibleCategories.add(row.name); else visibleCategories.delete(row.name);
                renderChart(model);
            });
            const swatch = document.createElement('span');
            swatch.className = 'trend-swatch';
            swatch.style.backgroundColor = COLORS[index % COLORS.length];
            label.append(input, swatch, document.createTextNode(row.name));
            legend.append(label);
        });
        renderChart(model);
    }

    root.renderSettlementDashboard = renderSettlementDashboard;
    if (typeof module !== 'undefined' && module.exports) module.exports = { buildDashboard, monthOf };
})(typeof window !== 'undefined' ? window : globalThis);
