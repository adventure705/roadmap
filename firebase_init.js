(async function () {
    try {
        // Firebase 설정을 직접 포함 (firebase-config.json이 gitignore되어 있어서)
        const config = {
            apiKey: "AIzaSyDlGPmUwJf7qVmT5eWGNKxGBJPvLqRRwGI",
            authDomain: "roadmap-d4d6a.firebaseapp.com",
            projectId: "roadmap-d4d6a",
            storageBucket: "roadmap-d4d6a.firebasestorage.app",
            messagingSenderId: "1031959746865",
            appId: "1:1031959746865:web:9a5b0c0e9f9e9e9e9e9e9e"
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
