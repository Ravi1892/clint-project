(function () {
  const LS_KEY = "site:data:v1";
  const LS_ADMINS = "site:admins:v1";
  const LS_MESSAGES = "site:messages:v1";
  const SS_AUTH = "site:auth:v1";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const adminRoot = $("#admin-root");
  const fab = $("#admin-open");

  async function sha256(str) {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function readDefaults() {
    try {
      const el = $("#site-defaults");
      if (!el) return null;
      return JSON.parse(el.textContent);
    } catch (e) {
      return null;
    }
  }

  function loadData() {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
    const defaults = readDefaults() || {
      projects: [],
      services: [],
      socials: [],
    };
    localStorage.setItem(LS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  function saveData(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    renderPublic(data);
  }

  function loadAdmins() {
    const raw = localStorage.getItem(LS_ADMINS);
    return raw ? JSON.parse(raw) : [];
  }
  function saveAdmins(list) {
    localStorage.setItem(LS_ADMINS, JSON.stringify(list));
  }
  function loadMessages() {
    const raw = localStorage.getItem(LS_MESSAGES);
    return raw ? JSON.parse(raw) : [];
  }
  function saveMessages(list) {
    localStorage.setItem(LS_MESSAGES, JSON.stringify(list));
  }
  function currentUser() {
    const raw = sessionStorage.getItem(SS_AUTH);
    return raw ? JSON.parse(raw) : null;
  }
  function setCurrentUser(user) {
    if (user) sessionStorage.setItem(SS_AUTH, JSON.stringify(user));
    else sessionStorage.removeItem(SS_AUTH);
    updateFab();
  }

  // Render public sections from data
  function renderPublic(data) {
    // Projects
    const grid = $("#work-grid");
    if (grid) {
      grid.innerHTML = data.projects
        .map(
          (p) => `
        <article class="card reveal-fade">
          <div class="card-media" style="${
            p.image ? `background-image: url('${p.image}')` : ""
          }"></div>
          <div class="card-body">
            <h3>${escapeHtml(p.title || "")}</h3>
            <p>${escapeHtml(p.desc || "")}</p>
            <div class="meta">
              <span>${escapeHtml(p.metaLeft || "")}</span>
              <span>${escapeHtml(p.metaRight || "")}</span>
            </div>
          </div>
        </article>
      `
        )
        .join("");
      revealWithin(grid);
    }
    // Services
    const services = $("#services-list");
    if (services) {
      services.innerHTML = (data.services || [])
        .map(
          (s) => `
        <div class="service-item reveal-fade">
          <h3>${escapeHtml(s.title || "")}</h3>
          <p>${escapeHtml(s.desc || "")}</p>
        </div>
      `
        )
        .join("");
      revealWithin(services);
    }
    // Socials (footer)
    const socials = $("#socials");
    if (socials && data.socials) {
      socials.innerHTML = data.socials
        .map(
          (s) =>
            `<a href="${s.url || "#"}" aria-label="${escapeHtml(
              s.label || ""
            )}">${escapeHtml(s.label || "")}</a>`
        )
        .join("");
    }

    // Social Panel (left side)
    const socialPanel = $("#social-links-panel");
    if (socialPanel && data.socials) {
      socialPanel.innerHTML = data.socials
        .map((s) => {
          const icon = getSocialIcon(s.platform || s.label);
          return `
            <a href="${
              s.url || "#"
            }" class="social-link" aria-label="${escapeHtml(
            s.label || ""
          )}" target="_blank" rel="noopener">
              ${icon}
            </a>
          `;
        })
        .join("");
    }
  }

  // Mark newly inserted reveal elements as visible to avoid staying hidden
  function revealWithin(container) {
    const els = container.querySelectorAll(".reveal-up, .reveal-fade");
    els.forEach((el) => el.classList.add("revealed"));
  }

  function escapeHtml(s) {
    return (s || "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );
  }

  // Admin UI
  function updateFab() {
    fab.style.display = currentUser() ? "inline-flex" : "none";
  }

  function openAdmin() {
    const data = loadData();
    const admins = loadAdmins();
    adminRoot.innerHTML = `
      <div class="admin-overlay" role="dialog" aria-modal="true">
        <div class="admin-panel">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <h3 style="margin:0;">Admin Panel</h3>
            <div class="admin-actions">
              <button class="btn btn-outline" id="export-data">Export</button>
              <label class="btn btn-outline" style="cursor:pointer;">
                Import <input id="import-data" type="file" accept="application/json" style="display:none;">
              </label>
              <button class="btn btn-outline" id="logout">Logout</button>
              <button class="btn btn-primary" id="close-admin">Close</button>
            </div>
          </div>

          <div class="admin-tabs" role="tablist">
            <button class="admin-tab" data-tab="projects" aria-selected="true">Projects</button>
            <button class="admin-tab" data-tab="services">Services</button>
            <button class="admin-tab" data-tab="social">Social Links</button>
            <button class="admin-tab" data-tab="messages">Messages</button>
            <button class="admin-tab" data-tab="admins">Admins</button>
          </div>

          <div id="tab-projects">
            <div class="admin-actions" style="margin-bottom:8px;">
              <button class="btn btn-primary" id="add-project">Add project</button>
            </div>
            <div class="admin-list" id="projects-list"></div>
          </div>

          <div id="tab-services" style="display:none;">
            <div class="admin-actions" style="margin-bottom:8px;">
              <button class="btn btn-primary" id="add-service">Add service</button>
            </div>
            <div class="admin-list" id="services-list-admin"></div>
          </div>

          <div id="tab-social" style="display:none;">
            <div class="admin-actions" style="margin-bottom:8px;">
              <button class="btn btn-primary" id="add-social">Add social link</button>
            </div>
            <div class="admin-list" id="social-list-admin"></div>
          </div>

          <div id="tab-messages" style="display:none;">
            <div class="admin-actions" style="margin-bottom:8px;">
              <button class="btn btn-outline" id="clear-messages">Clear all messages</button>
            </div>
            <div class="admin-list" id="messages-list"></div>
          </div>

          <div id="tab-admins" style="display:none;">
            <div class="admin-row">
              <label>
                <div class="admin-muted">Username</div>
                <input type="text" id="admin-username" placeholder="newadmin">
              </label>
              <label>
                <div class="admin-muted">Password</div>
                <input type="password" id="admin-password" placeholder="********">
              </label>
            </div>
            <div class="admin-actions" style="margin:10px 0;">
              <button class="btn btn-primary" id="create-admin">Add admin</button>
            </div>
            <div class="admin-list">
              ${admins
                .map(
                  (a) => `
                <div class="admin-item" data-username="${escapeHtml(
                  a.username
                )}">
                  <div><strong>${escapeHtml(a.username)}</strong></div>
                  <div class="admin-actions">
                    <button class="btn btn-outline remove-admin">Remove</button>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
    `;
    bindAdminEvents();
    renderProjectsEditor();
    renderServicesEditor();
    renderSocialEditor();
    renderMessagesEditor();
  }

  function bindAdminEvents() {
    const overlay = $(".admin-overlay");
    $("#close-admin")?.addEventListener(
      "click",
      () => (adminRoot.innerHTML = "")
    );
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) adminRoot.innerHTML = "";
    });

    // Tabs
    $$(".admin-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        $$(".admin-tab").forEach((t) =>
          t.setAttribute("aria-selected", "false")
        );
        tab.setAttribute("aria-selected", "true");
        const t = tab.dataset.tab;
        $("#tab-projects").style.display = t === "projects" ? "" : "none";
        $("#tab-services").style.display = t === "services" ? "" : "none";
        $("#tab-social").style.display = t === "social" ? "" : "none";
        $("#tab-messages").style.display = t === "messages" ? "" : "none";
        $("#tab-admins").style.display = t === "admins" ? "" : "none";
      });
    });

    // Export/Import
    $("#export-data")?.addEventListener("click", () => {
      const data = loadData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "site-data.json";
      a.click();
      URL.revokeObjectURL(a.href);
    });
    $("#import-data")?.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const obj = JSON.parse(text);
        saveData(obj);
        renderProjectsEditor();
        renderServicesEditor();
        alert("Imported successfully.");
      } catch {
        alert("Invalid JSON file.");
      }
    });

    // Logout
    $("#logout")?.addEventListener("click", () => {
      setCurrentUser(null);
      adminRoot.innerHTML = "";
    });

    // Admins add/remove
    $("#create-admin")?.addEventListener("click", async () => {
      const username = $("#admin-username").value.trim();
      const password = $("#admin-password").value;
      if (!username || !password)
        return alert("Provide username and password.");
      const list = loadAdmins();
      if (
        list.some((a) => a.username.toLowerCase() === username.toLowerCase())
      ) {
        return alert("Username already exists.");
      }
      const hash = await sha256(password);
      list.push({ username, hash });
      saveAdmins(list);
      alert("Admin added.");
      openAdmin();
    });
    $$(".remove-admin").forEach((btn) => {
      btn.addEventListener("click", () => {
        const username = btn.closest(".admin-item").dataset.username;
        const me = currentUser();
        if (me && me.username === username)
          return alert("You cannot remove yourself.");
        const list = loadAdmins().filter((a) => a.username !== username);
        saveAdmins(list);
        openAdmin();
      });
    });
  }

  function renderProjectsEditor() {
    const data = loadData();
    const wrap = $("#projects-list");
    if (!wrap) return;
    wrap.innerHTML = data.projects
      .map(
        (p, i) => `
      <div class="admin-item" data-index="${i}">
        <div class="admin-row">
          <label>
            <div class="admin-muted">Title</div>
            <input type="text" class="p-title" value="${escapeAttr(p.title)}">
          </label>
          <label>
            <div class="admin-muted">Image URL</div>
            <input type="text" class="p-image" value="${escapeAttr(
              p.image
            )}" placeholder="assets/work-1.jpg">
          </label>
        </div>
        <div class="admin-row">
          <label>
            <div class="admin-muted">Description</div>
            <textarea rows="2" class="p-desc">${escapeText(p.desc)}</textarea>
          </label>
          <label>
            <div class="admin-muted">Meta Left</div>
            <input type="text" class="p-metaL" value="${escapeAttr(
              p.metaLeft
            )}" placeholder="Feature • 108 pages">
          </label>
        </div>
        <div class="admin-row">
          <label>
            <div class="admin-muted">Meta Right</div>
            <input type="text" class="p-metaR" value="${escapeAttr(
              p.metaRight
            )}" placeholder="Final Draft">
          </label>
        </div>
        <div class="admin-actions">
          <button class="btn btn-outline save-project">Save</button>
          <button class="btn btn-outline move-up">Move up</button>
          <button class="btn btn-outline move-down">Move down</button>
          <button class="btn btn-outline delete-project" style="color:#e56">Delete</button>
        </div>
      </div>
    `
      )
      .join("");

    // Bind per-item actions for projects only
    $$("#projects-list .admin-item").forEach((item) => {
      const idx = +item.dataset.index;
      $(".save-project", item)?.addEventListener("click", () => {
        const p = data.projects[idx];
        p.title = $(".p-title", item).value.trim();
        p.image = $(".p-image", item).value.trim();
        p.desc = $(".p-desc", item).value.trim();
        p.metaLeft = $(".p-metaL", item).value.trim();
        p.metaRight = $(".p-metaR", item).value.trim();
        saveData(data);
        alert("Saved.");
      });
      $(".move-up", item)?.addEventListener("click", () => {
        if (idx <= 0) return;
        const [it] = data.projects.splice(idx, 1);
        data.projects.splice(idx - 1, 0, it);
        saveData(data);
        renderProjectsEditor();
      });
      $(".move-down", item)?.addEventListener("click", () => {
        if (idx >= data.projects.length - 1) return;
        const [it] = data.projects.splice(idx, 1);
        data.projects.splice(idx + 1, 0, it);
        saveData(data);
        renderProjectsEditor();
      });
      $(".delete-project", item)?.addEventListener("click", () => {
        if (!confirm("Delete this project?")) return;
        data.projects.splice(idx, 1);
        saveData(data);
        renderProjectsEditor();
      });
    });

    $("#add-project")?.addEventListener("click", () => {
      data.projects.push({
        title: "New project",
        desc: "",
        metaLeft: "",
        metaRight: "",
        image: "",
      });
      saveData(data);
      renderProjectsEditor();
    });
  }

  function renderServicesEditor() {
    const data = loadData();
    const wrap = $("#services-list-admin");
    if (!wrap) return;
    wrap.innerHTML = data.services
      .map(
        (s, i) => `
      <div class="admin-item" data-index="${i}">
        <div class="admin-row">
          <label>
            <div class="admin-muted">Title</div>
            <input type="text" class="s-title" value="${escapeAttr(s.title)}">
          </label>
        </div>
        <div class="admin-row">
          <label>
            <div class="admin-muted">Description</div>
            <textarea rows="3" class="s-desc">${escapeText(s.desc)}</textarea>
          </label>
        </div>
        <div class="admin-actions">
          <button class="btn btn-outline save-service">Save</button>
          <button class="btn btn-outline move-up-service">Move up</button>
          <button class="btn btn-outline move-down-service">Move down</button>
          <button class="btn btn-outline delete-service" style="color:#e56">Delete</button>
        </div>
      </div>
    `
      )
      .join("");

    // Bind per-item actions for services only
    $$("#services-list-admin .admin-item").forEach((item) => {
      const idx = +item.dataset.index;
      $(".save-service", item)?.addEventListener("click", () => {
        const s = data.services[idx];
        s.title = $(".s-title", item).value.trim();
        s.desc = $(".s-desc", item).value.trim();
        saveData(data);
        alert("Saved.");
      });
      $(".move-up-service", item)?.addEventListener("click", () => {
        if (idx <= 0) return;
        const [it] = data.services.splice(idx, 1);
        data.services.splice(idx - 1, 0, it);
        saveData(data);
        renderServicesEditor();
      });
      $(".move-down-service", item)?.addEventListener("click", () => {
        if (idx >= data.services.length - 1) return;
        const [it] = data.services.splice(idx, 1);
        data.services.splice(idx + 1, 0, it);
        saveData(data);
        renderServicesEditor();
      });
      $(".delete-service", item)?.addEventListener("click", () => {
        if (!confirm("Delete this service?")) return;
        data.services.splice(idx, 1);
        saveData(data);
        renderServicesEditor();
      });
    });

    $("#add-service")?.addEventListener("click", () => {
      data.services.push({
        title: "New service",
        desc: "",
      });
      saveData(data);
      renderServicesEditor();
    });
  }

  function renderMessagesEditor() {
    const messages = loadMessages();
    const wrap = $("#messages-list");
    if (!wrap) return;

    if (messages.length === 0) {
      wrap.innerHTML =
        '<div class="admin-muted" style="text-align:center;padding:20px;">No messages yet</div>';
      return;
    }

    wrap.innerHTML = messages
      .map(
        (msg, i) => `
      <div class="admin-item" data-index="${i}">
        <div class="admin-row">
          <label>
            <div class="admin-muted">From</div>
            <input type="text" value="${escapeAttr(
              msg.name
            )}" readonly style="background:#1a1a1a;">
          </label>
          <label>
            <div class="admin-muted">Email</div>
            <input type="email" value="${escapeAttr(
              msg.email
            )}" readonly style="background:#1a1a1a;">
          </label>
        </div>
        <div class="admin-row">
          <label>
            <div class="admin-muted">Message</div>
            <textarea rows="4" readonly style="background:#1a1a1a;">${escapeText(
              msg.message
            )}</textarea>
          </label>
        </div>
        <div class="admin-row">
          <label>
            <div class="admin-muted">Received</div>
            <input type="text" value="${escapeAttr(
              new Date(msg.timestamp).toLocaleString()
            )}" readonly style="background:#1a1a1a;">
          </label>
        </div>
        <div class="admin-actions">
          <button class="btn btn-outline delete-message" style="color:#e56">Delete</button>
        </div>
      </div>
    `
      )
      .join("");

    // Bind delete actions
    $$("#messages-list .admin-item").forEach((item) => {
      const idx = +item.dataset.index;
      $(".delete-message", item)?.addEventListener("click", () => {
        if (!confirm("Delete this message?")) return;
        const messages = loadMessages();
        messages.splice(idx, 1);
        saveMessages(messages);
        renderMessagesEditor();
      });
    });

    // Clear all messages
    $("#clear-messages")?.addEventListener("click", () => {
      if (!confirm("Clear all messages? This cannot be undone.")) return;
      saveMessages([]);
      renderMessagesEditor();
    });
  }

  function escapeAttr(s) {
    return (s || "").replace(/"/g, "&quot;");
  }
  function escapeText(s) {
    return s || "";
  }

  // Get social media icon SVG
  function getSocialIcon(platform) {
    const icons = {
      github:
        '<svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
      linkedin:
        '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="16" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="currentColor">in</text></svg>',
      twitter:
        '<svg viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>',
      instagram:
        '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
      youtube:
        '<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
      facebook:
        '<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
      email:
        '<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    };

    const platformKey = platform?.toLowerCase() || "";
    return icons[platformKey] || icons["email"];
  }

  function renderSocialEditor() {
    const data = loadData();
    const wrap = $("#social-list-admin");
    if (!wrap) return;

    wrap.innerHTML = (data.socials || [])
      .map(
        (s, i) => `
      <div class="admin-item" data-index="${i}">
        <div class="admin-row">
          <label>
            <div class="admin-muted">Platform</div>
            <select class="s-platform">
              <option value="github" ${
                s.platform === "github" ? "selected" : ""
              }>GitHub</option>
              <option value="linkedin" ${
                s.platform === "linkedin" ? "selected" : ""
              }>LinkedIn</option>
              <option value="twitter" ${
                s.platform === "twitter" ? "selected" : ""
              }>Twitter</option>
              <option value="instagram" ${
                s.platform === "instagram" ? "selected" : ""
              }>Instagram</option>
              <option value="youtube" ${
                s.platform === "youtube" ? "selected" : ""
              }>YouTube</option>
              <option value="facebook" ${
                s.platform === "facebook" ? "selected" : ""
              }>Facebook</option>
              <option value="email" ${
                s.platform === "email" ? "selected" : ""
              }>Email</option>
            </select>
          </label>
          <label>
            <div class="admin-muted">URL</div>
            <input type="url" class="s-url" value="${escapeAttr(
              s.url
            )}" placeholder="https://...">
          </label>
        </div>
        <div class="admin-actions">
          <button class="btn btn-outline save-social">Save</button>
          <button class="btn btn-outline move-up-social">Move up</button>
          <button class="btn btn-outline move-down-social">Move down</button>
          <button class="btn btn-outline delete-social" style="color:#e56">Delete</button>
        </div>
      </div>
    `
      )
      .join("");

    // Bind per-item actions
    $$("#social-list-admin .admin-item").forEach((item) => {
      const idx = +item.dataset.index;
      $(".save-social", item)?.addEventListener("click", () => {
        const s = data.socials[idx];
        s.platform = $(".s-platform", item).value;
        s.url = $(".s-url", item).value.trim();
        s.label = $(".s-platform", item).selectedOptions[0].text;
        saveData(data);
        alert("Saved.");
      });
      $(".move-up-social", item)?.addEventListener("click", () => {
        if (idx <= 0) return;
        const [it] = data.socials.splice(idx, 1);
        data.socials.splice(idx - 1, 0, it);
        saveData(data);
        renderSocialEditor();
      });
      $(".move-down-social", item)?.addEventListener("click", () => {
        if (idx >= data.socials.length - 1) return;
        const [it] = data.socials.splice(idx, 1);
        data.socials.splice(idx + 1, 0, it);
        saveData(data);
        renderSocialEditor();
      });
      $(".delete-social", item)?.addEventListener("click", () => {
        if (!confirm("Delete this social link?")) return;
        data.socials.splice(idx, 1);
        saveData(data);
        renderSocialEditor();
      });
    });

    $("#add-social")?.addEventListener("click", () => {
      data.socials.push({
        platform: "github",
        label: "GitHub",
        url: "",
      });
      saveData(data);
      renderSocialEditor();
    });
  }

  // Auth flows
  async function ensureFirstAdmin() {
    const admins = loadAdmins();
    if (admins.length > 0) return;
    // First run: ask to create
    const username = prompt("Create admin - username:");
    if (!username) return;
    const password = prompt("Create admin - password:");
    if (!password) return;
    const hash = await sha256(password);
    saveAdmins([{ username, hash }]);
    alert("Admin created. Press Ctrl+Shift+A to open login.");
  }

  async function loginDialog() {
    const u = prompt("Admin login - username:");
    const p = prompt("Admin login - password:");
    if (!u || !p) return;
    const hash = await sha256(p);
    const match = loadAdmins().find((a) => a.username === u && a.hash === hash);
    if (match) {
      setCurrentUser({ username: u });
      openAdmin();
    } else {
      alert("Invalid credentials.");
    }
  }

  // Keyboard shortcut to open login/admin
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyZ") {
      if (currentUser()) openAdmin();
      else loginDialog();
    }
  });

  // FAB open admin
  fab.addEventListener("click", () => openAdmin());

  // Contact form handling
  function setupContactForm() {
    const form = $(".contact-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const message = {
        name: formData.get("name") || "",
        email: formData.get("email") || "",
        message: formData.get("message") || "",
        timestamp: Date.now(),
      };

      // Store message
      const messages = loadMessages();
      messages.unshift(message); // Add to beginning
      saveMessages(messages);

      // Show success feedback
      const button = form.querySelector('button[type="submit"]');
      const original = button.textContent;
      button.disabled = true;
      button.textContent = "Sending...";

      setTimeout(() => {
        button.textContent = "Sent ✓";
        setTimeout(() => {
          button.textContent = original;
          button.disabled = false;
          form.reset();
        }, 1500);
      }, 800);
    });
  }

  // Init
  (async function init() {
    const data = loadData();
    renderPublic(data);
    await ensureFirstAdmin();
    updateFab();
    setupContactForm();
  })();
})();
