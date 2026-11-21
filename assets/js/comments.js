// "Questions & comments" on plans and guide pages.
// Reads from the Worker, falls back to data/comments.json.
(function () {
  var section = document.getElementById("comments");
  if (!section) return;

  var page = section.dataset.page;        // e.g. "guides/descaling.html"
  var root = section.dataset.root || "";  // relative path back to the site root
  var list = section.querySelector(".comment-list");
  var form = section.querySelector(".comment-form");
  var button = form.querySelector("button[type=submit]");
  var status = form.querySelector(".form-status");
  var workerUrl = ((window.SITE_CONFIG && window.SITE_CONFIG.workerUrl) || "").replace(/\/$/, "");

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function renderOne(c) {
    var li = document.createElement("li");
    li.className = "comment";
    var meta = document.createElement("div");
    meta.className = "comment-meta";
    var name = document.createElement("strong");
    name.textContent = c.name;
    var time = document.createElement("time");
    time.dateTime = c.created_at;
    time.textContent = formatDate(c.created_at);
    meta.appendChild(name);
    meta.appendChild(time);
    var text = document.createElement("p");
    text.textContent = c.text;
    li.appendChild(meta);
    li.appendChild(text);
    return li;
  }

  function render(comments) {
    list.innerHTML = "";
    comments
      .filter(function (c) { return c.page === page; })
      .sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; })
      .forEach(function (c) { list.appendChild(renderOne(c)); });
    if (!list.children.length) {
      var empty = document.createElement("li");
      empty.className = "comment-empty";
      empty.textContent = "No questions yet.";
      list.appendChild(empty);
    }
  }

  function loadSeed() {
    return fetch(root + "data/comments.json").then(function (res) { return res.json(); });
  }

  function load() {
    var request = workerUrl
      ? fetch(workerUrl + "/comments?page=" + encodeURIComponent(page)).then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
      : Promise.reject(new Error("offline mode"));

    request
      .catch(function (err) {
        console.info("[comments] using data/comments.json (" + err.message + ")");
        return loadSeed();
      })
      .then(render)
      .catch(function () {
        list.innerHTML = '<li class="comment-empty">Comments could not be loaded.</li>';
      });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (button.disabled) return;
    if (!form.reportValidity()) return;

    button.disabled = true;
    status.className = "form-status";
    status.textContent = "Posting...";

    var data = {
      page: page,
      name: form.elements.name.value.trim(),
      text: form.elements.text.value.trim(),
      website: form.elements.website.value
    };

    function posted() {
      var empty = list.querySelector(".comment-empty");
      if (empty) empty.remove();
      list.appendChild(renderOne({ name: data.name, text: data.text, created_at: new Date().toISOString() }));
      form.reset();
      status.textContent = "Thanks. Your comment is posted.";
      button.disabled = false;
    }

    if (!workerUrl) {
      console.info("[comments] offline mode: workerUrl is empty, comment not sent.", data);
      posted();
      return;
    }

    fetch(workerUrl + "/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        posted();
      })
      .catch(function (err) {
        console.error("[comments]", err);
        status.className = "form-status form-error";
        status.textContent = "That didn't post. Please try again in a moment.";
        button.disabled = false;
      });
  });

  load();
})();
