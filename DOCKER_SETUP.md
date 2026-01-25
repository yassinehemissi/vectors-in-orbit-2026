# Docker Installation Guide

## Why Docker is Recommended

This pipeline requires **three external services** that are easiest to run with Docker:

1. **GROBID** - Converts PDFs to TEI XML (complex Java-based service)
2. **Qdrant** - Vector database for semantic search
3. **ScyllaDB** - NoSQL database for structured storage

## ✅ Recommended: Install Docker Desktop

### For Windows:

1. **Download Docker Desktop:**
   - Visit: https://www.docker.com/products/docker-desktop
   - Download Docker Desktop for Windows
   - Run the installer

2. **After Installation:**
   - Start Docker Desktop (it will run in the background)
   - Wait for Docker to fully start (whale icon in system tray)
   - Verify installation:
     ```powershell
     docker --version
     docker ps
     ```

3. **Run the setup script:**
   ```powershell
   .\setup.ps1
   ```

### System Requirements:
- Windows 10 64-bit: Pro, Enterprise, or Education (Build 15063+)
- Windows 11 64-bit: Home or Pro version 21H2 or higher
- WSL 2 feature enabled
- Virtualization enabled in BIOS

## ⚠️ Alternatives (More Complex)

If you **cannot** install Docker, you can install services locally, but it's much more complex:

### Option 1: Install GROBID Locally
- Requires Java 8+
- Complex setup process
- See: https://grobid.readthedocs.io/en/latest/Install-Grobid/

### Option 2: Use Cloud Services
- Use hosted Qdrant Cloud (free tier available)
- Use hosted ScyllaDB (requires account)
- Still need GROBID (Docker or local)

### Option 3: Skip Some Services (Limited Functionality)
- You can modify the code to skip ScyllaDB (lose persistent storage)
- You can modify the code to skip Qdrant (lose semantic search)
- **GROBID is essential** - cannot skip PDF conversion

## Quick Check: Do You Need Docker?

**Answer: YES** if you want:
- ✅ Easy setup (one command)
- ✅ Full functionality
- ✅ Isolated services (no conflicts)
- ✅ Easy updates and maintenance

**Answer: NO** if you:
- ❌ Cannot install Docker (system restrictions)
- ❌ Prefer local installations
- ❌ Want to use cloud-hosted services

## Installation Steps Summary

1. **Install Docker Desktop** (5-10 minutes)
2. **Run setup script:** `.\setup.ps1` (automated)
3. **Start processing papers!**

## Troubleshooting Docker Installation

### Docker won't start:
- Ensure WSL 2 is enabled: `wsl --install`
- Check virtualization is enabled in BIOS
- Restart computer after installation

### Docker Desktop is slow:
- Allocate more resources in Docker Desktop settings
- Ensure Windows updates are installed

### Port conflicts:
- Check if ports 8070, 6333, 9042 are already in use
- Change ports in `.env` file if needed

## Next Steps After Docker Installation

Once Docker is installed:

```powershell
# Verify Docker is running
docker ps

# Run the automated setup
.\setup.ps1

# Or manually start services
.\start-services.ps1
```

That's it! Docker makes everything much easier. 🐳


