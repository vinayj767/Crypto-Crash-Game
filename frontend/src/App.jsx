import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'
import GameBoard from './components/GameBoard'
import PlayerWallet from './components/PlayerWallet'
import BettingPanel from './components/BettingPanel'
import GameHistory from './components/GameHistory'
import PlayerLogin from './components/PlayerLogin'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://crypto-crash-game-h8w6.onrender.com'

console.log('Frontend Environment:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: API_BASE_URL,
  NODE_ENV: import.meta.env.NODE_ENV
})

function App() {
  const [socket, setSocket] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [player, setPlayer] = useState(null)
  const [playerWallet, setPlayerWallet] = useState(null)
  const [cryptoPrices, setCryptoPrices] = useState({ BTC: 60000, ETH: 3000 })
  const [roundHistory, setRoundHistory] = useState([])
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0)
  const [notifications, setNotifications] = useState([])

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Connected to server')
      if (player) {
        newSocket.emit('join_game', { playerId: player.playerId })
      }
    })

    newSocket.on('gameState', (state) => {
      setGameState(state)
      setCurrentMultiplier(state.multiplier)
    })

    newSocket.on('roundStart', (data) => {
      console.log('New round started:', data)
      setCurrentMultiplier(1.0)
      setCryptoPrices(data.cryptoPrices)
      addNotification('New round started!', 'info')
    })

    newSocket.on('multiplierUpdate', (data) => {
      setCurrentMultiplier(data.multiplier)
    })

    newSocket.on('roundCrash', (data) => {
      console.log('Round crashed:', data)
      addNotification(`Round crashed at ${data.crashPoint}x!`, 'error')
      setTimeout(fetchRoundHistory, 1000)
    })

    newSocket.on('betPlaced', (data) => {
      if (data.playerId === player?.playerId) {
        addNotification(`Bet placed: $${data.betAmountUsd} ${data.currency}`, 'success')
        fetchPlayerWallet()
      }
    })

    newSocket.on('playerCashout', (data) => {
      if (data.playerId === player?.playerId) {
        addNotification(`Cashed out at ${data.multiplier}x for $${data.winAmountUsd.toFixed(2)}!`, 'success')
        fetchPlayerWallet()
      } else {
        addNotification(`Player cashed out at ${data.multiplier}x`, 'info')
      }
    })

    newSocket.on('bet_result', (result) => {
      if (result.success) {
        addNotification('Bet placed successfully!', 'success')
      } else {
        addNotification(`Bet failed: ${result.message}`, 'error')
      }
    })

    newSocket.on('cashout_result', (result) => {
      if (result.success) {
        addNotification(`Cashed out successfully at ${result.data.multiplier}x!`, 'success')
      } else {
        addNotification(`Cashout failed: ${result.message}`, 'error')
      }
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
      addNotification(error.message || 'Connection error', 'error')
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [player])

  // Fetch initial data
  useEffect(() => {
    fetchRoundHistory()
    fetchCryptoPrices()
  }, [])

  // Fetch player wallet when player changes
  useEffect(() => {
    if (player) {
      fetchPlayerWallet()
    }
  }, [player])

  const fetchPlayerWallet = async () => {
    if (!player) return
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/player/${player.playerId}/wallet`)
      if (response.data.success) {
        setPlayerWallet(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch player wallet:', error)
    }
  }

  const fetchRoundHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/game/history?limit=10`)
      if (response.data.success) {
        setRoundHistory(response.data.data.rounds)
      }
    } catch (error) {
      console.error('Failed to fetch round history:', error)
    }
  }

  const fetchCryptoPrices = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/game/prices`)
      if (response.data.success) {
        setCryptoPrices(response.data.data.prices)
      }
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error)
    }
  }

  const placeBet = async (betAmountUsd, currency) => {
    if (!socket || !player) return

    socket.emit('place_bet', {
      playerId: player.playerId,
      betAmountUsd: parseFloat(betAmountUsd),
      currency
    })
  }

  const cashOut = async () => {
    if (!socket || !player) return

    socket.emit('cash_out', {
      playerId: player.playerId
    })
  }

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    }
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]) // Keep only 5 notifications
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  if (!player) {
    return <PlayerLogin onLogin={setPlayer} apiBaseUrl={API_BASE_URL} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Crypto Crash Game</h1>
        <div className="player-info">
          Welcome, {player.name}!
        </div>
      </header>

      <div className="notifications">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>

      <main className="app-main">
        <div className="game-section">
          <GameBoard 
            gameState={gameState}
            currentMultiplier={currentMultiplier}
            cryptoPrices={cryptoPrices}
          />
          
          <BettingPanel
            onPlaceBet={placeBet}
            onCashOut={cashOut}
            gameState={gameState}
            playerWallet={playerWallet}
            cryptoPrices={cryptoPrices}
          />
        </div>

        <div className="sidebar">
          <PlayerWallet 
            wallet={playerWallet}
            cryptoPrices={cryptoPrices}
          />
          
          <GameHistory 
            rounds={roundHistory}
            onRefresh={fetchRoundHistory}
          />
        </div>
      </main>
    </div>
  )
}

export default App
