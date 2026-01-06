const roadmapData = {
    createYearData: () => ({
        variableIncome: new Array(12).fill(0),
        fixedIncome: new Array(12).fill(0),
        expenses: new Array(12).fill(0),
        settlement: {
            variableIncome: new Array(12).fill(0),
            fixedIncome: new Array(12).fill(0),
            expenses: new Array(12).fill(0)
        },
        // Detailed Breakdown Data
        details: {
            income: [],      // { id, name, values: [12] }
            fixed: [],       // { id, name, values: [12] }
            variable: [],    // { id, name, values: [12] }
            installment: [], // { id, name, values: [12] }
            cash: []         // { id, name, values: [12] }
        }
    }),
    years: {
        2026: {
            variableIncome: [1500000, 3000000, 7000000, 10000000, 15000000, 20000000, 25000000, 30000000, 35000000, 40000000, 45000000, 50000000],
            fixedIncome: [2000000, 2000000, 2000000, 2000000, 2000000, 2000000, 2000000, 2000000, 2000000, 2000000, 2000000, 2000000],
            expenses: [6000000, 6000000, 6000000, 6000000, 6000000, 6000000, 6000000, 6000000, 6000000, 6000000, 6000000, 6000000],
            settlement: {
                variableIncome: new Array(12).fill(0),
                fixedIncome: new Array(12).fill(0),
                expenses: new Array(12).fill(0)
            },
            details: { income: [], fixed: [], variable: [], installment: [], cash: [] }
        }
    },
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    categories: {
        fixed: ['구독', '고정비용', '대출이자'],
        variable: ['식비', '교통비', '쇼핑'],
        income: ['월급', '부수입'],
        cash: ['용돈'],
        installment: ['가전', '가구'],
        settlement: ['식자재', '배달', '외식', '대중교통', '택시', '물품구입비', '자기계발비', '꾸밈비', '의료건강비', '사회생활비', '문화생활비', '경조사', '예비비']
    },
    bankAccounts: {
        fixed: ['국민은행', '신한은행'],
        variable: ['국민은행', '카카오뱅크'],
        income: ['국민은행'],
        cash: [],
        installment: ['현대카드', '삼성카드'], // Usually cards, but structure asks for accounts?
        settlement: []
    },
    cards: {
        fixed: ['현대카드', '삼성카드'],
        variable: ['현대카드', '삼성카드'],
        income: [],
        cash: [],
        installment: ['현대카드', '삼성카드'],
        settlement: ['현대카드', '삼성카드']
    },
    commonMemos: { fixed: [], variable: [], income: [], cash: [], installment: [], settlement: [] },
    investment: {
        subtitle: "자유로운 형식으로 투자 내역과 수입을 관리하세요.",
        block1: { title: "투자 현황 (일반)", corner: "", rows: ["매출", "영업이익"], cols: ["2026", "2027"], data: {}, rowColors: [], colColors: [], rowHeights: [], colWidths: [], headerHeight: 0 },
        block2Title: "투자자별 내역",
        investors: [
            { id: 1, name: "기본 투자자", block2: { title: "투자자별 내역", corner: "", rows: ["지분율", "배당금"], cols: ["2026", "2027"], data: {}, rowColors: [], colColors: [], rowHeights: [], colWidths: [], headerHeight: 0 } }
        ],
        selectedInvestorId: 1
    },
    moneyPlan: {
        birthdays: [
            { name: "아버지", lunarType: "음력", lunarDate: "3월 6일", solarType: "양력", solarDate: "4월 24일" },
            { name: "이모", lunarType: "음력", lunarDate: "9월 17일", solarType: "양력", solarDate: "10월 31일" },
            { name: "어머니", lunarType: "음력", lunarDate: "11월 8일", solarType: "양력", solarDate: "12월 18일" }
        ],
        categories: ["생일", "명절", "경조금", "세금", "병원", "기타"],
        title: "Money Plan 💰",
        subtitle: "연간 주요 일정 및 지출 계획을 관리하세요."
    }
};

let currentYear = 2026;
let currentMonth = 0; // 0 = Jan

