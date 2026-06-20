# ============================================================
#  SWAN GMAO — Script d'installation Windows (PowerShell)
#  Plateforme GMAO pour l'industrie algérienne
# ============================================================
#
# Utilisation : Clic-droit sur install.ps1 → "Exécuter avec PowerShell"
# Ou depuis PowerShell : .\install.ps1
#
# Prérequis : PowerShell 5.1+ ou PowerShell 7+
#             Exécution autorisée : Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

$ErrorActionPreference = "Stop"

function Write-Step { param([string]$Msg, [string]$Color = "Cyan")
  Write-Host "`n$Msg" -ForegroundColor $Color
}
function Write-OK   { param([string]$Msg) Write-Host "  ✓ $Msg" -ForegroundColor Green }
function Write-Warn { param([string]$Msg) Write-Host "  ⚠ $Msg" -ForegroundColor Yellow }
function Write-Err  { param([string]$Msg) Write-Host "  ✗ $Msg" -ForegroundColor Red }

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          SWAN GMAO — Script d'installation           ║" -ForegroundColor Cyan
Write-Host "║        Plateforme GMAO pour l'industrie algérienne   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ──────────────────────────────────────────────
# 1. Node.js check (v18+)
# ──────────────────────────────────────────────
Write-Step "[1/6] Vérification de Node.js..."

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  Write-Warn "Node.js non trouvé."
  Write-Host "  Installation via winget..." -ForegroundColor Yellow
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
  } else {
    Write-Err "winget non disponible. Installez Node.js LTS depuis : https://nodejs.org"
    exit 1
  }
}

$nodeVersion = & node -e "process.stdout.write(process.version.slice(1).split('.')[0])"
if ([int]$nodeVersion -lt 18) {
  Write-Err "Node.js v18+ requis. Version détectée : $(node -v)"
  Write-Host "  Téléchargez Node.js 20 LTS : https://nodejs.org" -ForegroundColor Yellow
  exit 1
}
Write-OK "Node.js $(node -v)"

# ──────────────────────────────────────────────
# 2. pnpm check / install
# ──────────────────────────────────────────────
Write-Step "[2/6] Vérification de pnpm..."

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Warn "pnpm non trouvé. Installation..."
  npm install -g pnpm@latest
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
Write-OK "pnpm $(pnpm -v)"

# ──────────────────────────────────────────────
# 3. PostgreSQL check
# ──────────────────────────────────────────────
Write-Step "[3/6] Vérification de PostgreSQL..."

$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlCmd) {
  Write-Warn "PostgreSQL non trouvé."
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Host "  Installation via winget..." -ForegroundColor Yellow
    winget install PostgreSQL.PostgreSQL --silent --accept-package-agreements --accept-source-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
  } else {
    Write-Warn "Installez PostgreSQL manuellement : https://www.postgresql.org/download/windows/"
    Write-Warn "Puis relancez ce script."
  }
}

if (Get-Command psql -ErrorAction SilentlyContinue) {
  Write-OK "PostgreSQL disponible"
} else {
  Write-Warn "PostgreSQL non détecté — configurez DATABASE_URL manuellement dans .env"
}

# ──────────────────────────────────────────────
# 4. Fichier .env
# ──────────────────────────────────────────────
Write-Step "[4/6] Configuration de l'environnement..."

if (-not (Test-Path ".env")) {
  Write-Warn "Création du fichier .env..."

  # Random session secret via Node
  $sessionSecret = & node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"

  $dbUrl = "postgresql://postgres:password@localhost:5432/swan_gmao"

  # Try to create DB
  if (Get-Command psql -ErrorAction SilentlyContinue) {
    try {
      $env:PGPASSWORD = "password"
      & psql -U postgres -c "CREATE DATABASE swan_gmao;" 2>$null | Out-Null
      Write-OK "Base de données swan_gmao créée"
    } catch {
      Write-Warn "La base de données existe peut-être déjà — continuons."
    }
  }

  $envContent = @"
# SWAN GMAO — Variables d'environnement
# Généré le $(Get-Date -Format "dd/MM/yyyy HH:mm")

# Base de données PostgreSQL
DATABASE_URL=$dbUrl

# Session (secret aléatoire généré automatiquement)
SESSION_SECRET=$sessionSecret

# Ports (optionnel — par défaut: 5173 pour le frontend, 5001 pour l'API)
# PORT=5173
# API_PORT=5001
"@

  $envContent | Out-File -FilePath ".env" -Encoding UTF8
  Write-OK "Fichier .env créé"
  Write-Warn "Vérifiez DATABASE_URL dans .env si votre PostgreSQL a un mot de passe différent"
} else {
  Write-OK "Fichier .env existant détecté"
}

# ──────────────────────────────────────────────
# 5. Installation des dépendances
# ──────────────────────────────────────────────
Write-Step "[5/6] Installation des dépendances (pnpm install)..."

pnpm install
Write-OK "Dépendances installées"

# ──────────────────────────────────────────────
# 6. Migration base de données
# ──────────────────────────────────────────────
Write-Step "[6/6] Migration de la base de données..."

# Load .env vars
Get-Content ".env" | Where-Object { $_ -match "^\s*[^#]" -and $_ -match "=" } | ForEach-Object {
  $parts = $_ -split "=", 2
  [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
}

try {
  pnpm --filter @workspace/db run push
  Write-OK "Schéma de base de données appliqué"
} catch {
  Write-Warn "Migration ignorée — vérifiez DATABASE_URL dans .env"
}

# ──────────────────────────────────────────────
# TERMINÉ
# ──────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         ✓  Installation terminée avec succès         ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Pour démarrer SWAN GMAO, ouvrez 2 terminaux PowerShell :"
Write-Host ""
Write-Host "  Terminal 1 (API)  :" -ForegroundColor Cyan -NoNewline
Write-Host "  pnpm --filter @workspace/api-server run dev"
Write-Host "  Terminal 2 (App)  :" -ForegroundColor Cyan -NoNewline
Write-Host "  pnpm --filter @workspace/swan-gmao run dev"
Write-Host ""
Write-Host "Application disponible sur :" -NoNewline
Write-Host "  http://localhost:5173" -ForegroundColor Green
Write-Host "API disponible sur          :" -NoNewline
Write-Host "  http://localhost:5001" -ForegroundColor Green
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
