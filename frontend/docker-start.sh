#!/bin/sh
set -e

# RailwayがPORTを注入しない場合は80にフォールバック
export PORT="${PORT:-80}"

# nginx設定テンプレートの ${PORT} を実際のポートに置換
envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Starting nginx on port ${PORT}"
exec nginx -g 'daemon off;'
