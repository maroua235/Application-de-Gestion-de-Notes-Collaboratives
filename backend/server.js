require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const authRoutes = require('./auth');
const notesRoutes = require('./notes'); // Ajouter les routes notes
const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: 'http://localhost:3000'
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes); // Ajouter les routes notes

// Route de test
app.get('/api/test', (req, res) => {
  console.log('Route /api/test appelée');
  res.json({ message: 'Backend fonctionne !' });
});

// Test de la base de données
app.get('/api/db-test', (req, res) => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ tables: rows, message: 'Base de données connectée !' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});