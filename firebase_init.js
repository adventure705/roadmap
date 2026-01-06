(async function () {
    try {
        const response = await fetch('./firebase-config.json');
        if (!response.ok) {
            throw new Error(`설정 로드 실패: ${response.statusText}`);
        }
        const config = await response.json();

        if (typeof firebase !== 'undefined') {
            // 중복 초기화 방지
            if (!firebase.apps.length) {
                firebase.initializeApp(config);
                console.log("Firebase 초기화 완료");
            }

            // Firebase가 준비되었으므로 리스너 부착을 위해 loadData 트리거
            if (typeof loadData === 'function') {
                loadData();
            }
        } else {
            console.error("Firebase SDK가 로드되지 않았습니다.");
        }
    } catch (e) {
        console.error("Firebase 초기화 중 오류 발생:", e);
    }
})();
