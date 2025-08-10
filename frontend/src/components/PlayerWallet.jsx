import './PlayerWallet.css'

function PlayerWallet({ wallet, cryptoPrices }) {
  if (!wallet) {
    return (
      <div className="player-wallet">
        <h3>💼 Wallet</h3>
        <div className="loading">Loading wallet...</div>
      </div>
    )
  }

  const formatBalance = (balance, currency) => {
    return balance?.toFixed(currency === 'BTC' ? 6 : 4) || '0'
  }

  const formatUSD = (amount) => {
    return amount?.toFixed(2) || '0'
  }

  return (
    <div className="player-wallet">
      <div className="wallet-header">
        <h3>💼 Wallet</h3>
        <div className="total-value">
          Total: ${formatUSD(wallet.totalUsdValue)}
        </div>
      </div>

      <div className="wallet-balances">
        {['BTC', 'ETH'].map(currency => {
          const balance = wallet.wallets[currency]
          const currentPrice = cryptoPrices[currency]
          const liveValue = balance.balance * currentPrice

          return (
            <div key={currency} className="balance-card">
              <div className="balance-header">
                <span className={`crypto-icon ${currency.toLowerCase()}`}>
                  {currency === 'BTC' ? '₿' : 'Ξ'}
                </span>
                <span className="crypto-name">{currency}</span>
              </div>

              <div className="balance-amount">
                <div className="crypto-amount">
                  {formatBalance(balance.balance, currency)}
                </div>
                <div className="usd-amount">
                  ${formatUSD(liveValue)}
                </div>
              </div>

              <div className="balance-details">
                <div className="current-price">
                  Price: ${currentPrice?.toLocaleString()}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="wallet-stats">
        <h4>📊 Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Bets:</span>
            <span className="stat-value">{wallet.statistics?.totalBets || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Wins:</span>
            <span className="stat-value wins">{wallet.statistics?.totalWins || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Losses:</span>
            <span className="stat-value losses">{wallet.statistics?.totalLosses || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Wagered:</span>
            <span className="stat-value">${formatUSD(wallet.statistics?.totalWagered)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Won:</span>
            <span className="stat-value wins">${formatUSD(wallet.statistics?.totalWon)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Biggest Win:</span>
            <span className="stat-value biggest-win">${formatUSD(wallet.statistics?.biggestWin)}</span>
          </div>
        </div>
      </div>

      <div className="player-info">
        <div className="player-id">ID: {wallet.playerId}</div>
        <div className="last-active">
          Last Active: {new Date(wallet.lastActive).toLocaleTimeString()}
        </div>
        <div className={`online-status ${wallet.isOnline ? 'online' : 'offline'}`}>
          {wallet.isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
      </div>
    </div>
  )
}

export default PlayerWallet

