# Test Supabase Integration Script
# Run this after setting up Supabase to verify everything works

Write-Host "🧪 Testing Supabase Integration..." -ForegroundColor Cyan

# Get the base URL (replace with your actual Render.com URL)
$baseUrl = "https://showroom-backend.onrender.com"

Write-Host "Testing against: $baseUrl" -ForegroundColor Yellow

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Green
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health check passed: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get Projects (should be empty initially)
Write-Host "`n2. Testing Get Projects..." -ForegroundColor Green
try {
    $projectsResponse = Invoke-RestMethod -Uri "$baseUrl/api/projects" -Method GET
    Write-Host "✅ Get projects successful: $($projectsResponse.Count) projects found" -ForegroundColor Green
} catch {
    Write-Host "❌ Get projects failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Create a Test Project
Write-Host "`n3. Testing Create Project..." -ForegroundColor Green
$testProject = @{
    name = "Test Project - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    slug = "test-project-$(Get-Date -Format 'yyyyMMddHHmm')"
    shortDescription = "This is a test project created by the integration test script"
    fullDescription = "This project was created to verify that the Supabase integration is working correctly. It should appear in your Supabase dashboard."
    genre = "Action"
    publishingTrack = "Platform Games"
    platformType = "PC Client"
    distributionMethod = "Steam"
    buildStatus = "In Development"
    isPublic = $false
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/projects" -Method POST -Body $testProject -ContentType "application/json"
    Write-Host "✅ Create project successful: $($createResponse.name)" -ForegroundColor Green
    $projectId = $createResponse.id
} catch {
    Write-Host "❌ Create project failed: $($_.Exception.Message)" -ForegroundColor Red
    $projectId = $null
}

# Test 4: Get Project by ID
if ($projectId) {
    Write-Host "`n4. Testing Get Project by ID..." -ForegroundColor Green
    try {
        $getProjectResponse = Invoke-RestMethod -Uri "$baseUrl/api/projects/$projectId" -Method GET
        Write-Host "✅ Get project by ID successful: $($getProjectResponse.name)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Get project by ID failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: Get Projects Again (should now have 1 project)
Write-Host "`n5. Testing Get Projects (after creation)..." -ForegroundColor Green
try {
    $projectsResponse2 = Invoke-RestMethod -Uri "$baseUrl/api/projects" -Method GET
    Write-Host "✅ Get projects successful: $($projectsResponse2.Count) projects found" -ForegroundColor Green
} catch {
    Write-Host "❌ Get projects failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Integration test completed!" -ForegroundColor Cyan
Write-Host "Check your Supabase dashboard → Table Editor → projects to see the test project." -ForegroundColor Yellow
