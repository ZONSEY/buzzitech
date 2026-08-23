#!/bin/sh
set -e

# Génère env.js à partir du gabarit copié par le build Angular (voir
# public/env.js.template), en substituant API_BASE_URL. Vide par défaut :
# le frontend appelle alors /api en relatif (cas nginx same-origin local).
: "${API_BASE_URL:=}"

envsubst '${API_BASE_URL}' \
  < /usr/share/nginx/html/env.js.template \
  > /usr/share/nginx/html/env.js
