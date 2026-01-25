# PowerShell script to stop all Docker services
# Run this script to stop GROBID, Qdrant, and ScyllaDB

Write-Host "Stopping Scientific Paper Processing Pipeline Services..." -ForegroundColor Cyan
Write-Host ""

# Stop GROBID
Write-Host "Stopping GROBID..." -ForegroundColor Yellow
$grobidContainer = docker ps -a --filter "name=grobid" --format "{{.ID}}"
if ($grobidContainer) {
    docker stop grobid 2>&1 | Out-Null
    docker rm grobid 2>&1 | Out-Null
    Write-Host "  GROBID stopped" -ForegroundColor Green
} else {
    Write-Host "  GROBID not running" -ForegroundColor Gray
}

# Stop Qdrant
Write-Host "Stopping Qdrant..." -ForegroundColor Yellow
$qdrantContainer = docker ps -a --filter "name=qdrant" --format "{{.ID}}"
if ($qdrantContainer) {
    docker stop qdrant 2>&1 | Out-Null
    docker rm qdrant 2>&1 | Out-Null
    Write-Host "  Qdrant stopped" -ForegroundColor Green
} else {
    Write-Host "  Qdrant not running" -ForegroundColor Gray
}

# Stop ScyllaDB
Write-Host "Stopping ScyllaDB..." -ForegroundColor Yellow
$scyllaContainer = docker ps -a --filter "name=scylla" --format "{{.ID}}"
if ($scyllaContainer) {
    docker stop scylla 2>&1 | Out-Null
    docker rm scylla 2>&1 | Out-Null
    Write-Host "  ScyllaDB stopped" -ForegroundColor Green
} else {
    Write-Host "  ScyllaDB not running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "All services stopped!" -ForegroundColor Green


