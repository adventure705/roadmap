var LZString=function(){var r=String.fromCharCode,o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",e={};function t(r,o){if(!e[r]){e[r]={};for(var n=0;n<r.length;n++)e[r][r.charAt(n)]=n}return e[r][o]}var i={compressToBase64:function(r){if(null==r)return"";var n=i._compress(r,6,function(r){return o.charAt(r)});switch(n.length%4){default:case 0:return n;case 1:return n+"===";case 2:return n+"==";case 3:return n+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(n){return t(o,r.charAt(n))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(r){return null==r?"":""==r?null:i._decompress(r.length,16384,function(o){return r.charCodeAt(o)-32})},compressToUint8Array:function(r){for(var o=i.compress(r),n=new Uint8Array(2*o.length),e=0,t=o.length;e<t;e++){var s=o.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null==o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;e<t;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(r){return null==r?"":i._compress(r,6,function(r){return n.charAt(r)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(o){return t(n,r.charAt(o))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(r,o,n){if(null==r)return"";var e,t,i,s={},u={},a="",p="",c="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<r.length;i+=1)if(a=r.charAt(i),Object.prototype.hasOwnProperty.call(s,a)||(s[a]=f++,u[a]=!0),p=c+a,Object.prototype.hasOwnProperty.call(s,p))c=p;else{if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++),s[p]=f++,c=String(a)}if(""!==c){if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==o-1){d.push(n(m));break}v++}return d.join("")},decompress:function(r){return null==r?"":""==r?null:i._decompress(r.length,32768,function(o){return r.charCodeAt(o)})},_decompress:function(o,n,e){var t,i,s,u,a,p,c,l=[],f=4,h=4,d=3,m="",v=[],g={val:e(0),position:n,index:1};for(t=0;t<3;t+=1)l[t]=t;for(s=0,a=Math.pow(2,2),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 2:return""}for(l[3]=c,i=c,v.push(c);;){if(g.index>o)return"";for(s=0,a=Math.pow(2,d),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(c=s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 2:return v.join("")}if(0==f&&(f=Math.pow(2,d),d++),l[c])m=l[c];else{if(c!==h)return null;m=i+i.charAt(0)}v.push(m),l[h++]=i+m.charAt(0),i=m,0==--f&&(f=Math.pow(2,d),d++)}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module?module.exports=LZString:"undefined"!=typeof angular&&null!=angular&&angular.module("LZString",[]).factory("LZString",function(){return LZString});
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
            other_income: [], // { id, name, values: [12] }
            installment: [], // { id, name, values: [12] }
            cash: [],        // { id, name, values: [12] }
            settlement: [],
            business: []
        },
        monthlyMemos: Array.from({ length: 12 }, () => ({
            fixed: [], variable: [], other_income: [], income: [], cash: [], installment: [], settlement: [], business: [],
            investment: [], tax_management: [], roadmap: [], management: [], secret_board: [], moneyPlan: [], dashboard: []
        }))
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
            details: { income: [], fixed: [], variable: [], other_income: [], installment: [], cash: [], settlement: [], business: [] },
            monthlyMemos: Array.from({ length: 12 }, () => ({
                fixed: [], variable: [], other_income: [], income: [], cash: [], installment: [], settlement: [], business: [],
                investment: [], tax_management: [], roadmap: [], management: [], secret_board: [], moneyPlan: [], dashboard: []
            }))
        }
    },
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    categories: {
        fixed: ['구독', '고정비용', '대출이자'],
        variable: ['식비', '교통비', '쇼핑'],
        other_income: ['기타 수입'],
        income: ['월급', '부수입'],
        cash: ['용돈'],
        installment: ['가전', '가구'],
        settlement: ['식자재', '배달', '외식', '대중교통', '택시', '물품구입비', '자기계발비', '꾸밈비', '의료건강비', '사회생활비', '문화생활비', '경조사', '예비비']
    },
    bankAccounts: {
        fixed: ['국민은행', '신한은행'],
        variable: ['국민은행', '카카오뱅크'],
        other_income: ['국민은행'],
        income: ['국민은행'],
        cash: [],
        installment: ['현대카드', '삼성카드'], // Usually cards, but structure asks for accounts?
        settlement: []
    },
    cards: {
        fixed: ['현대카드', '삼성카드'],
        variable: ['현대카드', '삼성카드'],
        other_income: [],
        income: [],
        cash: [],
        installment: ['현대카드', '삼성카드'],
        settlement: ['현대카드', '삼성카드']
    },
    commonMemos: {
        fixed: [], variable: [], other_income: [], income: [], cash: [], installment: [], settlement: [],
        business: [], investment: [], tax_management: [], roadmap: [], management: [], secret_board: [], moneyPlan: [], dashboard: []
    },
    categoryOperators: {},
    categoryColors: {},
    businessNames: [],
    investment: {
        subtitle: "자유로운 형식으로 투자 내역과 수입을 관리하세요.",
        block1: { title: "투자 현황 (일반)", corner: "", rows: [], cols: [], data: {}, rowColors: [], colColors: [], rowHeights: [], colWidths: [], headerHeight: 0 },
        block2Title: "투자자별 내역",
        investors: []
    },
    tax_management: {
        subtitle: "세금 납부 및 환급 내역을 체계적으로 관리하세요.",
        block1: { title: "세금 관리 (일반)", corner: "", rows: [], cols: [], data: {}, rowColors: [], colColors: [], rowHeights: [], colWidths: [], headerHeight: 0 },
        block2Title: "세부 내역",
        investors: [
            { id: 1, name: "기본 관리자", years: {} }
        ],
        selectedInvestorId: 1,
        currentYear: 2026
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
    dashboardSubtitle: "자산 흐름 요약",
    pageTitles: {
        'tax_management': '세금 관리'
    },
    sidebarConfig: null, // 초기에는 null로 두어 클라우드 데이터 대기
    memoPage: { common: [], yearly: {}, subtitle: "공통 메모와 연도별 메모를 자유롭게 관리하세요." },
    updatedAt: 0
};

