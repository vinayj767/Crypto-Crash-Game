import { useState } from 'react'
import './GameHistory.css'

function GameHistory({ rounds, onRefresh }) {
  const [showDetailed, setShowDetailed] = useState(false)

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString()
  }

  const getCrashColor = (crashPoint) => {
    if (crashPoint >= 10) return '#ffa502' // Gold for high multipliers
    if (crashPoint >= 5) return '#00ff88'  // Green for good multipliers
    if (crashPoint >= 2) return '#54a0ff'  // Blue for moderate
    return '#ff6b7a' // Red for low multipliers
  }

  const getRelativeTime = (timeString) => {
    const now = new Date()
    const time = new Date(timeString)
    const diffMs = now - time
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  if (!rounds || rounds.length === 0) {
    return (
      <div className="game-history">
        <div className="history-header">
          <h3>📈 Recent Rounds</h3>
          <button onClick={onRefresh} className="refresh-button">
            🔄
          </button>
        </div>
        <div className="no-history">No rounds yet</div>
      </div>
    )
  }

  return (
    <div className="game-history">
      <div className="history-header">
        <h3>📈 Recent Rounds</h3>
        <div className="header-controls">
          <button
            onClick={() => setShowDetailed(!showDetailed)}
            className="toggle-button"
          >
            {showDetailed ? '📋' : '📊'}
          </button>
          <button onClick={onRefresh} className="refresh-button">
            🔄
          </button>
        </div>
      </div>

      <div className="history-content">
        {showDetailed ? (
          <div className="detailed-history">
            {rounds.map((round, index) => (
              <div key={round.roundId || index} className="round-card">
                <div className="round-header">
                  <span className="round-id">
                    #{round.roundId?.split('_')[1] || index + 1}
                  </span>
                  <span className="round-time">
                    {getRelativeTime(round.startTime)}
                  </span>
                </div>
                
                <div className="round-crash">
                  <span
                    className="crash-multiplier"
                    style={{ color: getCrashColor(round.crashPoint) }}
                  >
                    {round.crashPoint?.toFixed(2)}x
                  </span>
                </div>

                <div className="round-stats">
                  <div className="stat">
                    <span className="stat-label">Bets:</span>
                    <span className="stat-value">${round.totalBetsUsd?.toFixed(0) || '0'}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Payouts:</span>
                    <span className="stat-value">${round.totalPayoutsUsd?.toFixed(0) || '0'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="compact-history">
            <div className="crash-points-grid">
              {rounds.map((round, index) => (
                <div
                  key={round.roundId || index}
                  className="crash-point-item"
                  style={{ color: getCrashColor(round.crashPoint) }}
                  title={`Round ${round.roundId?.split('_')[1] || index + 1}: ${round.crashPoint?.toFixed(2)}x at ${formatTime(round.startTime)}`}
                >
                  {round.crashPoint?.toFixed(2)}x
                </div>
              ))}
            </div>

            <div className="history-summary">
              <div className="summary-stats">
                <div className="summary-item">
                  <span className="summary-label">Avg Crash:</span>
                  <span className="summary-value">
                    {(rounds.reduce((sum, r) => sum + (r.crashPoint || 0), 0) / rounds.length).toFixed(2)}x
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">High:</span>
                  <span className="summary-value highest">
                    {Math.max(...rounds.map(r => r.crashPoint || 0)).toFixed(2)}x
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Low:</span>
                  <span className="summary-value lowest">
                    {Math.min(...rounds.map(r => r.crashPoint || 0)).toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="history-footer">
        <div className="legend">
          <span className="legend-item">
            <span className="legend-color" style={{ color: '#ff6b7a' }}>●</span>
            &lt;2x
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ color: '#54a0ff' }}>●</span>
            2-5x
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ color: '#00ff88' }}>●</span>
            5-10x
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ color: '#ffa502' }}>●</span>
            10x+
          </span>
        </div>
      </div>
    </div>
  )
}

export default GameHistory

