const ACCOUNTS = [
  { username: "Bilegzaya", password: "12345678" },
  { username: "Eneenee", password: "1234" }
];

const STORAGE_PREFIX = "ourlove_data_";

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("loginForm")) {
    initLoginPage();
  }

  if (document.querySelector(".app-shell")) {
    initAppPage();
  }
});

function initLoginPage() {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const matched = ACCOUNTS.find(
      (acc) => acc.username === username && acc.password === password
    );

    if (!matched) {
      alert("Wrong username or password.");
      return;
    }

    localStorage.setItem("ourlove_current_user", username);
    window.location.href = "app.html";
  });
}

function initAppPage() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  bindNavigation();
  bindModalCloseButtons();
  bindMemoryModal();
  bindLetterModal();
  bindProfile();
  bindLogout();
  renderAll();
}

function getCurrentUser() {
  return localStorage.getItem("ourlove_current_user");
}

function getUserStorageKey() {
  return STORAGE_PREFIX + getCurrentUser();
}

function getDefaultData() {
  return {
    profile: {
      name: "",
      bio: "",
      image: ""
    },
    memories: [],
    letters: []
  };
}

function getData() {
  const raw = localStorage.getItem(getUserStorageKey());

  if (!raw) {
    return getDefaultData();
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      profile: parsed.profile || { name: "", bio: "", image: "" },
      memories: Array.isArray(parsed.memories) ? parsed.memories : [],
      letters: Array.isArray(parsed.letters) ? parsed.letters : []
    };
  } catch {
    return getDefaultData();
  }
}

function saveData(data) {
  localStorage.setItem(getUserStorageKey(), JSON.stringify(data));
}

function bindNavigation() {
  const navButtons = document.querySelectorAll(".tabbar-btn");
  const panels = document.querySelectorAll(".tab-panel");

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.tabTarget;

      navButtons.forEach((btn) => btn.classList.remove("active"));
      panels.forEach((panel) => panel.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(targetId).classList.add("active");
    });
  });
}

function bindModalCloseButtons() {
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      closeModal(button.dataset.closeModal);
    });
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  });
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function bindMemoryModal() {
  const openMemoryBtn = document.getElementById("openMemoryBtn");
  const saveMemoryBtn = document.getElementById("saveMemoryBtn");
  const memoryImageInput = document.getElementById("memoryImage");
  const dropZone = document.getElementById("dropZone");

  openMemoryBtn.addEventListener("click", () => {
    resetMemoryForm();
    openModal("memoryModal");
  });

  saveMemoryBtn.addEventListener("click", async () => {
    const date = document.getElementById("memoryDate").value;
    const title = document.getElementById("memoryTitle").value.trim();
    const text = document.getElementById("memoryText").value.trim();
    const file = memoryImageInput.files[0];

    if (!date) {
      alert("Please choose a date.");
      return;
    }

    if (!title) {
      alert("Please write a memory title.");
      return;
    }

    if (!text) {
      alert("Please write what happened.");
      return;
    }

    let image = "";
    if (file) {
      image = await fileToBase64(file);
    }

    const data = getData();
    data.memories.push({
      id: createId(),
      date,
      title,
      text,
      image,
      createdAt: new Date().toISOString()
    });

    data.memories.sort((a, b) => a.date.localeCompare(b.date));
    saveData(data);

    closeModal("memoryModal");
    resetMemoryForm();
    renderAll();
  });

  memoryImageInput.addEventListener("change", () => {
    previewSelectedImage(memoryImageInput.files[0], "memoryImagePreview");
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];

    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const dt = new DataTransfer();
    dt.items.add(file);
    memoryImageInput.files = dt.files;

    previewSelectedImage(file, "memoryImagePreview");
  });
}

function bindLetterModal() {
  const openLetterBtn = document.getElementById("openLetterBtn");
  const saveLetterBtn = document.getElementById("saveLetterBtn");

  openLetterBtn.addEventListener("click", () => {
    resetLetterForm();
    openModal("letterModal");
  });

  saveLetterBtn.addEventListener("click", () => {
    const date = document.getElementById("letterDate").value;
    const title = document.getElementById("letterTitle").value.trim();
    const text = document.getElementById("letterText").value.trim();

    if (!date) {
      alert("Please choose a date.");
      return;
    }

    if (!title) {
      alert("Please write a letter title.");
      return;
    }

    if (!text) {
      alert("Please write your letter.");
      return;
    }

    const data = getData();
    data.letters.push({
      id: createId(),
      date,
      title,
      text,
      createdAt: new Date().toISOString()
    });

    data.letters.sort((a, b) => a.date.localeCompare(b.date));
    saveData(data);

    closeModal("letterModal");
    resetLetterForm();
    renderAll();
  });
}