let isCloudSyncComplete = false; // 클라우드 데이터 수신 여부 확인용

let currentYear = 2026;
let currentMonth = 0; // 0 = Jan

const FIXED_DOC_ID = 'main_roadmap_data';
let firebaseSyncStarted = false;
let isDirty = false; // Flag to track local edits before sync

function loadData() {
    try {
        if (typeof localStorage !== 'undefined') {
            const lzSaved = localStorage.getItem('supermoon_data_lz');
            const saved = localStorage.getItem('supermoon_data');
            
            // Backup the old uncompressed just in case, only if we haven't already migrated
            if (saved && !lzSaved) {
                localStorage.setItem('supermoon_data_backup_last', saved);
            }

            if (lzSaved) {
                try {
                    const parsed = JSON.parse(LZString.decompressFromUTF16(lzSaved));
                    processParsedData(parsed);
                } catch(e) { console.error("LZ Decompress error", e); }
            } else if (saved) {
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
                    const docRefV2 = db.collection('roadmap').doc('main_roadmap_data_v2');
                    const docRefV1 = db.collection('roadmap').doc(FIXED_DOC_ID);

                    // Auth is ready, if we have pending changes, push them now
                    if (isDirty) {
                        console.log("🚀 Auth ready. Pushing pending changes...");
                        syncMemoryToCloud();
                    }

                    docRefV2.onSnapshot(docV2 => {
                        isCloudSyncComplete = true; // 클라우드와 연결 확인됨

                        // If we have unsaved local changes (Dirty), we prioritize Local over Cloud (Push)
                        if (isDirty) {
                            console.log("☁️ Local changes pending. Harmonizing with Cloud...");
                            const cloudData = docV2.exists ? JSON.parse(LZString.decompressFromUTF16(docV2.data().compressedData)) : null;
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
                            if (docV2.exists) {
                                try {
                                    const cloudData = JSON.parse(LZString.decompressFromUTF16(docV2.data().compressedData));
                                    const cloudUpdated = cloudData.updatedAt || 0;
                                    const localUpdated = roadmapData.updatedAt || 0;

                                    if (cloudUpdated > localUpdated) {
                                        console.log(`✅ Cloud updated (V2): ${new Date(cloudUpdated).toLocaleTimeString()}`);
                                        mergeCloudData(cloudData);
                                    } else if (localUpdated > cloudUpdated && localUpdated !== 0) {
                                        console.log("⬆️ Local is ahead of Cloud. Re-syncing...");
                                        syncMemoryToCloud();
                                    }
                                } catch(e) {
                                    console.error("Failed to parse V2 cloud data", e);
                                }
                            } else {
                                // V2 문서가 없으면 V1 문서를 확인하여 마이그레이션
                                console.log("📝 V2 문서가 없습니다. V1 데이터를 확인하여 마이그레이션합니다...");
                                docRefV1.get().then(docV1 => {
                                    if (docV1.exists) {
                                        console.log("Migrating V1 cloud data to V2...");
                                        const cloudDataV1 = docV1.data();
                                        mergeCloudData(cloudDataV1);
                                        // 강제로 업데이트 시간을 최신으로 갱신 후 V2에 저장
                                        roadmapData.updatedAt = Date.now();
                                        syncMemoryToCloud();
                                    } else {
                                        // V1도 없으면 완전 초기 데이터 생성
                                        console.log("Creating default data in Firestore (V2)...");
                                        const localData = localStorage.getItem('supermoon_data');
                                        if (localData) {
                                            roadmapData.updatedAt = Date.now();
                                            syncMemoryToCloud();
                                        } else {
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
                                                tax_management: roadmapData.tax_management,
                                                management: roadmapData.management || {},
                                                moneyPlan: roadmapData.moneyPlan,
                                                sidebarConfig: roadmapData.sidebarConfig || null,
                                                updatedAt: Date.now()
                                            };
                                            roadmapData = {...roadmapData, ...defaultData};
                                            localStorage.setItem('supermoon_data', JSON.stringify(defaultData));
                                            syncMemoryToCloud();
                                        }
                                    }
                                });
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

const MAX_HISTORY_ITEMS = 20;

function saveData(forceHistory = false) {
    try {
        // 0. Integrity Check
        if (!roadmapData.memoPage || !Array.isArray(roadmapData.memoPage.common)) {
            console.error("CRITICAL: Data integrity check failed during save. Aborting to protect data.");
            return;
        }

        isDirty = true;
        roadmapData.updatedAt = Date.now();
        const dataStr = JSON.stringify(roadmapData);
        const compressed = LZString.compressToUTF16(dataStr);

        // 1. Local Save First (Instant persistence)
        try {
            localStorage.setItem('supermoon_data_lz', compressed);
            localStorage.removeItem('supermoon_data'); // Delete old uncompressed to free space if successful
            // Backup
            localStorage.setItem('supermoon_data_backup_last', dataStr); // Immediate Backup
        } catch(e) {
            if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
                alert("⚠️ 경고: 데이터 용량이 가득 차서 저장되지 않았습니다! 기존 데이터를 백업하고 불필요한 데이터를 지워주세요.");
            }
            throw e;
        }

        // 2. History Management (Time Machine)
        try {
            const now = Date.now();
            let history = JSON.parse(localStorage.getItem('supermoon_history') || '[]');

            // Save snapshot if last save was > 5 minutes ago OR history is empty OR Forced (Ctrl+S)
            const lastSave = history.length > 0 ? history[history.length - 1].timestamp : 0;
            if (forceHistory || now - lastSave > 5 * 60 * 1000) {
                // history에는 압축된 데이터를 넣어서 용량 확보
                history.push({ timestamp: now, data: compressed, isCompressed: true, summary: forceHistory ? "수동 저장 (Ctrl+S)" : new Date(now).toLocaleTimeString() });
                if (history.length > MAX_HISTORY_ITEMS) history.shift(); // Remove oldest
                localStorage.setItem('supermoon_history', JSON.stringify(history));
                console.log("🕒 History snapshot saved.");
            }
        } catch (e) { console.error("History save failed", e); }

        // 3. Cloud Sync
        syncMemoryToCloud();
    } catch (e) {
        console.error("Save Error:", e);
    }
}
// Global Ctrl+S Handler
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveData(true); // Force history snapshot

        // Visual Feedback
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-xl z-[9999] animate-in slide-in-from-bottom duration-300';
        toast.innerText = '✅ 저장 및 타임머신 기록 완료';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
});

// Data Export
window.exportDataToFile = function () {
    const dataStr = JSON.stringify(roadmapData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;

    a.href = url;
    a.download = `supermoon_backup_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("데이터 백업 파일이 다운로드 되었습니다.\nPC에 안전하게 보관하세요.");
};

// Data Import
window.importDataFromFile = function (inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (confirm("이 파일로 데이터를 복원하시겠습니까?\n현재 데이터가 덮어씌워집니다.")) {
                // Restore logic
                processParsedData(importedData);
                saveData(); // Save immediately
                alert("복원이 완료되었습니다.");
                location.reload();
            }
        } catch (err) {
            alert("파일을 읽는 중 오류가 발생했습니다: " + err.message);
        }
    };
    reader.readAsText(file);
};

let isSyncing = false;
function syncMemoryToCloud() {
    if (typeof firebase === 'undefined' || firebase.apps.length === 0) return;

    const auth = firebase.auth();
    const db = firebase.firestore();

    if (!auth.currentUser) {
        // Deferred save: will be picked up by onAuthStateChanged
        return;
    }

    if (!isCloudSyncComplete) {
        console.warn("⚠️ Cloud sync not complete. Delaying syncMemoryToCloud...");
        return;
    }

    if (isSyncing) return;
    isSyncing = true;

    const dataToSaveObj = {
        years: roadmapData.years || {},
        categories: roadmapData.categories || {},
        bankAccounts: roadmapData.bankAccounts || {},
        cards: roadmapData.cards || {},
        commonMemos: roadmapData.commonMemos || {},
        categoryOperators: roadmapData.categoryOperators || {},
        categoryColors: roadmapData.categoryColors || {},
        businessNames: roadmapData.businessNames || [],
        investment: roadmapData.investment || {},
        tax_management: roadmapData.tax_management || {},
        management: roadmapData.management || {},
        moneyPlan: roadmapData.moneyPlan || {},
        memoPage: roadmapData.memoPage || { common: [], yearly: {}, subtitle: "공통 메모와 연도별 메모를 자유롭게 관리하세요." },
        updatedAt: roadmapData.updatedAt || 0,
        pageTitles: roadmapData.pageTitles || {}
    };

    if (roadmapData.sidebarConfig) {
        dataToSaveObj.sidebarConfig = roadmapData.sidebarConfig;
    }

    const compressedStr = LZString.compressToUTF16(JSON.stringify(dataToSaveObj));
    const dataToSave = {
        compressedData: compressedStr,
        updatedAt: roadmapData.updatedAt || 0
    };

    db.collection('roadmap').doc('main_roadmap_data_v2').set(dataToSave, { merge: true })
        .then(() => {
            console.log("✅ Firebase Sync Success (V2): " + new Date(roadmapData.updatedAt).toLocaleTimeString());
            isDirty = false;
            isSyncing = false;
        })
        .catch(err => {
            console.error("❌ Firebase Sync Fail:", err);
            isSyncing = false;
            if(err.code === 'resource-exhausted' || err.message.includes('quota')) {
                alert("⚠️ Firebase 용량이 초과되어 동기화에 실패했습니다.");
            }
        });
}
// History UI
window.openBackupCenter = function () {
    // Check if modal exists
    let modal = document.getElementById('backupCenterModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'backupCenterModal';
        modal.className = 'fixed inset-0 bg-black/80 hidden items-center justify-center z-[200] backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-gray-900 border border-white/10 p-6 rounded-2xl w-[90%] max-w-lg shadow-2xl relative">
                <button onclick="document.getElementById('backupCenterModal').style.display='none'" class="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                <h2 class="text-xl font-bold mb-6 text-white flex items-center gap-2">🛡️ 데이터 백업 센터</h2>
                
                <div class="space-y-6">
                    <!-- File Backup -->
                    <div class="bg-gray-800/50 p-4 rounded-xl border border-white/5">
                        <h3 class="font-bold text-gray-300 mb-2">💾 파일 백업</h3>
                        <p class="text-xs text-gray-500 mb-4">현재 데이터를 내 컴퓨터에 파일로 저장합니다.</p>
                        <div class="flex gap-2">
                            <button onclick="exportDataToFile()" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-bold transition">
                                파일로 저장하기 (다운로드)
                            </button>
                            <label class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-bold transition cursor-pointer text-center">
                                파일 불러오기
                                <input type="file" onchange="importDataFromFile(this)" class="hidden" accept=".json">
                            </label>
                        </div>
                    </div>

                    <!-- Time Machine -->
                    <div class="bg-gray-800/50 p-4 rounded-xl border border-white/5">
                        <h3 class="font-bold text-yellow-500 mb-2">⏰ 타임머신 (자동 저장 기록)</h3>
                        <p class="text-xs text-gray-500 mb-4">최근 자동 저장된 시점으로 데이터를 되돌립니다.</p>
                        <ul id="historyList" class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                            <li class="text-center text-gray-500 text-sm py-2">저장된 기록이 없습니다.</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Render History List
    const listEl = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('supermoon_history') || '[]');

    if (history.length === 0) {
        listEl.innerHTML = '<li class="text-center text-gray-500 text-sm py-2">저장된 기록이 없습니다.</li>';
    } else {
        listEl.innerHTML = history.slice().reverse().map((item, idx) => `
            <li class="flex justify-between items-center bg-gray-900/50 p-3 rounded border border-white/5 hover:bg-gray-800 transition">
                <div class="flex flex-col">
                    <span class="text-sm text-gray-300 font-bold">${item.summary || new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span class="text-xs text-gray-500">${new Date(item.timestamp).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</span>
                </div>
                <button onclick="restoreHistoryItem(${item.timestamp})" class="text-xs bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded transition">
                    되돌리기
                </button>
            </li>
        `).join('');
    }

    modal.style.display = 'flex';
};

window.restoreHistoryItem = function (timestamp) {
    if (!confirm("정말로 이 시점으로 되돌리시겠습니까?
현재 데이터는 덮어씌워집니다.")) return;

    const history = JSON.parse(localStorage.getItem('supermoon_history') || '[]');
    const target = history.find(h => h.timestamp === timestamp);

    if (target) {
        try {
            const parsed = JSON.parse(target.isCompressed ? LZString.decompressFromUTF16(target.data) : target.data);
            processParsedData(parsed);
            saveData();
            alert("복구되었습니다.");
            location.reload();
        } catch (e) {
            alert("복구 실패: " + e.message);
        }
    }
};
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
    if (cloudData.tax_management) roadmapData.tax_management = cloudData.tax_management;
    if (cloudData.management) roadmapData.management = cloudData.management;
    if (cloudData.moneyPlan) roadmapData.moneyPlan = cloudData.moneyPlan;
    if (cloudData.dashboardSubtitle) roadmapData.dashboardSubtitle = cloudData.dashboardSubtitle;
    if (cloudData.pageTitles) roadmapData.pageTitles = cloudData.pageTitles;
    if (cloudData.sidebarConfig) roadmapData.sidebarConfig = cloudData.sidebarConfig;
    if (cloudData.memoPage) roadmapData.memoPage = cloudData.memoPage;
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

    if (parsed.sidebarConfig) {
        roadmapData.sidebarConfig = parsed.sidebarConfig;
    } else {
        // Fallback to legacy sidebar_config if missing in supermoon_data
        const legacy = localStorage.getItem('sidebar_config');
        if (legacy) {
            try { roadmapData.sidebarConfig = JSON.parse(legacy); } catch (e) { }
        }
    }

    // Migration for Sidebar: Ensure new items exist in loaded config
    if (roadmapData.sidebarConfig) {
        const config = roadmapData.sidebarConfig;
        const checkAndAdd = (id, newItem, anchorId = null) => {
            if (!config.find(item => item.id === id)) {
                const idx = anchorId ? config.findIndex(item => item.id === anchorId) : -1;
                if (idx !== -1) config.splice(idx + 1, 0, newItem);
                else config.push(newItem);
            }
        };
        checkAndAdd('moneyPlan', { type: 'item', id: 'moneyPlan', label: '머니 플랜', icon: '💰', link: 'money_plan.html' }, 'roadmap');
        checkAndAdd('settlement', { type: 'item', id: 'settlement', label: '지출 예정산', icon: '💰', link: 'settlement.html' }, 'cash');
        if (!config.find(item => item.id === 'business')) {
            config.push({ type: 'header', label: '사업 관리' });
            config.push({ type: 'item', id: 'business', label: '사업 관리', icon: '💼', link: 'business.html' });
        }
        checkAndAdd('investment', { type: 'item', id: 'investment', label: '투자 수입', icon: '📈', link: 'investment.html' }, 'income');
        checkAndAdd('other_income', { type: 'item', id: 'other_income', label: '기타 수입', icon: '📥', link: 'other_income.html' }, 'income');
        checkAndAdd('secret_board', { type: 'item', id: 'secret_board', label: '시크릿 보드', icon: '🚩', link: 'secret_board.html' }, 'investment');
        if (!config.find(item => item.id === 'management')) {
            config.push({ type: 'header', label: '정보 관리' });
            config.push({ type: 'item', id: 'management', label: '정보 관리', icon: '📋', link: 'management.html' });
        }
    }

    // Check if it's the new format (has 'years' property) or old format
    let yearsData;
    if (parsed.years) {
        yearsData = parsed.years;

        // Migrate Categories
        if (parsed.categories) {
            if (Array.isArray(parsed.categories)) {
                const shared = parsed.categories;
                roadmapData.categories = {
                    fixed: [...shared], variable: [...shared], other_income: [...shared], income: [...shared], cash: [...shared], installment: [...shared],
                    settlement: ['식자재', '배달', '외식', '대중교통', '택시', '물품구입비', '자기계발비', '꾸밈비', '의료건강비', '사회생활비', '문화생활비', '경조사', '예비비']
                };
            } else {
                roadmapData.categories = parsed.categories;
            }
        }

        // Category Integrity Checks (Always run)
        {
            const defaults = {
                settlement: ['식자재', '배달', '외식', '대중교통', '택시', '물품구입비', '자기계발비', '꾸밈비', '의료건강비', '사회생활비', '문화생활비', '경조사', '예비비'],
                other_income: ['기타 수입'],
                income: ['월급', '부수입'],
                fixed: ['구독', '고정비용', '대출이자'],
                variable: ['식비', '교통비', '쇼핑'],
                cash: ['용돈'],
                installment: ['가전', '가구']
            };
            if (!roadmapData.categories) roadmapData.categories = {};
            if (!roadmapData.categories.settlement || roadmapData.categories.settlement.length === 0) roadmapData.categories.settlement = defaults.settlement;
            if (!roadmapData.categories.other_income || roadmapData.categories.other_income.length === 0) roadmapData.categories.other_income = defaults.other_income;
            if (!roadmapData.categories.income || roadmapData.categories.income.length === 0) roadmapData.categories.income = defaults.income;
            if (!roadmapData.categories.fixed || roadmapData.categories.fixed.length === 0) roadmapData.categories.fixed = defaults.fixed;
            if (!roadmapData.categories.variable || roadmapData.categories.variable.length === 0) roadmapData.categories.variable = defaults.variable;
            if (!roadmapData.categories.cash || roadmapData.categories.cash.length === 0) roadmapData.categories.cash = defaults.cash;
            if (!roadmapData.categories.installment || roadmapData.categories.installment.length === 0) roadmapData.categories.installment = defaults.installment;
        }

        // Migrate Bank Accounts
        if (parsed.bankAccounts) {
            if (Array.isArray(parsed.bankAccounts)) {
                const shared = parsed.bankAccounts;
                roadmapData.bankAccounts = {
                    fixed: [...shared], variable: [...shared], other_income: [...shared], income: [...shared], cash: [...shared], installment: [...shared]
                };
            } else {
                roadmapData.bankAccounts = parsed.bankAccounts;
            }
        }

        // Bank Accounts Integrity Checks (Always run)
        {
            const defaults = {
                other_income: ['국민은행'],
                income: ['국민은행'],
                fixed: ['국민은행', '신한은행'],
                variable: ['국민은행', '카카오뱅크'],
                installment: ['현대카드', '삼성카드']
            };
            if (!roadmapData.bankAccounts) roadmapData.bankAccounts = {};
            if (!roadmapData.bankAccounts.settlement) roadmapData.bankAccounts.settlement = [];
            if (!roadmapData.bankAccounts.other_income || roadmapData.bankAccounts.other_income.length === 0) roadmapData.bankAccounts.other_income = defaults.other_income;
            if (!roadmapData.bankAccounts.income || roadmapData.bankAccounts.income.length === 0) roadmapData.bankAccounts.income = defaults.income;
            if (!roadmapData.bankAccounts.fixed || roadmapData.bankAccounts.fixed.length === 0) roadmapData.bankAccounts.fixed = defaults.fixed;
            if (!roadmapData.bankAccounts.variable || roadmapData.bankAccounts.variable.length === 0) roadmapData.bankAccounts.variable = defaults.variable;
            if (!roadmapData.bankAccounts.cash) roadmapData.bankAccounts.cash = [];
            if (!roadmapData.bankAccounts.installment || roadmapData.bankAccounts.installment.length === 0) roadmapData.bankAccounts.installment = defaults.installment;
        }

        // Migrate Cards
        if (parsed.cards) {
            if (Array.isArray(parsed.cards)) {
                const shared = parsed.cards;
                roadmapData.cards = {
                    fixed: [...shared], variable: [...shared], other_income: [...shared], income: [...shared], cash: [...shared], installment: [...shared],
                    business: []
                };
            } else {
                roadmapData.cards = parsed.cards;
            }
        }

        // Cards Integrity Checks (Always run)
        {
            const defaults = {
                settlement: ['현대카드', '삼성카드'],
                fixed: ['현대카드', '삼성카드'],
                variable: ['현대카드', '삼성카드'],
                installment: ['현대카드', '삼성카드']
            };
            if (!roadmapData.cards) roadmapData.cards = {};
            if (!roadmapData.cards.settlement || roadmapData.cards.settlement.length === 0) roadmapData.cards.settlement = defaults.settlement;
            if (!roadmapData.cards.business) roadmapData.cards.business = [];
            if (!roadmapData.cards.other_income) roadmapData.cards.other_income = [];
            if (!roadmapData.cards.income) roadmapData.cards.income = [];
            if (!roadmapData.cards.cash) roadmapData.cards.cash = [];
            if (!roadmapData.cards.fixed || roadmapData.cards.fixed.length === 0) roadmapData.cards.fixed = defaults.fixed;
            if (!roadmapData.cards.variable || roadmapData.cards.variable.length === 0) roadmapData.cards.variable = defaults.variable;
            if (!roadmapData.cards.installment || roadmapData.cards.installment.length === 0) roadmapData.cards.installment = defaults.installment;
        }

        if (parsed.commonMemos) roadmapData.commonMemos = parsed.commonMemos;
        if (parsed.categoryOperators) roadmapData.categoryOperators = parsed.categoryOperators;
        if (parsed.categoryColors) roadmapData.categoryColors = parsed.categoryColors;
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

        // Migrate Tax Management Data
        if (parsed.tax_management) {
            roadmapData.tax_management = parsed.tax_management;
            if (!roadmapData.tax_management.block1) roadmapData.tax_management.block1 = { title: "세금 관리 (일반)", rows: ["항목 1"], cols: ["구분 1"], data: {}, rowColors: [], colColors: [], rowHeights: [], colWidths: [] };
            if (!roadmapData.tax_management.block2Title) roadmapData.tax_management.block2Title = "세부 내역";
            if (!roadmapData.tax_management.subtitle) roadmapData.tax_management.subtitle = "세금 납부 및 환급 내역을 체계적으로 관리하세요.";
            if (!roadmapData.tax_management.investors) roadmapData.tax_management.investors = [
                { id: 1, name: "기본 관리자", block2: { rows: ["세부 항목 1"], cols: ["구분 1"], data: {} }, years: {} }
            ];
            if (!roadmapData.tax_management.currentYear) roadmapData.tax_management.currentYear = 2026;

            // Ensure investors have years object
            roadmapData.tax_management.investors.forEach(inv => {
                if (!inv.years) inv.years = {};
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

        // Migrate Memo Page Data
        if (parsed.memoPage) {
            roadmapData.memoPage = parsed.memoPage;
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
                yearsData[y].details = { income: [], fixed: [], variable: [], other_income: [], installment: [], cash: [], settlement: [], business: [] };
            }
            if (!yearsData[y].details.other_income) yearsData[y].details.other_income = [];
            if (!yearsData[y].details.settlement) yearsData[y].details.settlement = [];
            if (!yearsData[y].details.business) yearsData[y].details.business = []; // Ensure business exists

            // Ensure monthlyMemos exist and are in the correct format (12-slot array)
            const oldMemos = yearsData[y].monthlyMemos;
            if (!oldMemos) {
                yearsData[y].monthlyMemos = Array.from({ length: 12 }, () => ({
                    fixed: [], variable: [], other_income: [], income: [], cash: [], installment: [], settlement: [], business: [],
                    investment: [], roadmap: [], management: [], secret_board: [], moneyPlan: [], dashboard: []
                }));
            } else if (!Array.isArray(oldMemos) && typeof oldMemos === 'object') {
                // Migrate from Object Keyed by month names ("1월"...) to Array
                const newMemosArr = Array.from({ length: 12 }, () => ({
                    fixed: [], variable: [], other_income: [], income: [], cash: [], installment: [], settlement: [], business: [],
                    investment: [], roadmap: [], management: [], secret_board: [], moneyPlan: [], dashboard: []
                }));
                roadmapData.months.forEach((monthName, idx) => {
                    if (oldMemos[monthName]) {
                        newMemosArr[idx] = oldMemos[monthName];
                    }
                });
                yearsData[y].monthlyMemos = newMemosArr;
            } else if (Array.isArray(oldMemos)) {
                // Ensure all keys exist in each slot
                oldMemos.forEach(m => {
                    const keys = ['fixed', 'variable', 'other_income', 'income', 'cash', 'installment', 'settlement', 'business', 'investment', 'tax_management', 'roadmap', 'management', 'secret_board', 'moneyPlan', 'dashboard'];
                    keys.forEach(k => { if (!m[k]) m[k] = []; });
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
        income: [], fixed: [], variable: [], other_income: [], installment: [], cash: [], settlement: [], business: []
    },
    // New Settlement Specific Data for Budgets and Rules
    settlementData: {
        // monthIndex : { categoryName: budgetAmount }
        budgets: Array.from({ length: 12 }, () => ({})),
        // Classification Rules: "keyword": "category"
        rules: {}
    },
    monthlyMemos: Array.from({ length: 12 }, () => ({
        fixed: [], variable: [], other_income: [], income: [], cash: [], installment: [], settlement: [], business: [],
        investment: [], roadmap: [], management: [], secret_board: [], moneyPlan: [], dashboard: []
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
        'other_income': '기타 수입 관리',
        'income': '수입 관리',
        'cash': '현금 지출 관리',
        'installment': '할부 관리',
        'business': '사업자 통합 관리',
        'dashboard': '대시보드',
        'roadmap': '단기 로드맵',
        'settlement': '지출 예정산',
        'investment': '투자 수입 관리',
        'management': '정보 관리',
        'memo': '메모 관리'
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

// Emergency Recovery Tools
window.diagnoseData = function () {
    const local = localStorage.getItem('supermoon_data');
    const backup = localStorage.getItem('supermoon_data_backup_last');

    let msg = "진단 결과:\n";

    // Memory
    msg += `현재 메모리: Common(${roadmapData.memoPage?.common?.length || 0}), Yearly(${Object.keys(roadmapData.memoPage?.yearly || {}).length})\n`;

    // LocalStorage
    if (local) {
        try {
            const p = JSON.parse(local);
            msg += `로컬 저장소: Common(${p.memoPage?.common?.length || 0}), Yearly(${Object.keys(p.memoPage?.yearly || {}).length})\n`;
        } catch (e) { msg += "로컬 저장소: 파싱 에러\n"; }
    } else {
        msg += "로컬 저장소: 없음\n";
    }

    // Backup
    if (backup) {
        try {
            const b = JSON.parse(backup);
            msg += `백업 저장소: Common(${b.memoPage?.common?.length || 0}), Yearly(${Object.keys(b.memoPage?.yearly || {}).length})\n`;
        } catch (e) { msg += "백업 저장소: 파싱 에러\n"; }
    } else {
        msg += "백업 저장소: 없음\n";
    }

    alert(msg);
};

window.tryRestoreBackup = function () {
    const backup = localStorage.getItem('supermoon_data_backup_last');
    if (!backup) {
        alert("복구할 백업 데이터가 없습니다.");
        return;
    }

    if (confirm("백업 데이터로 복원하시겠습니까? 현재 데이터는 덮어씌워집니다.")) {
        try {
            const parsed = JSON.parse(backup);
            // Manually merge crucial data
            if (parsed.memoPage) roadmapData.memoPage = parsed.memoPage;
            // Add other critical restorations if needed

            saveData(); // Save normalized data
            alert("복원 완료. 페이지를 새로고침합니다.");
            location.reload();
        } catch (e) {
            alert("복원 중 오류: " + e.message);
        }
    }
};

window.forcePullFromCloud = function () {
    if (typeof firebase === 'undefined') {
        alert("클라우드 연결이 되어있지 않습니다.");
        return;
    }

    if (confirm("클라우드 데이터를 강제로 내려받으시겠습니까? 로컬 데이터가 덮어씌워집니다.")) {
        const db = firebase.firestore();
        db.collection('roadmap').doc(FIXED_DOC_ID).get().then(doc => {
            if (doc.exists) {
                const cloudData = doc.data();
                console.log("⬇️ Forced Pull from Cloud...");
                // Verify cloud data integrity before merging
                if (cloudData.memoPage && (cloudData.memoPage.common.length > 0 || Object.keys(cloudData.memoPage.yearly).length > 0)) {
                    console.log(`Cloud has data: Common(${cloudData.memoPage.common.length}), Yearly(${Object.keys(cloudData.memoPage.yearly).length})`);
                } else {
                    console.warn("Cloud appears to look empty too?");
                }

                mergeCloudData(cloudData);
                saveData(); // Persist immediately
                alert("클라우드 데이터 동기화 완료. 페이지가 새로고침됩니다.");
                location.reload();
            } else {
                alert("클라우드에 데이터가 없습니다.");
            }
        }).catch(err => alert("클라우드 오류: " + err.message));
    }
};

window.inspectCloudData = function () {
    if (typeof firebase === 'undefined') { alert("연결 안됨"); return; }
    firebase.firestore().collection('roadmap').doc(FIXED_DOC_ID).get().then(doc => {
        if (doc.exists) {
            const d = doc.data();
            console.log("=== Cloud Data Inspection ===");
            console.log("Updated At:", new Date(d.updatedAt).toLocaleString());
            console.log("Memos (Common):", d.memoPage?.common?.length || 0);
            console.log("Memos (Yearly):", Object.keys(d.memoPage?.yearly || {}).length);
            alert(`클라우드 데이터 확인:\n수정일: ${new Date(d.updatedAt).toLocaleString()}\n공통메모: ${d.memoPage?.common?.length}개\n연도별메모: ${Object.keys(d.memoPage?.yearly || {}).length}개\n\n복구하려면 forcePullFromCloud() 를 실행하세요.`);
        } else {
            alert("문서 없음");
        }
    });
};

window.deepScanRecovery = function (keyword) {
    const local = localStorage.getItem('supermoon_data');
    const backup = localStorage.getItem('supermoon_data_backup_last');

    console.log("=== Deep Scan Report ===");
    if (local && local.includes(keyword)) console.log("Found keyword in LocalStorage!");
    else console.log("Keyword NOT found in LocalStorage.");

    if (backup && backup.includes(keyword)) console.log("Found keyword in Backup!");
    else console.log("Keyword NOT found in Backup.");

    // Dump raw sizes
    console.log("Local Size:", local ? local.length : 0);
    console.log("Backup Size:", backup ? backup.length : 0);

    // Try to extract memo-like structures regex
    const regex = /"title":"([^"]+)","content":"([^"]*)"/g;
    let match;
    console.log("--- Extracted Local Memos ---");
    if (local) {
        while ((match = regex.exec(local)) !== null) {
            console.log(`Found: [${match[1]}] ${match[2].substring(0, 20)}...`);
        }
    }

    console.log("--- Extracted Backup Memos ---");
    if (backup) {
        while ((match = regex.exec(backup)) !== null) {
            console.log(`Found: [${match[1]}] ${match[2].substring(0, 20)}...`);
        }
    }

    alert("개발자 도구(F12)의 콘솔(Console) 탭에서 스캔 결과를 확인하세요.\\n찾는 키워드가 백업에 있다면, forceRestoreFromBackup()을 실행하세요.");
};

// Advanced Diagnostics for Data Recovery
window.advancedDiagnostics = function () {
    console.log("=== Storage Analysis ===");
    let msg = "저장소 상태 분석:\n";
    let foundKeys = [];

    // 1. LocalStorage Scan
    if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const size = localStorage.getItem(key).length;
            console.log(`Key: [${key}], Size: ${size} bytes`);
            foundKeys.push(`${key} (${(size / 1024).toFixed(1)}KB)`);
        }
    }
    msg += "발견된 키:\n" + foundKeys.join("\n") + "\n\n";

    // 2. Data Structure Deep Dive
    console.log("=== InMemory Data Structure ===");
    msg += "현재 로드된 데이터 구조:\n";

    // Check Years present
    const years = roadmapData.years ? Object.keys(roadmapData.years) : [];
    msg += `연도 데이터: [${years.join(', ')}]\n`;

    years.forEach(y => {
        const d = roadmapData.years[y];
        const memoCounts = d.monthlyMemos ? d.monthlyMemos.map(m => Object.keys(m).length).join(',') : "없음";
        console.log(`Year ${y}: Details keys: ${Object.keys(d.details || {}).join(',')}`);
        // Check for specific lost data types
        const instCount = d.details?.installment?.length || 0;
        const taxCount = (roadmapData.tax_management?.block1?.data ? Object.keys(roadmapData.tax_management.block1.data).length : 0);
        // Note: tax_management might be global or in details depending on migration

        msg += `${y}년: 할부(${instCount}개), 월별메모슬롯(${memoCounts})\n`;
    });

    // Check Global Tax/Investment
    const invCount = roadmapData.investment?.investors?.length || 0;
    msg += `투자 관리자: ${invCount}명\n`;

    const taxKeys = roadmapData.tax_management ? Object.keys(roadmapData.tax_management) : [];
    msg += `세금 관리 키: ${taxKeys.join(', ')}\n`;

    alert(msg);
    console.log("Check the console for detailed object structure.");
};

// Rescue Data Tool (2024 -> 2026)
window.rescue2024Data = function () {
    const wrongYear = 2024;
    const targetYear = currentYear || 2026;

    if (!roadmapData.years[wrongYear]) {
        alert(`${wrongYear}년 데이터가 없습니다. (이미 이동했거나 없음)`);
        return;
    }

    // Create target year if missing
    if (!roadmapData.years[targetYear]) roadmapData.years[targetYear] = roadmapData.createYearData();

    const source = roadmapData.years[wrongYear];
    const target = roadmapData.years[targetYear];
    let moveCount = 0;

    // 1. Merge Installments
    if (source.details && source.details.installment && source.details.installment.length > 0) {
        if (!target.details.installment) target.details.installment = [];
        target.details.installment.push(...source.details.installment);
        console.log(`Moved ${source.details.installment.length} installments.`);
        moveCount += source.details.installment.length;
    }

    // 2. Merge Monthly Memos (Tax, Investment, etc)
    if (source.monthlyMemos) {
        source.monthlyMemos.forEach((m, i) => {
            Object.keys(m).forEach(cat => {
                if (Array.isArray(m[cat]) && m[cat].length > 0) {
                    if (!target.monthlyMemos[i][cat]) target.monthlyMemos[i][cat] = [];
                    target.monthlyMemos[i][cat].push(...m[cat]);
                    console.log(`Moved ${cat} memos for month ${i + 1}`);
                    moveCount++;
                }
            });
        });
    }

    // 3. Global Tax Management Check
    // Sometimes tax data is in global 'tax_management' or yearly. 
    // If user mentioned tax tab, we should ensure global tax struct is intact.
    // If previously it was in 2024 details? Tax is usually global or monthly.

    if (moveCount > 0) {
        saveData();
        alert(`총 ${moveCount}건의 데이터를 2024년에서 ${targetYear}년으로 성공적으로 복구했습니다!\n페이지를 새로고침합니다.`);
        location.reload();
    } else {
        alert("2024년에 데이터가 있지만, 옮길 내용(할부/메모)을 찾지 못했습니다. 이미 옮겨졌을 수 있습니다.");
    }
};

// Check for data loss on load
setTimeout(() => {
    if (typeof localStorage !== 'undefined') {
        const hasMemoryData = roadmapData.memoPage && (roadmapData.memoPage.common.length > 0 || Object.keys(roadmapData.memoPage.yearly).length > 0);
        if (!hasMemoryData) {
            // Check backup
            const backupStr = localStorage.getItem('supermoon_data_backup_last');
            if (backupStr) {
                const backup = JSON.parse(backupStr);
                const hasBackupData = backup.memoPage && (backup.memoPage.common.length > 0 || Object.keys(backup.memoPage.yearly).length > 0);

                if (hasBackupData) {
                    console.warn("⚠️ Data integrity issue: Found empty memory but data in backup.");
                    // Optional: Auto restore or just prompt
                    // Let's safe-merge: only if memory is empty
                    roadmapData.memoPage = backup.memoPage;
                    saveData();
                    triggerUIUpdate();
                    console.log("✅ Auto-restored memo data from backup.");
                }
            }
        }
    }
}, 1000);
