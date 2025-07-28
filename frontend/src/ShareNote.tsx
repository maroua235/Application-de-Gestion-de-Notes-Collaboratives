import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface ShareNoteProps {
  noteId: number;
  onClose: () => void;
}

interface Share {
  id: number;
  shared_with_email: string;
  created_at: string;
}

const ShareNote: React.FC<ShareNoteProps> = ({ noteId, onClose }) => {
  const [email, setEmail] = useState('');
  const [shares, setShares] = useState<Share[]>([]);
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Charger les partages existants (avec useCallback)
  const loadShares = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/notes/${noteId}/shares`);
      setShares(response.data.shares);
      setPublicLink(response.data.publicLink);
    } catch (error: any) {
      console.error('Erreur chargement partages:', error);
    }
  }, [noteId]);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  // Partager avec un utilisateur
  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email requis');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`http://localhost:3001/api/notes/${noteId}/share`, { email });
      setSuccess(`Note partagée avec ${email}`);
      setEmail('');
      loadShares();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erreur lors du partage');
    } finally {
      setIsLoading(false);
    }
  };

  // Générer un lien public
  const generatePublicLink = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`http://localhost:3001/api/notes/${noteId}/public-link`);
      setPublicLink(response.data.publicLink);
      setSuccess('Lien public généré avec succès');
      loadShares();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erreur lors de la génération du lien');
    } finally {
      setIsLoading(false);
    }
  };

  // Copier le lien
  const copyLink = () => {
    if (publicLink) {
      navigator.clipboard.writeText(publicLink);
      setSuccess('Lien copié dans le presse-papiers');
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
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Partager la note</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ background: '#fee', color: '#c33', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ background: '#efe', color: '#363', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
            {success}
          </div>
        )}

        {/* Partage avec un utilisateur */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Partager avec un utilisateur</h3>
          <form onSubmit={handleShare}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email de l'utilisateur"
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
                {isLoading ? 'Partage...' : 'Partager'}
              </button>
            </div>
          </form>

          {/* Liste des partages */}
          {shares.length > 0 && (
            <div>
              <h4>Partagé avec :</h4>
              {shares.map((share) => (
                <div key={share.id} style={{
                  padding: '8px 12px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  marginBottom: '5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{share.shared_with_email}</span>
                  <small style={{ color: '#666' }}>
                    {new Date(share.created_at).toLocaleDateString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lien public */}
        <div>
          <h3>Lien public</h3>
          {publicLink ? (
            <div>
              <div style={{
                padding: '10px',
                background: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '10px',
                wordBreak: 'break-all',
                fontSize: '14px'
              }}>
                {publicLink}
              </div>
              <button
                onClick={copyLink}
                style={{
                  padding: '8px 16px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Copier le lien
              </button>
            </div>
          ) : (
            <div>
              <p style={{ color: '#666', marginBottom: '10px' }}>
                Aucun lien public généré pour cette note.
              </p>
              <button
                onClick={generatePublicLink}
                disabled={isLoading}
                style={{
                  padding: '10px 20px',
                  background: '#ffc107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Génération...' : 'Générer un lien public'}
              </button>
            </div>
          )}
        </div>

        {/* Bouton fermer */}
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 30px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareNote;