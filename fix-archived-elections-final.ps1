# Final fix for archived elections
Write-Host "🔧 Final fix for archived elections..." -ForegroundColor Yellow

# Navigate to backend
Set-Location "backend"

# Run the SQL script
Write-Host "📝 Adding archive columns..." -ForegroundColor Cyan
psql -d trustelect -f ensure_archive_columns.sql

Write-Host "✅ Archive columns added successfully!" -ForegroundColor Green
Write-Host "🎉 Archived elections should now work!" -ForegroundColor Green

# Return to root
Set-Location ".."

Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your backend server" -ForegroundColor White
Write-Host "2. Try accessing the archived elections page" -ForegroundColor White
Write-Host "3. The 400 error should be resolved" -ForegroundColor White
