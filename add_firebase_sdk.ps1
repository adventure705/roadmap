$files = @(
    "business.html",
    "cash_expenses.html", 
    "dashboard.html",
    "fixed_expenses.html",
    "income.html",
    "investment.html",
    "management.html",
    "money_plan.html",
    "roadmap.html",
    "secret_board.html",
    "settlement.html",
    "variable_expenses.html"
)

$firebaseScripts = @"
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="firebase_init.js"></script>
"@

foreach ($file in $files) {
    $path = "c:\Users\blue2510\자체제작프로그램\roadmap\$file"
    if (Test-Path $path) {
        $content = Get-Content $path -Raw -Encoding UTF8
        
        # Check if Firebase SDK is already added
        if ($content -notmatch "firebase-app-compat.js") {
            # Find the position before <script src="data.js">
            if ($content -match '(\s*)<script src="data\.js">') {
                $indent = $matches[1]
                $replacement = "$firebaseScripts`r`n$indent<script src=`"data.js`">"
                $content = $content -replace '(\s*)<script src="data\.js">', $replacement
                Set-Content $path -Value $content -Encoding UTF8 -NoNewline
                Write-Host "✅ Added Firebase SDK to $file"
            } else {
                Write-Host "⚠️  Could not find data.js script tag in $file"
            }
        } else {
            Write-Host "ℹ️  Firebase SDK already exists in $file"
        }
    }
}

Write-Host "`n✅ Firebase SDK 추가 완료!"
