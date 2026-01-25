# PowerShell Setup Script for Scientific Paper Processing Pipeline
# This script automates the setup process on Windows

param(
    [switch]$SkipDocker,
    [switch]$SkipPython,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Scientific Paper Processing Pipeline - PowerShell Setup Script

Usage:
    .\setup.ps1 [options]

Options:
    -SkipDocker    Skip Docker container setup
    -SkipPython    Skip Python dependency installation
    -Help          Show this help message

Examples:
    .\setup.ps1                    # Full setup
    .\setup.ps1 -SkipDocker         # Skip Docker setup
    .\setup.ps1 -SkipPython         # Skip Python installation
"@
    exit 0
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Scientific Paper Processing Pipeline" -ForegroundColor Cyan
Write-Host "PowerShell Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# Step 1: Check Python Installation
Write-Host "[1/5] Checking Python installation..." -ForegroundColor Yellow
if (-not $SkipPython) {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Python not found. Please install Python 3.8+ from https://www.python.org/" -ForegroundColor Red
        exit 1
    }
    Write-Host "Found: $pythonVersion" -ForegroundColor Green
    
    # Install Python dependencies
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Python dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "Python dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Skipping Python setup" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Check Docker Installation
Write-Host "[2/5] Checking Docker installation..." -ForegroundColor Yellow
if (-not $SkipDocker) {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker not found. Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Red
        Write-Host "Or use -SkipDocker to skip Docker setup" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "Found: $dockerVersion" -ForegroundColor Green
    
    # Check if Docker is running
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker is not running. Please start Docker Desktop" -ForegroundColor Red
        exit 1
    }
    Write-Host "Docker is running" -ForegroundColor Green
} else {
    Write-Host "Skipping Docker setup" -ForegroundColor Gray
}

Write-Host ""

# Step 3: Start Docker Containers
if (-not $SkipDocker) {
    Write-Host "[3/5] Starting Docker containers..." -ForegroundColor Yellow
    
    # Start GROBID
    Write-Host "Starting GROBID..." -ForegroundColor Cyan
    $grobidRunning = docker ps --filter "ancestor=lfoppiano/grobid:0.8.1" --format "{{.ID}}"
    if (-not $grobidRunning) {
        docker run -d -p 8070:8070 --name grobid lfoppiano/grobid:0.8.1
        Start-Sleep -Seconds 5
        Write-Host "GROBID started" -ForegroundColor Green
    } else {
        Write-Host "GROBID already running" -ForegroundColor Green
    }
    
    # Start Qdrant
    Write-Host "Starting Qdrant..." -ForegroundColor Cyan
    $qdrantRunning = docker ps --filter "ancestor=qdrant/qdrant" --format "{{.ID}}"
    if (-not $qdrantRunning) {
        docker run -d -p 6333:6333 --name qdrant qdrant/qdrant
        Start-Sleep -Seconds 3
        Write-Host "Qdrant started" -ForegroundColor Green
    } else {
        Write-Host "Qdrant already running" -ForegroundColor Green
    }
    
    # Start ScyllaDB
    Write-Host "Starting ScyllaDB..." -ForegroundColor Cyan
    $scyllaRunning = docker ps --filter "ancestor=scylladb/scylla" --format "{{.ID}}"
    if (-not $scyllaRunning) {
        docker run -d -p 9042:9042 --name scylla scylladb/scylla
        Start-Sleep -Seconds 5
        Write-Host "ScyllaDB started" -ForegroundColor Green
    } else {
        Write-Host "ScyllaDB already running" -ForegroundColor Green
    }
} else {
    Write-Host "[3/5] Skipping Docker container startup" -ForegroundColor Gray
}

Write-Host ""

# Step 4: Create .env file
Write-Host "[4/5] Setting up environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Cyan
    @"
# GROBID Configuration
GROBID_URL=http://localhost:8070
GROBID_TIMEOUT=120

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=experiments
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# ScyllaDB Configuration
SCYLLADB_HOSTS=127.0.0.1
SCYLLADB_KEYSPACE=scientific_papers
SCYLLADB_PORT=9042

# Model Configuration
SUMMARIZATION_MODEL=facebook/bart-large-cnn
EXTRACTION_MODEL=mistralai/Mistral-7B-Instruct-v0.2
DEVICE=cpu
CUDA_AVAILABLE=false

# Processing Configuration
MAX_BLOCK_SIZE=1000
MIN_BLOCK_SIZE=50
BATCH_SIZE=8

# Output Configuration
OUTPUT_DIR=./output
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host ".env file created" -ForegroundColor Green
} else {
    Write-Host ".env file already exists" -ForegroundColor Green
}

Write-Host ""

# Step 5: Verify Services
Write-Host "[5/5] Verifying services..." -ForegroundColor Yellow
if (-not $SkipDocker) {
    # Check GROBID
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8070/api/isalive" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ GROBID is accessible" -ForegroundColor Green
        }
    } catch {
        Write-Host "✗ GROBID is not accessible" -ForegroundColor Red
    }
    
    # Check Qdrant
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:6333/collections" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Qdrant is accessible" -ForegroundColor Green
        }
    } catch {
        Write-Host "✗ Qdrant is not accessible" -ForegroundColor Red
    }
    
    # Check ScyllaDB (basic check)
    $scyllaContainer = docker ps --filter "name=scylla" --format "{{.Status}}"
    if ($scyllaContainer) {
        Write-Host "✓ ScyllaDB container is running" -ForegroundColor Green
    } else {
        Write-Host "✗ ScyllaDB container is not running" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review and adjust .env file if needed" -ForegroundColor White
Write-Host "2. Run: python example_usage.py" -ForegroundColor White
Write-Host "3. Process your first PDF paper!" -ForegroundColor White
Write-Host ""