function bindProfile() {
  const data = getData();
  const profileName = document.getElementById("profileName");
  const profileBio = document.getElementById("profileBio");
  const profileImage = document.getElementById("profileImage");
  const saveProfileBtn = document.getElementById("saveProfileBtn");

  profileName.value = data.profile.name || "";
  profileBio.value = data.profile.bio || "";
  updateProfilePreview(data.profile.image || "");

  profileImage.addEventListener("change", async () => {
    const file = profileImage.files[0];
    if (!file) return;

    const image = await fileToBase64(file);
    const freshData = getData();
    freshData.profile.image = image;
    saveData(freshData);
    updateProfilePreview(image);
  });

  saveProfileBtn.addEventListener("click", () => {
    const freshData = getData();
    freshData.profile.name = profileName.value.trim();
    freshData.profile.bio = profileBio.value.trim();
    saveData(freshData);
    renderHomeHeader();
    alert("Profile saved.");
  });
}

function bindLogout() {
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("ourlove_current_user");
    window.location.href = "index.html";
  });
}

function renderAll() {
  renderHomeHeader();
  renderStats();
  renderMemories();
  renderLetters();
  renderCalendar();
  refreshProfileFields();
}

function renderHomeHeader() {
  const data = getData();
  const currentUser = getCurrentUser();
  const displayName = data.profile.name || currentUser || "love";

  document.getElementById("welcomeText").textContent = `Welcome, ${displayName}`;
}

function renderStats() {
  const data = getData();
  document.getElementById("memoryCount").textContent = data.memories.length;
  document.getElementById("letterCount").textContent = data.letters.length;
}

function renderMemories() {
  const list = document.getElementById("memoryList");
  const data = getData();

  if (!data.memories.length) {
    list.innerHTML = `<div class="empty-card">No memories yet. Add your first one.</div>`;
    return;
  }

  list.innerHTML = data.memories
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((memory) => {
      const imagePart = memory.image
        ? `<img class="memory-cover" src="${memory.image}" alt="${escapeHtml(memory.title)}" />`
        : `<div class="memory-cover"></div>`;

      return `
        <article class="memory-card" data-memory-id="${memory.id}">
          ${imagePart}
          <div class="memory-info">
            <div class="memory-date">${formatDate(memory.date)}</div>
            <h3 class="memory-title">${escapeHtml(memory.title)}</h3>
            <p class="memory-preview">${escapeHtml(shorten(memory.text, 88))}</p>
          </div>
        </article>
      `;
    })
    .join("");

  list.querySelectorAll("[data-memory-id]").forEach((card) => {
    card.addEventListener("click", () => {
      openMemoryView(card.dataset.memoryId);
    });
  });
}

function renderLetters() {
  const list = document.getElementById("letterList");
  const data = getData();

  if (!data.letters.length) {
    list.innerHTML = `<div class="empty-card">No letters yet. Write your first one.</div>`;
    return;
  }

  list.innerHTML = data.letters
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((letter) => {
      return `
        <article class="letter-card" data-letter-id="${letter.id}">
          <div class="letter-info">
            <div class="letter-seal">💌</div>
            <div class="letter-date">${formatDate(letter.date)}</div>
            <h3 class="letter-title">${escapeHtml(letter.title)}</h3>
            <p class="letter-preview">${escapeHtml(shorten(letter.text, 96))}</p>
          </div>
        </article>
      `;
    })
    .join("");

  list.querySelectorAll("[data-letter-id]").forEach((card) => {
    card.addEventListener("click", () => {
      openLetterView(card.dataset.letterId);
    });
  });
}

