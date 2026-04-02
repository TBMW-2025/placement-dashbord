#!/bin/bash
# Simple script to automatically push changes to GitHub

echo "Syncing your code with GitHub..."
git add .
git commit -m "Auto-update: $(date '+%Y-%m-%d %H:%M:%S')"
git push

echo ""
echo "✅ Done! Your changes are safely on GitHub and will deploy shortly."
