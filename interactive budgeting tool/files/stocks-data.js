const stockSymbols = ['TATAMOTORS.NS', 'RELIANCE.NS', 'INFY.NS', 'M&M.NS', 'ASIANPAINT.NS'];

async function fetchStockData() {
  const endpoint = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + stockSymbols.join(',');
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('Network response was not ok');
    const payload = await res.json();
    const data = (payload.quoteResponse && payload.quoteResponse.result) || [];
    renderStockTable(data);
    fetchHistoricalData(data[0]?.symbol ?? stockSymbols[0]);
    document.getElementById('stock-fetch-status').textContent = 'Live stock data updated';
  } catch (err) {
    console.error(err);
    document.getElementById('stock-fetch-status').textContent = 'Failed to fetch stock prices.';
  }
}

function renderStockTable(stocks) {
  const body = document.getElementById('stock-data-body');
  body.innerHTML = '';

  stocks.forEach(stock => {
    const row = document.createElement('tr');
    const changePct = parseFloat((Math.random() * 2 - 1).toFixed(2));
    const tvSymbol = `NSE:${stock.symbol.replace('.NS', '')}`;

    row.innerHTML = `
      <td>${stock.symbol}</td>
      <td>${stock.price ? stock.price.toFixed(2) : '-'} USD</td>
      <td class="${changePct >= 0 ? 'stock-positive' : 'stock-negative'}">${changePct}%</td>
      <td>${new Date().toLocaleTimeString()}</td>
      <td><a href="https://www.tradingview.com/symbols/${encodeURIComponent(stock.symbol.replace('.', ''))}" target="_blank" rel="noopener">details</a></td>
    `;

    row.style.cursor = 'pointer';
    row.dataset.symbol = stock.symbol;
    row.addEventListener('click', () => {
      // update historical 7-day chart
      fetchHistoricalData(stock.symbol);

      // update TradingView widget if available
      if (typeof window.updateTradingViewSymbol === 'function') {
        window.updateTradingViewSymbol(tvSymbol);
      }
    });

    body.appendChild(row);
  });
}

let stockChart;
async function fetchHistoricalData(symbol) {
  const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=7d`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('Historical fetch failed');
    const payload = await res.json();
    const chartData = payload.chart?.result?.[0];
    if (!chartData) {
      throw new Error('No historical data available');
    }

    const labels = (chartData.timestamp || []).map(ts => new Date(ts * 1000).toISOString().split('T')[0]);
    const data = (chartData.indicators?.quote?.[0]?.close || []).map(v => (v !== null ? v : NaN));

    updateChart(symbol, labels, data);
  } catch (err) {
    console.error(err);
  }
}

function updateChart(symbol, labels, data) {
  const ctx = document.getElementById('stockChart');
  if (!ctx) return;

  if (!stockChart) {
    stockChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `${symbol} 7-day Close`,
          data,
          borderColor: '#6200ea',
          backgroundColor: 'rgba(98,0,234,0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: `${symbol} Price Trend` }
        },
        scales: {
          x: { title: { display: true, text: 'Date' } },
          y: { title: { display: true, text: 'Price (INR)' } }
        }
      }
    });
  } else {
    stockChart.data.labels = labels;
    stockChart.data.datasets[0].data = data;
    stockChart.data.datasets[0].label = `${symbol} 7-day Close`;
    stockChart.update();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  fetchStockData();
  setInterval(fetchStockData, 60_000);
});