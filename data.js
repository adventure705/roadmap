let roadmapData = {
    createYearData: () => ({
        variableIncome: new Array(12).fill(0),
        fixedIncome: new Array(12).fill(0),
        expenses: new Array(12).fill(0),
        settlement: {
            variableIncome: new Array(12).fill(0),
            fixedIncome: new Array(12).fill(0),
            expenses: new Array(12).fill(0)
        },
        // 상세 내역 데이터
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
    categoryOperators: {},
    categoryColors: {},
    businessNames: [],
    investment: {
        subtitle: "자유로운 형식으로 투자 내역과 수입을 관리하세요.",
        block1: { title: "투자 현황 (일반)", corner: "", rows: [], cols: [], data: {}, rowColors: [], colColors: [], rowHeights: [], colWidths: [], headerHeight: 0 },
        block2Title: "투자자별 내역",
        investors: []
    },
    management: {
        block1: { title: "정보 관리 리스트", rows: ["계좌 1", "카드 1"], cols: ["구분", "번호/내용", "메모"], data: {}, rowColors: [], colColors: [], rowHeights: [], colWidths: [] }
    },
    moneyPlan: {
        title: "Money Plan 💰",
        subtitle: "연간 주요 일정 및 지출 계획을 관리하세요.",
        birthdays: [
            { name: "아버지", lunarType: "음력", lunarDate: "3월 6일", solarType: "양력", solarDate: "4월 24일" },
            { name: "이모", lunarType: "음력", lunarDate: "9월 17일", solarType: "양력", solarDate: "10월 31일" },
            { name: "어머니", lunarType: "음력", lunarDate: "11월 8일", solarType: "양력", solarDate: "12월 18일" }
        ],
        categories: ["생일", "명절", "경조금", "세금", "병원", "기타"],
        plan: { reserve: {}, monthly: {} },
        details: { monthly: {} },
        settlement: { monthly: {} }
    },
    updatedAt: 0
};

let currentYear = 2026;
let currentMonth = 0; // 0 = Jan

const FIXED_DOC_ID = 'main_roadmap_data';
let firebaseSyncStarted = false;
let isDirty = false; // Flag to track local edits before sync

function loadData() {
    try {
        if (typeof localStorage !== 'undefined') {
            const currentData = localStorage.getItem('supermoon_data');
            if (currentData) localStorage.setItem('supermoon_data_backup_last', currentData);
        }

        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('supermoon_data');
            if (saved) {
                const parsed = JSON.parse(saved);
                processParsedData(parsed);
            } else {
                if (!roadmapData.businessNames) roadmapData.businessNames = [];
            }
        }

        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            if (firebaseSyncStarted) return;
            firebaseSyncStarted = true;
            const auth = firebase.auth();
            const db = firebase.firestore();

            // Set Dirty Flag on Window for debug
            window.roadmapIsDirty = isDirty;

            auth.signInAnonymously().catch(e => console.error("Auth Failed:", e));

            auth.onAuthStateChanged(user => {
                if (user) {
                    const docRef = db.collection('roadmap').doc(FIXED_DOC_ID);

                    // Auth is ready, if we have pending changes, push them now
                    if (isDirty) {
                        console.log("🚀 Auth ready. Pushing pending changes...");
                        syncMemoryToCloud();
                    }

                    docRef.onSnapshot(doc => {
                        // If we have unsaved local changes (Dirty), we prioritize Local over Cloud (Push)
                        // UNLESS this snapshot is triggered by our own write? 
                        // Actually, if isDirty is true, it means we tried to save but maybe failed or haven't synced yet.
                        // Ideally we check timestamps, but here we assume Local Edits > Old Cloud Data on startup.

                        if (isDirty) {
                            console.log("☁️ Local changes pending. Harmonizing with Cloud...");
                            const cloudData = doc.exists ? doc.data() : null;
                            const localUpdated = roadmapData.updatedAt || 0;
                            const cloudUpdated = (cloudData && cloudData.updatedAt) ? cloudData.updatedAt : 0;

                            if (localUpdated > cloudUpdated) {
                                console.log("⬆️ Pushing newer local data to Cloud...");
                                syncMemoryToCloud();
                            } else if (cloudUpdated > localUpdated) {
                                console.log("⬇️ Cloud has newer data. Updating Local...");
                                mergeCloudData(cloudData);
                                isDirty = false;
                            }
                        } else {
                            if (doc.exists) {
                                const cloudData = doc.data();
                                const cloudUpdated = cloudData.updatedAt || 0;
                                const localUpdated = roadmapData.updatedAt || 0;

                                if (cloudUpdated > localUpdated) {
                                    console.log(`✅ Cloud updated: ${new Date(cloudUpdated).toLocaleTimeString()}`);
                                    mergeCloudData(cloudData);
                                } else if (localUpdated > cloudUpdated && localUpdated !== 0) {
                                    // This case happens if a previous push failed or was interrupted
                                    console.log("⬆️ Local is ahead of Cloud. Re-syncing...");
                                    syncMemoryToCloud();
                                }
                            } else {
                                // 문서가 존재하지 않으면 초기 데이터 생성
                                console.log("📝 Firestore 문서가 없습니다. 초기 데이터를 생성합니다...");
                                const localData = localStorage.getItem('supermoon_data');

                                if (localData) {
                                    // 로컬 스토리지에 데이터가 있으면 마이그레이션
                                    console.log("Migrating local data to Firestore...");
                                    docRef.set(JSON.parse(localData));
                                } else {
                                    // 로컬 데이터도 없으면 기본 데이터 생성
                                    console.log("Creating default data in Firestore...");
                                    const defaultData = {
                                        years: roadmapData.years,
                                        categories: roadmapData.categories,
                                        bankAccounts: roadmapData.bankAccounts,
                                        cards: roadmapData.cards,
                                        commonMemos: roadmapData.commonMemos,
                                        categoryOperators: roadmapData.categoryOperators || {},
                                        categoryColors: roadmapData.categoryColors || {},
                                        businessNames: roadmapData.businessNames || [],
                                        investment: roadmapData.investment,
                                        management: roadmapData.management || {},
                                        moneyPlan: roadmapData.moneyPlan
                                    };
                                    docRef.set(defaultData);
                                    localStorage.setItem('supermoon_data', JSON.stringify(defaultData));
                                }
                            }
                        }
                    });
                }
            });
        }
    } catch (e) {
        console.error('Storage error:', e);
        if (!roadmapData.businessNames) roadmapData.businessNames = [];
    }
}

