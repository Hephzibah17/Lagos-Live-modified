/**
 * Lagos Live - Shared Core Utilities
 * Synchronizes themes, profile, Lagos clock, mobile sidebar, and bookmarking across all HTML pages.
 */

(function () {
  const SETTINGS_KEY = "lagosLiveSettings";
  const USER_KEY = "lagosLiveUser";
  const PROFILE_KEY = "lagosLiveProfile";
  const SAVED_KEY = "lagosLiveSavedPlaces";
  const BOOKMARKS_KEY = "lagosLiveBookmarks";

  const defaultSettings = {
    theme: "dark",
    compactMode: false,
    reduceMotion: false,
    largeText: false,
    highContrast: false,
    language: "en",
    notifications: {
      traffic: true,
      weather: true,
      events: true,
      transit: true,
      emergency: true
    }
  };

  // Get current settings
  window.getLagosSettings = function () {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  };

  // Save settings
  window.saveLagosSettings = function (newSettings) {
    try {
      const current = window.getLagosSettings();
      const merged = { ...current, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      window.applySharedSettings();
      window.dispatchEvent(new CustomEvent("lagosLiveSettingsChanged", { detail: merged }));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  // Apply settings to document.body
  window.applySharedSettings = function () {
    const s = window.getLagosSettings();
    const body = document.body;
    if (!body) return;

    body.classList.remove("light-theme", "large-text", "compact", "high-contrast", "reduce-motion");

    let isLight = s.theme === "light";
    if (s.theme === "system" && window.matchMedia) {
      isLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    }

    if (isLight) body.classList.add("light-theme");
    if (s.largeText) body.classList.add("large-text");
    if (s.compactMode) body.classList.add("compact");
    if (s.highContrast) body.classList.add("high-contrast");
    if (s.reduceMotion) body.classList.add("reduce-motion");
  };

  // Live Lagos Time Clock
  window.updateLagosClock = function () {
    const now = new Date();
    const hour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Lagos",
        hour: "2-digit",
        hourCycle: "h23"
      }).format(now)
    );

    const s = window.getLagosSettings();
    const lang = s.language || "en";

    let greeting = "";
    if (lang === "yo") {
      greeting = hour >= 5 && hour < 12 ? "E kaaro" : hour >= 12 && hour < 17 ? "E kaasan" : "E kaale";
    } else if (lang === "pidgin") {
      greeting = hour >= 5 && hour < 12 ? "Good morning o" : hour >= 12 && hour < 17 ? "How afternoon dey" : "Good evening brethren";
    } else {
      greeting = hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 17 ? "Good afternoon" : hour >= 17 && hour < 21 ? "Good evening" : "Good night";
    }

    const timeString = new Intl.DateTimeFormat("en-NG", {
      timeZone: "Africa/Lagos",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).format(now);

    const greetingElements = document.querySelectorAll("#greeting, #liveGreeting, #timeGreeting");
    greetingElements.forEach(el => {
      el.textContent = greeting + " 👋";
    });

    const clockElements = document.querySelectorAll("#clock, #liveClock, #lagosLiveClock");
    clockElements.forEach(el => {
      el.textContent = timeString;
    });
  };

  // Sync user profile across all pages
  window.syncUserProfile = function () {
    let user = null;
    try {
      const u1 = localStorage.getItem(USER_KEY);
      const u2 = localStorage.getItem(PROFILE_KEY);
      user = u1 ? JSON.parse(u1) : (u2 ? JSON.parse(u2) : null);
    } catch {
      user = null;
    }

    const name = user?.name || user?.fullName || user?.displayName || "Lagosian";
    const email = user?.email || "";
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "LL";

    document.querySelectorAll(".profile-btn, .user-avatar, #profileBtn, .user-badge").forEach(el => {
      if (el.tagName.toLowerCase() === "button" || el.classList.contains("profile-btn")) {
        el.textContent = initials;
        el.title = `${name} (${email || "Logged in"})`;
      }
    });

    document.querySelectorAll(".user-name, [data-user-name]").forEach(el => {
      el.textContent = name;
    });
  };

  // Unified Bookmarks System
  window.getBookmarks = function () {
    try {
      const raw = localStorage.getItem(BOOKMARKS_KEY) || localStorage.getItem(SAVED_KEY) || "[]";
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  window.saveBookmarks = function (items) {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(items));
      localStorage.setItem(SAVED_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent("lagosLiveBookmarksChanged", { detail: items }));
    } catch (e) {
      console.error("Failed to save bookmarks:", e);
    }
  };

  window.toggleBookmark = function (item) {
    let items = window.getBookmarks();
    const idx = items.findIndex(x => x.id === item.id || (x.name === item.name && x.type === item.type));
    let added = false;
    if (idx >= 0) {
      items.splice(idx, 1);
      added = false;
    } else {
      items.unshift({
        ...item,
        savedAt: Date.now()
      });
      added = true;
    }
    window.saveBookmarks(items);
    window.showToast(
      added ? "Saved to Bookmarks" : "Removed from Bookmarks",
      added ? `"${item.title || item.name}" is now in your Saved collection.` : `"${item.title || item.name}" was removed.`,
      added ? "success" : "info"
    );
    return added;
  };

  window.isBookmarked = function (idOrName) {
    const items = window.getBookmarks();
    return items.some(x => x.id === idOrName || x.name === idOrName);
  };

  // Toast notifications
  window.showToast = function (title, message, type = "success") {
    let toast = document.getElementById("lagosToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "lagosToast";
      toast.className = "lagos-toast";
      document.body.appendChild(toast);
    }

    const icons = {
      success: "fa-solid fa-circle-check",
      error: "fa-solid fa-circle-exclamation",
      warning: "fa-solid fa-triangle-exclamation",
      info: "fa-solid fa-circle-info"
    };

    const colors = {
      success: "#20d99b",
      error: "#ff6078",
      warning: "#ffc857",
      info: "#00bfff"
    };

    toast.innerHTML = `
      <div class="toast-inner" style="border-left: 4px solid ${colors[type] || colors.info}">
        <i class="${icons[type] || icons.info}" style="color: ${colors[type] || colors.info}"></i>
        <div>
          <h4>${title}</h4>
          <p>${message}</p>
        </div>
      </div>
    `;

    toast.classList.add("visible");
    clearTimeout(window._lagosToastTimer);
    window._lagosToastTimer = setTimeout(() => {
      toast.classList.remove("visible");
    }, 3800);
  };

  // Mobile drawer setup
  window.initMobileNavigation = function () {
    const menuBtn = document.getElementById("mobileMenu");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    if (menuBtn && sidebar) {
      menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        if (overlay) overlay.classList.toggle("active");
      });
    }

    if (overlay && sidebar) {
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
      });
    }
  };

  // Initial runs
  document.addEventListener("DOMContentLoaded", () => {
    window.applySharedSettings();
    window.updateLagosClock();
    setInterval(window.updateLagosClock, 1000);
    window.syncUserProfile();
    window.initMobileNavigation();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === SETTINGS_KEY) window.applySharedSettings();
    if (e.key === USER_KEY || e.key === PROFILE_KEY) window.syncUserProfile();
  });

  window.addEventListener("lagosLiveSettingsChanged", window.applySharedSettings);
})();
