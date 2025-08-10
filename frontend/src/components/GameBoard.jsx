import { useEffect, useRef } from 'react'
import './GameBoard.css'

function GameBoard({ gameState, currentMultiplier, cryptoPrices }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw grid background
    drawGrid(ctx, width, height)

    // Draw multiplier curve
    if (gameState?.gameState === 'active' && currentMultiplier > 1) {
      drawMultiplierCurve(ctx, width, height, currentMultiplier)
    }

    // Draw current multiplier text
    drawMultiplierText(ctx, width, height, currentMultiplier, gameState?.gameState)

  }, [currentMultiplier, gameState])

  const drawGrid = (ctx, width, height) => {
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  const drawMultiplierCurve = (ctx, width, height, multiplier) => {
    const points = []
    const maxTime = 10000 // 10 seconds
    const timeStep = 100 // 100ms steps

    for (let t = 0; t <= maxTime; t += timeStep) {
      const mult = 1 + Math.pow(t * 0.00006, 1.5)
      const x = (t / maxTime) * width
      const y = height - ((mult - 1) / (multiplier - 1)) * (height * 0.8)
      
      if (mult <= multiplier) {
        points.push({ x, y })
      }
    }

    if (points.length < 2) return

    // Draw curve
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()

    // Add glow effect
    ctx.shadowColor = '#00ff88'
    ctx.shadowBlur = 10
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  const drawMultiplierText = (ctx, width, height, multiplier, gameState) => {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (gameState === 'crashed') {
      ctx.fillStyle = '#ff4757'
      ctx.font = 'bold 48px Arial'
      ctx.fillText('CRASHED!', width / 2, height / 2)
      
      ctx.fillStyle = '#ff6b7a'
      ctx.font = '24px Arial'
      ctx.fillText(`${multiplier.toFixed(2)}x`, width / 2, height / 2 + 60)
    } else if (gameState === 'active') {
      const color = multiplier >= 2 ? '#00ff88' : '#ffa502'
      ctx.fillStyle = color
      ctx.font = 'bold 64px Arial'
      ctx.fillText(`${multiplier.toFixed(2)}x`, width / 2, height / 2)
      
      // Add pulsing effect for high multipliers
      if (multiplier >= 5) {
        ctx.shadowColor = color
        ctx.shadowBlur = 20
        ctx.fillText(`${multiplier.toFixed(2)}x`, width / 2, height / 2)
        ctx.shadowBlur = 0
      }
    } else {
      ctx.fillStyle = '#666'
      ctx.font = '32px Arial'
      ctx.fillText('Waiting for next round...', width / 2, height / 2)
    }
  }

  const getGameStateDisplay = () => {
    if (!gameState) return 'Connecting...'
    
    switch (gameState.gameState) {
      case 'active':
        return 'Round Active'
      case 'crashed':
        return 'Round Crashed'
      case 'waiting':
        return 'Next Round Starting...'
      default:
        return 'Unknown State'
    }
  }

  return (
    <div className="game-board">
      <div className="game-header">
        <div className="game-status">
          <span className={`status-indicator ${gameState?.gameState || 'connecting'}`}></span>
          <span className="status-text">{getGameStateDisplay()}</span>
        </div>
        
        <div className="crypto-prices">
          <div className="crypto-price">
            <span className="crypto-symbol">₿</span>
            <span className="price">${cryptoPrices.BTC?.toLocaleString()}</span>
          </div>
          <div className="crypto-price">
            <span className="crypto-symbol">Ξ</span>
            <span className="price">${cryptoPrices.ETH?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="multiplier-display">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="game-canvas"
        />
      </div>

      <div className="game-info">
        <div className="round-info">
          {gameState?.currentRound && (
            <>
              <span>Round: {gameState.currentRound.roundId}</span>
              <span>Hash: {gameState.currentRound.hash.substring(0, 12)}...</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameBoard

