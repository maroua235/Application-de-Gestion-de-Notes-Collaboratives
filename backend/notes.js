require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./database');
const Joi = require('joi');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dev_only';

// Middleware pour vérifier l'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Créer une note
router.post('/', authenticateToken, (req, res) => {
  const { title, content, tags, status } = req.body;
  const userId = req.user.userId;

  if (!title) {
    return res.status(400).json({ error: 'Le titre est requis' });
  }

  const validStatus = ['private', 'shared', 'public'];
  const noteStatus = validStatus.includes(status) ? status : 'private';

  db.run(
    'INSERT INTO notes (title, content, tags, status, user_id) VALUES (?, ?, ?, ?, ?)',
    [title, content || '', tags || '', noteStatus, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la création de la note' });
      }

      res.status(201).json({
        id: this.lastID,
        title,
        content: content || '',
        tags: tags || '',
        status: noteStatus,
        message: 'Note créée avec succès'
      });
    }
  );
});

// Lister les notes de l'utilisateur + notes partagées avec moi
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const userEmail = req.user.email;
  const { search, status } = req.query;

  // Query pour mes notes + notes partagées avec moi
  let query = `
    SELECT n.*, u.email as owner_email, 'own' as source
    FROM notes n 
    JOIN users u ON n.user_id = u.id
    WHERE n.user_id = ?
    
    UNION ALL
    
    SELECT n.*, u.email as owner_email, 'shared' as source
    FROM notes n 
    JOIN users u ON n.user_id = u.id
    JOIN note_shares ns ON n.id = ns.note_id
    WHERE ns.shared_with_email = ?
  `;
  
  let params = [userId, userEmail];

  // Filtrer par statut si spécifié
  if (status && ['private', 'shared', 'public'].includes(status)) {
    query = `SELECT * FROM (${query}) WHERE status = ?`;
    params.push(status);
  }

  // Recherche par titre ou tags
  if (search) {
    const searchCondition = status ? 
      ' AND (title LIKE ? OR tags LIKE ?)' : 
      ` WHERE title LIKE ? OR tags LIKE ?`;
    query += searchCondition;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY updated_at DESC';

  db.all(query, params, (err, notes) => {
    if (err) {
      console.error('Erreur SQL:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des notes' });
    }
    res.json(notes);
  });
});

// Récupérer une note spécifique
router.get('/:id', authenticateToken, (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.userId;
  const userEmail = req.user.email;

  // Vérifier si l'utilisateur peut accéder à cette note
  db.get(`
    SELECT n.*, u.email as owner_email
    FROM notes n 
    JOIN users u ON n.user_id = u.id
    WHERE n.id = ? AND (
      n.user_id = ? OR 
      EXISTS(SELECT 1 FROM note_shares WHERE note_id = ? AND shared_with_email = ?)
    )
  `, [noteId, userId, noteId, userEmail], (err, note) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur de base de données' });
    }

    if (!note) {
      return res.status(404).json({ error: 'Note non trouvée' });
    }

    res.json(note);
  });
});

// Modifier une note (seulement le propriétaire)
router.put('/:id', authenticateToken, (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.userId;
  const { title, content, tags, status } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Le titre est requis' });
  }

  const validStatus = ['private', 'shared', 'public'];
  const noteStatus = validStatus.includes(status) ? status : 'private';

  db.run(
    `UPDATE notes 
     SET title = ?, content = ?, tags = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ? AND user_id = ?`,
    [title, content || '', tags || '', noteStatus, noteId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la modification' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Note non trouvée ou non autorisée' });
      }

      res.json({ message: 'Note modifiée avec succès' });
    }
  );
});

// Supprimer une note (seulement le propriétaire)
router.delete('/:id', authenticateToken, (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.userId;

  db.run(
    'DELETE FROM notes WHERE id = ? AND user_id = ?',
    [noteId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la suppression' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Note non trouvée' });
      }

      res.json({ message: 'Note supprimée avec succès' });
    }
  );
});

// Partager une note avec un utilisateur
router.post('/:id/share', authenticateToken, (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.userId;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }

  // Vérifier que la note appartient à l'utilisateur
  db.get(
    'SELECT * FROM notes WHERE id = ? AND user_id = ?',
    [noteId, userId],
    (err, note) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      if (!note) {
        return res.status(404).json({ error: 'Note non trouvée' });
      }

      // Vérifier que l'utilisateur cible existe
      db.get(
        'SELECT id FROM users WHERE email = ?',
        [email],
        (err, targetUser) => {
          if (err) {
            return res.status(500).json({ error: 'Erreur de base de données' });
          }

          if (!targetUser) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
          }

          // Créer le partage
          db.run(
            'INSERT OR REPLACE INTO note_shares (note_id, shared_with_email, shared_by_user_id) VALUES (?, ?, ?)',
            [noteId, email, userId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Erreur lors du partage' });
              }

              res.json({
                message: `Note partagée avec succès avec ${email}`,
                shareId: this.lastID
              });
            }
          );
        }
      );
    }
  );
});

// Générer un lien public
router.post('/:id/public-link', authenticateToken, (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.userId;
  
  const publicToken = crypto.randomBytes(32).toString('hex');

  // Vérifier que la note appartient à l'utilisateur
  db.get(
    'SELECT * FROM notes WHERE id = ? AND user_id = ?',
    [noteId, userId],
    (err, note) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      if (!note) {
        return res.status(404).json({ error: 'Note non trouvée' });
      }

      // Mettre à jour la note avec le token public
      db.run(
        'UPDATE notes SET public_token = ?, status = ? WHERE id = ?',
        [publicToken, 'public', noteId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erreur lors de la génération du lien' });
          }

          res.json({
            message: 'Lien public généré avec succès',
            publicLink: `http://localhost:3000/public/${publicToken}`,
            token: publicToken
          });
        }
      );
    }
  );
});

// Accéder à une note via lien public (SANS authentification)
router.get('/public/:token', (req, res) => {
  const token = req.params.token;

  db.get(
    'SELECT n.*, u.email as owner_email FROM notes n JOIN users u ON n.user_id = u.id WHERE n.public_token = ? AND n.status = "public"',
    [token],
    (err, note) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      if (!note) {
        return res.status(404).json({ error: 'Note publique non trouvée' });
      }

      res.json(note);
    }
  );
});

// Lister les partages d'une note
router.get('/:id/shares', authenticateToken, (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.userId;

  // Vérifier que la note appartient à l'utilisateur
  db.get(
    'SELECT * FROM notes WHERE id = ? AND user_id = ?',
    [noteId, userId],
    (err, note) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      if (!note) {
        return res.status(404).json({ error: 'Note non trouvée' });
      }

      // Lister les partages
      db.all(
        'SELECT * FROM note_shares WHERE note_id = ? ORDER BY created_at DESC',
        [noteId],
        (err, shares) => {
          if (err) {
            return res.status(500).json({ error: 'Erreur lors de la récupération des partages' });
          }

          res.json({
            note: note,
            shares: shares,
            publicLink: note.public_token ? `http://localhost:3000/public/${note.public_token}` : null
          });
        }
      );
    }
  );
});

module.exports = router;