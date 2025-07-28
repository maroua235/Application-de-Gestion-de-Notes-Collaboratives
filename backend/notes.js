const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./database');
const router = express.Router();

require('dotenv').config();
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

// Lister les notes de l'utilisateur
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { search, status } = req.query;

  let query = 'SELECT * FROM notes WHERE user_id = ?';
  let params = [userId];

  // Filtrer par statut
  if (status && ['private', 'shared', 'public'].includes(status)) {
    query += ' AND status = ?';
    params.push(status);
  }

  // Recherche par titre ou tags
  if (search) {
    query += ' AND (title LIKE ? OR tags LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY updated_at DESC';

  db.all(query, params, (err, notes) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des notes' });
    }
    res.json(notes);
  });
});

// Récupérer une note spécifique
router.get('/:id', authenticateToken, (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.userId;

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

      res.json(note);
    }
  );
});

// Modifier une note
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
        return res.status(404).json({ error: 'Note non trouvée' });
      }

      res.json({ message: 'Note modifiée avec succès' });
    }
  );
});

// Supprimer une note
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
  const { sharedWithEmail } = req.body;

  if (!sharedWithEmail) {
    return res.status(400).json({ error: 'Email de partage requis' });
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

      // Trouver l'utilisateur avec qui partager
      db.get(
        'SELECT id FROM users WHERE email = ?',
        [sharedWithEmail],
        (err, sharedUser) => {
          if (err) {
            return res.status(500).json({ error: 'Erreur de base de données' });
          }

          if (!sharedUser) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
          }

          // Vérifier si déjà partagé
          db.get(
            'SELECT * FROM shares WHERE note_id = ? AND shared_with_user_id = ?',
            [noteId, sharedUser.id],
            (err, existingShare) => {
              if (err) {
                return res.status(500).json({ error: 'Erreur de base de données' });
              }

              if (existingShare) {
                return res.status(400).json({ error: 'Note déjà partagée avec cet utilisateur' });
              }

              // Créer le partage
              db.run(
                'INSERT INTO shares (note_id, shared_with_user_id) VALUES (?, ?)',
                [noteId, sharedUser.id],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: 'Erreur lors du partage' });
                  }

                  res.json({ 
                    message: `Note partagée avec ${sharedWithEmail}`,
                    shareId: this.lastID
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Lister les notes partagées AVEC moi
router.get('/shared-with-me', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(`
    SELECT n.*, u.email as owner_email, s.created_at as shared_at
    FROM notes n
    JOIN shares s ON n.id = s.note_id
    JOIN users u ON n.user_id = u.id
    WHERE s.shared_with_user_id = ?
    ORDER BY s.created_at DESC
  `, [userId], (err, notes) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la récupération' });
    }
    res.json(notes);
  });
});

// Générer un lien public pour une note
router.post('/:id/public-link', authenticateToken, (req, res) => {
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

      // Mettre à jour le statut de la note en public
      db.run(
        'UPDATE notes SET status = ? WHERE id = ?',
        ['public', noteId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
          }

          const publicUrl = `${req.protocol}://${req.get('host')}/api/notes/public/${noteId}`;
          res.json({ 
            message: 'Lien public généré',
            publicUrl: publicUrl,
            noteId: noteId
          });
        }
      );
    }
  );
});

// Accéder à une note publique (sans authentification)
router.get('/public/:id', (req, res) => {
  const noteId = req.params.id;

  db.get(
    `SELECT n.*, u.email as owner_email 
     FROM notes n 
     JOIN users u ON n.user_id = u.id 
     WHERE n.id = ? AND n.status = 'public'`,
    [noteId],
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

// Lister les utilisateurs avec qui une note est partagée
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
      db.all(`
        SELECT s.id, u.email, s.created_at
        FROM shares s
        JOIN users u ON s.shared_with_user_id = u.id
        WHERE s.note_id = ?
        ORDER BY s.created_at DESC
      `, [noteId], (err, shares) => {
        if (err) {
          return res.status(500).json({ error: 'Erreur lors de la récupération' });
        }
        res.json(shares);
      });
    }
  );
});

module.exports = router;