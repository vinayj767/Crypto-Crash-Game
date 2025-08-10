import { useState } from 'react'
import axios from 'axios'
import './PlayerLogin.css'

function PlayerLogin({ onLogin, apiBaseUrl }) {
  const [formData, setFormData] = useState({
    playerId: '',
    name: '',
    isNewPlayer: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const existingPlayers = [
    'alice_crypto',
    'bob_trader', 
    'charlie_whale',
    'diana_lucky',
    'eve_gamer'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (formData.isNewPlayer) {
        // Create new player
        const response = await axios.post(`${apiBaseUrl}/api/player`, {
          playerId: formData.playerId,
          name: formData.name,
          initialBtcBalance: 0.001,
          initialEthBalance: 0.1
        })

        if (response.data.success) {
          onLogin({
            playerId: formData.playerId,
            name: formData.name
          })
        }
      } else {
        // Login existing player
        const response = await axios.get(`${apiBaseUrl}/api/player/${formData.playerId}/wallet`)
        
        if (response.data.success) {
          onLogin({
            playerId: formData.playerId,
            name: response.data.data.name
          })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const loginAsExistingPlayer = async (playerId) => {
    setLoading(true)
    setError('')

    try {
      const response = await axios.get(`${apiBaseUrl}/api/player/${playerId}/wallet`)
      
      if (response.data.success) {
        onLogin({
          playerId: playerId,
          name: response.data.data.name
        })
      }
    } catch (error) {
      console.error('Quick login error:', error)
      setError('Failed to login as ' + playerId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🚀 Crypto Crash Game</h1>
        <p>Enter the multiplayer crypto crash game!</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="login-options">
          <div className="quick-login">
            <h3>Quick Login (Demo Players)</h3>
            <div className="existing-players">
              {existingPlayers.map(playerId => (
                <button
                  key={playerId}
                  onClick={() => loginAsExistingPlayer(playerId)}
                  disabled={loading}
                  className="player-button"
                >
                  {playerId}
                </button>
              ))}
            </div>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isNewPlayer}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    isNewPlayer: e.target.checked
                  }))}
                />
                Create New Player
              </label>
            </div>

            <div className="form-group">
              <input
                type="text"
                placeholder="Player ID"
                value={formData.playerId}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  playerId: e.target.value
                }))}
                required
                minLength={3}
                maxLength={50}
                pattern="[a-zA-Z0-9_-]+"
                title="Only letters, numbers, underscores and hyphens allowed"
              />
            </div>

            {formData.isNewPlayer && (
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Display Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  required
                  maxLength={50}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.playerId}
              className="login-button"
            >
              {loading ? 'Loading...' : formData.isNewPlayer ? 'Create & Join' : 'Login'}
            </button>
          </form>
        </div>

        <div className="login-info">
          <p>
            <strong>Demo Mode:</strong> Use existing players or create new ones.
            New players get 0.001 BTC and 0.1 ETH to start playing!
          </p>
          <p>
            🎮 Game rounds every 10 seconds • Real-time multiplayer • Provably fair
          </p>
        </div>
      </div>
    </div>
  )
}

export default PlayerLogin

