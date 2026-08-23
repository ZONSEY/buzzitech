FROM nginx:alpine

# nginx.conf est un gabarit (${PORT}, ${API_HOST}, ...) : l'image nginx
# officielle exécute automatiquement envsubst sur tout fichier placé dans
# /etc/nginx/templates/*.template au démarrage, en ne substituant que les
# vraies variables d'environnement (les variables nginx comme $host ou
# $remote_addr ne sont pas touchées).
COPY nginx.conf /etc/nginx/templates/default.conf.template
