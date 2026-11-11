/* Shared top menu and footer, so every page has the same ones.
   <body data-page="..."> marks the active link; data-live="off" hides the
   market search and price strip on pages that do not load market data. */
(function () {
  const page = document.body.dataset.page || '', live = document.body.dataset.live !== 'off';
  const links = [['premium', 'premium.html', 'Premium'], ['markets', 'markets.html', 'Markets'], ['heatmaps', 'heatmaps.html', 'Heatmaps'], ['chart', 'chart.html', 'Charts'], ['tools', 'tools.html', 'Scanner'], ['sentiment', 'sentiment.html', 'Sentiment'], ['learn', 'learn.html', 'Learn']];
  const brand = '<a class="brand" href="index.html"><span class="wm">ALPHA<i></i>STRATS</span></a>';
  const search = `<div class="search" id="search">
      <svg viewBox="0 0 20 20" class="search-ico"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m13.5 13.5 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      <input id="q" type="search" placeholder="Search any coin or stock" autocomplete="off" spellcheck="false" aria-label="Search markets">
      <kbd>/</kbd><div class="search-results" id="qResults" hidden></div></div>`;
  document.currentScript.insertAdjacentHTML('beforebegin', `<header class="nav">${brand}
    <nav class="nav-links" id="navLinks">${links.map(([id, href, label]) => `<a href="${href}" class="${id === 'premium' ? 'nav-prem ' : ''}${id === page ? 'is-here' : ''}">${label}</a>`).join('')}</nav>
    ${live ? search : '<span class="nav-gap"></span>'}
    <div class="nav-right">${live ? '<span class="feed-pill" id="feedPill"><i class="dot"></i><span id="feedText">Connecting</span></span>' : ''}<a class="btn btn-primary btn-sm" href="index.html#pricing">Get strategies</a>
      <button class="nav-btn" id="navBtn" aria-label="Menu"><svg viewBox="0 0 20 20" width="20"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
  </header>${live ? '<div class="tape" aria-hidden="true"><div class="tape-track" id="tape"></div></div>' : ''}`);
  document.getElementById('navBtn').addEventListener('click', () => document.getElementById('navLinks').classList.toggle('open'));

  window.renderFooter = function () {
    document.currentScript.insertAdjacentHTML('beforebegin', `<footer id="contact" class="footer">
      <div>${brand}
        <p>Questions or orders: <a class="mail" href="mailto:hello@yourdomain.com">hello@yourdomain.com</a></p>
        <p class="foot-links">${links.map(([, href, label]) => `<a href="${href}">${label}</a>`).join('')}</p>
        <p class="credit">Charts by <a href="https://www.tradingview.com/" target="_blank" rel="noopener">TradingView</a> Lightweight Charts. Coin figures from CoinGecko. Crypto market mood index from Alternative.me.</p>
      </div>
      <p class="disclaimer">AlphaStrats provides educational trading research. Nothing on this site is financial advice. Backtested results are hypothetical, do not include every real-world cost, and past performance does not guarantee future results. Trading involves risk of loss. Crypto, stock and commodity prices shown are USDT-settled perpetual contracts that track the underlying asset and trade around the clock, so they can differ from spot or exchange closing prices. Scores, moods and readings on this site are AlphaStrats' own calculations from public market data.</p>
    </footer>`);
  };
})();
