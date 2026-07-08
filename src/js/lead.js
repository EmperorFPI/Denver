/* Lead capture: attribution + submit.
   1. On any landing, persist UTM params + gclid to sessionStorage (survives navigation).
   2. On form pages, hydrate hidden fields.
   3. Submit via fetch to /api/lead (Cloudflare Pages Function), then redirect to /thank-you/. */
(function () {
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"];
  var params = new URLSearchParams(window.location.search);

  KEYS.forEach(function (k) {
    var v = params.get(k);
    if (v) sessionStorage.setItem("attr_" + k, v);
  });
  if (!sessionStorage.getItem("attr_landing_page")) {
    sessionStorage.setItem("attr_landing_page", window.location.pathname + window.location.search);
  }
  if (!sessionStorage.getItem("attr_referrer") && document.referrer) {
    sessionStorage.setItem("attr_referrer", document.referrer);
  }

  var form = document.getElementById("lead-form");
  if (!form) return;

  KEYS.concat(["landing_page", "referrer"]).forEach(function (k) {
    var input = form.querySelector('input[name="' + k + '"]');
    var v = sessionStorage.getItem("attr_" + k);
    if (input && v) input.value = v;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var err = document.getElementById("lead-form-error");
    err.hidden = true;

    if (!form.reportValidity()) return;

    btn.disabled = true;
    btn.textContent = "Sending…";

    fetch(form.action, { method: "POST", body: new FormData(form) })
      .then(function (res) {
        if (!res.ok) throw new Error("Lead endpoint returned " + res.status);
        return res.json();
      })
      .then(function () {
        window.location.href = "/thank-you/";
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = btn.getAttribute("data-label") || "Request my appointment";
        err.hidden = false;
      });
  });
})();