function loadData() {
    try {
        if (typeof localStorage === 'undefined') return;
        const saved = localStorage.getItem('supermoon_data');
        if (saved) {
            const parsed = JSON.parse(saved);

            // Check if it's the new format (has 'years' property) or old format
            let yearsData;
            if (parsed.years) {
                yearsData = parsed.years;

                // Migrate Categories
                if (parsed.categories) {
                    if (Array.isArray(parsed.categories)) {
                        const shared = parsed.categories;
                        roadmapData.categories = {
                            fixed: [...shared], variable: [...shared], income: [...shared], cash: [...shared], installment: [...shared],
                            settlement: ['식자재', '배달', '외식', '대중교통', '택시', '물품구입비', '자기계발비', '꾸밈비', '의료건강비', '사회생활비', '문화생활비', '경조사', '예비비']
                        };
                    } else {
                        roadmapData.categories = parsed.categories;
                        if (!roadmapData.categories.settlement) {
                            roadmapData.categories.settlement = ['식자재', '배달', '외식', '대중교통', '택시', '물품구입비', '자기계발비', '꾸밈비', '의료건강비', '사회생활비', '문화생활비', '경조사', '예비비'];
                        }
                    }
                }

                // Migrate Bank Accounts
                if (parsed.bankAccounts) {
                    if (Array.isArray(parsed.bankAccounts)) {
                        const shared = parsed.bankAccounts;
                        roadmapData.bankAccounts = {
                            fixed: [...shared], variable: [...shared], income: [...shared], cash: [...shared], installment: [...shared]
                        };
                    } else {
                        roadmapData.bankAccounts = parsed.bankAccounts;
                        if (!roadmapData.bankAccounts.settlement) roadmapData.bankAccounts.settlement = [];
                    }
                }

                // Migrate Cards
                if (parsed.cards) {
                    if (Array.isArray(parsed.cards)) {
                        const shared = parsed.cards;
                        roadmapData.cards = {
                            fixed: [...shared], variable: [...shared], income: [...shared], cash: [...shared], installment: [...shared],
                            business: []
                        };
                    } else {
                        roadmapData.cards = parsed.cards;
                        if (!roadmapData.cards.settlement) roadmapData.cards.settlement = [];
                        if (!roadmapData.cards.business) roadmapData.cards.business = [];
                    }
                }

                if (parsed.commonMemos) roadmapData.commonMemos = parsed.commonMemos;
                if (parsed.categoryOperators) roadmapData.categoryOperators = parsed.categoryOperators;
                if (parsed.businessNames) roadmapData.businessNames = parsed.businessNames;
                else roadmapData.businessNames = []; // Initialize if missing

                // Migrate Investment Data
                if (parsed.investment) {
                    roadmapData.investment = parsed.investment;
                    // Compatibility check: ensure block1, block2Title and investors exist
                    if (!roadmapData.investment.block1) roadmapData.investment.block1 = { title: "투자 현황 (일반)", corner: "", rows: [], cols: [], data: {}, rowColors: [], colColors: [], rowHeights: [], colWidths: [] };
                    if (!roadmapData.investment.block1.title) roadmapData.investment.block1.title = "투자 현황 (일반)";
                    if (!roadmapData.investment.block1.corner) roadmapData.investment.block1.corner = "";
                    if (!roadmapData.investment.block1.rowColors) roadmapData.investment.block1.rowColors = [];
                    if (!roadmapData.investment.block1.colColors) roadmapData.investment.block1.colColors = [];
                    if (!roadmapData.investment.block1.rowHeights) roadmapData.investment.block1.rowHeights = [];
                    if (!roadmapData.investment.block1.colWidths) roadmapData.investment.block1.colWidths = [];
                    if (!roadmapData.investment.block1.headerHeight) roadmapData.investment.block1.headerHeight = 0;

                    if (!roadmapData.investment.block2Title) roadmapData.investment.block2Title = "투자자별 내역";
                    if (!roadmapData.investment.subtitle) roadmapData.investment.subtitle = "자유로운 형식으로 투자 내역과 수입을 관리하세요.";
                    if (!roadmapData.investment.investors) roadmapData.investment.investors = [];

                    roadmapData.investment.investors.forEach(inv => {
                        if (!inv.block2.title) inv.block2.title = "투자자별 내역";
                        if (!inv.block2.corner) inv.block2.corner = "";
                        if (!inv.block2.rowColors) inv.block2.rowColors = [];
                        if (!inv.block2.colColors) inv.block2.colColors = [];
                        if (!inv.block2.rowHeights) inv.block2.rowHeights = [];
                        if (!inv.block2.colWidths) inv.block2.colWidths = [];
                        if (!inv.block2.headerHeight) inv.block2.headerHeight = 0;
                    });
                }

                // Migrate Money Plan Data
                if (parsed.moneyPlan) {
                    roadmapData.moneyPlan = parsed.moneyPlan;
                    if (!roadmapData.moneyPlan.birthdays) {
                        roadmapData.moneyPlan.birthdays = [
                            { name: "아버지", lunarType: "음력", lunarDate: "3월 6일", solarType: "양력", solarDate: "4월 24일" },
                            { name: "이모", lunarType: "음력", lunarDate: "9월 17일", solarType: "양력", solarDate: "10월 31일" },
                            { name: "어머니", lunarType: "음력", lunarDate: "11월 8일", solarType: "양력", solarDate: "12월 18일" }
                        ];
                    }
                    if (!roadmapData.moneyPlan.categories) {
                        roadmapData.moneyPlan.categories = ["생일", "명절", "경조금", "세금", "병원", "기타"];
                    }
                    if (!roadmapData.moneyPlan.title) roadmapData.moneyPlan.title = "Money Plan 💰";
                    if (!roadmapData.moneyPlan.subtitle) roadmapData.moneyPlan.subtitle = "연간 주요 일정 및 지출 계획을 관리하세요.";
                }

                // Migrate Management Data
                if (parsed.management) {
                    roadmapData.management = parsed.management;
                    if (!roadmapData.management.block1) {
                        roadmapData.management.block1 = { title: "정보 관리 리스트", rows: ["계좌 1", "카드 1"], cols: ["구분", "번호/내용", "메모"], data: {}, rowColors: [], colColors: [], rowHeights: [], colWidths: [] };
                    }
                    if (!roadmapData.management.block1.rowColors) roadmapData.management.block1.rowColors = [];
                    if (!roadmapData.management.block1.colColors) roadmapData.management.block1.colColors = [];
                    if (!roadmapData.management.block1.rowHeights) roadmapData.management.block1.rowHeights = [];
                    if (!roadmapData.management.block1.colWidths) roadmapData.management.block1.colWidths = [];
                }
            } else {
                // Old format: parsed IS the years object
                yearsData = parsed;
                roadmapData.businessNames = []; // Initialize for old format
            }

            // Validation & Migration
            if (yearsData[2026]) {
                for (const y in yearsData) {
                    // Ensure details exist
                    if (!yearsData[y].details) {
                        yearsData[y].details = { income: [], fixed: [], variable: [], installment: [], cash: [], settlement: [], business: [] };
                    }
                    if (!yearsData[y].details.settlement) yearsData[y].details.settlement = [];
                    if (!yearsData[y].details.business) yearsData[y].details.business = []; // Ensure business exists

                    // Ensure monthlyMemos exist
                    if (!yearsData[y].monthlyMemos) {
                        yearsData[y].monthlyMemos = Array.from({ length: 12 }, () => ({
                            fixed: [], variable: [], income: [], cash: [], installment: [], settlement: [], business: []
                        }));
                    } else {
                        // Check inner keys of existing memos
                        yearsData[y].monthlyMemos.forEach(m => {
                            if (!m.settlement) m.settlement = [];
                            if (!m.business) m.business = [];
                        });
                    }
                }
                roadmapData.years = yearsData;
            }
        } else {
            // No saved data found, initialize defaults
            if (!roadmapData.businessNames) roadmapData.businessNames = [];
        }
    } catch (e) {
        console.error('Storage error:', e);
        if (!roadmapData.businessNames) roadmapData.businessNames = []; // Fallback safety
    }
}

