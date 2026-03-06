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
  const workModeEnabled = JSON.parse(localStorage.getItem("workModeEnabled") || "false");
  
  if (workModeToggle) {
    workModeToggle.checked = workModeEnabled;
  }
  if (workModeStatusText) {
    workModeStatusText.textContent = workModeEnabled ? "ON" : "OFF";
    workModeStatusText.classList.toggle("active", workModeEnabled);
  }

  // Toggle status text when switch changes
  if (workModeToggle) {
    workModeToggle.addEventListener("change", function() {
      const isEnabled = this.checked;
      if (workModeStatusText) {
        workModeStatusText.textContent = isEnabled ? "ON" : "OFF";
        workModeStatusText.classList.toggle("active", isEnabled);
      }
    });
  }

  // Load saved work hours config
  const workHoursConfig = getWorkHoursConfig();
  
  // Set work hours form values
  const startTimeInput = document.getElementById("workmode-start-time");
  const endTimeInput = document.getElementById("workmode-end-time");
  if (startTimeInput) startTimeInput.value = workHoursConfig.startTime;
  if (endTimeInput) endTimeInput.value = workHoursConfig.endTime;
  
  // Set workday checkboxes
  const dayCheckboxes = {
    "workmode-mon": workHoursConfig.days.mon,
    "workmode-tue": workHoursConfig.days.tue,
    "workmode-wed": workHoursConfig.days.wed,
    "workmode-thu": workHoursConfig.days.thu,
    "workmode-fri": workHoursConfig.days.fri,
    "workmode-sat": workHoursConfig.days.sat,
    "workmode-sun": workHoursConfig.days.sun
  };
  
  Object.keys(dayCheckboxes).forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) checkbox.checked = dayCheckboxes[id];
  });

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

  modal.classList.add("active");

  document.getElementById("workmode-cancel").onclick = () => {
    modal.classList.remove("active");
  };

  document.getElementById("workmode-form").onsubmit = (e) => {
    e.preventDefault();
    
    // Save work mode enabled state from toggle
    const workModeToggle = document.getElementById("workmode-enabled-toggle");
    if (workModeToggle) {
      localStorage.setItem("workModeEnabled", workModeToggle.checked);
    }
    
    // Save work hours config
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
    
    // Save selected folders
    const checked = allFolderCheckboxes()
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
    localStorage.setItem("workModeFolders", JSON.stringify(checked));
    
    modal.classList.remove("active");
    if (typeof applyWorkModeFilter === "function") applyWorkModeFilter();
    if (typeof autoApplyWorkMode === "function") autoApplyWorkMode();
  };
}
