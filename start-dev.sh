#!/usr/bin/env bash

# RLA2 Medical Delivery Logistics - Development Setup Script
# This script sets up and runs both the backend and frontend

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  RLA2 Medical Delivery Logistics - Setup & Run Script       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found!${NC}"
    echo "  Please download from: https://nodejs.org/"
    exit 1
fi

# Check for Python
if ! command -v python &> /dev/null; then
    echo -e "${RED}✗ Python not found!${NC}"
    echo "  Please download from: https://python.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node -v)${NC}"
echo -e "${GREEN}✓ Python found: $(python --version)${NC}"
echo ""

# Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Start backend in background
echo -e "${BLUE}🚀 Starting Flask backend on port 5000...${NC}"
python app.py &
BACKEND_PID=$!
sleep 3
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Start frontend
echo -e "${BLUE}🚀 Starting React frontend on port 3000...${NC}"
echo -e "${YELLOW}Once loaded, open: ${BLUE}http://localhost:3000/${NC}"
echo ""

npm run dev

# Cleanup
echo ""
echo -e "${YELLOW}Shutting down...${NC}"
kill $BACKEND_PID 2>/dev/null
echo -e "${GREEN}✓ Done${NC}"