// Helper to reuse the logic from original loadData without re-typing it all if possible, 
// but since I'm rewriting loadData, I must include the parsing logic. 
// For brevity in this tool call, I will assume 'processParsedData' is not defined and I will paste the original logic inside loadData, 
// adapted slightly to be cleaner.
// Actually, the original logic is long. I'll paste it fully.

function saveData() {
    try {
        isDirty = true;
        roadmapData.updatedAt = Date.now();

        // 1. Local Save First (Instant persistence)
        localStorage.setItem('supermoon_data', JSON.stringify(roadmapData));

        // 2. Cloud Sync
        syncMemoryToCloud();
    } catch (e) {
        console.error("Save Error:", e);
    }
}

let isSyncing = false;
function syncMemoryToCloud() {
    if (typeof firebase === 'undefined' || firebase.apps.length === 0) return;

    const auth = firebase.auth();
    const db = firebase.firestore();

    if (!auth.currentUser) {
        // Deferred save: will be picked up by onAuthStateChanged
        return;
    }

    if (isSyncing) return;
    isSyncing = true;

    const dataToSave = {
        years: roadmapData.years || {},
        categories: roadmapData.categories || {},
        bankAccounts: roadmapData.bankAccounts || {},
        cards: roadmapData.cards || {},
        commonMemos: roadmapData.commonMemos || {},
        categoryOperators: roadmapData.categoryOperators || {},
        categoryColors: roadmapData.categoryColors || {},
        businessNames: roadmapData.businessNames || [],
        investment: roadmapData.investment || {},
        management: roadmapData.management || {},
        moneyPlan: roadmapData.moneyPlan || {},
        updatedAt: roadmapData.updatedAt || 0,
        dashboardSubtitle: roadmapData.dashboardSubtitle || "자산 흐름 요약",
        pageTitles: roadmapData.pageTitles || {}
    };

    db.collection('roadmap').doc(FIXED_DOC_ID).set(dataToSave)
        .then(() => {
            console.log("✅ Firebase Sync Success: " + new Date(roadmapData.updatedAt).toLocaleTimeString());
            isDirty = false;
            isSyncing = false;
        })
        .catch(err => {
            console.error("❌ Firebase Sync Fail:", err);
            isSyncing = false;
        });
}

// Global UI Update Trigger Helper
function triggerUIUpdate() {
    if (typeof renderAllBlocks === 'function') renderAllBlocks();
    if (typeof updateUI === 'function') updateUI();
    if (typeof renderSidebar === 'function') renderSidebar(window.currentPageType);
    if (typeof updateSettlementUI === 'function') updateSettlementUI();
    if (typeof renderMoneyPlanUI === 'function') renderMoneyPlanUI();
    if (typeof renderMemos === 'function') renderMemos();
    if (typeof renderPageTitle === 'function') renderPageTitle();
}

