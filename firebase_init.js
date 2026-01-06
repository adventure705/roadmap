(async function () {
    try {
        // Firebase 설정을 직접 포함 (firebase-config.json이 gitignore되어 있어서)
        const config = {
            apiKey: "AIzaSyDdk_axp2Q9OANqleknWeYWK9DrxKWKeY4",
            authDomain: "template-3530f.firebaseapp.com",
            projectId: "template-3530f",
            storageBucket: "template-3530f.firebasestorage.app",
            messagingSenderId: "891098188622",
            appId: "1:891098188622:web:392c0121a17f1cd4402c1f"
        };

        if (typeof firebase !== 'undefined') {
            // 중복 초기화 방지
            if (!firebase.apps.length) {
                firebase.initializeApp(config);
                console.log("✅ Firebase 초기화 완료");
            }

            // Firebase가 준비되었으므로 리스너 부착을 위해 loadData 트리거
            if (typeof loadData === 'function') {
                loadData();
            }
        } else {
            console.error("❌ Firebase SDK가 로드되지 않았습니다.");
        }
    } catch (e) {
        console.error("❌ Firebase 초기화 중 오류 발생:", e);
    }
})();
