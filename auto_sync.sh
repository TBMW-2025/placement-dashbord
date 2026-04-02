#!/bin/bash
# Continuous GitHub Auto-Sync

echo "🟢 Auto-Sync is ACTIVE!"
echo "Any changes you make to these files will be uploaded and deployed instantly."
echo "Running in background... (Checking every 10 seconds)"

while true; do
  # Check if there are any uncommitted changes
  if [[ -n $(git status --porcelain) ]]; then
    git add .
    git commit -m "Auto-update: $(date '+%Y-%m-%d %H:%M:%S')" --quiet
    git push --quiet
    echo "✅ Auto-synced changes at $(date '+%H:%M:%S')"
  fi
  
  # Wait 10 seconds before checking again
  sleep 10
done
