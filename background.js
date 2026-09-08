// ClickBox Extension — Background Service Worker
// Acts as a CORS proxy relay: the ClickBox admin page sends messages here
// and this worker fetches Sam's Club API (which allows cross-origin GET from extensions)

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CLICKBOX_FETCH') {
    const { url } = message;
    fetch(url, {
      headers: {
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      credentials: 'omit',
    })
      .then(r => r.text())
      .then(text => {
        try {
          sendResponse({ ok: true, data: JSON.parse(text) });
        } catch {
          sendResponse({ ok: true, data: text });
        }
      })
      .catch(err => sendResponse({ ok: false, error: err.message }));

    return true; // Keep message channel open for async response
  }
});
