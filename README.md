# Application de Gestion de Notes Collaboratives

Une application web moderne de gestion de notes avec authentification, recherche, filtrage et partage entre utilisateurs.

##  Fonctionnalités

### Authentification
-  Inscription d'utilisateur (email + mot de passe)
-  Connexion / Déconnexion
-  Sécurisation des routes API avec JWT
-  Persistance de la session

### Gestion des Notes
-  Créer une note avec titre, contenu, tags
-  Lister ses notes
-  Modifier une note
-  Supprimer une note
-  Recherche par titre ou tag
-  Filtrage par statut de visibilité
-  Support du Markdown dans le contenu

### Statuts de Visibilité
- **Privé** : Visible uniquement par le propriétaire
- **Partagé** : Peut être partagé avec d'autres utilisateurs
- **Public** : Accessible publiquement

### Interface Utilisateur
-  Interface responsive (desktop/mobile)
-  Affichage des notes par statut
-  Barre de recherche et filtres
-  Notifications de succès/erreur
-  Design moderne et intuitif

##  Technologies Utilisées

### Backend
- **Node.js** avec Express.js
- **JWT** pour l'authentification
- **bcryptjs** pour le cryptage des mots de passe
- **SQLite** comme base de données
- **CORS** pour la communication frontend/backend

### Frontend
- **React.js** avec TypeScript
- **Axios** pour les requêtes API
- **Context API** pour la gestion d'état
- **CSS moderne** avec Flexbox/Grid

##  Structure du Projet

```
notes-app/
├── backend/
│   ├── server.js          # Serveur principal
│   ├── auth.js            # Routes d'authentification
│   ├── notes.js           # Routes de gestion des notes
│   ├── database.js        # Configuration base de données
│   ├── notes.db           # Base de données SQLite
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Composant principal
│   │   ├── AuthContext.tsx # Contexte d'authentification
│   │   ├── Login.tsx      # Composant de connexion
│   │   ├── Notes.tsx      # Composant de gestion des notes
│   │   ├── index.tsx      # Point d'entrée
│   │   └── index.css      # Styles globaux
│   ├── public/
│   └── package.json
├── docker-compose.yml     # Configuration Docker
└── README.md
```

##  Installation et Lancement

### Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn
- Git

### Installation Manuelle

1. **Cloner le repository**
```bash
git clone [URL_DU_REPO]
cd notes-app
```

2. **Installation du Backend**
```bash
cd backend
npm install
```

3. **Installation du Frontend**
```bash
cd ../frontend
npm install
```

4. **Lancement de l'application**

**Terminal 1 - Backend :**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm start
```

5. **Accéder à l'application**
- Frontend : http://localhost:3000
- Backend API : http://localhost:3001

### Installation avec Docker

```bash
docker-compose up --build
```

L'application sera accessible sur http://localhost:3000

##  Tests

### Tests manuels de l'API

**Authentification :**
```bash
# Inscription
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

**Gestion des notes :**
```bash
# Créer une note 
curl -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc1MzU0NzkyM30.Iec3GSvIMTrBQvGp1IeHS8jd8FuiwxPQ6G-rzTXQgQQ" \
  -d '{"title":"Test","content":"Contenu test","tags":"demo,test","status":"private"}'

# Lister les notes
curl -X GET http://localhost:3001/api/notes \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc1MzU0NzkyM30.Iec3GSvIMTrBQvGp1IeHS8jd8FuiwxPQ6G-rzTXQgQQ"
```

##  Résolution des Problèmes

### Problèmes courants

**1. Erreur de connexion frontend/backend**
- Vérifiez que le backend tourne sur le port 3001
- Vérifiez les paramètres CORS dans `backend/server.js`

**2. Erreur de base de données**
- Supprimez le fichier `backend/notes.db` et relancez le serveur
- Vérifiez les permissions du dossier backend

**3. Problèmes d'authentification**
- Vérifiez que le token JWT est correctement envoyé dans les headers
- Vérifiez la constante JWT_SECRET dans les fichiers

### Logs de débogage

**Backend :**
- Les logs s'affichent dans le terminal du serveur
- Vérifiez les requêtes dans la console

**Frontend :**
- Ouvrez les outils de développement (F12)
- Vérifiez l'onglet Console pour les erreurs
- Vérifiez l'onglet Network pour les requêtes API

##  Sécurité

### Mesures implémentées
-  Cryptage des mots de passe avec bcrypt
-  Authentification JWT
-  Validation des entrées utilisateur
-  Protection des routes API
-  Configuration CORS restrictive

### À améliorer en production
-  Variables d'environnement pour les secrets
-  Rate limiting sur les API
-  Validation plus stricte des données
-  HTTPS obligatoire
-  Base de données PostgreSQL

##  API Documentation

### Authentification

**POST** `/api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "motdepasse"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "motdepasse"
}
```

### Notes (Authentification requise)

**GET** `/api/notes?search=terme&status=private`
- Paramètres optionnels : `search`, `status`

**POST** `/api/notes`
```json
{
  "title": "Titre de la note",
  "content": "Contenu markdown",
  "tags": "tag1,tag2,tag3",
  "status": "private|shared|public"
}
```

**PUT** `/api/notes/:id`
```json
{
  "title": "Nouveau titre",
  "content": "Nouveau contenu",
  "tags": "nouveaux,tags",
  "status": "private|shared|public"
}
```

**DELETE** `/api/notes/:id`

##  Déploiement

### Variables d'environnement recommandées

**Backend (.env) :**
```
JWT_SECRET=votre_secret_jwt_super_securise
DB_PATH=./notes.db
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

**Frontend :**
```
REACT_APP_API_URL=http://localhost:3001
```

### Pour générer rapidement un secret :

**Ouvrez un terminal et tapez :**
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"


##  Développement

### Scripts disponibles

**Backend :**
- `npm start` : Démarrer le serveur
- `npm run dev` : Démarrer en mode développement (avec nodemon)

**Frontend :**
- `npm start` : Démarrer en mode développement
- `npm run build` : Build de production
- `npm test` : Lancer les tests

##  Fonctionnalités futures

-  Partage de notes avec d'autres utilisateurs
-  Liens publics pour les notes
-  Éditeur Markdown avec prévisualisation
-  Système de notifications
-  Recherche avancée
-  Export des notes (PDF, Markdown)
-  Thèmes sombre/clair
-  Application mobile

##  Licence

Ce projet est développé dans le cadre d'un exercice technique.

##  Auteur

Développé par Assahli Maroua dans le cadre d'une candidature de stage.

---

**Temps de développement estimé :** 72h