import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Share {
  id: number;
  email: string;
  created_at: string;
}

interface ShareNoteProps {
  noteId: number;
  noteTitle: string;
  onClose: () => void;
}

const ShareNote: React.FC<ShareNoteProps> = ({ noteId, noteTitle, onClose }) => {
  const [shareEmail, setShareEmail] = useState('');
  const [shares, setShares] = useState<Share[]>([]);
  const [publicUrl, setPublicUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Charger les partages existants
  useEffect(() => {
    loadShares();
  }, [noteId]);

  const loadShares = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/notes/${noteId}/shares`);
      setShares(response.data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des partages:', error);
    }
  };

  // Partager avec un utilisateur
  const handleShareWithUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await axios.post(`http://localhost:3001/api/notes/${noteId}/share`, {
        sharedWithEmail: shareEmail
      });

      setSuccess(`Note partagée avec ${shareEmail}`);
      setShareEmail('');
      loadShares(); // Recharger la liste
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erreur lors du partage');
    } finally {
      setIsLoading(false);
    }
  };

  // Générer un lien public
  const handleGeneratePublicLink = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await axios.post(`http://localhost:3001/api/notes/${noteId}/public-link`);
      setPublicUrl(response.data.publicUrl);
      setSuccess('Lien public généré !');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erreur lors de la génération du lien');
    } finally {
      setIsLoading(false);
    }
  };

  // Copier le lien dans le presse-papier
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setSuccess('Lien copié dans le presse-papier !');
    } catch {
      setError('Impossible de copier le lien');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Partager la note: {noteTitle}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999'
            }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ 
            background: '#fee', 
            color: '#c33', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            background: '#efe', 
            color: '#363', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            {success}
          </div>
        )}

        {/* Partage avec un utilisateur */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Partager avec un utilisateur</h3>
          <form onSubmit={handleShareWithUser}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Email de l'utilisateur"
                required
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                Partager
              </button>
            </div>
          </form>

          {/* Liste des partages */}
          {shares.length > 0 && (
            <div>
              <h4>Partagé avec:</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {shares.map((share) => (
                  <li key={share.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #eee'
                  }}>
                    <span>{share.email}</span>
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      {new Date(share.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Lien public */}
        <div>
          <h3>Lien public</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
            Générez un lien public pour que n'importe qui puisse voir cette note.
          </p>
          
          {!publicUrl ? (
            <button
              onClick={handleGeneratePublicLink}
              disabled={isLoading}
              style={{
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              Générer un lien public
            </button>
          ) : (
            <div>
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa'
                  }}
                />
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '10px 15px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Copier
                </button>
              </div>
              <p style={{ color: '#666', fontSize: '12px' }}>
                ⚠️ Attention: Cette note est maintenant publique et accessible à tous avec ce lien.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareNote;