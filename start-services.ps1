# PowerShell script to start all required Docker services
# Run this script to start GROBID, Qdrant, and ScyllaDB

Write-Host "Starting Scientific Paper Processing Pipeline Services..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Start GROBID
Write-Host "Starting GROBID..." -ForegroundColor Yellow
$grobidRunning = docker ps --filter "ancestor=lfoppiano/grobid:0.8.1" --format "{{.ID}}"
if (-not $grobidRunning) {
    docker run -d -p 8070:8070 --name grobid lfoppiano/grobid:0.8.1
    Write-Host "  GROBID started on http://localhost:8070" -ForegroundColor Green
} else {
    Write-Host "  GROBID already running" -ForegroundColor Gray
}

# Start Qdrant
Write-Host "Starting Qdrant..." -ForegroundColor Yellow
$qdrantRunning = docker ps --filter "ancestor=qdrant/qdrant" --format "{{.ID}}"
if (-not $qdrantRunning) {
    docker run -d -p 6333:6333 --name qdrant qdrant/qdrant
    Write-Host "  Qdrant started on http://localhost:6333" -ForegroundColor Green
} else {
    Write-Host "  Qdrant already running" -ForegroundColor Gray
}

# Start ScyllaDB
Write-Host "Starting ScyllaDB..." -ForegroundColor Yellow
$scyllaRunning = docker ps --filter "ancestor=scylladb/scylla" --format "{{.ID}}"
if (-not $scyllaRunning) {
    docker run -d -p 9042:9042 --name scylla scylladb/scylla
    Write-Host "  ScyllaDB started on port 9042" -ForegroundColor Green
} else {
    Write-Host "  ScyllaDB already running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "All services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  GROBID:   http://localhost:8070" -ForegroundColor White
Write-Host "  Qdrant:   http://localhost:6333" -ForegroundColor White
Write-Host "  ScyllaDB: localhost:9042" -ForegroundColor White
Write-Host ""

# Wait a bit for services to initialize
Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verify services
Write-Host ""
Write-Host "Verifying services..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8070/api/isalive" -TimeoutSec 5 -UseBasicParsing
    Write-Host "  ✓ GROBID is ready" -ForegroundColor Green
} catch {
    Write-Host "  ✗ GROBID is not ready yet (may need more time)" -ForegroundColor Yellow
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:6333/collections" -TimeoutSec 5 -UseBasicParsing
    Write-Host "  ✓ Qdrant is ready" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Qdrant is not ready yet (may need more time)" -ForegroundColor Yellow
}

$scyllaStatus = docker ps --filter "name=scylla" --format "{{.Status}}"
if ($scyllaStatus) {
    Write-Host "  ✓ ScyllaDB container is running" -ForegroundColor Green
} else {
    Write-Host "  ✗ ScyllaDB is not running" -ForegroundColor Red
}

Write-Host ""
Write-Host "Ready to process papers!" -ForegroundColor Green


