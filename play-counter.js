(() => {
  const config = document.querySelector('meta[name="game-click-counter"]');
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  const endpoint = loopback ? "http://127.0.0.1:8754/counts" :
    location.protocol === "https:" ? config?.content : "";
  if (!endpoint) return;

  const labels = new Map();
  const format = new Intl.NumberFormat("zh-CN");
  const request = new URL(endpoint);
  request.searchParams.set("gallery", config.dataset.gallery);

  function render(id, clicks) {
    const item = labels.get(id);
    if (!item || !Number.isSafeInteger(clicks) || clicks < item.clicks) return;
    item.clicks = clicks;
    item.label.textContent = "试玩点击 " + format.format(clicks) + " 次";
    item.label.hidden = false;
  }

  async function fetchCounts(url, method = "GET") {
    const result = await fetch(url, {
      method, credentials: "omit", referrerPolicy: "no-referrer", keepalive: method === "POST",
    });
    if (!result.ok) throw new Error("Click counter unavailable");
    return result.json();
  }

  function attach(link, parent, game) {
    const id = game.counterId ?? game.id ?? game.name.normalize("NFKC").trim().toLowerCase();
    const label = document.createElement("p");
    label.className = "play-click-count";
    label.hidden = true;
    parent.append(label);
    labels.set(id, { label, clicks: 0 });

    const url = new URL(request);
    url.searchParams.set("game", id);
    function record(event) {
      if (event.defaultPrevented) return;
      fetchCounts(url, "POST").then(data => render(id, data.clicks)).catch(() => {});
    }
    link.addEventListener("click", record);
    link.addEventListener("auxclick", event => {
      if (event.button === 1) record(event);
    });
  }

  async function load() {
    if (!labels.size) return;
    try {
      const { counts } = await fetchCounts(request);
      for (const [id, clicks] of Object.entries(counts)) render(id, clicks);
    } catch {
      // Keep links usable and leave unavailable counts hidden.
    }
  }

  window.galleryPlayCounter = { attach, load };
})();
