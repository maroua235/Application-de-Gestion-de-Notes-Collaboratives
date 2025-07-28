# Application de Gestion de Notes Collaboratives

Une application web moderne de gestion de notes avec authentification, recherche, filtrage et partage entre utilisateurs, développée avec Node.js + React.js.

## Fonctionnalités Implémentées

### Authentification (JWT)
- **Inscription** d'utilisateur avec email + mot de passe
- **Connexion / Déconnexion** avec persistance de session
- **Middleware de sécurisation** des routes API
- **Validation** des données d'entrée

### Gestion Complète des Notes
Chaque note comprend :
- **Titre** (requis)
- **Contenu** avec support Markdown complet
- **Tags** optionnels (séparés par virgules)
- **Statut de visibilité** : privé / partagé / public
- **Dates** de création et modification automatiques

**Fonctionnalités API disponibles :**
- Créer une note
- Lister ses notes + notes partagées
- Modifier une note (propriétaire uniquement)
- Supprimer une note (propriétaire uniquement)
- Rechercher par titre ou tag
- Filtrer par statut de visibilité

### Partage de Notes Avancé
- **Partage utilisateur** : Partager une note avec un autre utilisateur (lecture seule)
- **Liens publics** : Générer des liens publics avec token sécurisé
- **Gestion des partages** : Voir qui a accès à vos notes
- **Accès partagé** : Visualiser les notes partagées avec vous

### Interface Web Moderne
- **Éditeur Markdown** avec aperçu en temps réel
- **Rendu Markdown** : Titres, gras, italique, liens, code
- **Affichage par statut** avec filtres dynamiques
- **Barre de recherche** temps réel
- **Interface responsive** (desktop/mobile)
- **Notifications** de succès/erreur élégantes
- **Distinction visuelle** entre notes propres et partagées

## Technologies Utilisées

### Backend
- **Node.js** avec Express.js v4+
- **JWT** (jsonwebtoken) pour l'authentification
- **bcryptjs** pour le cryptage des mots de passe
- **SQLite3** comme base de données
- **CORS** pour la communication cross-origin
- **Joi** pour la validation des données
- **crypto** pour les tokens publics sécurisés

### Frontend
- **React.js 18** avec TypeScript
- **Axios** pour les requêtes HTTP
- **Context API** pour la gestion d'état globale
- **Hooks personnalisés** pour les notifications
- **CSS moderne** avec Flexbox/Grid
- **Support Markdown** avec rendu HTML

### DevOps
- **Docker** avec docker-compose
- **Nginx** pour le reverse proxy en production
- **Variables d'environnement** pour la configuration

## Structure du Projet

```
notes-app/
├── backend/
│   ├── server.js              # Serveur Express principal
│   ├── auth.js                # Routes d'authentification JWT
│   ├── notes.js               # Routes CRUD + partage des notes
│   ├── database.js            # Configuration SQLite + schémas
│   ├── .env                   # Variables d'environnement 
│   ├── .env.example           # Exemple de configuration
│   ├── notes.db               # Base de données SQLite 
│   ├── package.json           # Dépendances Node.js
│   └── Dockerfile             # Image Docker backend
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Composant racine
│   │   ├── AuthContext.tsx    # Contexte d'authentification
│   │   ├── Login.tsx          # Formulaire connexion/inscription
│   │   ├── Notes.tsx          # Interface de gestion des notes
│   │   ├── ShareNote.tsx      # Modal de partage
│   │   ├── Notification.tsx   # Composant notifications
│   │   ├── useNotification.tsx # Hook notifications
│   │   ├── index.tsx          # Point d'entrée React
│   │   └── index.css          # Styles globaux
│   ├── public/
│   ├── Dockerfile             # Image Docker frontend
│   ├── nginx.conf             # Configuration Nginx
│   └── package.json           # Dépendances React
├── docker-compose.yml         # Orchestration Docker
├── .gitignore                 # Fichiers à ignorer
└── README.md                  # Documentation 
```

## Installation et Lancement

