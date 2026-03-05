#!/bin/bash
# ═══════════════════════════════════════════════════
# Ghaith ERP - Azure VM Deployment Script
# ═══════════════════════════════════════════════════
set -e

echo "========================================="
echo "  Ghaith ERP - Deployment Script"
echo "========================================="

# --- Configuration ---
# Change these if your DB is different
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ghaith_erp}"
DB_USER="${DB_USER:-ghaith_admin}"
DB_PASS="${DB_PASS:-ghaith_pass}"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- Step 1: Install Dependencies ---
echo ""
echo "[1/6] Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq openjdk-21-jdk maven nodejs npm postgresql-client curl unzip > /dev/null 2>&1 || true

# Install Node.js 20+ if current version is too old
NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
    echo "  Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y -qq nodejs > /dev/null 2>&1
fi

echo "  Java: $(java -version 2>&1 | head -1)"
echo "  Node: $(node -v)"
echo "  Maven: $(mvn -v 2>&1 | head -1)"

# --- Step 2: Setup PostgreSQL (if local) ---
echo ""
echo "[2/6] Setting up PostgreSQL..."
if command -v psql &> /dev/null; then
    # Check if DB exists
    if sudo -u postgres psql -lqt 2>/dev/null | grep -q "$DB_NAME"; then
        echo "  Database '$DB_NAME' already exists."
    else
        echo "  Creating database and user..."
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || echo "  User already exists"
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "  Database already exists"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
        echo "  Database created successfully."
    fi
else
    echo "  PostgreSQL client not found. Make sure the database is accessible at $DB_HOST:$DB_PORT"
fi

# Test DB connection
echo "  Testing database connection..."
if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "  Database connection OK!"
else
    echo "  WARNING: Cannot connect to database at $DB_HOST:$DB_PORT/$DB_NAME"
    echo "  Make sure PostgreSQL is running and accessible."
    echo "  You may need to edit pg_hba.conf to allow password auth."
    echo ""
    echo "  Quick fix for local PostgreSQL:"
    echo "    sudo -u postgres psql -c \"ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';\""
    echo "    sudo sed -i 's/peer/md5/g' /etc/postgresql/*/main/pg_hba.conf"
    echo "    sudo systemctl restart postgresql"
fi

# --- Step 3: Build Backend ---
echo ""
echo "[3/6] Building Spring Boot backend..."
cd "$PROJECT_DIR/backend"
export DB_HOST DB_PORT DB_NAME DB_USER DB_PASS
mvn clean package -DskipTests -q
echo "  Backend built: target/erp-0.0.1-SNAPSHOT.jar"

# --- Step 4: Build Frontend ---
echo ""
echo "[4/6] Building frontend..."
cd "$PROJECT_DIR"
npm install --legacy-peer-deps 2>&1 | tail -1
npx vite build --config frontend/vite.config.ts 2>&1 | tail -3
echo "  Frontend built: dist/public/"

# --- Step 5: Create systemd services ---
echo ""
echo "[5/6] Setting up systemd services..."

# Backend service
sudo tee /etc/systemd/system/ghaith-backend.service > /dev/null << SERVICEEOF
[Unit]
Description=Ghaith ERP Backend (Spring Boot)
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR/backend
Environment=DB_HOST=$DB_HOST
Environment=DB_PORT=$DB_PORT
Environment=DB_NAME=$DB_NAME
Environment=DB_USER=$DB_USER
Environment=DB_PASS=$DB_PASS
ExecStart=/usr/bin/java -jar $PROJECT_DIR/backend/target/erp-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Frontend - serve static files with a simple Node server
sudo tee /etc/systemd/system/ghaith-frontend.service > /dev/null << SERVICEEOF
[Unit]
Description=Ghaith ERP Frontend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/npx serve dist/public -l 5173 -s
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF

sudo systemctl daemon-reload
echo "  Services created."

# --- Step 6: Start services ---
echo ""
echo "[6/6] Starting services..."
sudo systemctl enable ghaith-backend ghaith-frontend
sudo systemctl restart ghaith-backend
sleep 5
sudo systemctl restart ghaith-frontend

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "  Backend:  http://$(hostname -I | awk '{print $1}'):8080"
echo "  Frontend: http://$(hostname -I | awk '{print $1}'):5173"
echo ""
echo "  Login: admin / Admin@2026"
echo ""
echo "  Check status:"
echo "    sudo systemctl status ghaith-backend"
echo "    sudo systemctl status ghaith-frontend"
echo ""
echo "  View logs:"
echo "    sudo journalctl -u ghaith-backend -f"
echo "    sudo journalctl -u ghaith-frontend -f"
echo ""
