#!/usr/bin/env bash
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║          SWAN GMAO — Script d'installation           ║"
echo "║        Plateforme GMAO pour l'industrie algérienne   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ──────────────────────────────────────────────
# 1. Node.js check (need v18+)
# ──────────────────────────────────────────────
echo -e "${CYAN}[1/6] Vérification de Node.js...${NC}"
if ! command -v node &>/dev/null; then
  echo -e "${YELLOW}Node.js non trouvé. Installation via nvm...${NC}"
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}Node.js v18+ requis. Version détectée : $(node -v)${NC}"
  echo "Installez Node.js 20 LTS : https://nodejs.org"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# ──────────────────────────────────────────────
# 2. pnpm check / install
# ──────────────────────────────────────────────
echo -e "${CYAN}[2/6] Vérification de pnpm...${NC}"
if ! command -v pnpm &>/dev/null; then
  echo -e "${YELLOW}pnpm non trouvé. Installation...${NC}"
  npm install -g pnpm@latest
fi
echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

# ──────────────────────────────────────────────
# 3. PostgreSQL check
# ──────────────────────────────────────────────
echo -e "${CYAN}[3/6] Vérification de PostgreSQL...${NC}"
if ! command -v psql &>/dev/null; then
  echo -e "${YELLOW}PostgreSQL non trouvé.${NC}"
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Installation PostgreSQL (Debian/Ubuntu)..."
    sudo apt-get update -qq && sudo apt-get install -y postgresql postgresql-contrib
    sudo service postgresql start
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &>/dev/null; then
      brew install postgresql@16 && brew services start postgresql@16
    else
      echo -e "${RED}Homebrew requis sur macOS. Installez depuis https://brew.sh${NC}"
      exit 1
    fi
  else
    echo -e "${RED}Installez PostgreSQL manuellement : https://www.postgresql.org/download/${NC}"
    exit 1
  fi
fi
echo -e "${GREEN}✓ PostgreSQL disponible${NC}"

# ──────────────────────────────────────────────
# 4. Fichier .env
# ──────────────────────────────────────────────
echo -e "${CYAN}[4/6] Configuration de l'environnement...${NC}"
if [ ! -f .env ]; then
  echo -e "${YELLOW}Création du fichier .env...${NC}"

  # Generate a random session secret
  SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

  # Try to detect or create database
  DB_NAME="swan_gmao"
  DB_USER="swan_user"
  DB_PASS="swan_pass_$(openssl rand -hex 4 2>/dev/null || echo 'change_me')"

  if command -v psql &>/dev/null; then
    echo "Création de la base de données PostgreSQL..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
    DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
  else
    DATABASE_URL="postgresql://postgres:password@localhost:5432/swan_gmao"
    echo -e "${YELLOW}⚠ Configurez DATABASE_URL manuellement dans .env${NC}"
  fi

  cat > .env << EOF
# SWAN GMAO — Variables d'environnement
# Généré le $(date)

# Base de données PostgreSQL
DATABASE_URL=$DATABASE_URL

# Session (secret aléatoire généré automatiquement)
SESSION_SECRET=$SESSION_SECRET

# Ports (optionnel — par défaut: 3000 pour le frontend, 5001 pour l'API)
# PORT=3000
# API_PORT=5001
EOF

  echo -e "${GREEN}✓ Fichier .env créé${NC}"
else
  echo -e "${GREEN}✓ Fichier .env existant détecté${NC}"
fi

# ──────────────────────────────────────────────
# 5. Installation des dépendances
# ──────────────────────────────────────────────
echo -e "${CYAN}[5/6] Installation des dépendances (pnpm install)...${NC}"
pnpm install
echo -e "${GREEN}✓ Dépendances installées${NC}"

# ──────────────────────────────────────────────
# 6. Migration base de données
# ──────────────────────────────────────────────
echo -e "${CYAN}[6/6] Migration de la base de données...${NC}"
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs) 2>/dev/null || true
fi

if pnpm --filter @workspace/db run push 2>/dev/null; then
  echo -e "${GREEN}✓ Schéma de base de données appliqué${NC}"
else
  echo -e "${YELLOW}⚠ Migration ignorée — vérifiez DATABASE_URL dans .env${NC}"
fi

# ──────────────────────────────────────────────
# TERMINÉ
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✓  Installation terminée avec succès         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Pour démarrer SWAN GMAO :"
echo -e "  ${CYAN}Terminal 1 (API)  :${NC} pnpm --filter @workspace/api-server run dev"
echo -e "  ${CYAN}Terminal 2 (App)  :${NC} pnpm --filter @workspace/swan-gmao run dev"
echo ""
echo -e "  ${CYAN}Ou avec concurrently :${NC}"
echo -e "  pnpm -r --filter @workspace/api-server --filter @workspace/swan-gmao run dev"
echo ""
echo -e "Application disponible sur : ${GREEN}http://localhost:5173${NC}"
echo -e "API disponible sur          : ${GREEN}http://localhost:5001${NC}"
echo ""
