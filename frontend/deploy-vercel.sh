#!/bin/bash

echo "Vercelデプロイを開始します..."

echo ""
echo "1. 依存関係をインストール中..."
npm install

echo ""
echo "2. ビルド中..."
npm run build

echo ""
echo "3. Vercelにデプロイ中..."
vercel --prod

echo ""
echo "デプロイが完了しました！"
