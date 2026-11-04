/* Read-only annual spending dashboard. No storage or synchronization writes. */
(function (root) {
    'use strict';
    const COLORS = ['#506447', '#a4473e', '#376b86', '#806033', '#78577c', '#a3476d', '#545d92', '#31736b', '#97532d', '#486b6e', '#747432', '#885c59', '#4c5964', '#765443', '#5d6a32'];
    let visibleCategories = null;
    let lastYear = null;
    let detailSelection = null;
    let detailFocusSelector = null;
    let detailOrigin = 'dashboard';
    let detailOpener = null;
    const money = value => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value);
    const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const categoryOf = item => typeof item.category === 'string' && item.category.trim() ? item.category : '미분류';
    const amountOf = item => typeof item.amount === 'number' ? item.amount : Number(String(item.amount ?? '').replace(/,/g, '').trim());

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
            const name = categoryOf(item);
            if (!includeFixed && name === '고정지출') continue;
            const amount = amountOf(item);
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

    function buildDetails(yearData, year, month, category) {
        const groups = new Map();
        for (const item of yearData?.details?.settlement || []) {
            if (monthOf(item?.date, year) !== month || categoryOf(item) !== category) continue;
            const amount = amountOf(item);
            if (!Number.isFinite(amount)) continue;
            const name = String(item.name || item.content || '내용 없음').trim() || '내용 없음';
            if (!groups.has(name)) groups.set(name, { name, total: 0, count: 0, usageCount: 0, refundCount: 0, items: [] });
            const group = groups.get(name);
            group.total += amount;
            group.count++;
            if (amount > 0) group.usageCount++;
            if (amount < 0) group.refundCount++;
            group.items.push({ date: String(item.date), name: String(item.content || item.name || '내용 없음'), amount });
        }
        const rows = Array.from(groups.values()).sort((a, b) => b.total - a.total || b.usageCount - a.usageCount || a.name.localeCompare(b.name, 'ko'));
        rows.forEach(row => row.items.sort((a, b) => b.amount - a.amount || b.date.localeCompare(a.date)));
        return {
            rows,
            total: rows.reduce((sum, row) => sum + row.total, 0),
            count: rows.reduce((sum, row) => sum + row.count, 0),
            usageCount: rows.reduce((sum, row) => sum + row.usageCount, 0),
            refundCount: rows.reduce((sum, row) => sum + row.refundCount, 0)
        };
    }

    function renderDetails() {
        let panel = document.getElementById('settlementDashboardDetails');
        if (!detailSelection) { if (panel?.open) panel.close(); return; }
        if (!panel) {
            panel = document.createElement('dialog');
            panel.id = 'settlementDashboardDetails';
            panel.className = 'settlement-drilldown';
            panel.tabIndex = -1;
            panel.setAttribute('aria-labelledby', 'settlementDashboardDetailTitle');
            panel.setAttribute('aria-modal', 'true');
            panel.addEventListener('cancel', event => { event.preventDefault(); panel.close(); });
            panel.addEventListener('close', () => {
                detailSelection = null;
                if (detailOrigin === 'dashboard') renderSettlementDashboard();
                const table = document.getElementById('settlementDashboardTable');
                const opener = detailFocusSelector ? table.querySelector(detailFocusSelector) : null;
                (detailOrigin === 'chart' && detailOpener?.isConnected ? detailOpener : opener || table.parentElement).focus({ preventScroll: true });
            });
            panel.addEventListener('click', event => {
                if (event.target !== panel) return;
                const bounds = panel.getBoundingClientRect();
                if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) panel.close();
            });
            document.body.append(panel);
        }
        const { year, month, category } = detailSelection;
        const data = buildDetails(roadmapData.years?.[year], year, month, category);
        const top = data.rows.find(row => row.total > 0);
        const records = data.rows.map((row, index) => {
            const items = row.items.map(item => `<tr><td>${escapeHTML(item.date)}</td><td>${escapeHTML(item.name)}</td><td>${money(item.amount)}원</td></tr>`).join('');
            return `<details class="settlement-merchant" open><summary><span class="settlement-merchant-name">${index + 1}. ${escapeHTML(row.name)}</span><span class="settlement-merchant-count">사용 ${row.usageCount}회 · 내역 ${row.count}건${row.refundCount ? ` · 환불 ${row.refundCount}건` : ''}</span><strong>${money(row.total)}원</strong></summary><div class="settlement-record-scroll"><table><caption class="settlement-visually-hidden">${escapeHTML(row.name)} 개별 내역 · 금액 내림차순</caption><thead><tr><th scope="col">날짜</th><th scope="col">내용</th><th scope="col">금액</th></tr></thead><tbody>${items}</tbody><tfoot><tr><th colspan="2" scope="row">합계 · ${row.count}건</th><td>${money(row.total)}원</td></tr></tfoot></table></div></details>`;
        }).join('');
        panel.innerHTML = `<div class="settlement-drilldown-heading"><div><h4 id="settlementDashboardDetailTitle">${year}년 ${month + 1}월 · ${escapeHTML(category)} 상세내역</h4><p>같은 사용처·내용별 합계와 개별 내역을 금액 내림차순으로 표시합니다.</p></div><div class="settlement-drilldown-actions"><button type="button" id="settlementDashboardCollapseAll">모두 접기</button><button type="button" id="settlementDashboardExpandAll">모두 펼치기</button><button type="button" id="settlementDashboardDetailsClose">상세 닫기</button></div></div><div class="settlement-drilldown-stats"><p>합계<strong>${money(data.total)}원</strong></p><p>사용 횟수<strong>${data.usageCount}회 <small>· 내역 ${data.count}건</small></strong></p><p>가장 많이 쓴 곳<strong>${top ? escapeHTML(top.name) : '없음'}</strong>${top ? `<small>${money(top.total)}원 · ${top.usageCount}회</small>` : ''}</p></div><p class="settlement-dashboard-note">사용 횟수는 양수 지출 기준입니다. 환불은 합계에서 차감하고 내역에는 포함합니다. 각 묶음을 눌러 접거나 펼칠 수 있습니다.</p><div class="settlement-merchant-list">${records || '<p class="settlement-dashboard-empty">이 월·카테고리에는 등록된 지출 내역이 없습니다.</p>'}</div>`;
        document.getElementById('settlementDashboardCollapseAll').onclick = () => {
            panel.querySelectorAll('details.settlement-merchant').forEach(group => { group.open = false; });
        };
        document.getElementById('settlementDashboardExpandAll').onclick = () => {
            panel.querySelectorAll('details.settlement-merchant').forEach(group => { group.open = true; });
        };
        document.getElementById('settlementDashboardDetailsClose').onclick = () => panel.close();
        if (!panel.open) panel.showModal();
        document.getElementById('settlementDashboardDetailsClose').focus({ preventScroll: true });
    }

    function buildDashboardTrendSVG(rows, selectedNames, year) {
        const selected = rows.filter(row => selectedNames.has(row.name));
        if (!selected.length) {
            return '<p class="settlement-dashboard-empty">추이를 볼 카테고리를 선택하세요.</p>';
        }
        const width = 1080, height = 350, left = 100, right = 28, top = 28, bottom = 48;
        const values = selected.flatMap(row => row.months);
        const min = Math.min(0, ...values), max = Math.max(0, ...values);
        const span = max - min || 1;
        const low = min < 0 ? min - span * .08 : 0;
        const high = max > 0 ? max + span * .12 : (min < 0 ? 0 : 1);
        const x = month => left + month * (width - left - right) / 11;
        const y = value => top + (high - value) * (height - top - bottom) / (high - low);
        let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="settlementTrendTitle settlementTrendDesc"><title id="settlementTrendTitle">${escapeHTML(year)}년 카테고리별 월별 금액 추이</title><desc id="settlementTrendDesc">가로축은 1월부터 12월, 세로축은 원 단위 금액입니다. 정확한 금액은 위 표에서도 확인할 수 있습니다.</desc>`;
        for (let tick = 0; tick <= 4; tick++) {
            const value = low + (high - low) * tick / 4;
            svg += `<line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}" stroke="#ded9cc"/><text x="${left - 12}" y="${y(value) + 4}" text-anchor="end" class="trend-axis">${money(Math.round(value))}</text>`;
        }
        if (min < 0) svg += `<line x1="${left}" y1="${y(0)}" x2="${width - right}" y2="${y(0)}" stroke="#746f62" stroke-dasharray="4 4"/>`;
        for (let month = 0; month < 12; month++) svg += `<text x="${x(month)}" y="${height - 16}" text-anchor="middle" class="trend-axis">${month + 1}월</text>`;
        selected.forEach(row => {
            const index = rows.indexOf(row), color = COLORS[index % COLORS.length];
            const dash = index >= COLORS.length ? ' stroke-dasharray="6 4"' : '';
            svg += `<polyline points="${row.months.map((value, month) => `${x(month)},${y(value)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5"${dash}/>`;
            row.months.forEach((value, month) => {
                const label = `${row.name} · ${month + 1}월 · ${money(value)}원`;
                svg += `<circle cx="${x(month)}" cy="${y(value)}" r="4" fill="${color}" stroke="#fcfaf5" stroke-width="1.5" tabindex="0" role="img" aria-label="${escapeHTML(label)}"><title>${escapeHTML(label)}</title></circle>`;
            });
        });
        return svg + '</svg>';
    }

    function renderChart(model) {
        document.getElementById('settlementTrendChart').innerHTML = buildDashboardTrendSVG(model.rows, visibleCategories, lastYear);
    }

    function renderSettlementDashboard() {
        const panel = document.getElementById('settlementDashboardView');
        if (!panel || typeof roadmapData === 'undefined') return;
        const year = currentYear;
        const model = buildDashboard(roadmapData.years?.[year], roadmapData.categories?.settlement, year, document.getElementById('settlementDashboardFixed').checked);
        if (detailSelection && (detailSelection.year !== year || !model.rows.some(row => row.name === detailSelection.category))) detailSelection = null;
        if (lastYear !== year || visibleCategories === null) visibleCategories = new Set();
        lastYear = year;
        document.getElementById('settlementDashboardYear').textContent = `${year}년`;
        document.getElementById('settlementDashboardSummary').textContent = `월평균(12개월) ${money(Math.round(model.total / 12))}원 · 연간 합계 ${money(model.total)}원 · ${money(model.count)}건`;
        const head = '<tr><th scope="col">카테고리</th>' + Array.from({ length: 12 }, (_, month) => `<th scope="col">${month + 1}월</th>`).join('') + '<th scope="col">월평균</th><th scope="col">연간 합계</th></tr>';
        const cells = values => values.map(value => `<td>${money(value)}</td>`).join('');
        const body = model.rows.map((row, index) => {
            const monthCells = row.months.map((value, month) => `<td><button type="button" class="settlement-month-amount" data-dashboard-month="${month}" data-dashboard-category="${index}" aria-label="${escapeHTML(`${year}년 ${month + 1}월 ${row.name} ${money(value)}원 상세내역`)}" aria-pressed="${Boolean(detailSelection && detailSelection.month === month && detailSelection.category === row.name)}" aria-controls="settlementDashboardDetails">${money(value)}</button></td>`).join('');
            return `<tr><th scope="row"><span class="trend-swatch" style="background:${COLORS[index % COLORS.length]}"></span>${escapeHTML(row.name)}</th>${monthCells}<td class="trend-total">${money(Math.round(row.total / 12))}</td><td class="trend-total">${money(row.total)}</td></tr>`;
        }).join('');
        const table = document.getElementById('settlementDashboardTable');
        table.innerHTML = `<caption>${year}년 카테고리별 월별 지출 · 단위: 원 · 월평균은 12개월 기준, 원 단위 반올림 · 월별 금액을 누르면 상세내역이 열립니다.</caption><thead>${head}</thead><tbody><tr class="dashboard-total-row"><th scope="row">합계</th>${cells(model.monthlyTotals)}<td>${money(Math.round(model.total / 12))}</td><td>${money(model.total)}</td></tr>${body || '<tr><td colspan="15">등록된 지출 내역이 없습니다.</td></tr>'}</tbody>`;
        table.onclick = event => {
            const button = event.target.closest('button[data-dashboard-month]');
            if (!button || !table.contains(button)) return;
            const month = Number(button.dataset.dashboardMonth), index = Number(button.dataset.dashboardCategory);
            if (!Number.isInteger(month) || month < 0 || month > 11 || !model.rows[index]) return;
            detailSelection = { year, month, category: model.rows[index].name };
            detailOrigin = 'dashboard';
            detailOpener = null;
            detailFocusSelector = `[data-dashboard-month="${month}"][data-dashboard-category="${index}"]`;
            renderSettlementDashboard();
        };
        renderDetails();
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
    root.buildDashboardTrendSVG = buildDashboardTrendSVG;
    root.openSettlementCategoryDetails = (category, year, month, opener) => {
        detailOrigin = 'chart';
        detailOpener = opener || null;
        detailFocusSelector = null;
        detailSelection = { year, month, category };
        renderDetails();
    };
    root.refreshSettlementCategoryDetails = () => { if (detailOrigin === 'chart' && detailSelection) renderDetails(); };
    if (typeof module !== 'undefined' && module.exports) module.exports = { buildDashboard, buildDetails, monthOf, buildDashboardTrendSVG };
})(typeof window !== 'undefined' ? window : globalThis);
