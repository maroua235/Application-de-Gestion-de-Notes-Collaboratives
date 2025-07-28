import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import ShareNote from './ShareNote';
import { useNotification } from './useNotification';

interface Note {
  id: number;
  title: string;
  content: string;
  tags: string;
  status: 'private' | 'shared' | 'public';
  created_at: string;
  updated_at: string;
  owner_email?: string;
  source?: 'own' | 'shared';
}

const Notes: React.FC = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError, NotificationContainer } = useNotification();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [shareModalNote, setShareModalNote] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<{[key: string]: boolean}>({});

  // Formulaire
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    status: 'private' as 'private' | 'shared' | 'public'
  });

  // Charger les notes
  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await axios.get(`http://localhost:3001/api/notes?${params}`);
      setNotes(response.data);
      setError('');
    } catch (error: any) {
      showError('Erreur lors du chargement des notes');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [searchTerm, statusFilter]);

  // Créer ou modifier une note
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return;
    }

    try {
      if (editingNote) {
        // Modification
        await axios.put(`http://localhost:3001/api/notes/${editingNote.id}`, formData);
      } else {
        // Création
        await axios.post('http://localhost:3001/api/notes', formData);
      }

      setFormData({ title: '', content: '', tags: '', status: 'private' });
      setShowForm(false);
      setEditingNote(null);
      loadNotes();
      setError('');
      showSuccess(editingNote ? 'Note modifiée avec succès !' : 'Note créée avec succès !');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  // Supprimer une note
  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3001/api/notes/${id}`);
      loadNotes();
      showSuccess('Note supprimée avec succès !');
    } catch (error: any) {
      showError('Erreur lors de la suppression');
    }
  };

  // Commencer l'édition
  const startEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags,
      status: note.status
    });
    setShowForm(true);
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setShowForm(false);
    setEditingNote(null);
    setFormData({ title: '', content: '', tags: '', status: 'private' });
  };

  // Fonction pour rendre le Markdown en HTML simple
  const renderMarkdown = (text: string) => {
    if (!text) return '';
    
    let html = text
      // Titres
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Gras et italique
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Liens
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Code inline
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Saut de ligne
      .replace(/\n/g, '<br>');
    
    return html;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'private': return '#6c757d';
      case 'shared': return '#007bff';
      case 'public': return '#28a745';
      default: return '#6c757d';
    }
  };

  // Vérifier si l'utilisateur peut modifier une note
  const canEdit = (note: Note) => {
    return note.source !== 'shared'; // Peut modifier seulement ses propres notes
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h1>Mes Notes</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>Connecté: {user?.email}</span>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ 
          background: '#fee', 
          color: '#c33', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Rechercher par titre ou tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="private">Privé</option>
          <option value="shared">Partagé</option>
          <option value="public">Public</option>
        </select>

        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Nouvelle Note
        </button>
      </div>

      {/* Formulaire de création/édition */}
      {showForm && (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3>{editingNote ? 'Modifier la note' : 'Nouvelle note'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Titre *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label>Contenu (Markdown supporté)</label>
                <button
                  type="button"
                  onClick={() => setPreviewMode({...previewMode, form: !previewMode.form})}
                  style={{
                    padding: '5px 10px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {previewMode.form ? 'Éditer' : 'Aperçu'}
                </button>
              </div>
              
              {previewMode.form ? (
                <div
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    minHeight: '150px',
                    background: '#f9f9f9'
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.content) }}
                />
              ) : (
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={6}
                  placeholder="# Titre principal&#10;## Sous-titre&#10;**Texte en gras** *italique*&#10;`code`&#10;[Lien](http://example.com)"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    resize: 'vertical',
                    fontFamily: 'monospace'
                  }}
                />
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Tags (séparés par des virgules)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="tag1, tag2, tag3"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="private">Privé</option>
                <option value="shared">Partagé</option>
                <option value="public">Public</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingNote ? 'Modifier' : 'Créer'}
              </button>
              
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des notes */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Chargement des notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Aucune note trouvée. Créez votre première note !</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {notes.map((note) => (
            <div key={note.id} style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '8px', 
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              position: 'relative',
              border: note.source === 'shared' ? '2px solid #007bff' : 'none'
            }}>
              {/* Header de la note */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '10px'
              }}>
                <h3 style={{ margin: '0 0 10px 0', wordBreak: 'break-word', flex: 1 }}>
                  {note.title}
                  {note.source === 'shared' && (
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#007bff',
                      display: 'block',
                      fontWeight: 'normal'
                    }}>
                      Partagé par: {note.owner_email}
                    </span>
                  )}
                </h3>
                <span style={{ 
                  background: getStatusColor(note.status),
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  marginLeft: '10px'
                }}>
                  {note.status}
                </span>
              </div>
              
              {/* Contenu de la note */}
              {note.content && (
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Contenu:</span>
                    <button
                      onClick={() => setPreviewMode({...previewMode, [note.id]: !previewMode[note.id]})}
                      style={{
                        padding: '2px 8px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      {previewMode[note.id] ? 'Brut' : 'Rendu'}
                    </button>
                  </div>
                  
                  {previewMode[note.id] ? (
                    <div
                      style={{
                        color: '#666',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        padding: '10px',
                        background: '#f9f9f9',
                        borderRadius: '4px',
                        maxHeight: '150px',
                        overflow: 'auto'
                      }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
                    />
                  ) : (
                    <p style={{ 
                      color: '#666', 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      maxHeight: '100px',
                      overflow: 'auto',
                      background: '#f9f9f9',
                      padding: '10px',
                      borderRadius: '4px'
                    }}>
                      {note.content.length > 200 ? `${note.content.substring(0, 200)}...` : note.content}
                    </p>
                  )}
                </div>
              )}
              
              {/* Tags */}
              {note.tags && (
                <div style={{ marginBottom: '15px' }}>
                  {note.tags.split(',').map((tag, index) => (
                    <span key={index} style={{
                      display: 'inline-block',
                      background: '#e9ecef',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      marginRight: '5px',
                      marginBottom: '5px'
                    }}>
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Dates */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '12px',
                color: '#999',
                marginBottom: '15px'
              }}>
                <span>Créé: {new Date(note.created_at).toLocaleDateString()}</span>
                {note.updated_at !== note.created_at && (
                  <span>Modifié: {new Date(note.updated_at).toLocaleDateString()}</span>
                )}
              </div>

              {/* Boutons d'action */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {canEdit(note) && (
                  <>
                    <button
                      onClick={() => startEdit(note)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Modifier
                    </button>
                    
                    <button
                      onClick={() => handleDelete(note.id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Supprimer
                    </button>

                    <button
                      onClick={() => setShareModalNote(note.id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Partager
                    </button>
                  </>
                )}
                
                {!canEdit(note) && (
                  <div style={{
                    width: '100%',
                    padding: '8px',
                    background: '#e9ecef',
                    color: '#6c757d',
                    textAlign: 'center',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    📖 Lecture seule - Note partagée
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de partage */}
      {shareModalNote && (
        <ShareNote
          noteId={shareModalNote}
          onClose={() => setShareModalNote(null)}
        />
      )}

      {/* Notifications */}
      <NotificationContainer />
    </div>
  );
};

export default Notes;