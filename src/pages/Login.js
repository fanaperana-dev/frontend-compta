import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ArivotekIcon from '../components/ArivotekIcon';

export default function Login() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [modeAdmin, setModeAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [voirMdp, setVoirMdp] = useState(false);

  const { connexion, connexionAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErreur('');

    const resultat = modeAdmin
      ? await connexionAdmin(email, motDePasse)
      : await connexion(email, motDePasse);

    if (resultat.success) {
      navigate(modeAdmin ? '/admin' : '/dashboard');
    } else {
      setErreur(resultat.message);
    }

    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #004d5a 0%, #006b7a 50%, #008a99 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>

        {/* Logo et titre */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <ArivotekIcon height={130} />
          <p style={{ color: '#666', margin: '15px 0 0 0', fontSize: '14px' }}>
            {modeAdmin ? 'Accès Administrateur' : 'Automatiser. Simplifier. Avancer.'}
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 'bold',
              color: '#333',
              fontSize: '14px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#004d5a'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 'bold',
              color: '#333',
              fontSize: '14px'
          }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={voirMdp ? 'text' : 'password'}
                value={motDePasse}
                onChange={e => setMotDePasse(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '40px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#004d5a'}
                onBlur={e => e.target.style.borderColor = '#e0e0e0'}
              />
              <button
                type="button"
                onClick={() => setVoirMdp(!voirMdp)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#666'
                }}
              >
                {voirMdp ? '🙈' : '👁️'}
              </button>
            </div>
           </div>

          {/* Erreur */}
          {erreur && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              ⚠️ {erreur}
            </div>
          )}

          {/* Bouton connexion */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#7ec8cb' : '#004d5a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

        </form>

        {/* Lien admin */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => {
              setModeAdmin(!modeAdmin);
              setErreur('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#004d5a',
              cursor: 'pointer',
              fontSize: '13px',
              textDecoration: 'underline'
            }}
          >
            {modeAdmin
              ? '← Retour connexion entreprise'
              : 'Accès administrateur'
            }
          </button>
        </div>

      </div>
    </div>
  );
}