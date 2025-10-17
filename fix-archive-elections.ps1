# Fix Archive Elections Functionality
Write-Host "🔧 Fixing Archive Elections Functionality..." -ForegroundColor Yellow

# Navigate to backend directory
Set-Location "backend"

# Run the fix script
Write-Host "📝 Running database migration..." -ForegroundColor Cyan
node fix_archive_elections.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Archive elections functionality fixed successfully!" -ForegroundColor Green
    Write-Host "🎉 You can now use the archived elections feature!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to fix archive elections functionality. Please check the error messages above." -ForegroundColor Red
}

# Return to root directory
Set-Location ".."

Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your backend server if it's running" -ForegroundColor White
Write-Host "2. Try accessing the archived elections page again" -ForegroundColor White
Write-Host "3. The 400 Bad Request error should now be resolved" -ForegroundColor White
Write-Host "4. You can now archive and view archived elections" -ForegroundColor White
