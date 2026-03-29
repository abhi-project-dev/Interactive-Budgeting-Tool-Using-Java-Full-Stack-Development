// Real-time crypto data fetcher (CoinGecko free API)
// Docs: https://www.coingecko.com/en/api/documentation

const cryptoIds = [
  'bitcoin',
  'ethereum',
  'dogecoin',
  'ripple',
  'litecoin',
  'solana',
  'avalanche-2'
];

async function fetchCryptoPrices() {
  const endpoint = `https://api.coingecko.com/api/v3/simple/price`;
  const params = new URLSearchParams({
    ids: cryptoIds.join(','),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
    include_last_updated_at: 'true'
  });

  try {
    const response = await fetch(`${endpoint}?${params}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    updateCryptoTable(data);
    document.getElementById('crypto-fetch-status').textContent = 'Live prices updated';
  } catch (error) {
    console.error('Crypto data load failed:', error);
    document.getElementById('crypto-fetch-status').textContent = 'Unable to load live prices. Please try again later.';
  }
}

function updateCryptoTable(data) {
  cryptoIds.forEach(id => {
    const row = document.getElementById(`crypto-${id}`);
    if (!row || !data[id]) return;

    const price = data[id].usd;
    const change = data[id].usd_24h_change;

    row.querySelector('.crypto-price').textContent = price ? `$${price.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}` : '-';
    row.querySelector('.crypto-change').textContent = change !== undefined ? `${change.toFixed(2)}%` : '-';
    row.querySelector('.crypto-change').className = `crypto-change ${change >= 0 ? 'positive' : 'negative'}`;
    row.querySelector('.crypto-updated').textContent = data[id].last_updated_at ? new Date(data[id].last_updated_at * 1000).toLocaleTimeString() : '-';
  });
}

function initCryptoData() {
  fetchCryptoPrices();
  setInterval(fetchCryptoPrices, 60 * 1000); // refresh every minute
}

window.addEventListener('DOMContentLoaded', initCryptoData);
