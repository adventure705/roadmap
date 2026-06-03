import sys
import re

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace loadData
load_data_replacement = """function loadData() {
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
}"""

content = re.sub(r'function loadData\(\) \{.*?(?=\n// Helper to reuse)', load_data_replacement, content, flags=re.DOTALL)

# Replace saveData
save_data_replacement = """function saveData(forceHistory = false) {
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
}"""

content = re.sub(r'function saveData\(forceHistory = false\) \{.*?(?=\n// Global Ctrl\+S Handler)', save_data_replacement, content, flags=re.DOTALL)

# Replace restoreHistoryItem
restore_history_replacement = """window.restoreHistoryItem = function (timestamp) {
    if (!confirm("정말로 이 시점으로 되돌리시겠습니까?\\n현재 데이터는 덮어씌워집니다.")) return;

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
};"""

content = re.sub(r'window\.restoreHistoryItem = function \(timestamp\) \{.*?(?=\n// Global UI Update Trigger Helper)', restore_history_replacement, content, flags=re.DOTALL)

# Replace syncMemoryToCloud
sync_cloud_replacement = """function syncMemoryToCloud() {
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
}"""

content = re.sub(r'function syncMemoryToCloud\(\) \{.*?(?=\n// History UI)', sync_cloud_replacement, content, flags=re.DOTALL)


with open('data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
