#!/bin/sh
git filter-branch --force --tree-filter '
if [ -f frontend/env.production ]; then
  sed -i "s/VITE_OPENAI_API_KEY=sk-proj-.*/VITE_OPENAI_API_KEY=your-openai-api-key-here/g" frontend/env.production
fi
if [ -f NEW_API_KEY_SETUP_COMPLETE.md ]; then
  sed -i "s/sk-proj-[^ ]*/REMOVED_API_KEY/g" NEW_API_KEY_SETUP_COMPLETE.md
fi
if [ -f RAILWAY_API_KEY_SETUP.md ]; then
  sed -i "s/sk-proj-[^ ]*/your-openai-api-key-here/g" RAILWAY_API_KEY_SETUP.md
fi
if [ -f SETUP_RAILWAY_ENV.md ]; then
  sed -i "s/sk-proj-[^ ]*/your-openai-api-key-here/g" SETUP_RAILWAY_ENV.md
fi
if [ -f set-railway-api-key.bat ]; then
  sed -i "s/sk-proj-[^ ]*/your-openai-api-key-here/g" set-railway-api-key.bat
fi
' --prune-empty --tag-name-filter cat -- --all


