const axios = require('axios');

class CryptoPriceService {
  constructor() {
    this.cache = {
      BTC: { price: 60000, lastUpdate: 0 },
      ETH: { price: 3000, lastUpdate: 0 }
    };
    this.cacheInterval = 10000; // 10 seconds cache
    this.apiKey = process.env.COINGECKO_API_KEY || '';
  }

  // Get current prices with caching
  async getCurrentPrices() {
    const now = Date.now();
    
    // Check if cache is still valid (less than 10 seconds old)
    if (now - this.cache.BTC.lastUpdate < this.cacheInterval) {
      return {
        BTC: this.cache.BTC.price,
        ETH: this.cache.ETH.price,
        timestamp: this.cache.BTC.lastUpdate
      };
    }

    try {
      // Fetch from CoinGecko API
      const response = await this.fetchFromCoinGecko();
      
      // Update cache
      this.cache.BTC = {
        price: response.bitcoin.usd,
        lastUpdate: now
      };
      this.cache.ETH = {
        price: response.ethereum.usd,
        lastUpdate: now
      };

      return {
        BTC: this.cache.BTC.price,
        ETH: this.cache.ETH.price,
        timestamp: now
      };
    } catch (error) {
      console.error('Error fetching crypto prices:', error.message);
      
      // Return cached prices with warning
      console.warn('Using cached prices due to API error');
      return {
        BTC: this.cache.BTC.price,
        ETH: this.cache.ETH.price,
        timestamp: this.cache.BTC.lastUpdate,
        cached: true,
        error: error.message
      };
    }
  }

  async fetchFromCoinGecko() {
    const url = 'https://api.coingecko.com/api/v3/simple/price';
    const params = {
      ids: 'bitcoin,ethereum',
      vs_currencies: 'usd',
      include_24hr_change: true,
      include_last_updated_at: true
    };

    // Add API key if available
    if (this.apiKey) {
      params.x_cg_pro_api_key = this.apiKey;
    }

    const response = await axios.get(url, {
      params,
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoCrashGame/1.0'
      }
    });

    return response.data;
  }

  // Convert USD to crypto
  usdToCrypto(usdAmount, cryptoPrice) {
    if (!usdAmount || !cryptoPrice || cryptoPrice <= 0) {
      throw new Error('Invalid USD amount or crypto price');
    }
    return parseFloat((usdAmount / cryptoPrice).toFixed(8));
  }

  // Convert crypto to USD
  cryptoToUsd(cryptoAmount, cryptoPrice) {
    if (!cryptoAmount || !cryptoPrice || cryptoPrice <= 0) {
      throw new Error('Invalid crypto amount or price');
    }
    return parseFloat((cryptoAmount * cryptoPrice).toFixed(2));
  }

  // Get price for specific currency
  async getPrice(currency) {
    const prices = await this.getCurrentPrices();
    return prices[currency.toUpperCase()];
  }

  // Validate currency
  isValidCurrency(currency) {
    return ['BTC', 'ETH'].includes(currency.toUpperCase());
  }

  // Get price change percentage (mock for now)
  async getPriceChange24h() {
    // In a real implementation, this would come from the API
    return {
      BTC: (Math.random() - 0.5) * 10, // Random between -5% and +5%
      ETH: (Math.random() - 0.5) * 10
    };
  }

  // Format price for display
  formatPrice(price, currency) {
    if (currency === 'USD') {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      const decimals = price >= 1 ? 4 : 8;
      return `${price.toFixed(decimals)} ${currency}`;
    }
  }

  // Start background price updates
  startPriceUpdates(interval = 10000) {
    setInterval(async () => {
      try {
        await this.getCurrentPrices();
        console.log(`[${new Date().toISOString()}] Crypto prices updated`);
      } catch (error) {
        console.error('Background price update failed:', error.message);
      }
    }, interval);
  }
}

// Export singleton instance
module.exports = new CryptoPriceService();
