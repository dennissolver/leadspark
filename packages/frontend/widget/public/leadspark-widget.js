/*! LeadSpark Widget Embed Loader v1.0.0 */
(function () {
  const d = document;
  function ready(fn){ if (d.readyState !== "loading") fn(); else d.addEventListener("DOMContentLoaded", fn); }

  function mount() {
    const cfg = (window.LEADSPARK_CONFIG || {});
    if (!cfg.backendBaseUrl) {
      console.error("[LeadSpark] backendBaseUrl missing in window.LEADSPARK_CONFIG");
      return;
    }
    const containerId = cfg.containerId || "leadspark-widget-container";
    let container = d.getElementById(containerId);
    if (!container) {
      container = d.createElement("div");
      container.id = containerId;
      d.body.appendChild(container);
    }

    // Use iframe to isolate styles, serve the built widget index.html
    const src = (cfg.widgetUrl || "https://YOUR_WIDGET_HOST/index.html") + `?tenantId=${encodeURIComponent(cfg.tenantId || "")}&api=${encodeURIComponent(cfg.backendBaseUrl)}`;
    const iframe = d.createElement("iframe");
    iframe.src = src;
    iframe.title = "LeadSpark Widget";
    iframe.loading = "lazy";
    iframe.style.border = "0";
    iframe.style.width = cfg.width || "380px";
    iframe.style.height = cfg.height || "560px";
    iframe.style.position = cfg.position || "fixed";
    iframe.style.bottom = cfg.bottom || "24px";
    iframe.style.right = cfg.right || "24px";
    iframe.style.zIndex = cfg.zIndex || "999999";

    container.appendChild(iframe);
  }

  ready(mount);
})();