function renderCalendar() {
  const container = document.getElementById("calendarContainer");
  const months = getMonthsInRange("2025-12-01", "2026-04-30");
  const data = getData();

  container.innerHTML = months
    .map((monthInfo) => {
      const { year, monthIndex, monthName, days } = monthInfo;
      const firstWeekday = new Date(year, monthIndex, 1).getDay();
      const blanks = Array.from({ length: firstWeekday }, () => `<div class="day-blank"></div>`).join("");

      const allowedStart = "2025-12-23";
      const allowedEnd = "2026-04-30";

      const dayCells = days
        .map((day) => {
          const isoDate = formatISODate(new Date(year, monthIndex, day));
          const isActive = isoDate >= allowedStart && isoDate <= allowedEnd;

          if (!isActive) {
            return `<div class="day-blank"></div>`;
          }

          const hasMemory = data.memories.some((m) => m.date === isoDate);
          const hasLetter = data.letters.some((l) => l.date === isoDate);

          return `
            <button class="day-cell" data-calendar-date="${isoDate}" type="button">
              <div class="day-number">${day}</div>
              <div class="day-dot-wrap">
                ${hasMemory ? `<span class="day-dot memory-dot"></span>` : ""}
                ${hasLetter ? `<span class="day-dot letter-dot"></span>` : ""}
              </div>
              <div class="day-label">${hasMemory || hasLetter ? "view" : "add"}</div>
            </button>
          `;
        })
        .join("");

      return `
        <section class="month-card">
          <h3 class="month-title">${monthName} ${year}</h3>
          <div class="weekday-row">
            <div class="weekday">Sun</div>
            <div class="weekday">Mon</div>
            <div class="weekday">Tue</div>
            <div class="weekday">Wed</div>
            <div class="weekday">Thu</div>
            <div class="weekday">Fri</div>
            <div class="weekday">Sat</div>
          </div>
          <div class="calendar-grid">
            ${blanks}
            ${dayCells}
          </div>
        </section>
      `;
    })
    .join("");

  container.querySelectorAll("[data-calendar-date]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openDayView(btn.dataset.calendarDate);
    });
  });
}

function openMemoryView(id) {
  const data = getData();
  const memory = data.memories.find((item) => item.id === id);

  if (!memory) return;

  const body = document.getElementById("viewModalBody");
  const heading = document.getElementById("viewModalHeading");
  const deleteBtn = document.getElementById("deleteItemBtn");

  heading.textContent = "Memory";

  body.innerHTML = `
    <div class="view-layout">
      <div>
        <div class="view-meta">${formatDate(memory.date)}</div>
        <h2 class="view-title">${escapeHtml(memory.title)}</h2>
      </div>
      <div class="view-grid">
        ${memory.image ? `<img class="view-image" src="${memory.image}" alt="${escapeHtml(memory.title)}" />` : `<div class="empty-card">No photo added</div>`}
        <p class="view-text">${escapeHtml(memory.text)}</p>
      </div>
    </div>
  `;

  deleteBtn.classList.remove("hidden");
  deleteBtn.onclick = () => {
    const fresh = getData();
    fresh.memories = fresh.memories.filter((item) => item.id !== id);
    saveData(fresh);
    closeModal("viewModal");
    renderAll();
  };

  openModal("viewModal");
}

function openLetterView(id) {
  const data = getData();
  const letter = data.letters.find((item) => item.id === id);

  if (!letter) return;

  const body = document.getElementById("viewModalBody");
  const heading = document.getElementById("viewModalHeading");
  const deleteBtn = document.getElementById("deleteItemBtn");

  heading.textContent = "Letter";

  body.innerHTML = `
    <div class="view-layout">
      <div>
        <div class="view-meta">${formatDate(letter.date)}</div>
        <h2 class="view-title">${escapeHtml(letter.title)}</h2>
      </div>
      <div class="view-grid">
        <div class="empty-card">💌</div>
        <p class="view-text">${escapeHtml(letter.text)}</p>
      </div>
    </div>
  `;

  deleteBtn.classList.remove("hidden");
  deleteBtn.onclick = () => {
    const fresh = getData();
    fresh.letters = fresh.letters.filter((item) => item.id !== id);
    saveData(fresh);
    closeModal("viewModal");
    renderAll();
  };

  openModal("viewModal");
}

