@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "firebase_sdk=    <!-- Firebase SDK -->^

    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>^

    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>^

    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>^

    <script src="firebase_init.js"></script>"

set files=fixed_expenses.html variable_expenses.html cash_expenses.html business.html settlement.html roadmap.html dashboard.html investment.html management.html money_plan.html secret_board.html

for %%f in (%files%) do (
    if exist "%%f" (
        findstr /C:"firebase-app-compat.js" "%%f" >nul
        if errorlevel 1 (
            echo Adding Firebase SDK to %%f...
            powershell -Command "(Get-Content '%%f' -Raw) -replace '(\s*)<script src=\"data\.js\">', '%firebase_sdk%`r`n$1<script src=\"data.js\">' | Set-Content '%%f' -Encoding UTF8 -NoNewline"
            echo ✓ Done: %%f
        ) else (
            echo ℹ Firebase SDK already in %%f
        )
    )
)

echo.
echo ✅ Firebase SDK 추가 완료!
pause
