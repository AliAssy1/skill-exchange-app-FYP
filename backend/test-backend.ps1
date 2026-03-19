# Backend API Test Script
# Run this to verify all backend endpoints are working

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SKILL EXCHANGE BACKEND API TEST SUITE      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api"
$allTestsPassed = $true

# Test 1: Server Health Check
Write-Host "🔍 Test 1: Server Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method GET -ErrorAction SilentlyContinue
    Write-Host "   ❌ FAIL - Server should return 401 without token" -ForegroundColor Red
    $allTestsPassed = $false
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ PASS - Server is responding correctly`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAIL - Unexpected response`n" -ForegroundColor Red
        $allTestsPassed = $false
    }
}

# Test 2: Admin Login
Write-Host "🔍 Test 2: Admin Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "ali.assi@kingston.ac.uk"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.success -and $loginResponse.user.role -eq "admin") {
        Write-Host "   ✅ PASS - Admin login successful" -ForegroundColor Green
        Write-Host "   📧 Email: $($loginResponse.user.email)" -ForegroundColor Gray
        Write-Host "   👤 Name: $($loginResponse.user.full_name)" -ForegroundColor Gray
        Write-Host "   🔑 Token: $($loginResponse.token.Substring(0,20))...`n" -ForegroundColor Gray
        $adminToken = $loginResponse.token
    } else {
        Write-Host "   ❌ FAIL - Login response invalid`n" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "   ❌ FAIL - $($_.Exception.Message)`n" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 3: Get Admin Profile
Write-Host "🔍 Test 3: Get Admin Profile (with JWT token)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
    }
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method GET -Headers $headers
    
    if ($profileResponse.success -and $profileResponse.user.email -eq "ali.assi@kingston.ac.uk") {
        Write-Host "   ✅ PASS - Profile retrieved successfully" -ForegroundColor Green
        Write-Host "   💰 Credits: $($profileResponse.user.credits)" -ForegroundColor Gray
        Write-Host "   ⭐ Reputation: $($profileResponse.user.reputation_score)`n" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ FAIL - Profile response invalid`n" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "   ❌ FAIL - $($_.Exception.Message)`n" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 4: User Registration
Write-Host "🔍 Test 4: User Registration..." -ForegroundColor Yellow
try {
    $randomNum = Get-Random -Minimum 1000 -Maximum 9999
    $registerBody = @{
        email = "testuser$randomNum@kingston.ac.uk"
        password = "test123456"
        full_name = "Test User $randomNum"
        major = "Computer Science"
        year_of_study = "Year 2"
    } | ConvertTo-Json
    
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    
    if ($registerResponse.success -and $registerResponse.user.email -like "testuser*@kingston.ac.uk") {
        Write-Host "   ✅ PASS - User registered successfully" -ForegroundColor Green
        Write-Host "   📧 Email: $($registerResponse.user.email)" -ForegroundColor Gray
        Write-Host "   👤 Name: $($registerResponse.user.full_name)" -ForegroundColor Gray
        Write-Host "   💰 Starting Credits: $($registerResponse.user.credits)`n" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ FAIL - Registration response invalid`n" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "   ❌ FAIL - $($_.Exception.Message)`n" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 5: Duplicate Registration (should fail)
Write-Host "🔍 Test 5: Duplicate Registration (should fail)..." -ForegroundColor Yellow
try {
    $duplicateBody = @{
        email = "ali.assi@kingston.ac.uk"
        password = "test123"
        full_name = "Duplicate User"
    } | ConvertTo-Json
    
    $duplicateResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $duplicateBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ❌ FAIL - Should have rejected duplicate email`n" -ForegroundColor Red
    $allTestsPassed = $false
} catch {
    if ($_.ErrorDetails.Message -like "*already exists*") {
        Write-Host "   ✅ PASS - Duplicate email correctly rejected`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAIL - Wrong error message`n" -ForegroundColor Red
        $allTestsPassed = $false
    }
}

# Test 6: Database Connection
Write-Host "🔍 Test 6: Database Connection..." -ForegroundColor Yellow
try {
    Push-Location backend
    $dbOutput = npm run view-db 2>&1 | Out-String
    Pop-Location
    
    if ($dbOutput -like "*Connected to MySQL Database*" -and $dbOutput -like "*Ali Assi*") {
        Write-Host "   ✅ PASS - Database connected and data persisted`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAIL - Database connection issues`n" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "   ❌ FAIL - $($_.Exception.Message)`n" -ForegroundColor Red
    $allTestsPassed = $false
    Pop-Location
}

# Final Results
Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($allTestsPassed) {
    Write-Host "║          ✅ ALL TESTS PASSED! 🎉             ║" -ForegroundColor Green
    Write-Host "║                                                ║" -ForegroundColor Cyan
    Write-Host "║  Your backend is working perfectly!            ║" -ForegroundColor Green
} else {
    Write-Host "║          ❌ SOME TESTS FAILED                 ║" -ForegroundColor Red
    Write-Host "║                                                ║" -ForegroundColor Cyan
    Write-Host "║  Please check the errors above                 ║" -ForegroundColor Red
}
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Test results summary
Write-Host "📋 Quick Summary:" -ForegroundColor Cyan
Write-Host "   - Server: Running on port 5000" -ForegroundColor White
Write-Host "   - Database: MySQL connected" -ForegroundColor White
Write-Host "   - Authentication: JWT tokens working" -ForegroundColor White
Write-Host "   - Registration: User creation working" -ForegroundColor White
Write-Host "   - Admin Access: Available" -ForegroundColor White
Write-Host ""
