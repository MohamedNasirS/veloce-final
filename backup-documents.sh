#!/bin/bash

# Document Backup Script for Veloce Marketplace
# Run this before major deployments for extra safety

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📁 Veloce Marketplace Document Backup${NC}"
echo "======================================"

# Create backup directory with timestamp
BACKUP_DIR="backups/documents-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📂 Creating backup of documents...${NC}"

# Backup all document types
if [ -d "backend/uploads/documents" ]; then
    cp -r backend/uploads/documents "$BACKUP_DIR/"
    echo -e "${GREEN}✅ User documents backed up${NC}"
fi

if [ -d "backend/uploads/bids" ]; then
    cp -r backend/uploads/bids "$BACKUP_DIR/"
    echo -e "${GREEN}✅ Bid documents backed up${NC}"
fi

if [ -d "backend/uploads/gatepasses" ]; then
    cp -r backend/uploads/gatepasses "$BACKUP_DIR/"
    echo -e "${GREEN}✅ Gate passes backed up${NC}"
fi

if [ -d "backend/uploads/users" ]; then
    cp -r backend/uploads/users "$BACKUP_DIR/"
    echo -e "${GREEN}✅ User files backed up${NC}"
fi

# Create backup info file
cat > "$BACKUP_DIR/backup-info.txt" << EOF
Backup created: $(date)
Total files: $(find "$BACKUP_DIR" -type f | wc -l)
Total size: $(du -sh "$BACKUP_DIR" | cut -f1)
Source: backend/uploads/
EOF

echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
echo -e "${YELLOW}📁 Backup location: $BACKUP_DIR${NC}"
echo -e "${YELLOW}📊 Backup info: $BACKUP_DIR/backup-info.txt${NC}"

# Optional: Compress backup
read -p "Do you want to compress the backup? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
    tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
    rm -rf "$BACKUP_DIR"
    echo -e "${GREEN}✅ Compressed backup: $BACKUP_DIR.tar.gz${NC}"
fi
