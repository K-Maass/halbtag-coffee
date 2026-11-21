// Quote form on contact.html. Sends the lead to the Worker as JSON.
(function () {
  var form = document.getElementById("quote-form");
  if (!form) return;

  var button = form.querySelector("button[type=submit]");
  var status = form.querySelector(".form-status");
  var done = document.getElementById("quote-done");
  var workerUrl = (window.SITE_CONFIG && window.SITE_CONFIG.workerUrl) || "";

  function showDone() {
    form.hidden = true;
    done.hidden = false;
    done.focus();
  }

  function showError() {
    button.disabled = false;
    button.textContent = "Send request";
    status.className = "form-status form-error";
    status.textContent =
      "That didn't go through. Please try again, or email us at hello@halbtagcoffee.ch.";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (button.disabled) return;
    if (!form.reportValidity()) return;

    button.disabled = true;
    button.textContent = "Sending...";
    status.textContent = "";

    var data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      company: form.elements.company.value.trim(),
      website_url: form.elements.website_url.value.trim(),
      message: form.elements.message.value.trim(),
      website: form.elements.website.value
    };

    if (!workerUrl) {
      console.info("[quote-form] offline mode: workerUrl is empty, nothing was sent.", data);
      showDone();
      return;
    }

    fetch(workerUrl.replace(/\/$/, "") + "/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        showDone();
      })
      .catch(function (err) {
        console.error("[quote-form]", err);
        showError();
      });
  });
})();
