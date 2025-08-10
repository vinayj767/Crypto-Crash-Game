import { useState, useEffect } from 'react'
import './BettingPanel.css'

function BettingPanel({ onPlaceBet, onCashOut, gameState, playerWallet, cryptoPrices }) {
  const [betAmount, setBetAmount] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('BTC')
  const [activeBet, setActiveBet] = useState(null)

  useEffect(() => {
    // Check if player has an active bet in current round
    if (gameState?.currentRound && playerWallet) {
      // This would normally come from the game state
      // For now, we'll track it locally
      setActiveBet(null)
    }
  }, [gameState, playerWallet])

  const handlePlaceBet = () => {
    if (!betAmount || !playerWallet || gameState?.gameState !== 'active') return

    const amount = parseFloat(betAmount)
    if (amount <= 0 || amount > getMaxBet()) return

    onPlaceBet(amount, selectedCurrency)
    setActiveBet({
      amount,
      currency: selectedCurrency,
      multiplier: 1.0
    })
    setBetAmount('')
  }

  const handleCashOut = () => {
    if (!activeBet || gameState?.gameState !== 'active') return

    onCashOut()
    setActiveBet(null)
  }

  const getMaxBet = () => {
    if (!playerWallet || !cryptoPrices) return 0
    
    const wallet = playerWallet.wallets[selectedCurrency]
    return wallet ? wallet.usdValue : 0
  }

  const getCryptoAmount = () => {
    if (!betAmount || !cryptoPrices) return 0
    return parseFloat(betAmount) / cryptoPrices[selectedCurrency]
  }

  const canPlaceBet = () => {
    return gameState?.gameState === 'active' && 
           !activeBet && 
           betAmount && 
           parseFloat(betAmount) > 0 && 
           parseFloat(betAmount) <= getMaxBet()
  }

  const canCashOut = () => {
    return gameState?.gameState === 'active' && activeBet
  }

  const getWinAmount = () => {
    if (!activeBet || !gameState) return 0
    return activeBet.amount * gameState.multiplier
  }

  return (
    <div className="betting-panel">
      <div className="betting-header">
        <h3>Place Your Bet</h3>
        <div className="game-status-indicator">
          {gameState?.gameState === 'active' ? '🟢 Active' : 
           gameState?.gameState === 'crashed' ? '🔴 Crashed' : 
           '🟡 Waiting'}
        </div>
      </div>

      {activeBet ? (
        <div className="active-bet">
          <div className="bet-info">
            <h4>Active Bet</h4>
            <div className="bet-details">
              <span>${activeBet.amount.toFixed(2)} {activeBet.currency}</span>
              <span>Current: {gameState?.multiplier?.toFixed(2)}x</span>
              <span className="win-amount">
                Win: ${getWinAmount().toFixed(2)}
              </span>
            </div>
          </div>

          <button
            className="cash-out-button"
            onClick={handleCashOut}
            disabled={!canCashOut()}
          >
            💰 Cash Out at {gameState?.multiplier?.toFixed(2)}x
          </button>
        </div>
      ) : (
        <div className="bet-form">
          <div className="currency-selector">
            <label>Currency:</label>
            <div className="currency-buttons">
              {['BTC', 'ETH'].map(currency => (
                <button
                  key={currency}
                  className={`currency-btn ${selectedCurrency === currency ? 'active' : ''}`}
                  onClick={() => setSelectedCurrency(currency)}
                >
                  {currency}
                  <span className="balance">
                    {playerWallet?.wallets[currency]?.balance?.toFixed(6) || '0'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bet-input-group">
            <label>Bet Amount (USD):</label>
            <div className="input-with-max">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                max={getMaxBet()}
                step="0.01"
                disabled={gameState?.gameState !== 'active'}
              />
              <button
                className="max-button"
                onClick={() => setBetAmount(getMaxBet().toFixed(2))}
                disabled={gameState?.gameState !== 'active'}
              >
                MAX
              </button>
            </div>
            
            {betAmount && (
              <div className="crypto-equivalent">
                ≈ {getCryptoAmount().toFixed(8)} {selectedCurrency}
              </div>
            )}
          </div>

          <div className="quick-bet-amounts">
            <label>Quick Amounts:</label>
            <div className="quick-buttons">
              {[1, 5, 10, 25, 50].map(amount => (
                <button
                  key={amount}
                  className="quick-bet-btn"
                  onClick={() => setBetAmount(amount.toString())}
                  disabled={amount > getMaxBet() || gameState?.gameState !== 'active'}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          <button
            className="place-bet-button"
            onClick={handlePlaceBet}
            disabled={!canPlaceBet()}
          >
            🎲 Place Bet
          </button>

          {gameState?.gameState !== 'active' && (
            <div className="betting-disabled-message">
              {gameState?.gameState === 'crashed' ? 
                'Round crashed! Next round starting soon...' :
                'Waiting for next round to start...'}
            </div>
          )}
        </div>
      )}

      <div className="betting-info">
        <div className="balance-display">
          <h4>Available Balance</h4>
          <div className="balances">
            {playerWallet && ['BTC', 'ETH'].map(currency => (
              <div key={currency} className="balance-item">
                <span className="currency-name">{currency}:</span>
                <span className="balance-amount">
                  {playerWallet.wallets[currency]?.balance?.toFixed(6) || '0'}
                </span>
                <span className="balance-usd">
                  (${playerWallet.wallets[currency]?.usdValue?.toFixed(2) || '0'})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BettingPanel