function openDayView(date) {
  const data = getData();
  const dayMemories = data.memories.filter((item) => item.date === date);
  const dayLetters = data.letters.filter((item) => item.date === date);

  const body = document.getElementById("viewModalBody");
  const heading = document.getElementById("viewModalHeading");
  const deleteBtn = document.getElementById("deleteItemBtn");

  heading.textContent = formatDate(date);
  deleteBtn.classList.add("hidden");
  deleteBtn.onclick = null;

  const memoryHtml = dayMemories.length
    ? dayMemories
        .map((memory) => `
          <article class="memory-card" data-memory-id="${memory.id}">
            ${memory.image ? `<img class="memory-cover" src="${memory.image}" alt="${escapeHtml(memory.title)}" />` : `<div class="memory-cover"></div>`}
            <div class="memory-info">
              <div class="memory-date">Memory</div>
              <h3 class="memory-title">${escapeHtml(memory.title)}</h3>
              <p class="memory-preview">${escapeHtml(shorten(memory.text, 110))}</p>
            </div>
          </article>
        `)
        .join("")
    : `<div class="empty-card">No memory saved for this day.</div>`;

  const letterHtml = dayLetters.length
    ? dayLetters
        .map((letter) => `
          <article class="letter-card" data-letter-id="${letter.id}">
            <div class="letter-info">
              <div class="letter-seal">💌</div>
              <div class="letter-date">Letter</div>
              <h3 class="letter-title">${escapeHtml(letter.title)}</h3>
              <p class="letter-preview">${escapeHtml(shorten(letter.text, 110))}</p>
            </div>
          </article>
        `)
        .join("")
    : `<div class="empty-card">No letter saved for this day.</div>`;

  body.innerHTML = `
    <div class="view-layout">
      <div class="section-header" style="margin-bottom:0;">
        <div>
          <p class="eyebrow">day details</p>
          <h2 style="margin:0;">What happened</h2>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button id="quickAddMemoryBtn" class="primary-btn" type="button">Add Memory</button>
          <button id="quickAddLetterBtn" class="secondary-btn" type="button">Add Letter</button>
        </div>
      </div>

      <div class="view-grid">
        <div>
          <p class="eyebrow">memories</p>
          <div class="card-grid">${memoryHtml}</div>
        </div>
        <div>
          <p class="eyebrow">letters</p>
          <div class="card-grid">${letterHtml}</div>
        </div>
      </div>
    </div>
  `;

  openModal("viewModal");

  document.getElementById("quickAddMemoryBtn").addEventListener("click", () => {
    closeModal("viewModal");
    resetMemoryForm(date);
    openModal("memoryModal");
  });

  document.getElementById("quickAddLetterBtn").addEventListener("click", () => {
    closeModal("viewModal");
    resetLetterForm(date);
    openModal("letterModal");
  });

  body.querySelectorAll("[data-memory-id]").forEach((card) => {
    card.addEventListener("click", () => {
      openMemoryView(card.dataset.memoryId);
    });
  });

  body.querySelectorAll("[data-letter-id]").forEach((card) => {
    card.addEventListener("click", () => {
      openLetterView(card.dataset.letterId);
    });
  });
}

function resetMemoryForm(prefillDate = "") {
  document.getElementById("memoryDate").value = prefillDate;
  document.getElementById("memoryTitle").value = "";
  document.getElementById("memoryText").value = "";
  document.getElementById("memoryImage").value = "";
  document.getElementById("memoryImagePreview").src = "";
  document.getElementById("memoryImagePreview").classList.add("hidden");
}

function resetLetterForm(prefillDate = "") {
  document.getElementById("letterDate").value = prefillDate;
  document.getElementById("letterTitle").value = "";
  document.getElementById("letterText").value = "";
}

function previewSelectedImage(file, previewId) {
  const preview = document.getElementById(previewId);

  if (!file) {
    preview.src = "";
    preview.classList.add("hidden");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function refreshProfileFields() {
  const data = getData();
  const profileName = document.getElementById("profileName");
  const profileBio = document.getElementById("profileBio");

  if (profileName !== document.activeElement) {
    profileName.value = data.profile.name || "";
  }

  if (profileBio !== document.activeElement) {
    profileBio.value = data.profile.bio || "";
  }

  updateProfilePreview(data.profile.image || "");
}

function updateProfilePreview(image) {
  const img = document.getElementById("profilePreview");
  const fallback = document.getElementById("avatarFallback");

  if (image) {
    img.src = image;
    img.style.display = "block";
    fallback.style.display = "none";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
    fallback.style.display = "grid";
  }
}

function getMonthsInRange(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const months = [];

  let current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    const year = current.getFullYear();
    const monthIndex = current.getMonth();
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();

    months.push({
      year,
      monthIndex,
      monthName: current.toLocaleString("en-US", { month: "long" }),
      days: Array.from({ length: lastDay }, (_, i) => i + 1)
    });

    current = new Date(year, monthIndex + 1, 1);
  }

  return months;
}

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatISODate(date) {
  return date.toISOString().slice(0, 10);
}

function createId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function shorten(text, max) {
  return text.length <= max ? text : text.slice(0, max).trim() + "...";
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}