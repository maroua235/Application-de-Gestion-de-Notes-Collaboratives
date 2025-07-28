# Utiliser l'image officielle Node.js
FROM node:18-alpine

# Installer les dépendances système nécessaires pour SQLite3
RUN apk add --no-cache python3 make g++ sqlite

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances et recompiler sqlite3 pour l'architecture Alpine
RUN npm ci --only=production && \
    npm rebuild sqlite3

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Changer le propriétaire des fichiers
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exposer le port
EXPOSE 3001

# Démarrer l'application
CMD ["node", "server.js"]