### Prérequis
- **Node.js** v18+ ([Télécharger](https://nodejs.org/))
- **npm** v8+ (inclus avec Node.js)
- **Git** ([Télécharger](https://git-scm.com/))
- **Docker** + Docker Compose (optionnel, pour le déploiement)

### Installation Manuelle (Développement)

#### 1. Cloner le Repository
```bash
git clone https://github.com/maroua235/Application-de-Gestion-de-Notes-Collaboratives
cd notes-app
```

#### 2. Configuration Backend
```bash
cd backend

# Installer les dépendances
npm install

# Créer le fichier de configuration
cp .env.example .env

# Générer un secret JWT sécurisé
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

**Éditez le fichier `.env`** avec le secret généré :
```env
JWT_SECRET=votre_secret_jwt_genere_ici
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

#### 3. Configuration Frontend
```bash
cd ../frontend

# Installer les dépendances
npm install
```

#### 4. Lancement de l'Application

**Terminal 1 - Backend :**
```bash
cd backend
npm start
# Serveur démarré sur http://localhost:3001
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm start
# Application disponible sur http://localhost:3000
```

#### 5. Accès à l'Application
- **Interface utilisateur** : http://localhost:3000
- **API Backend** : http://localhost:3001
- **Test API** : http://localhost:3001/api/test

### Installation avec Docker (Production)

```bash
# Cloner et configurer
git clone https://github.com/maroua235/Application-de-Gestion-de-Notes-Collaboratives
cd notes-app

# Lancer avec Docker Compose
docker-compose up --build

# L'application sera disponible sur http://localhost:3000
```

## Tests et Validation

### Tests Manuels de l'Interface

1. **Authentification**
   - Créer un compte avec email/mot de passe
   - Se connecter avec les identifiants
   - Vérifier la persistance de session (rafraîchir la page)
   - Se déconnecter

2. **Gestion des Notes**
   - Créer une note avec titre, contenu Markdown, tags
   - Tester l'aperçu Markdown (titres, gras, liens)
   - Modifier une note existante
   - Supprimer une note
   - Rechercher par titre ou tag
   - Filtrer par statut (privé/partagé/public)

3. **Partage de Notes**
   - Partager une note avec un autre utilisateur
   - Générer un lien public
   - Accéder à une note via lien public
   - Vérifier les permissions (lecture seule pour notes partagées)

### Tests API avec cURL

#### Authentification
```bash
# Inscription
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

#### Gestion des Notes
```bash
# Créer une note (remplacez TOKEN par votre JWT)
curl -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "title":"Ma première note",
    "content":"# Titre\n**Texte en gras**\n[Lien](https://example.com)",
    "tags":"markdown,test",
    "status":"private"
  }'

# Lister les notes
curl -X GET http://localhost:3001/api/notes \
  -H "Authorization: Bearer TOKEN"

# Rechercher des notes
curl -X GET "http://localhost:3001/api/notes?search=markdown&status=private" \
  -H "Authorization: Bearer TOKEN"
```

#### Partage de Notes
```bash
# Partager une note avec un utilisateur
curl -X POST http://localhost:3001/api/notes/1/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"email":"ami@example.com"}'

# Générer un lien public
curl -X POST http://localhost:3001/api/notes/1/public-link \
  -H "Authorization: Bearer TOKEN"

# Accéder à une note publique (sans authentification)
curl -X GET http://localhost:3001/api/notes/public/TOKEN_PUBLIC
```

## Sécurité Implémentée

### Mesures de Protection
- **Cryptage des mots de passe** avec bcrypt 
- **Authentification JWT** avec secret sécurisé
- **Validation des entrées** avec vérifications côté serveur
- **Protection des routes** avec middleware d'authentification
- **Configuration CORS** restrictive
- **Tokens publics** générés avec crypto.randomBytes
- **Isolation des données** utilisateur par user_id

### Recommandations Production
- Variables d'environnement pour tous les secrets
- Rate limiting sur les endpoints sensibles
- Validation plus stricte avec Joi/Zod
- HTTPS obligatoire
- Base de données PostgreSQL
- Logs de sécurité et monitoring

## Résolution des Problèmes

### Problèmes Courants

**1. Erreur "Token invalide" :**
- Vérifiez que le backend utilise le même JWT_SECRET
- Reconnectez-vous pour obtenir un nouveau token

**2. Erreur de connexion frontend/backend :**
- Vérifiez que le backend tourne sur le port 3001
- Vérifiez les paramètres CORS dans `server.js`

**3. Notes partagées non visibles :**
- Vérifiez que l'utilisateur cible existe dans la base
- Vérifiez l'email exact utilisé pour le partage

**4. Problème avec Docker :**
```bash
# Nettoyer et reconstruire
docker-compose down -v
docker-compose up --build
```

### Logs de Débogage

**Backend :**
```bash
cd backend
DEBUG=* npm start  # Mode debug complet
```

**Base de données :**
```bash
# Vérifier la structure de la base
sqlite3 backend/notes.db ".schema"
sqlite3 backend/notes.db "SELECT * FROM users;"
```

## Conformité au Cahier des Charges

### Version 2 (Node.js + React.js) - 100% Conforme

**Backend :**
- Node.js avec Express.js
- JWT Auth via `jsonwebtoken`
- Validation des données (manuelle + Joi recommandé)
- Base de données SQLite
- Gestion d'erreurs complète

**Frontend :**
- React.js avec TypeScript
- Auth Context pour la gestion d'état
- Interface responsive
- Notifications utilisateur

**Fonctionnalités :**
- Authentification complète (inscription/connexion/déconnexion)
- CRUD complet des notes
- Recherche et filtrage avancés
- Partage utilisateur et liens publics
- Interface Markdown avec aperçu
- Gestion des permissions

**Livraison :**
- Code source complet et organisé
- README.md détaillé avec instructions
- Dockerisation fonctionnelle
- Bonnes pratiques respectées

## Déploiement Production

### Variables d'Environnement Production

**Backend (.env.production) :**
```env
JWT_SECRET=VOTRE_SECRET_PRODUCTION_ULTRA_SECURISE_64_CARACTERES_MINIMUM
NODE_ENV=production
PORT=3001
CORS_ORIGIN=http://localhost:3000
DB_PATH=/data/notes.db
```

### Commandes de Production

```bash
# Build et déploiement
docker-compose -f docker-compose.prod.yml up -d

# Monitoring des logs
docker-compose logs -f

# Backup de la base de données
docker cp notes-app_backend_1:/app/notes.db ./backup_$(date +%Y%m%d).db
```

## Informations de Développement

**Auteur :** Développé par Assahli Maroua dans le cadre d'un exercice technique de stage  


---
