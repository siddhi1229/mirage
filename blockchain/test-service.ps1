# Test script to verify blockchain service integration
$uri = "http://localhost:3001/log-threat"

$testThreat = @{
    user_id = "python_test_user"
    threat_score = 87.5
    duration_minutes = 25.0
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

Write-Host "`n🧪 Testing Blockchain Service..." -ForegroundColor Cyan
Write-Host "Endpoint: $uri" -ForegroundColor Gray
Write-Host "Payload:" -ForegroundColor Gray
Write-Host $testThreat -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Body $testThreat -ContentType "application/json"
    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor Green
} catch {
    Write-Host "`n❌ FAILED!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
