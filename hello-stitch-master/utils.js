// Utility functions
const trunc = (text, maxLen) => {
  const s = String(text ?? "");
  const max = typeof maxLen === "number" ? maxLen : 50;
  if (s.length <= max) return s;
  if (max <= 1) return "…";
  return s.substring(0, max - 1) + "…";
};

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string safe for innerHTML
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

/**
 * Safely parse JSON from localStorage with fallback
 * @param {string} key - localStorage key
 * @param {any} fallback - Default value if parse fails
 * @returns {any} - Parsed value or fallback
 */
function safeLocalStorageGet(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Failed to parse localStorage key "${key}":`, e);
    return fallback;
  }
}

function normalizeUrl(url) {
  try {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  } catch (e) {
    return url;
  }
}

// Clean URL for display - shows domain + path, removes tracking parameters
function cleanUrlForDisplay(url) {
  try {
    const urlObj = new URL(url);
    let cleanPath = urlObj.pathname;
    let cleanUrl = urlObj.hostname + (cleanPath === "/" ? "" : cleanPath);
    
    // Extended tracking parameters list including SharePoint/OneDrive and other common services
    const trackingParams = [
      // Standard marketing tracking
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 
      'fbclid', 'gclid', 'ref', 'source', 'mc_cid', 'mc_eid', 
      'vero_id', 'vero_conv', '_ga', '_gl', 'yclid',
      // SharePoint/OneDrive specific parameters
      'CT', 'OR', 'CID', 'e', 'sharingv2', 'fromShare', 'at', 'FolderCTID', 
      'id', 'parent', 'xsdata', 'sdata', 'ovuser', 'clickparams',
      // Microsoft/O365 parameters
      'wt', 'mc', '暗', 'nobacking', 'noresize', 'navpanes', 'web',
      // Additional common tracking
      'tid', 'ss', 'mkt', 'form', 'mbid', 'trk', 'trkCampaign', 's_kwcid',
      'msclkid', 'zanpid', '_hsenc', '_hsmi', 'hsCtaTracking',
      // Social media tracking
      'twclid', 'igshid', 'linkedin_oid', 'li_fat_id',
      // Email tracking
      'email', 'recipientid', 'campaignid', 'userid'
    ];
    
    const searchParams = new URLSearchParams(urlObj.search);
    trackingParams.forEach(param => searchParams.delete(param));
    
    // Only add query string if there are non-tracking params
    const remainingParams = searchParams.toString();
    if (remainingParams) {
      cleanUrl += "?" + remainingParams;
    }
    
    // Truncate if too long (max 60 characters for display)
    const maxLen = 60;
    if (cleanUrl.length > maxLen) {
      // Find the last meaningful separator to cut at
      const truncPoint = cleanUrl.lastIndexOf('/', cleanUrl.length - 20);
      if (truncPoint > 0 && truncPoint > cleanUrl.length - maxLen) {
        cleanUrl = cleanUrl.substring(0, truncPoint) + "…";
      } else {
        cleanUrl = cleanUrl.substring(0, maxLen - 1) + "…";
      }
    }
    
    return cleanUrl;
  } catch (e) {
    // Fallback to simple normalization
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (e) {
    return "";
  }
}

function getFolderIcon(folderTitle) {
  const title = String(folderTitle || "").toLowerCase();
  let icon = "📁";
  let color = "#ff9900";

  if (title.includes("work") || title.includes("job")) {
    icon = "💼";
    color = "#4caf50";
  } else if (title.includes("social") || title.includes("facebook") || title.includes("twitter") || title.includes("instagram")) {
    icon = "👥";
    color = "#2196f3";
  } else if (title.includes("video") || title.includes("youtube") || title.includes("twitch")) {
    icon = "🎬";
    color = "#f44336";
  } else if (title.includes("music") || title.includes("spotify") || title.includes("sound")) {
    icon = "🎵";
    color = "#e91e63";
  } else if (title.includes("dev") || title.includes("code") || title.includes("github") || title.includes("stack")) {
    icon = "💻";
    color = "#00bcd4";
  } else if (title.includes("news") || title.includes("blog") || title.includes("rss")) {
    icon = "📰";
    color = "#ff9800";
  } else if (title.includes("shop") || title.includes("store") || title.includes("amazon")) {
    icon = "🛒";
    color = "#ff5722";
  } else if (title.includes("learn") || title.includes("edu") || title.includes("course")) {
    icon = "📚";
    color = "#9c27b0";
  } else if (title.includes("game") || title.includes("play") || title.includes("steam")) {
    icon = "🎮";
    color = "#673ab7";
  } else if (title.includes("travel") || title.includes("map") || title.includes("flight")) {
    icon = "✈️";
    color = "#03a9f4";
  } else if (title.includes("food") || title.includes("recipe") || title.includes("restaurant")) {
    icon = "🍕";
    color = "#ff5722";
  } else if (title.includes("finance") || title.includes("bank") || title.includes("money")) {
    icon = "💰";
    color = "#4caf50";
  } else if (title.includes("health") || title.includes("fitness") || title.includes("medical")) {
    icon = "🏥";
    color = "#f44336";
  } else if (title.includes("art") || title.includes("design") || title.includes("photo")) {
    icon = "🎨";
    color = "#e91e63";
  } else if (title.includes("tool") || title.includes("util") || title.includes("helper")) {
    icon = "🔧";
    color = "#607d8b";
  } else if (title.includes("important") || title.includes("urgent") || title.includes("priority")) {
    icon = "⭐";
    color = "#ffc107";
  } else if (title.includes("archive") || title.includes("old") || title.includes("backup")) {
    icon = "📦";
    color = "#795548";
  } else if (title.includes("temp") || title.includes("tmp") || title.includes("scratch")) {
    icon = "🗑️";
    color = "#9e9e9e";
  }

  return { icon: icon, color: color };
}

function getBookmarkAge(dateAdded) {
  try {
    if (!dateAdded) return null;
    const now = Date.now();
    const diffMs = now - dateAdded;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    let label = "";
    let className = "";
    let title = "";

    if (diffSeconds < 60) {
      label = "Just now";
      className = "new";
      title = "Added less than a minute ago";
    } else if (diffMinutes < 60) {
      label = diffMinutes + "m";
      className = "new";
      title = "Added " + diffMinutes + " minute(s) ago";
    } else if (diffHours < 24) {
      label = diffHours + "h";
      className = "new";
      title = "Added " + diffHours + " hour(s) ago";
    } else if (diffDays < 7) {
      label = diffDays + "d";
      className = "recent";
      title = "Added " + diffDays + " day(s) ago";
    } else if (diffWeeks < 4) {
      label = diffWeeks + "w";
      className = "recent";
      title = "Added " + diffWeeks + " week(s) ago";
    } else if (diffMonths < 12) {
      label = diffMonths + "mo";
      className = "recent";
      title = "Added " + diffMonths + " month(s) ago";
    } else {
      label = diffYears + "y";
      className = "old";
      title = "Added " + diffYears + " year(s) ago";
    }

    return { label: label, className: className, title: title };
  } catch (e) {
    return null;
  }
}

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function escapeRegExp(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeAccents(str) {
  try {
    return String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (e) {
    return String(str || "");
  }
}

function getUSHolidays(year) {
  const holidays = [
    new Date(year, 0, 1),
    new Date(year, 6, 4),
    new Date(year, 10, 11),
    new Date(year, 11, 25),
  ];

  function nthWeekdayOfMonth(n, weekday, month) {
    const first = new Date(year, month, 1);
    let day = 1 + ((7 + weekday - first.getDay()) % 7) + (n - 1) * 7;
    return new Date(year, month, day);
  }
  function lastWeekdayOfMonth(weekday, month) {
    const last = new Date(year, month + 1, 0);
    let day = last.getDate() - ((7 + last.getDay() - weekday) % 7);
    return new Date(year, month, day);
  }

  holidays.push(nthWeekdayOfMonth(3, 1, 0));
  holidays.push(nthWeekdayOfMonth(3, 1, 1));
  holidays.push(lastWeekdayOfMonth(1, 4));
  holidays.push(nthWeekdayOfMonth(1, 1, 8));
  holidays.push(nthWeekdayOfMonth(2, 1, 9));
  holidays.push(nthWeekdayOfMonth(4, 4, 10));

  return holidays.map((date) => {
    if (date.getDay() === 0) {
      date.setDate(date.getDate() + 1);
    } else if (date.getDay() === 6) {
      date.setDate(date.getDate() - 1);
    }
    return date;
  });
}

function isUSHoliday(date) {
  const year = date.getFullYear();
  const holidays = getUSHolidays(year);
  return holidays.some(
    (holiday) =>
      holiday.getFullYear() === date.getFullYear() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getDate() === date.getDate()
  );
}

function isUSWorkdayEST() {
  const now = new Date();
  const estNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = estNow.getDay();
  if (day === 0 || day === 6) return false;
  if (isUSHoliday(estNow)) return false;
  return true;
}

function isESTJobsTimeAndWorkday() {
  const now = new Date();
  const estNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const hours = estNow.getHours();
  return hours >= 8 && hours < 16 && isUSWorkdayEST();
}

function isWithinWorkHours() {
  // Get saved work hours config from localStorage using safe parsing
  const config = safeLocalStorageGet("workHoursConfig", null);
  
  // Default work hours: Mon-Fri 8:00 AM - 4:00 PM EST
  const defaultConfig = {
    startTime: "08:00",
    endTime: "16:00",
    days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false }
  };
  
  const workConfig = config || defaultConfig;
  
  const now = new Date();
  const estNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  
  // Get current day (0 = Sunday, 1 = Monday, etc.)
  const currentDay = estNow.getDay();
  const dayMap = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };
  const currentDayKey = dayMap[currentDay];
  
  // Check if today is a work day
  if (!workConfig.days[currentDayKey]) {
    return false;
  }
  
  // Parse start and end times
  const [startHour, startMin] = workConfig.startTime.split(":").map(Number);
  const [endHour, endMin] = workConfig.endTime.split(":").map(Number);
  
  const currentHour = estNow.getHours();
  const currentMin = estNow.getMinutes();
  
  const currentTime = currentHour * 60 + currentMin;
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  // Check if current time is within work hours
  return currentTime >= startTime && currentTime < endTime;
}

function getWorkHoursConfig() {
  return safeLocalStorageGet("workHoursConfig", {
    startTime: "08:00",
    endTime: "16:00",
    days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false }
  });
}

function showWorkModeModal(columns) {
  const modal = document.getElementById("workmode-modal");
  const folderList = document.getElementById("workmode-folder-list");
  if (!modal || !folderList || !columns) return;
  folderList.innerHTML = "";

  // Initialize the toggle with current work mode state
  const workModeToggle = document.getElementById("workmode-enabled-toggle");
  const workModeStatusText = document.getElementById("workmode-status-text");
  const startTimeInput = document.getElementById("workmode-start-time");
  const endTimeInput = document.getElementById("workmode-end-time");
  const dayCheckboxIds = [
    "workmode-mon",
    "workmode-tue",
    "workmode-wed",
    "workmode-thu",
    "workmode-fri",
    "workmode-sat",
    "workmode-sun"
  ];
  const workModeEnabled = JSON.parse(localStorage.getItem("workModeEnabled") || "false");
  const workHoursConfig = getWorkHoursConfig();
  const sections = Array.from(modal.querySelectorAll(".workmode-section"));

  function getDayCheckboxes() {
    return dayCheckboxIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
  }

  function getFolderCheckboxes() {
    return Array.from(
      folderList.querySelectorAll('input[type="checkbox"]:not(#workmode-select-all)')
    );
  }

  function setWorkModeEnabledState(enabled) {
    if (workModeToggle) workModeToggle.checked = enabled;
    if (workModeStatusText) {
      workModeStatusText.textContent = enabled ? "ON" : "OFF";
      workModeStatusText.classList.toggle("active", enabled);
    }

    sections.forEach((section) => {
      section.style.display = enabled ? "" : "none";
    });

    const controls = [startTimeInput, endTimeInput, ...getDayCheckboxes(), document.getElementById("workmode-select-all")];
    controls.filter(Boolean).forEach((control) => {
      control.disabled = !enabled;
    });
    getFolderCheckboxes().forEach((checkbox) => {
      checkbox.disabled = !enabled;
    });
  }

  function resetWorkModeForm() {
    const defaultConfig = getWorkHoursConfig();
    if (startTimeInput) startTimeInput.value = defaultConfig.startTime;
    if (endTimeInput) endTimeInput.value = defaultConfig.endTime;
    getDayCheckboxes().forEach((checkbox) => {
      checkbox.checked = defaultConfig.days[checkbox.id.replace("workmode-", "")];
    });
    getFolderCheckboxes().forEach((checkbox) => {
      checkbox.checked = false;
    });
    const selectAllCheckbox = document.getElementById("workmode-select-all");
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    }
  }

  setWorkModeEnabledState(workModeEnabled);

  if (workModeToggle) {
    workModeToggle.onchange = function () {
      const enabled = this.checked;
      if (enabled) {
        resetWorkModeForm();
      }
      setWorkModeEnabledState(enabled);
    };
  }

  // Load saved work hours config into the form when work mode is on
  if (workModeEnabled) {
    if (startTimeInput) startTimeInput.value = workHoursConfig.startTime;
    if (endTimeInput) endTimeInput.value = workHoursConfig.endTime;
    getDayCheckboxes().forEach((checkbox) => {
      checkbox.checked = workHoursConfig.days[checkbox.id.replace("workmode-", "")];
    });
  }

  const allFolders = [];
  columns.forEach((col) => {
    if (col.title !== "/") {
      allFolders.push({ title: col.title, path: col.title });
    }
    col.children.forEach((bm) => {
      if (bm.path && bm.path.length > 0) {
        const subPath = bm.path.join(" / ");
        if (!allFolders.some((f) => f.path === subPath)) {
          allFolders.push({
            title: bm.path[bm.path.length - 1],
            path: subPath,
          });
        }
      }
    });
  });

  const uniqueFolders = Array.from(
    new Set(allFolders.map((f) => f.path))
  ).map((path) => allFolders.find((f) => f.path === path));

  const saved = JSON.parse(localStorage.getItem("workModeFolders") || "[]");

  const selectAllLabel = document.createElement("label");
  selectAllLabel.style.display = "flex";
  selectAllLabel.style.alignItems = "center";
  selectAllLabel.style.gap = "0.5em";
  selectAllLabel.style.fontWeight = "bold";
  const selectAllCheckbox = document.createElement("input");
  selectAllCheckbox.type = "checkbox";
  selectAllCheckbox.id = "workmode-select-all";
  selectAllLabel.appendChild(selectAllCheckbox);
  selectAllLabel.appendChild(document.createTextNode("Select All"));
  folderList.appendChild(selectAllLabel);

  uniqueFolders.forEach((folder) => {
    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.gap = "0.5em";
    label.style.paddingLeft = "0";
    
    // Calculate depth based on path separators
    const depth = folder.path.split(" / ").length - 1;
    const indentPx = depth * 20;
    label.style.paddingLeft = indentPx + "px";
    
    // Add visual hierarchy indicator
    const indicator = document.createElement("span");
    indicator.style.marginRight = "0.3em";
    indicator.style.color = "#888";
    indicator.style.fontSize = "0.9em";
    
    if (depth === 0) {
      indicator.textContent = "📁"; // Root folder
    } else {
      // Add arrow indicators for nested folders
      indicator.textContent = "├──".slice(0, 2 * depth) + "📁";
      indicator.style.fontSize = "0.8em";
    }
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = folder.path;
    if (saved.includes(folder.path)) checkbox.checked = true;
    
    label.appendChild(indicator);
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(folder.path));
    folderList.appendChild(label);
  });

  const allFolderCheckboxes = () =>
    Array.from(
      folderList.querySelectorAll(
        'input[type="checkbox"]:not(#workmode-select-all)'
      )
    );

  function updateSelectAllState() {
    const boxes = allFolderCheckboxes();
    selectAllCheckbox.checked = boxes.every((cb) => cb.checked);
    selectAllCheckbox.indeterminate =
      !selectAllCheckbox.checked && boxes.some((cb) => cb.checked);
  }
  updateSelectAllState();

  selectAllCheckbox.addEventListener("change", () => {
    allFolderCheckboxes().forEach((cb) => {
      cb.checked = selectAllCheckbox.checked;
    });
  });

  folderList.addEventListener("change", (e) => {
    if (e.target !== selectAllCheckbox) updateSelectAllState();
  });

  // Ensure folder checkboxes respect the current enabled state after they are created
  setWorkModeEnabledState(workModeEnabled);

  modal.classList.add("active");

  document.getElementById("workmode-cancel").onclick = () => {
    modal.classList.remove("active");
  };

  document.getElementById("workmode-form").onsubmit = (e) => {
    e.preventDefault();
    
    const workModeToggleEl = document.getElementById("workmode-enabled-toggle");
    const enabled = workModeToggleEl ? workModeToggleEl.checked : false;
    localStorage.setItem("workModeEnabled", enabled);

    if (enabled) {
      const newStartTime = document.getElementById("workmode-start-time").value;
      const newEndTime = document.getElementById("workmode-end-time").value;
      const newWorkHoursConfig = {
        startTime: newStartTime,
        endTime: newEndTime,
        days: {
          mon: document.getElementById("workmode-mon").checked,
          tue: document.getElementById("workmode-tue").checked,
          wed: document.getElementById("workmode-wed").checked,
          thu: document.getElementById("workmode-thu").checked,
          fri: document.getElementById("workmode-fri").checked,
          sat: document.getElementById("workmode-sat").checked,
          sun: document.getElementById("workmode-sun").checked
        }
      };
      localStorage.setItem("workHoursConfig", JSON.stringify(newWorkHoursConfig));

      const checked = allFolderCheckboxes()
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);
      localStorage.setItem("workModeFolders", JSON.stringify(checked));
    } else {
      localStorage.setItem("workModeFolders", JSON.stringify([]));
      localStorage.setItem("workHoursConfig", JSON.stringify(getWorkHoursConfig()));
    }
    
    modal.classList.remove("active");
    if (typeof applyWorkModeFilter === "function") applyWorkModeFilter();
    if (typeof autoApplyWorkMode === "function") autoApplyWorkMode();
  };
}
