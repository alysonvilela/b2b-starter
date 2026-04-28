#!/bin/sh
set -e

node_modules/.bin/medusa db:migrate

if [ -n "$MEDUSA_ADMIN_EMAIL" ] && [ -n "$MEDUSA_ADMIN_PASSWORD" ]; then
  node_modules/.bin/medusa user -e "$MEDUSA_ADMIN_EMAIL" -p "$MEDUSA_ADMIN_PASSWORD" || true
fi

exec node_modules/.bin/medusa start