function mergeCloudData(cloudData) {
    if (cloudData.years) roadmapData.years = cloudData.years;
    if (cloudData.categories) roadmapData.categories = cloudData.categories;
    if (cloudData.bankAccounts) roadmapData.bankAccounts = cloudData.bankAccounts;
    if (cloudData.cards) roadmapData.cards = cloudData.cards;
    if (cloudData.commonMemos) roadmapData.commonMemos = cloudData.commonMemos;
    if (cloudData.categoryOperators) roadmapData.categoryOperators = cloudData.categoryOperators;
    if (cloudData.categoryColors) roadmapData.categoryColors = cloudData.categoryColors;
    if (cloudData.businessNames) roadmapData.businessNames = cloudData.businessNames;
    if (cloudData.investment) roadmapData.investment = cloudData.investment;
    if (cloudData.management) roadmapData.management = cloudData.management;
    if (cloudData.moneyPlan) roadmapData.moneyPlan = cloudData.moneyPlan;
    if (cloudData.dashboardSubtitle) roadmapData.dashboardSubtitle = cloudData.dashboardSubtitle;
    if (cloudData.pageTitles) roadmapData.pageTitles = cloudData.pageTitles;
    roadmapData.updatedAt = cloudData.updatedAt || 0;

    // Ensure no properties are undefined
    if (!roadmapData.categoryOperators) roadmapData.categoryOperators = {};
    if (!roadmapData.categoryColors) roadmapData.categoryColors = {};
    if (!roadmapData.businessNames) roadmapData.businessNames = [];
    if (!roadmapData.management) roadmapData.management = { block1: { title: "정보 관리 리스트", rows: [], cols: [], data: {}, rowColors: [], colColors: [], rowHeights: [], colWidths: [] } };
    if (!roadmapData.pageTitles) roadmapData.pageTitles = {};

    localStorage.setItem('supermoon_data', JSON.stringify(roadmapData));
    console.log("✅ Memory updated from Firestore");
    triggerUIUpdate();
}

function processParsedData(parsed) {
    if (parsed.updatedAt) roadmapData.updatedAt = parsed.updatedAt;
    else roadmapData.updatedAt = 0;

    if (parsed.dashboardSubtitle) roadmapData.dashboardSubtitle = parsed.dashboardSubtitle;
    if (parsed.pageTitles) roadmapData.pageTitles = parsed.pageTitles;
    else roadmapData.pageTitles = {};

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
        updateSettlementUI();
    }

    // Always try to render title if the key is known or passed
    // We need to know the current 'pageKey'.
    // In financial.js derived pages, window.currentPageType is set.
    // We should encourage specific pages to set window.currentPageType or passed key.
    if (window.currentPageType) renderPageTitle(window.currentPageType);
}

// --- Page Title Editing Logic (Centralized) ---

function renderPageTitle(pageKey) {
    if (!pageKey) return;
    const titleEl = document.getElementById('pageTitle');
    if (!titleEl) return;

    // Default titles mapping for all pages
    const defaultTitles = {
        'fixed': '고정 지출 관리',
        'variable': '변동 지출 관리',
        'income': '수입 관리',
        'cash': '현금 지출 관리',
        'installment': '할부 관리',
        'business': '사업자 통합 관리',
        'dashboard': '대시보드',
        'roadmap': '단기 로드맵',
        'settlement': '지출 예정산',
        'investment': '투자 수입 관리',
        'management': '정보 관리'
    };

    const savedTitle = (roadmapData.pageTitles && roadmapData.pageTitles[pageKey])
        ? roadmapData.pageTitles[pageKey]
        : defaultTitles[pageKey];

    titleEl.innerText = savedTitle || '제목 없음';

    // Ensure standard styling
    titleEl.classList.add('cursor-pointer', 'hover:text-blue-400', 'transition');
    titleEl.title = '클릭하여 제목 수정';

    titleEl.onclick = () => togglePageTitleEdit(pageKey);
}

function togglePageTitleEdit(pageKey) {
    const titleEl = document.getElementById('pageTitle');
    if (!titleEl) return;

    const currentText = titleEl.innerText;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    // Styling to match generic H2 but editable
    input.className = 'text-2xl font-bold bg-gray-800 text-white border border-blue-500 rounded px-2 py-0.5 focus:outline-none w-auto inline-block mb-1';

    input.onblur = function () {
        const val = this.value;
        if (!roadmapData.pageTitles) roadmapData.pageTitles = {};
        roadmapData.pageTitles[pageKey] = val;
        saveData();

        const h2 = document.createElement('h2');
        h2.id = 'pageTitle';
        h2.className = 'text-2xl font-bold mb-1 cursor-pointer hover:text-blue-400 transition select-none';
        h2.innerText = val;
        h2.onclick = () => togglePageTitleEdit(pageKey);
        h2.title = '클릭하여 제목 수정';

        this.replaceWith(h2);
    };

    input.onkeydown = function (e) {
        if (e.key === 'Enter') this.blur();
    };

    titleEl.replaceWith(input);
    input.focus();
}
