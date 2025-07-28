const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const router = express.Router();

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dev_only';

// Route d'inscription
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // Validation basique
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      if (user) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }

      // Crypter le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      db.run(
        'INSERT INTO users (email, password) VALUES (?, ?)',
        [email, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
          }

          // Créer le token JWT
          const token = jwt.sign({ userId: this.lastID, email }, JWT_SECRET);

          res.status(201).json({
            message: 'Utilisateur créé avec succès',
            token,
            user: { id: this.lastID, email }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de connexion
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  // Trouver l'utilisateur
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur de base de données' });
    }

    if (!user) {
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    try {
      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
      }

      // Créer le token JWT
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);

      res.json({
        message: 'Connexion réussie',
        token,
        user: { id: user.id, email: user.email }
      });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
});

module.exports = router;