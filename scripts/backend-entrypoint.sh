#!/bin/sh
set -e

node_modules/.bin/medusa db:migrate

exec node_modules/.bin/medusa start