function saveData() {
    try {
        const dataToSave = {
            years: roadmapData.years,
            categories: roadmapData.categories,
            bankAccounts: roadmapData.bankAccounts,
            cards: roadmapData.cards,
            commonMemos: roadmapData.commonMemos,
            categoryOperators: roadmapData.categoryOperators, // Persist Operators
            businessNames: roadmapData.businessNames, // Persist Business Names
            investment: roadmapData.investment, // Persist Investment Data
            management: roadmapData.management,  // Persist Management Data
            moneyPlan: roadmapData.moneyPlan    // Persist Money Plan Data
        };
        localStorage.setItem('supermoon_data', JSON.stringify(dataToSave));
    } catch (e) { }
}

// Override createYearData to include monthlyMemos
roadmapData.createYearData = () => ({
    variableIncome: new Array(12).fill(0),
    fixedIncome: new Array(12).fill(0),
    expenses: new Array(12).fill(0),
    settlement: {
        variableIncome: new Array(12).fill(0),
        fixedIncome: new Array(12).fill(0),
        expenses: new Array(12).fill(0)
    },
    details: {
        income: [], fixed: [], variable: [], installment: [], cash: [], settlement: [], business: []
    },
    // New Settlement Specific Data for Budgets and Rules
    settlementData: {
        // monthIndex : { categoryName: budgetAmount }
        budgets: Array.from({ length: 12 }, () => ({})),
        // Classification Rules: "keyword": "category"
        rules: {}
    },
    monthlyMemos: Array.from({ length: 12 }, () => ({
        fixed: [], variable: [], income: [], cash: [], installment: [], settlement: [], business: []
    })),
    moneyPlan: {
        plan: { reserve: {}, monthly: {} },
        details: { monthly: {} },
        settlement: { monthly: {} },
        rowHeights: [],
        colWidths: [],
        headerHeight: 0
    }
});

function changeYear(delta) {
    currentYear += delta;
    if (!roadmapData.years[currentYear]) {
        roadmapData.years[currentYear] = roadmapData.createYearData();
    }
    updateUI();
}

function changeMonth(delta) {
    let newMonth = currentMonth + delta;
    if (newMonth > 11) {
        currentYear++;
        currentMonth = 0;
        // Ensure year data exists
        if (!roadmapData.years[currentYear]) {
            roadmapData.years[currentYear] = roadmapData.createYearData();
        }
    } else if (newMonth < 0) {
        currentYear--;
        currentMonth = 11;
        if (!roadmapData.years[currentYear]) {
            roadmapData.years[currentYear] = roadmapData.createYearData();
        }
    } else {
        currentMonth = newMonth;
    }

    // Safely call updateUI if defined
    if (typeof updateUI === 'function') {
        updateUI();
    } else if (typeof updateSettlementUI === 'function') {
        // Fallback for settlement page if updateUI isn't globally alias yet
        updateSettlementUI();
    }
}
