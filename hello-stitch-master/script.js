const columns = [];
let currentColumns = columns;
let bookmarksLoaded = false; // Flag to prevent rendering before bookmarks are loaded
const selectedBookmarks = new Set();
window.selectedBookmarks = selectedBookmarks;
let bookmarkVisitCounts = {};
const SORT_PREFERENCE_KEY = "bookmarkSortPreference";
const PINS_KEY = "pinnedBookmarks";
const TAGS_KEY = "bookmarkTags";
const FONT_SIZE_KEY = "selectedFontSize";
const pinnedSet = new Set(JSON.parse(localStorage.getItem(PINS_KEY) || "[]"));
let isShowingPins = false;
const tagsByUrl = JSON.parse(localStorage.getItem(TAGS_KEY) || "{}");
window.tagsByUrl = tagsByUrl;

// ============================================
// AI Tagging System - Enhanced Categories
// ============================================

// Define category patterns for AI-like tagging
const TAG_CATEGORIES = {
  // Development & Tech
  development: {
    keywords: ['github', 'gitlab', 'stackoverflow', 'dev.to', 'codepen', 'jsfiddle', 'replit', 'vscode', 'npm', 'yarn', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify', 'digitalocean', 'linode', 'cloudflare', 'vite', 'webpack', 'babel', 'eslint', 'prettier', 'chrome', 'firefox', 'safari', 'browser', 'api', 'rest', 'graphql', 'json', 'xml', 'html', 'css', 'javascript', 'typescript', 'python', 'java', 'rust', 'go', 'ruby', 'php', 'c++', 'c#', 'react', 'vue', 'angular', 'svelte', 'node', 'deno', 'django', 'flask', 'spring', 'rails', 'laravel', 'symfony', 'wordpress', 'shopify', 'magento', 'presta', 'wix', 'squarespace', 'webflow', 'framer', 'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'indesign', 'xd', 'zeplin', 'invision', 'marvel', 'proto', 'miro', 'whimsical', 'excalidraw', 'draw.io', 'diagrams', 'uml', 'agile', 'scrum', 'jira', 'confluence', 'notion', 'asana', 'trello', 'monday', 'clickup', 'slack', 'discord', 'zoom', 'teams', 'meet', 'google docs', 'dropbox', 'onedrive', 'icloud', 'box', 'drive', 's3', 'storage', 'database', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'kafka', 'rabbitmq', 'nginx', 'apache', 'caddy', 'traefik', 'linux', 'unix', 'macos', 'windows', 'bash', 'shell', 'powershell', 'git', 'svn', 'mercurial', 'bitbucket', 'sourceforge', 'launchpad'],
    domains: ['github.com', 'gitlab.com', 'stackoverflow.com', 'dev.to', 'codepen.io', 'jsfiddle.net', 'replit.com', 'codesandbox.io', 'glitch.com', 'stackblitz.io', 'playcode.io', 'jsbin.com', 'html5', 'w3schools', 'mdn', 'mozilla.org', 'nodejs.org', 'npmjs.com', 'yarnpkg.com', 'docker.com', 'kubernetes.io', 'aws.amazon.com', 'azure.microsoft.com', 'cloud.google.com', 'heroku.com', 'vercel.com', 'netlify.com', 'digitalocean.com', 'linode.com', 'cloudflare.com']
  },
  
  // Video & Streaming
  video: {
    keywords: ['youtube', 'vimeo', 'twitch', 'netflix', 'hulu', 'disney', 'hbomax', 'prime', 'paramount', 'peacock', 'crunchyroll', 'funimation', 'anime', 'movie', 'film', 'series', 'stream', 'watch', 'video', 'tutorial', 'course', 'lecture', 'podcast', 'stream'],
    domains: ['youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv', 'netflix.com', 'hulu.com', 'disneyplus.com', 'hbomax.com', 'primevideo.com', 'paramountplus.com', 'peacocktv.com', 'crunchyroll.com', 'funimation.com', 'anime', 'dailymotion.com', 'metacafe.com', 'vevo.com', 'mubi.com']
  },
  
  // Social Media
  social: {
    keywords: ['twitter', 'x.com', 'facebook', 'instagram', 'reddit', 'linkedin', 'tiktok', 'snapchat', 'pinterest', 'tumblr', 'whatsapp', 'telegram', 'signal', 'messenger', 'wechat', 'viber', 'line', 'discord', 'slack', 'clubhouse', 'mastodon', 'threads', 'beereal', 'nextdoor', 'quora', 'medium', 'substack', 'patreon', 'ko-fi', 'buymeacoffee', 'gumroad', 'boosty'],
    domains: ['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'reddit.com', 'linkedin.com', 'tiktok.com', 'snapchat.com', 'pinterest.com', 'tumblr.com', 'whatsapp.com', 'telegram.org', 'signal.org', 'messenger.com', 'wechat.com', 'discord.com', 'slack.com', 'clubhouse.com', 'mastodon.social', 'threads.net', 'quora.com', 'medium.com', 'substack.com', 'patreon.com']
  },
  
  // News & Media
  news: {
    keywords: ['news', 'bbc', 'cnn', 'nytimes', 'reuters', 'huffpost', 'guardian', 'washingtonpost', 'wsj', 'bloomberg', 'forbes', 'fortune', 'economist', 'time', 'newsweek', 'usatoday', 'nypost', 'latimes', 'abc', 'cbs', 'nbc', 'fox', 'msnbc', 'ap', 'afp', 'reuters', 'guardian', 'telegraph', 'independent', 'daily', 'journal', 'report', 'breitbart', 'dailywire', 'vox', 'buzzfeed', 'vice', 'huffpost', 'upworthy', 'boredpanda', 'listverse', 'cracked', 'theonion', 'clickhole'],
    domains: ['bbc.com', 'cnn.com', 'nytimes.com', 'reuters.com', 'huffpost.com', 'theguardian.com', 'washingtonpost.com', 'wsj.com', 'bloomberg.com', 'forbes.com', 'fortune.com', 'economist.com', 'time.com', 'newsweek.com', 'usatoday.com', 'nypost.com', 'latimes.com', 'abcnews.go.com', 'cbsnews.com', 'nbcnews.com', 'foxnews.com', 'msnbc.com', 'apnews.com', 'afp.com']
  },
  
  // Shopping & E-commerce
  shopping: {
    keywords: ['amazon', 'ebay', 'etsy', 'walmart', 'target', 'costco', 'bestbuy', 'home depot', 'lowes', 'ikea', 'wayfair', 'overstock', 'newegg', 'adorama', 'bhphotovideo', 'newegg', 'tigerdirect', 'monoprice', 'aliexpress', 'wish', 'wish.com', 'temu', 'shein', 'fashion', 'clothing', 'shoes', 'jewelry', 'watch', 'electronics', 'gadget', 'sale', 'deal', 'coupon', 'discount'],
    domains: ['amazon.com', 'ebay.com', 'etsy.com', 'walmart.com', 'target.com', 'costco.com', 'bestbuy.com', 'homedepot.com', 'lowes.com', 'ikea.com', 'wayfair.com', 'overstock.com', 'newegg.com', 'adorama.com', 'bhphotovideo.com', 'tigerdirect.com', 'monoprice.com', 'aliexpress.com', 'wish.com', 'temu.com', 'shein.com', 'shopify.com', 'magento.com']
  },
  
  // Productivity & Work
  productivity: {
    keywords: ['notion', 'asana', 'trello', 'monday', 'clickup', 'todoist', 'any.do', 'ticktick', 'google keep', 'evernote', 'onenote', 'bear', 'obsidian', 'roam', 'logseq', 'craft', ' Ulysses', 'ia writer', 'markdown', 'note', 'notes', 'task', 'tasks', 'project', 'kanban', 'gantt', 'calendar', 'calendly', '日程', 'schedule', 'reminder', 'pomodoro', 'focus', 'timer'],
    domains: ['notion.so', 'asana.com', 'trello.com', 'monday.com', 'clickup.com', 'todoist.com', 'any.do', 'ticktick.com', 'keep.google.com', 'evernote.com', 'onenote.com', 'bear.app', 'obsidian.md', 'roamresearch.com', 'logseq.com', 'craft.do', 'ulysses.app', 'iawriter.com', 'calendly.com', 'calendar.google.com', 'outlook.live.com']
  },
  
  // Finance & Crypto
  finance: {
    keywords: ['bank', 'banking', 'crypto', 'bitcoin', 'ethereum', 'btc', 'eth', 'coinbase', 'binance', 'kraken', 'webull', 'robinhood', 'fidelity', 'schwab', 'vanguard', 'etrade', ' Interactive Brokers', 'td', 'ameritrade', 'stocks', 'trading', 'investing', 'portfolio', 'finance', 'money', 'paypal', 'venmo', 'cashapp', 'zelle', 'wise', 'revolut', 'square', 'stripe', 'plaid', 'mint', 'ynab', 'personal capital', 'credit', 'loan', 'mortgage', 'insurance'],
    domains: ['coinbase.com', 'binance.com', 'kraken.com', 'webull.com', 'robinhood.com', 'fidelity.com', 'schwab.com', 'vanguard.com', 'etrade.com', 'tdameritrade.com', 'paypal.com', 'venmo.com', 'cash.app', 'wise.com', 'revolut.com', 'stripe.com', 'plaid.com', 'mint.com', 'ynab.com', 'personalcapital.com']
  },
  
  // Learning & Education
  learning: {
    keywords: ['course', 'learn', 'tutorial', 'education', 'coursera', 'udemy', 'skillshare', 'khanacademy', 'edx', 'udacity', 'pluralsight', 'lynda', 'linkedin learning', 'codecademy', 'datacamp', 'treehouse', 'freecodecamp', 'w3schools', 'tutorial', 'guide', 'how to', 'learn', 'teach', 'study', 'exam', 'test', 'quiz', 'certificate', 'degree', 'university', 'college', 'school', 'bootcamp', 'training'],
    domains: ['coursera.org', 'udemy.com', 'skillshare.com', 'khanacademy.org', 'edx.org', 'udacity.com', 'pluralsight.com', 'lynda.com', 'linkedin.com/learning', 'codecademy.com', 'datacamp.com', 'teamtreehouse.com', 'freecodecamp.org', 'w3schools.com', 'tutorialspoint.com', 'geeksforgeeks.org', 'leetcode.com', 'hackerrank.com', 'codewars.com', 'exercism.io', 'kaggle.com']
  },
  
  // Music & Audio
  music: {
    keywords: ['spotify', 'soundcloud', 'apple music', 'bandcamp', 'youtube music', 'pandora', 'deezer', 'tidal', 'napster', 'music', 'song', 'album', 'artist', 'playlist', 'podcast', 'audio', 'mp3', 'flac', 'lossless', 'streaming', 'listen', 'lyrics', 'chords', 'tabs', 'guitar', 'piano'],
    domains: ['spotify.com', 'soundcloud.com', 'music.apple.com', 'bandcamp.com', 'music.youtube.com', 'pandora.com', 'deezer.com', 'tidal.com', 'napster.com', 'genius.com', 'azlyrics.com', 'lyricsfreak.com', 'songmeanings.com', 'musmatch.com', 'ultimate-guitar.com', 'musescore.com', 'noteflight.com']
  },
  
  // Gaming
  gaming: {
    keywords: ['steam', 'epic games', 'gog', 'origin', 'uplay', 'battle.net', 'xbox', 'playstation', 'nintendo', 'switch', 'ps4', 'ps5', 'xbox one', 'series x', 'game', 'gaming', 'esports', 'twitch', 'discord', 'roblox', 'minecraft', 'fortnite', 'valorant', 'league', 'lol', 'dota', 'csgo', 'cs2', 'overwatch', 'apex', 'pubg', 'genshin', 'gacha', 'indie', 'game jam'],
    domains: ['store.steampowered.com', 'epicgames.com', 'gog.com', 'origin.com', 'uplay.ubisoft.com', 'battle.net', 'xbox.com', 'playstation.com', 'nintendo.com', 'twitch.tv', 'discord.com', 'roblox.com', 'minecraft.net', 'fortnite.com', 'valorant.com', 'leagueoflegends.com', 'dota2.com', 'csgo.com', 'overwatch2.com', 'apexlegends.com', 'genshin.hoyoverse.com']
  },
  
  // Health & Fitness
  health: {
    keywords: ['health', 'fitness', 'workout', 'exercise', 'gym', 'yoga', 'meditation', 'mindfulness', 'nutrition', 'diet', 'weight', 'running', 'cycling', 'swimming', 'sports', 'medical', 'doctor', 'hospital', 'clinic', 'pharmacy', 'prescription', 'therapy', 'mental health', 'anxiety', 'depression', 'sleep', 'wellness', 'vitamins', 'supplements'],
    domains: ['myfitnesspal.com', 'strava.com', 'garmin.com', 'fitbit.com', 'whoop.com', 'apple.com/health', 'headspace.com', 'calm.com', ' Insight Timer', 'nutrition.gov', 'mayoclinic.org', 'webmd.com', 'healthline.com', 'medlineplus.gov', 'nih.gov', 'clevelandclinic.org']
  },
  
  // Food & Cooking
  food: {
    keywords: ['recipe', 'cooking', 'food', 'restaurant', 'menu', 'chef', 'baking', 'cake', 'bread', 'pizza', 'pasta', 'asian', 'mexican', 'italian', 'indian', 'thai', 'chinese', 'japanese', 'korean', 'vietnamese', 'french', 'greek', 'turkish', 'delicious', 'yummy', 'tasty', 'meal', 'dinner', 'lunch', 'breakfast', 'snack', 'dessert'],
    domains: ['allrecipes.com', 'foodnetwork.com', 'bonappetit.com', 'epicurious.com', 'serious eats.com', 'smittenkitchen.com', 'thepioneerwoman.com', 'bettycrocker.com', ' Pillsbury', 'marthastewart.com', 'jamieoliver.com', ' Gordon Ramsay', 'buzzfeed.com/tasty', 'tasty.co', 'yummly.com', 'cookpad.com', 'recipe.com', ' EatingWell', 'healthline.com/nutrition', 'nutrition.gov']
  },
  
  // Travel
  travel: {
    keywords: ['travel', 'trip', 'vacation', 'hotel', 'airbnb', 'booking', 'flight', 'airline', 'airport', 'rental', 'car', 'train', 'bus', 'cruise', 'resort', 'destination', 'tourist', 'attraction', 'museum', 'park', 'beach', 'mountain', 'adventure', 'explore', 'backpack', 'itinerary', 'passport', 'visa', 'map', 'gps'],
    domains: ['airbnb.com', 'booking.com', 'hotels.com', 'expedia.com', 'kayak.com', 'skyscanner.com', 'google.com/travel', 'tripadvisor.com', 'yelp.com', 'zomato.com', 'opentable.com', 'marriott.com', 'hilton.com', 'hyatt.com', 'airlines.com', 'delta.com', 'united.com', 'americanairlines.com', 'southwest.com', 'jetblue.com', 'britishairways.com', 'lufthansa.com', 'france.fr', 'japan.travel', 'visitscotland.com']
  },
  
  // Design & Creative
  design: {
    keywords: ['design', 'graphic', 'logo', 'branding', 'illustration', 'art', 'drawing', 'painting', 'photo', 'photography', 'edit', 'filter', 'template', 'poster', 'flyer', 'banner', 'icon', 'font', 'typography', 'color', 'palette', 'ui', 'ux', 'interface', 'wireframe', 'mockup', 'prototype', 'dribbble', 'behance', 'artstation', 'deviantart', '500px', 'unsplash', 'pexels', 'pixabay'],
    domains: ['dribbble.com', 'behance.net', 'artstation.com', 'deviantart.com', '500px.com', 'unsplash.com', 'pexels.com', 'pixabay.com', 'freepik.com', 'canva.com', 'adobe.com', 'figma.com', 'sketch.com', 'invisionapp.com', 'framer.com', 'webflow.com', 'squarespace.com', 'wix.com', 'webnode', 'weebly', 'webdesign']
  },
  
  // Email & Communication
  email: {
    keywords: ['email', 'gmail', 'outlook', 'yahoo', 'hotmail', 'mail', 'inbox', 'message', 'newsletter', 'subscribe', 'unsubscribe', 'spam', 'phishing', 'attachment', 'send', 'receive', 'forward', 'reply', 'cc', 'bcc', 'smtp', 'imap', 'pop3'],
    domains: ['gmail.com', 'outlook.com', 'live.com', 'hotmail.com', 'yahoo.com', 'protonmail.com', 'tutanota.com', 'zoho.com', 'mailchimp.com', 'buttondown.email', 'substack.com', 'mailerlite.com', 'sendinblue.com', 'getresponse.com', 'convertkit.com', 'activecampaign.com', 'drip.com', 'customer.io', 'iterable.com']
  },
  
  // Cloud & Storage
  cloud: {
    keywords: ['cloud', 'storage', 'drive', 'dropbox', 'onedrive', 'icloud', 'box', 'sync', 'backup', 'upload', 'download', 'file', 'folder', 'share', 'collaborate', 'team', 'business', 'enterprise', 'saas', 'hosting', 'server', 'vps', 'dedicated', 'shared', 'wordpress', 'cpanel', 'plesk'],
    domains: ['dropbox.com', 'drive.google.com', 'onedrive.live.com', 'icloud.com', 'box.com', 'sync.com', 'pcloud.com', 'tresorit.com', 'spideroak.com', 'backblaze.com', 'carbonite.com', 'IDrive', 'syncplicity', 'qnap.com', 'synology.com', 'westerndigital.com', 'seagate.com', 'wd.com']
  },
  
  // Security & Privacy
  security: {
    keywords: ['security', 'privacy', 'vpn', 'proxy', 'encryption', 'password', '2fa', 'mfa', 'authenticator', 'firewall', 'antivirus', 'malware', 'phishing', 'hack', 'breach', 'vulnerability', 'exploit', 'patch', 'update', 'secure', 'safe', 'privacy', 'anonymous', 'tor', 'browser', 'incognito', 'private'],
    domains: ['1password.com', 'lastpass.com', 'bitwarden.com', 'dashlane.com', 'nordpass.com', 'expressvpn.com', 'nordvpn.com', 'surfshark.com', 'cyberghostvpn.com', 'protonvpn.com', 'haveibeenpwned.com', 'twofactorauth.org', 'authy.com', 'duosecurity.com', 'okta.com', 'pingidentity.com', 'crowdstrike.com', 'sentinelone.com', 'malwarebytes.com', 'kaspersky.com', 'norton.com', 'mcafee.com', 'avg.com', 'avast.com']
  }
};

/**
 * Enhanced AI Tagging Function
 * Categorizes bookmarks based on domain and keywords
 * @param {Object} bm - Bookmark object with title and url properties
 * @returns {Array} - Array of AI-generated tags
 */
function autoTagBookmark(bm) {
  try {
    const tags = new Set();
    
    // Extract domain from URL
    let domain = '';
    let urlLower = '';
    try {
      const urlObj = new URL(bm.url);
      domain = urlObj.hostname.toLowerCase().replace(/^www\./, '');
      urlLower = bm.url.toLowerCase();
    } catch (e) {
      urlLower = bm.url.toLowerCase();
    }
    
    const titleLower = (bm.title || '').toLowerCase();
    const combinedText = titleLower + ' ' + urlLower;
    
    // Check each category for matches
    for (const [category, config] of Object.entries(TAG_CATEGORIES)) {
      // Check domain matches first (higher priority)
      if (config.domains) {
        for (const d of config.domains) {
          if (domain.includes(d.toLowerCase().replace(/^www\./, ''))) {
            tags.add(category);
            break;
          }
        }
      }
      
      // Check keyword matches
      if (config.keywords) {
        for (const keyword of config.keywords) {
          if (combinedText.includes(keyword.toLowerCase())) {
            tags.add(category);
            break;
          }
        }
      }
    }
    
    // Add some additional context tags based on URL patterns
    if (urlLower.includes('login') || urlLower.includes('signin') || urlLower.includes('auth')) {
      tags.add('login');
    }
    if (urlLower.includes('settings') || urlLower.includes('preferences') || urlLower.includes('config')) {
      tags.add('settings');
    }
    if (urlLower.includes('blog') || urlLower.includes('post') || urlLower.includes('article')) {
      tags.add('blog');
    }
    if (urlLower.includes('download') || urlLower.includes('install') || urlLower.includes('exe') || urlLower.includes('apk')) {
      tags.add('download');
    }
    if (urlLower.includes('forum') || urlLower.includes('community') || urlLower.includes('discussion')) {
      tags.add('forum');
    }
    
    // Convert set to array, limit to max 4 tags
    const tagArray = Array.from(tags).slice(0, 4);
    
    // Store tags
    tagsByUrl[bm.url] = tagArray;
    
    return tagArray;
  } catch (e) {
    console.error('Error auto-tagging bookmark:', e);
    return [];
  }
}

/**
 * Get all available AI tags/categories
 * @returns {Array} - Array of available tag names
 */
function getAvailableTags() {
  return Object.keys(TAG_CATEGORIES).concat(['login', 'settings', 'blog', 'download', 'forum']);
}

/**
 * Filter bookmarks by AI tag
 * @param {string} tag - Tag to filter by
 */
function filterByTag(tag) {
  isShowingPins = false;
  const normalizedTag = tag.toLowerCase();
  
  const filteredColumns = columns
    .map(function(col) {
      return {
        ...col,
        children: col.children.filter(function(bm) {
          const bmTags = tagsByUrl[bm.url] || [];
          return bmTags.some(t => t.toLowerCase() === normalizedTag);
        }),
      };
    })
    .filter(function(col) { return col.children.length > 0; });
  
  currentColumns = filteredColumns;
  clearMultiSelect();
  renderCurrent();
}


// Apply theme on DOM ready (after options.js is loaded)
function applyThemeOnReady() {
  const THEME_KEY = "selectedTheme";
  const savedTheme = localStorage.getItem(THEME_KEY) || "default";
  if (savedTheme && savedTheme !== "default") {
    document.body.classList.add("theme-" + savedTheme);
  }
}

function saveTags() {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tagsByUrl));
}

function autoTagBookmark(bm) {
  try {
    const titleWords = (bm.title || "").toLowerCase().split(/\W+/);
    const urlWords = normalizeUrl(bm.url).toLowerCase().split(/\W+/);
    const candidates = [...titleWords, ...urlWords].filter(Boolean);
    const unique = Array.from(new Set(candidates));
    tagsByUrl[bm.url] = unique.slice(0, 2);
  } catch (e) {}
}

function autoTagAll() {
  columns.forEach((col) => {
    col.children.forEach((bm) => {
      if (!tagsByUrl[bm.url]) autoTagBookmark(bm);
    });
  });
  saveTags();
}

function updateDuplicates() {
  const counts = {};
  columns.forEach((col) =>
    col.children.forEach((bm) => {
      const norm = normalizeUrl(bm.url);
      counts[norm] = (counts[norm] || 0) + 1;
    })
  );
  columns.forEach((col) =>
    col.children.forEach((bm) => {
      bm.isDuplicate = counts[normalizeUrl(bm.url)] > 1;
    })
  );
}

chrome.bookmarks.getTree((items) => {
  // Hide loading indicator and show main content after 2 seconds to ensure it's visible
  const loadingIndicator = document.getElementById("loading-indicator");
  if (loadingIndicator) {
    setTimeout(function() {
      loadingIndicator.classList.add("hidden");
    }, 160);
  }
  
  // Show main content after bookmarks are loaded
  const header = document.getElementById("header");
  const searchContainer = document.getElementById("search-container");
  const container = document.getElementById("container");
  const goToTop = document.getElementById("go-to-top");
  
  if (header) header.classList.add("loaded");
  if (searchContainer) searchContainer.classList.add("loaded");
  if (container) container.classList.add("loaded");
  if (goToTop) goToTop.classList.add("loaded");
  
  // Render title now that bookmarks are loaded and header is visible
  const welcomeElement = document.getElementById("welcome");
  const CUSTOM_TITLE_KEY = "customTitle";
  const DEFAULT_TITLE = "Hello, Stitch";
  
  // Check for custom title saved in localStorage
  const savedCustomTitle = localStorage.getItem(CUSTOM_TITLE_KEY);
  const baseTitle = savedCustomTitle || DEFAULT_TITLE;
  
  if (welcomeElement) {
    // Generate dynamic title with date and time
    const now = new Date();
    const dayName = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const monthName = now.toLocaleDateString("en-US", { month: "long" }).toLowerCase();
    const day = now.getDate();
    const year = now.getFullYear();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    
    // Create formatted title with date and time, wrapping date and time in underlined spans
    const formattedTitle = baseTitle + " today is <span class=\"stitch-underline\">" + dayName + " " + monthName + " " + day + ", " + year + "</span> and the time is <span class=\"stitch-underline\">" + hour12 + ":" + minutes + " " + ampm + "</span>";
    
    // Render the formatted title to the welcome element, preserving underline spans
    welcomeElement.innerHTML = renderTitleWithUnderline(formattedTitle);
  }
  
  // Find the "Stitch" folder
  const bookmarksBar = items[0].children.find((x) =>
    options.ROOT_FOLDER.test(x.title)
  );

  if (!bookmarksBar) {
    console.error(`Was expecting a folder called '${options.ROOT_FOLDER}'`);
    return;
  }

  // Separate root bookmarks (bookmarks at root level) from folders
  const rootBookmarks = bookmarksBar.children.filter((node) => !node.children);
  const rootFolders = bookmarksBar.children.filter((node) => !!node.children);

  // Create root column with title "/" for root-level bookmarks
  const rootColumn = {
    title: "/",
    children: [],
  };

  // Add root-level bookmarks to the root column
  rootBookmarks.forEach((node) => addBookmark(rootColumn, node));

  // Add root column to columns array
  columns.push(rootColumn);

  // Process each subfolder as a column
  rootFolders.forEach((node) => {
    const column = {
      title: node.title,
      children: [],
    };

    visit(column, node);

    columns.push(column);
  });

  currentColumns = columns;
  // Set flag to indicate bookmarks have been loaded
  bookmarksLoaded = true;
  
  // Set default sort preference to "frequency" if not already set
  if (!localStorage.getItem(SORT_PREFERENCE_KEY)) {
    localStorage.setItem(SORT_PREFERENCE_KEY, "frequency");
  }
  // Update visit counts first, then render after counts are available
  updateVisitCounts(() => {
    updateDuplicates();
    autoTagAll();
    renderCurrent();
    generateFilterButtons(rootFolders);
    updateSortButton();
    autoApplyWorkMode();
    updateCloseAllVisibility();
    updateWorkModeButton();
  });
});

function refreshBookmarks() {
  columns.length = 0;
  chrome.bookmarks.getTree((items) => {
    // Find the "Stitch" folder
    const bookmarksBar = items[0].children.find((x) =>
      options.ROOT_FOLDER.test(x.title)
    );

    if (!bookmarksBar) {
      console.error(`Was expecting a folder called '${options.ROOT_FOLDER}'`);
      return;
    }

    // Separate root bookmarks (bookmarks at root level) from folders
    const rootBookmarks = bookmarksBar.children.filter((node) => !node.children);
    const rootFolders = bookmarksBar.children.filter((node) => !!node.children);

    // Create root column with title "/" for root-level bookmarks
    const rootColumn = {
      title: "/",
      children: [],
    };

    // Add root-level bookmarks to the root column
    rootBookmarks.forEach((node) => addBookmark(rootColumn, node));

    // Add root column to columns array
    columns.push(rootColumn);

    // Process each subfolder as a column
    rootFolders.forEach((node) => {
      const column = {
        title: node.title,
        children: [],
      };

      visit(column, node);

      columns.push(column);
    });

    currentColumns = columns;
    updateVisitCounts();
    updateDuplicates();
    autoTagAll();
    renderCurrent();
    generateFilterButtons(rootFolders);
    updateSortButton();
    updateCloseAllVisibility();
    updateWorkModeButton();
  });
}

const visit = (column, node, path = []) => {
  if (node.children) {
    node.children.forEach((x) => visit(column, x, [...path, node.title]));
    return;
  }
  addBookmark(column, node, path);
};

const addBookmark = (column, node, path = []) => {
  if (!node.url || node.url.startsWith("javascript:")) return;
  const isSeparator = options.SEPARATORS.includes(node.title) || node.type === "separator";
  const faviconUrl = getFaviconUrl(node.url);
  column.children.push({
    title: node.title,
    url: node.url,
    path: path,
    isSeparator,
    faviconUrl,
    dateAdded: node.dateAdded,
    id: node.id,
  });
};

function updateVisitCounts(callback) {
  const historyAPI = typeof browser !== "undefined" ? browser.history : chrome.history;
  if (!historyAPI) {
    if (callback) callback();
    return;
  }

  const doSearch = () => {
    try {
      historyAPI.search({ text: "", maxResults: 10000 }, (results) => {
        bookmarkVisitCounts = {};
        results.forEach((item) => {
          const normalizedUrl = normalizeUrl(item.url);
          bookmarkVisitCounts[normalizedUrl] = (bookmarkVisitCounts[normalizedUrl] || 0) + item.visitCount;
        });
        if (callback) callback();
      });
    } catch (e) {
      if (callback) callback();
    }
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(doSearch, { timeout: 2000 });
  } else {
    setTimeout(doSearch, 500);
  }
}

function moveBookmark(srcUrl, dstUrl) {
  if (!srcUrl || !dstUrl) return;
  let srcCol, dstCol, srcIdx = -1, dstIdx = -1;
  columns.forEach((col) => {
    col.children.forEach((bm, i) => {
      if (bm.url === srcUrl) { srcCol = col; srcIdx = i; }
      if (bm.url === dstUrl) { dstCol = col; dstIdx = i; }
    });
  });
  if (!srcCol || !dstCol || srcIdx < 0 || dstIdx < 0) return;
  const [bm] = srcCol.children.splice(srcIdx, 1);
  if (srcCol === dstCol && srcIdx < dstIdx) dstIdx--;
  dstCol.children.splice(dstIdx, 0, bm);
  renderCurrent();
}
window.moveBookmark = moveBookmark;

function exportBookmarksToFile() {
  try {
    const data = JSON.stringify(currentColumns || columns);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookmarks-export.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export failed", e);
    alert("Failed to export bookmarks.");
  }
}

function importFromJson(json) {
  try {
    const imported = JSON.parse(json);
    if (!Array.isArray(imported)) throw new Error("Invalid format");
    columns.length = 0;
    imported.forEach((col) => columns.push(col));
    currentColumns = columns;
    renderCurrent();
  } catch (e) {
    console.error("Import error", e);
    alert("Import failed: invalid JSON");
  }
}

function handleImportClick() {
  const paste = prompt("Paste exported JSON here, or Cancel to choose a file.");
  if (paste) {
    importFromJson(paste);
    return;
  }
  const fileInput = document.getElementById("import-file");
  if (fileInput) fileInput.click();
}

function handleImportFileChange(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    importFromJson(reader.result);
    e.target.value = null;
  };
  reader.readAsText(file);
}

function sortBookmarks(bookmarksArray, sortBy) {
  const nonSeparators = bookmarksArray.filter((b) => !b.isSeparator);
  const separators = bookmarksArray.filter((b) => b.isSeparator);
  let sorted = [...nonSeparators];

  if (sortBy === "frequency") {
    sorted.sort((a, b) => {
      const countA = bookmarkVisitCounts[normalizeUrl(a.url)] || 0;
      const countB = bookmarkVisitCounts[normalizeUrl(b.url)] || 0;
      return countB - countA;
    });
  } else if (sortBy === "date") {
    sorted.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
  } else if (sortBy === "alphabetical") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  }

  const pinned = [], unpinned = [];
  sorted.forEach((b) => (pinnedSet.has(b.url) ? pinned.push(b) : unpinned.push(b)));
  sorted = [...pinned, ...unpinned];

  return separators.length > 0 ? [...sorted, ...separators] : sorted;
}

function applySorting(columnsToSort, sortBy) {
  return columnsToSort.map((col) => ({
    ...col,
    children: sortBookmarks(col.children, sortBy),
  }));
}

const debouncedFilterBookmarks = debounce(filterBookmarks, 300);

function clearMultiSelect() {
  window.selectedBookmarks.clear();
  document.querySelectorAll(".bookmark-checkbox").forEach((checkbox) => { checkbox.checked = false; });
  document.querySelectorAll(".bookmark-item.selected").forEach((item) => { item.classList.remove("selected"); });
  updateMultiSelectBar();
}

function openTabsSafely(urls) {
  if (!urls || urls.length === 0) {
    console.log('No URLs to open');
    return;
  }
  
  console.log('Opening URLs:', urls);
  
  if (window.chrome && chrome.tabs) {
    // Chrome extension context
    urls.forEach((url) => {
      chrome.tabs.create({ url: url, active: false });
    });
  } else if (window.browser && browser.tabs) {
    // Firefox browser context
    urls.forEach((url) => {
      browser.tabs.create({ url: url, active: false });
    });
  } else {
    // Fallback for web context
    urls.forEach((url) => {
      window.open(url, "_blank");
    });
  }
}

function updateMultiSelectBar() {
  const bar = document.getElementById("multi-open-bar");
  const openBtn = document.getElementById("multi-open-button");
  if (!bar) return;
  
  if (window.selectedBookmarks.size > 0) {
    bar.classList.add("active");
    bar.style.display = "flex";
    openBtn.textContent = "Open (" + window.selectedBookmarks.size + ")";
  } else {
    bar.classList.remove("active");
    bar.style.display = "none";
  }
}
window.updateMultiSelectBar = updateMultiSelectBar;

// Setup multi-select listeners - attach directly to document for better reliability
// This is called after DOM is ready to ensure all elements are present
function setupMultiSelectListeners() {
  // Use event delegation on document for more reliable event handling
  document.addEventListener('click', function(e) {
    // Handle pin button clicks
    const pinBtn = e.target.closest('.pin-btn');
    if (pinBtn) {
      e.preventDefault();
      const url = pinBtn.getAttribute('data-url');
      if (url) {
        togglePin(url);
      }
      e.stopPropagation();
      return;
    }

    // Handle copy URL button clicks
    const copyBtn = e.target.closest('.copy-url-btn');
    if (copyBtn) {
      const url = copyBtn.getAttribute('data-url');
      if (url && navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          const old = copyBtn.textContent;
          copyBtn.textContent = '✓';
          setTimeout(() => { copyBtn.textContent = old || '📋'; }, 1000);
        });
      }
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  });
}

// EDITABLE TITLE + THEME FUNCTIONALITY
document.addEventListener("DOMContentLoaded", function() {
  const welcomeElement = document.getElementById("welcome");
  const CUSTOM_TITLE_KEY = "customTitle";
  const DEFAULT_TITLE = "Hello, Stitch";
  const THEME_KEY = "selectedTheme";
  const FONT_KEY = "selectedFont";

  // Settings Modal Functionality
  const settingsModal = document.getElementById("settings-modal");
  const settingsButton = document.getElementById("settings-button");
  const settingsClose = document.getElementById("settings-close");
  const settingsSave = document.getElementById("settings-save");
  const settingsTitleInput = document.getElementById("settings-title-input");
  const settingsSortSelect = document.getElementById("settings-sort-select");
  
  // Settings modal - Export/Import buttons
  const settingsExportBtn = document.getElementById("settings-export-button");
  const settingsImportBtn = document.getElementById("settings-import-button");
  const settingsImportFile = document.getElementById("settings-import-file");

  // Open settings modal
  if (settingsButton) {
    settingsButton.addEventListener("click", function() {
      // Load current settings into the modal
      settingsTitleInput.value = localStorage.getItem(CUSTOM_TITLE_KEY) || DEFAULT_TITLE;
      
      // Load theme selection
      const savedTheme = localStorage.getItem(THEME_KEY) || "default";
      document.querySelectorAll('input[name="theme"]').forEach(function(radio) {
        radio.checked = radio.value === savedTheme;
      });
      
      // Load font selection
      const savedFont = localStorage.getItem(FONT_KEY) || "buka-bird";
      document.querySelectorAll('input[name="font"]').forEach(function(radio) {
        radio.checked = radio.value === savedFont;
      });
      
      // Load sort preference
      const savedSort = localStorage.getItem(SORT_PREFERENCE_KEY) || "frequency";
      settingsSortSelect.value = savedSort;
      
      settingsModal.classList.add("active");
    });
  }

  // Close settings modal
  if (settingsClose) {
    settingsClose.addEventListener("click", function() {
      settingsModal.classList.remove("active");
    });
  }

  // Close settings modal when clicking outside
  if (settingsModal) {
    settingsModal.addEventListener("click", function(e) {
      if (e.target === settingsModal) {
        settingsModal.classList.remove("active");
      }
    });
  }

  // Save Settings button
  if (settingsSave) {
    settingsSave.addEventListener("click", function() {
      // Save custom title
      const newTitle = settingsTitleInput.value.trim() || DEFAULT_TITLE;
      localStorage.setItem(CUSTOM_TITLE_KEY, newTitle);
      renderTitle(newTitle);
      
      // Save theme
      const selectedTheme = document.querySelector('input[name="theme"]:checked');
      if (selectedTheme) {
        applyTheme(selectedTheme.value);
      }
      
      // Save font
      const selectedFont = document.querySelector('input[name="font"]:checked');
      if (selectedFont) {
        applyFont(selectedFont.value);
      }
      
      // Save sort preference
      const sortPref = settingsSortSelect.value;
      localStorage.setItem(SORT_PREFERENCE_KEY, sortPref);
      updateSortButton();
      renderCurrent();
      
      // Close modal
      settingsModal.classList.remove("active");
    });
  }

  // Settings modal - Export button
  if (settingsExportBtn) {
    settingsExportBtn.addEventListener("click", function() {
      exportBookmarksToFile();
    });
  }

  // Settings modal - Import button
  if (settingsImportBtn) {
    settingsImportBtn.addEventListener("click", function() {
      settingsImportFile.click();
    });
  }

  // Settings modal - Import file change
  if (settingsImportFile) {
    settingsImportFile.addEventListener("change", function(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function() {
        importFromJson(reader.result);
        e.target.value = null;
        settingsModal.classList.remove("active");
      };
      reader.readAsText(file);
    });
  }

  // Features Modal Functionality
  const featuresModal = document.getElementById("features-modal");
  const featuresInfoButton = document.getElementById("settings-info-button");
  const featuresCloseButton = document.getElementById("features-close");

  // Open features modal
  if (featuresInfoButton && featuresModal) {
    featuresInfoButton.addEventListener("click", function() {
      featuresModal.classList.add("active");
    });
  }

  // Close features modal
  if (featuresCloseButton && featuresModal) {
    featuresCloseButton.addEventListener("click", function() {
      featuresModal.classList.remove("active");
    });
  }

  // Close features modal when clicking outside
  if (featuresModal) {
    featuresModal.addEventListener("click", function(e) {
      if (e.target === featuresModal) {
        featuresModal.classList.remove("active");
      }
    });
  }

  // Close on Escape key
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && featuresModal && featuresModal.classList.contains("active")) {
      featuresModal.classList.remove("active");
    }
  });

// Font dropdown functionality - now uses global function

  // Load saved font
  const savedFont = localStorage.getItem(FONT_KEY) || "buka-bird";
  applyFont(savedFont);

  function renderTitle(titleText) {
    if (!welcomeElement) return;
    
    // Get current date and time for the formatted title
    var now = new Date();
    var dayName = now.toLocaleDateString("en-US", { weekday: "long" });
    var monthName = now.toLocaleDateString("en-US", { month: "long" });
    var day = now.getDate();
    var year = now.getFullYear();
    var hours = now.getHours();
    var minutes = now.getMinutes().toString().padStart(2, "0");
    var ampm = hours >= 12 ? "PM" : "AM";
    var hour12 = hours % 12 || 12;
    
    // Create formatted title with date and time, wrapping date and time in underlined spans
    var formattedTitle = titleText + " today is <span class=\"stitch-underline\">" + dayName + " " + monthName + " " + day + ", " + year + "</span> and the time is <span class=\"stitch-underline\">" + hour12 + ":" + minutes + " " + ampm + "</span>";
    
    // Render the formatted title to the welcome element, preserving underline spans
    welcomeElement.innerHTML = renderTitleWithUnderline(formattedTitle);
    
    // Also update the browser tab title with full format (without HTML)
    document.title = titleText + " today is " + dayName + " " + monthName + " " + day + ", " + year + " and the time is " + hour12 + ":" + minutes + " " + ampm;
  }

  function loadCustomTitle() {
    return localStorage.getItem(CUSTOM_TITLE_KEY) || DEFAULT_TITLE;
  }

  // Title will be rendered after bookmarks load (in chrome.bookmarks.getTree callback)
  // This ensures title appears together with bookmarks, not before

  if (welcomeElement) {
    welcomeElement.addEventListener("click", function() {
      if (welcomeElement.querySelector(".title-edit-input")) return;

      const currentTitle = loadCustomTitle();
      welcomeElement.classList.add("editing");

      const input = document.createElement("input");
      input.type = "text";
      input.className = "title-edit-input";
      input.value = currentTitle;

      welcomeElement.innerHTML = "";
      welcomeElement.appendChild(input);
      input.focus();
      input.select();

      function saveTitle() {
        const newTitle = input.value.trim() || DEFAULT_TITLE;
        
        localStorage.setItem(CUSTOM_TITLE_KEY, newTitle);
        welcomeElement.classList.remove("editing");
        renderTitle(newTitle);
      }

      input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") saveTitle();
        else if (e.key === "Escape") {
          welcomeElement.classList.remove("editing");
          renderTitle(currentTitle);
        }
      });

      input.addEventListener("blur", saveTitle);
    });
  }

  // Theme dropdown functionality
  function applyTheme(themeName) {
    document.body.className = "";
    if (themeName && themeName !== "default") {
      document.body.classList.add("theme-" + themeName);
    }
    localStorage.setItem(THEME_KEY, themeName || "default");
  }

  // Load saved theme
  const savedTheme = localStorage.getItem(THEME_KEY) || "default";
  applyTheme(savedTheme);

  updateTimestamp();

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", debouncedFilterBookmarks);
    searchInput.value = "";
  }

  setupMultiSelectListeners();

  const openBtn = document.getElementById("multi-open-button");
  const closeBtn = document.getElementById("multi-close-button");
  if (openBtn) {
    openBtn.addEventListener("click", function() {
      const urls = Array.from(window.selectedBookmarks);
      if (urls.length) openTabsSafely(urls);
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", clearMultiSelect);
  }

  const quickLinks = [
    { id: "chatgpt-button", url: "https://chat.openai.com/" },
    { id: "grok-button", url: "https://grok.com/" },
    { id: "reddit-button", url: "https://www.reddit.com/" },
    { id: "twitch-button", url: "https://www.twitch.tv/" },
    { id: "youtube-button", url: "https://www.youtube.com/" },
  ];
  quickLinks.forEach(function(link) {
    const btn = document.getElementById(link.id);
    if (btn) btn.addEventListener("click", function() { window.location.href = link.url; });
  });

  const exportBtn = document.getElementById("export-button");
  if (exportBtn) exportBtn.addEventListener("click", exportBookmarksToFile);
  
  const importBtn = document.getElementById("import-button");
  if (importBtn) importBtn.addEventListener("click", handleImportClick);
  
  const importFileInput = document.getElementById("import-file");
  if (importFileInput) importFileInput.addEventListener("change", handleImportFileChange);

  document.addEventListener("keydown", function(e) {
    if (e.target.tagName === "INPUT" || e.target.isContentEditable) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      document.querySelectorAll(".bookmark-checkbox").forEach(function(cb) { if (!cb.checked) cb.click(); });
      e.preventDefault();
    } else if (e.key === "o" && window.selectedBookmarks.size) {
      openTabsSafely(Array.from(window.selectedBookmarks));
    } else if (e.key === "c") {
      clearMultiSelect();
    }
  });

  const youtubeButton = document.getElementById("youtube-button");
  if (youtubeButton) {
    youtubeButton.addEventListener("click", function() {
      const query = document.getElementById("search-input").value.trim();
      if (query) {
        window.location.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);
      } else {
        window.location.href = "https://www.youtube.com";
      }
    });
  }

  const goToTopBtn = document.getElementById("go-to-top");
  const container = document.getElementById("container");

  function updateGoToTopVisibility() {
    const windowScrolled = window.scrollY > 50;
    const containerScrolled = container && container.scrollTop > 50;
    goToTopBtn.style.display = (windowScrolled || containerScrolled) ? "block" : "none";
  }

  window.addEventListener("scroll", updateGoToTopVisibility);
  if (container) container.addEventListener("scroll", updateGoToTopVisibility);

  goToTopBtn.addEventListener("click", function() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (container) container.scrollTo({ top: 0, behavior: "smooth" });
  });

  setTimeout(function() {
    document.querySelectorAll("img.favicon").forEach(function(img) {
      img.onerror = function() {
        const faviconFinder = img.getAttribute("data-faviconfinder");
        const fallback = img.getAttribute("data-fallback");
        if (img.src !== faviconFinder && faviconFinder) img.src = faviconFinder;
        else if (img.src !== fallback && fallback) img.src = fallback;
      };
    });
  }, 0);

  document.body.addEventListener("click", function(e) {
    if (e.target.classList.contains("bookmark-link")) {
      e.preventDefault();
      window.location.href = e.target.getAttribute("data-url");
    }
  });

  autoApplyWorkMode();
  updateWorkModeButton();
});

function renderTitleWithUnderline(formattedTitle) {
  // Split the string but preserve the <span class="stitch-underline">...</span> tags
  // We'll process the string to keep underline spans intact while applying character styling to the rest
  
  // Use a regex to split into: regular text (group 1) and underline spans (group 2)
  // The pattern matches either:
  // - Text outside of underline spans (captured)
  // - The entire underline span with its content (captured)
  const parts = formattedTitle.split(/(<span class="stitch-underline">[\s\S]*?<\/span>)/g);
  
  // Process each part - apply character styling only to non-underline parts
  return parts.map(function(part, index) {
    // If this is an underline span, preserve it as-is
    if (part.includes('class="stitch-underline"')) {
      return part;
    }
    // Otherwise, apply character-by-character styling
    return part
      .split("")
      .map(function(letter, i) { return "<span class=\"stitch-theme color" + (i % 8) + "\">" + letter + "</span>"; })
      .join("");
  }).join("");
}

function updateTimestamp() {
  const now = new Date();
  
  // Check if elements exist before updating
  const dateEl = document.getElementById("date");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");
  const ampmEl = document.getElementById("ampm");
  const dayEl = document.getElementById("day");
  
  if (!dateEl || !hoursEl || !minutesEl || !secondsEl || !ampmEl || !dayEl) {
    return; // Elements don't exist, skip update
  }
  
  dateEl.textContent = now.toLocaleDateString();
  const hours = now.getHours();
  hoursEl.textContent = (hours % 12 || 12).toString().padStart(2, "0");
  minutesEl.textContent = now.getMinutes().toString().padStart(2, "0");
  secondsEl.textContent = now.getSeconds().toString().padStart(2, "0");
  ampmEl.textContent = hours >= 12 ? "PM" : "AM";
  dayEl.textContent = now.toLocaleDateString("en-US", { weekday: "long" });
  
  // Get custom title from localStorage or use default
  const CUSTOM_TITLE_KEY = "customTitle";
  const DEFAULT_TITLE = "Hello, Stitch";
  const customTitle = localStorage.getItem(CUSTOM_TITLE_KEY) || DEFAULT_TITLE;
  
  // Format date and time
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = now.toLocaleDateString("en-US", { month: "long" });
  const day = now.getDate();
  const year = now.getFullYear();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  
  // Create formatted title with date and time, wrapping date and time in underlined spans
  const formattedTitle = customTitle + " today is <span class=\"stitch-underline\">" + monthName + " " + day + ", " + year + "</span> and the time is <span class=\"stitch-underline\">" + hour12 + ":" + minutes + " " + ampm + "</span>";
  
  // Update the welcome heading with custom title and date/time
  const welcomeElement = document.getElementById("welcome");
  if (welcomeElement) {
    welcomeElement.innerHTML = renderTitleWithUnderline(formattedTitle);
  }
}

// Store interval ID for cleanup to prevent memory leaks
const timestampIntervalId = setInterval(updateTimestamp, 1000);

// Clean up interval on page unload to prevent memory leaks
window.addEventListener('unload', function() {
  if (timestampIntervalId) {
    clearInterval(timestampIntervalId);
  }
});

function filterBookmarks() {
  isShowingPins = false;
  const input = document.getElementById("search-input").value.trim().toLowerCase();
  const normalizedInput = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredColumns = columns
    .map(function(col) {
      return {
        ...col,
        children: col.children.filter(function(bm) {
          const title = bm.title ? bm.title.toLowerCase() : "";
          const normalizedTitle = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return normalizedTitle.includes(normalizedInput);
        }),
      };
    })
    .filter(function(col) { return col.children.length > 0; });

  currentColumns = filteredColumns;
  clearMultiSelect();
  renderCurrent();
}

function filterBy(category) {
  isShowingPins = false;
  const cat = category.toLowerCase();
  
  // Find the column that matches the folder name directly
  const matchingColumn = columns.find(function(col) { 
    return col.title.toLowerCase() === cat; 
  });
  
  if (matchingColumn) {
    // Show only the selected folder's column
    currentColumns = [matchingColumn];
  } else {
    // Fallback: filter bookmarks that have this category in their path
    const filteredColumns = columns
      .map(function(col) {
        return {
          ...col,
          children: col.children.filter(function(bm) {
            return (bm.path || []).map(function(s) { return s.toLowerCase(); }).indexOf(cat) !== -1;
          }),
        };
      })
      .filter(function(col) { return col.children.length > 0; });
    currentColumns = filteredColumns;
  }
  
  clearMultiSelect();
  renderCurrent();
}

function filterMostVisited() {
  isShowingPins = false;
  const historyAPI = typeof browser !== "undefined" ? browser.history : chrome.history;
  if (historyAPI) {
    historyAPI.search({ text: "", maxResults: 100 }, function(results) {
      const mostVisitedUrls = results.map(function(result) { return normalizeUrl(result.url); });
      currentColumns = columns
        .map(function(col) {
          return {
            ...col,
            children: col.children.filter(function(bm) {
              return mostVisitedUrls.indexOf(normalizeUrl(bm.url)) !== -1;
            }),
          };
        })
        .filter(function(col) { return col.children.length > 0; });
      clearMultiSelect();
      renderCurrent();
    });
  } else {
    resetFilters();
  }
  document.body.classList.remove("jobs-hours-active");
}

function filterPinned() {
  isShowingPins = true;
  currentColumns = columns
    .map(function(col) {
      return {
        ...col,
        children: col.children.filter(function(bm) { return pinnedSet.has(bm.url); }),
      };
    })
    .filter(function(col) { return col.children.length > 0; });
  clearMultiSelect();
  renderCurrent();
}

function filterJobsOnly() {
  isShowingPins = false;
  const jobsColumns = columns.filter(function(col) { return col.title.toLowerCase().indexOf("jobs") !== -1; });
  let newColumns = [];

  jobsColumns.forEach(function(jobsCol) {
    const subfolderMap = {};
    jobsCol.children.forEach(function(bm) {
      const jobsIndex = (bm.path || []).findIndex(function(p) { return p.toLowerCase().indexOf("jobs") !== -1; });
      let subfolderPath = "";
      if (jobsIndex !== -1 && bm.path && bm.path.length > jobsIndex + 1) {
        subfolderPath = bm.path.slice(jobsIndex + 1).join(" / ");
      }
      const key = subfolderPath || jobsCol.title;
      if (!subfolderMap[key]) subfolderMap[key] = [];
      subfolderMap[key].push(bm);
    });
    Object.entries(subfolderMap).forEach(function(entry) {
      newColumns.push({ title: entry[0], children: entry[1] });
    });
  });

  currentColumns = newColumns;
  clearMultiSelect();
  renderCurrent();
  document.body.classList.add("jobs-hours-active");
}

function filterJobsOrMostVisited() {
  isShowingPins = false;
  if (isESTJobsTimeAndWorkday()) filterJobsOnly();
  else filterMostVisited();
}

function generateFilterButtons(folders) {
  const filterButtonsContainer = document.getElementById("bookmark-filter-dropdown");
  if (!filterButtonsContainer) return;
  filterButtonsContainer.innerHTML = "";

  function makeBtn(config) {
    const btn = document.createElement("button");
    btn.className = "filter-button" + (config.extraClasses && config.extraClasses.length ? " " + config.extraClasses.join(" ") : "");
    if (config.id) btn.id = config.id;
    if (config.title) {
      btn.title = config.title;
      btn.setAttribute("data-tooltip", config.title);
    }
    btn.textContent = config.text;
    if (config.clickHandler) btn.addEventListener("click", config.clickHandler);
    return btn;
  }

  function renderFolder(folder, depth = 0) {
    if (folder.children && folder.children.length) {
      const details = document.createElement("details");
      details.setAttribute("data-depth", depth);
      const summary = document.createElement("summary");
      summary.textContent = folder.title;
      summary.className = "filter-folder-summary";
      // Add data-depth attribute for CSS-based indentation
      summary.setAttribute("data-depth", depth);
      details.appendChild(summary);

      folder.children.filter(function(child) { return child.children && child.children.length; }).forEach(function(child) {
        details.appendChild(renderFolder(child, depth + 1));
      });

      const button = makeBtn({
        text: "Show \"" + folder.title + "\"",
        clickHandler: function() { filterBy(folder.title.toLowerCase()); updateCloseAllVisibility(); }
      });
      // Add data-depth attribute to filter-button for indentation
      button.setAttribute("data-depth", depth);
      details.appendChild(button);
      return details;
    }
    return null;
  }

  folders.forEach(function(folder) {
    const rendered = renderFolder(folder);
    if (rendered) filterButtonsContainer.appendChild(rendered);
  });

  const resetButton = makeBtn({ text: "🔄 Reset", title: "Show all bookmarks", clickHandler: function() { resetFilters(); updateCloseAllVisibility(); } });
  const closeAllBtn = makeBtn({ id: "close-all-btn", text: "❌ Close All", title: "Collapse all folders", extraClasses: ["close-all-btn"], clickHandler: function() { document.querySelectorAll(".filter-buttons details[open]").forEach(function(d) { d.open = false; }); updateCloseAllVisibility(); } });
  const pinnedButton = makeBtn({ id: "filter-pinned", text: "📌 Pinned", title: "Show only pinned bookmarks", clickHandler: function() { filterPinned(); updateCloseAllVisibility(); } });
  const clearPinsButton = makeBtn({ id: "clear-pins", text: "🗑️ Clear Pins", title: "Remove all pinned bookmarks", clickHandler: function() { clearAllPins(); updateCloseAllVisibility(); } });
  const configureWorkModeButton = makeBtn({ id: "configure-work-mode", text: "⚙️ Work Mode", title: "Configure work mode settings", clickHandler: function() { if (typeof showWorkModeModal === "function") showWorkModeModal(columns); } });

  [configureWorkModeButton, resetButton, clearPinsButton, closeAllBtn].forEach(function(btn) { filterButtonsContainer.appendChild(btn); });

  updateCloseAllVisibility();
  updateClearPinsVisibility();
}

function resetFilters() {
  isShowingPins = false;
  currentColumns = columns;
  clearMultiSelect();
  renderCurrent();
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  document.querySelectorAll(".filter-buttons details[open]").forEach(function(d) { d.open = false; });
  document.body.classList.remove("jobs-hours-active");
}

function updateCloseAllVisibility() {
  const closeAllBtn = document.getElementById("close-all-btn");
  if (!closeAllBtn) return;
  closeAllBtn.style.display = document.querySelector(".filter-buttons details[open]") ? "inline-block" : "none";
}

function updateClearPinsVisibility() {
  const clearPinsBtn = document.getElementById("clear-pins");
  if (!clearPinsBtn) return;
  // Show the button only when there are pinned bookmarks
  clearPinsBtn.style.display = pinnedSet.size > 0 ? "inline-block" : "none";
}

document.addEventListener("click", function(e) {
  if (e.target.tagName === "SUMMARY" && e.target.closest(".filter-buttons details")) {
    setTimeout(updateCloseAllVisibility, 10);
  }
});

document.addEventListener("click", function(e) {
  const btn = e.target.closest(".delete-bookmark-btn");
  if (!btn) return;
  e.preventDefault();
  const url = btn.getAttribute("data-url");
  if (confirm("Are you sure you want to delete this bookmark?")) {
    if (window.chrome && chrome.bookmarks) {
      chrome.bookmarks.search({ url: url }, function(results) {
        let pending = results.length;
        if (pending === 0) refreshBookmarks();
        results.forEach(function(bm) {
          chrome.bookmarks.remove(bm.id, function() {
            if (--pending === 0) refreshBookmarks();
          });
        });
      });
    }
  }
});

// ============================================
// EDIT BOOKMARK FUNCTIONALITY
// ============================================

// Variable to store the current bookmark being edited
let currentEditingBookmarkId = null;

// Function to populate the folder dropdown in the edit modal
function populateEditFolderDropdown() {
  const folderSelect = document.getElementById("edit-folder");
  if (!folderSelect) return;
  
  folderSelect.innerHTML = "";
  
  // Add root option
  const rootOption = document.createElement("option");
  rootOption.value = "";
  rootOption.textContent = "/ (Root)";
  folderSelect.appendChild(rootOption);
  
  // Add columns as folder options
  columns.forEach(function(col) {
    const option = document.createElement("option");
    option.value = col.title;
    option.textContent = col.title;
    folderSelect.appendChild(option);
  });
}

// Function to open the edit modal with bookmark data
function openEditModal(url, title) {
  const editModal = document.getElementById("edit-modal");
  const editTitleInput = document.getElementById("edit-title");
  const editUrlInput = document.getElementById("edit-url");
  const editFolderSelect = document.getElementById("edit-folder");
  
  if (!editModal || !editTitleInput || !editUrlInput || !editFolderSelect) {
    console.error("Edit modal elements not found");
    return;
  }
  
  // Populate folder dropdown
  populateEditFolderDropdown();
  
  // Find the bookmark ID from the URL
  if (window.chrome && chrome.bookmarks) {
    chrome.bookmarks.search({ url: url }, function(results) {
      if (results && results.length > 0) {
        currentEditingBookmarkId = results[0].id;
        
        // Set form values
        editTitleInput.value = title || "";
        editUrlInput.value = url || "";
        
        // Try to find the folder this bookmark belongs to
        // For now, we'll leave it at root or the first match
        const parentId = results[0].parentId;
        if (parentId) {
          chrome.bookmarks.get(parentId, function(parentResult) {
            if (parentResult && parentResult.length > 0) {
              const parentTitle = parentResult[0].title;
              // Try to match with our columns
              let foundFolder = false;
              columns.forEach(function(col) {
                if (col.title === parentTitle) {
                  editFolderSelect.value = col.title;
                  foundFolder = true;
                }
              });
              // If not found in columns, try root
              if (!foundFolder) {
                editFolderSelect.value = "";
              }
            }
          });
        }
        
        // Show the modal
        editModal.classList.add("active");
      } else {
        console.error("Bookmark not found for URL:", url);
        alert("Could not find the bookmark to edit.");
      }
    });
  }
}

// Function to save the edited bookmark
function saveEditedBookmark() {
  const editTitleInput = document.getElementById("edit-title");
  const editUrlInput = document.getElementById("edit-url");
  const editFolderSelect = document.getElementById("edit-folder");
  
  if (!editTitleInput || !editUrlInput || !editFolderSelect) {
    console.error("Edit form elements not found");
    return;
  }
  
  const newTitle = editTitleInput.value.trim();
  const newUrl = editUrlInput.value.trim();
  const newFolder = editFolderSelect.value;
  
  if (!newTitle || !newUrl) {
    alert("Please enter both title and URL");
    return;
  }
  
  // Validate URL
  try {
    new URL(newUrl);
  } catch (e) {
    alert("Please enter a valid URL");
    return;
  }
  
  if (!currentEditingBookmarkId) {
    console.error("No bookmark ID to update");
    return;
  }
  
  // Update the bookmark
  if (window.chrome && chrome.bookmarks) {
    chrome.bookmarks.update(currentEditingBookmarkId, {
      title: newTitle,
      url: newUrl
    }, function(result) {
      if (chrome.runtime.lastError) {
        console.error("Error updating bookmark:", chrome.runtime.lastError);
        alert("Error updating bookmark: " + chrome.runtime.lastError.message);
      } else {
        // Close the modal
        const editModal = document.getElementById("edit-modal");
        if (editModal) {
          editModal.classList.remove("active");
        }
        
        // Refresh bookmarks to show the updated data
        refreshBookmarks();
      }
    });
  }
}

// Initialize edit bookmark functionality
function initEditBookmarkModal() {
  const editModal = document.getElementById("edit-modal");
  const editForm = document.getElementById("edit-form");
  const editCancelBtn = document.getElementById("edit-cancel");
  const editSaveBtn = document.getElementById("edit-save");
  
  // Handle edit button clicks using event delegation
  document.addEventListener("click", function(e) {
    const editBtn = e.target.closest(".edit-bookmark-btn");
    if (!editBtn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const url = editBtn.getAttribute("data-url");
    const title = editBtn.getAttribute("data-title");
    
    if (url) {
      openEditModal(url, title);
    }
  });
  
  // Handle cancel button
  if (editCancelBtn) {
    editCancelBtn.addEventListener("click", function() {
      if (editModal) {
        editModal.classList.remove("active");
      }
    });
  }
  
  // Handle save button
  if (editSaveBtn) {
    editSaveBtn.addEventListener("click", function(e) {
      e.preventDefault();
      saveEditedBookmark();
    });
  }
  
  // Handle form submission
  if (editForm) {
    editForm.addEventListener("submit", function(e) {
      e.preventDefault();
      saveEditedBookmark();
    });
  }
  
  // Close modal when clicking outside
  if (editModal) {
    editModal.addEventListener("click", function(e) {
      if (e.target === editModal) {
        editModal.classList.remove("active");
      }
    });
  }
  
  // Close on Escape key
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && editModal && editModal.classList.contains("active")) {
      editModal.classList.remove("active");
    }
  });
}

// Initialize the edit modal when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
  initEditBookmarkModal();
});

function renderCurrent() {
  // Don't render until bookmarks are loaded to prevent showing "No bookmarks found" prematurely
  if (!bookmarksLoaded) {
    return;
  }
  
  const sortBy = localStorage.getItem(SORT_PREFERENCE_KEY) || "frequency";
  const sortedColumns = applySorting(currentColumns, sortBy);
  render(sortedColumns);
  updatePinIcons();
  if (typeof setupVirtualization === "function") setupVirtualization();
}

function updatePinIcons() {
  document.querySelectorAll(".pin-btn").forEach(function(btn) {
    const url = btn.getAttribute("data-url");
    const item = btn.closest(".bookmark-item");
    if (pinnedSet.has(url)) {
      btn.textContent = "★";
      btn.classList.add("pinned");
      if (item) item.classList.add("pinned");
    } else {
      btn.textContent = "☆";
      btn.classList.remove("pinned");
      if (item) item.classList.remove("pinned");
    }
  });
}

function setupVirtualization() {
  const container = document.getElementById("container");
  if (!container || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      const item = entry.target;
      const preview = item.querySelector(".bookmark-preview-container");
      if (!preview) return;
      const iframe = item.querySelector("iframe[data-src]");
      if (entry.isIntersecting) {
        preview.style.display = "";
        if (iframe && !iframe.src) {
          const setSrc = function() { try { iframe.src = iframe.getAttribute("data-src") || ""; } catch (e) {} };
          if (typeof requestIdleCallback === "function") requestIdleCallback(setSrc, { timeout: 1000 });
          else setTimeout(setSrc, 200);
        }
      } else {
        preview.style.display = "none";
      }
    });
  }, { root: container, rootMargin: "200px" });
  document.querySelectorAll(".bookmark-item").forEach(function(item) { observer.observe(item); });
}

function setSortPreference(sortBy) {
  localStorage.setItem(SORT_PREFERENCE_KEY, sortBy);
  updateSortButton();
  renderCurrent();
}

function savePinned() {
  localStorage.setItem(PINS_KEY, JSON.stringify([...pinnedSet]));
}

function togglePin(url) {
  if (pinnedSet.has(url)) pinnedSet.delete(url);
  else pinnedSet.add(url);
  savePinned();
  renderCurrent();
  if (isShowingPins) filterPinned();
  updateClearPinsVisibility();
}

function clearAllPins() {
  pinnedSet.clear();
  savePinned();
  renderCurrent();
  updateClearPinsVisibility();
}

const WORK_MODE_KEY = "workModeFolders";

function applyWorkModeFilter() {
  isShowingPins = false;
  const selected = JSON.parse(localStorage.getItem(WORK_MODE_KEY) || "[]");
  if (!selected.length) {
    currentColumns = columns;
    clearMultiSelect();
    renderCurrent();
    document.body.classList.remove("jobs-hours-active");
    return;
  }

  const newColumns = selected.map(function(selPath) {
    let bookmarks = [];
    columns.forEach(function(col) {
      if (col.title === selPath) bookmarks = bookmarks.concat(col.children);
      else bookmarks = bookmarks.concat(col.children.filter(function(bm) { return (bm.path || []).join(" / ") === selPath; }));
    });
    return { title: selPath, children: bookmarks };
  });

  currentColumns = newColumns;
  clearMultiSelect();
  renderCurrent();
  document.body.classList.add("jobs-hours-active");
}

function autoApplyWorkMode() {
  const workModeFolders = JSON.parse(localStorage.getItem(WORK_MODE_KEY) || "[]");
  const workModeEnabled = JSON.parse(localStorage.getItem("workModeEnabled") || "false");
  
  // Use configurable work hours from utils.js
  const withinWorkHours = typeof isWithinWorkHours === "function" ? isWithinWorkHours() : false;
  
  if (workModeEnabled && workModeFolders.length) {
    applyWorkModeFilter();
  } else if (withinWorkHours) {
    // Apply work mode during configured work hours if folders are configured
    if (workModeFolders.length) {
      applyWorkModeFilter();
    } else {
      // No folders configured, just show normal view
      currentColumns = columns;
      renderCurrent();
      document.body.classList.remove("jobs-hours-active");
    }
  } else {
    currentColumns = columns;
    renderCurrent();
    document.body.classList.remove("jobs-hours-active");
  }
}

function updateWorkModeButton() {
  const btn = document.getElementById("filter-work-mode");
  const enabled = JSON.parse(localStorage.getItem("workModeEnabled") || "false");
  if (btn) btn.textContent = enabled ? "⚙️ Work Mode: ON" : "⚙️ Work Mode: OFF";
  
  // Show/hide work mode dependent buttons based on work mode state
  const workModeDependentBtns = document.querySelectorAll(".work-mode-dependent");
  workModeDependentBtns.forEach(function(button) {
    if (button) {
      button.style.display = enabled ? "inline-block" : "none";
    }
  });
}

function updateSortButton() {
  const sortBy = localStorage.getItem(SORT_PREFERENCE_KEY) || "frequency";
  const frequencyBtn = document.getElementById("sort-frequency");
  const dateBtn = document.getElementById("sort-date");
  const alphabeticalBtn = document.getElementById("sort-alphabetical");

  [frequencyBtn, dateBtn, alphabeticalBtn].forEach(function(btn) {
    if (btn) {
      btn.classList.remove("active-sort");
      btn.style.opacity = "0.7";
    }
  });

  const activeBtn = sortBy === "frequency" ? frequencyBtn : sortBy === "date" ? dateBtn : alphabeticalBtn;
  if (activeBtn) {
    activeBtn.classList.add("active-sort");
    activeBtn.style.opacity = "1";
  }
}

function toggleWorkMode() {
  const enabled = JSON.parse(localStorage.getItem("workModeEnabled") || "false");
  localStorage.setItem("workModeEnabled", !enabled);
  updateWorkModeButton();
  autoApplyWorkMode();
}

// Check work mode every minute to automatically apply during configured hours
// Store interval ID for cleanup to prevent memory leaks
const workModeIntervalId = setInterval(function() {
  const workModeEnabled = JSON.parse(localStorage.getItem("workModeEnabled") || "false");
  const workModeFolders = JSON.parse(localStorage.getItem(WORK_MODE_KEY) || "[]");
  
  // If work mode is manually ON or we have folders configured for auto mode
  if (workModeEnabled || workModeFolders.length > 0) {
    autoApplyWorkMode();
  }
}, 60000); // Check every 60 seconds

// Clean up interval on page unload to prevent memory leaks
window.addEventListener('unload', function() {
  if (workModeIntervalId) {
    clearInterval(workModeIntervalId);
  }
});

// ===========================================
// SETTINGS MODAL FUNCTIONALITY
// ===========================================
function initSettingsModal() {
  const settingsModal = document.getElementById("settings-modal");
  const settingsButton = document.getElementById("settings-button");
  const settingsClose = document.getElementById("settings-close");
  const settingsSave = document.getElementById("settings-save");
  const settingsTitleInput = document.getElementById("settings-title-input");
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const fontRadios = document.querySelectorAll('input[name="font"]');
  const sortSelect = document.getElementById("settings-sort-select");

  if (!settingsModal || !settingsButton) return;

  // Open modal
  settingsButton.addEventListener("click", function() {
    loadSettingsValues();
    settingsModal.classList.add("active");
  });

  // Close modal
  if (settingsClose) {
    settingsClose.addEventListener("click", function() {
      settingsModal.classList.remove("active");
    });
  }

  // Close on backdrop click
  settingsModal.addEventListener("click", function(e) {
    if (e.target === settingsModal) {
      settingsModal.classList.remove("active");
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && settingsModal.classList.contains("active")) {
      settingsModal.classList.remove("active");
    }
  });

// Save button handler
  if (settingsSave) {
    settingsSave.addEventListener("click", function() {
      // Save custom title
      const titleInput = document.getElementById("settings-title-input");
      if (titleInput) {
        const newTitle = titleInput.value.trim() || "Hello, Stitch";
        localStorage.setItem("customTitle", newTitle);
        // Update the title in the header if it exists
        const welcomeElement = document.getElementById("welcome");
        if (welcomeElement) {
          // Get current date and time for the formatted title
          var now = new Date();
          var dayName = now.toLocaleDateString("en-US", { weekday: "long" });
          var monthName = now.toLocaleDateString("en-US", { month: "long" });
          var day = now.getDate();
          var year = now.getFullYear();
          var hours = now.getHours();
          var minutes = now.getMinutes().toString().padStart(2, "0");
          var ampm = hours >= 12 ? "PM" : "AM";
          var hour12 = hours % 12 || 12;
          
          // Create formatted title with date and time, wrapping date and time in underlined spans
          var formattedTitle = newTitle + " today is <span class=\"stitch-underline\">" + dayName + " " + monthName + " " + day + ", " + year + "</span> and the time is <span class=\"stitch-underline\">" + hour12 + ":" + minutes + " " + ampm + "</span>";
          
          // Render the formatted title to the welcome element, preserving underline spans
          welcomeElement.innerHTML = renderTitleWithUnderline(formattedTitle);
        }
        // Also update the browser tab title with full format
        var now = new Date();
        var dayName = now.toLocaleDateString("en-US", { weekday: "long" });
        var monthName = now.toLocaleDateString("en-US", { month: "long" });
        var day = now.getDate();
        var year = now.getFullYear();
        var hours = now.getHours();
        var minutes = now.getMinutes().toString().padStart(2, "0");
        var ampm = hours >= 12 ? "PM" : "AM";
        var hour12 = hours % 12 || 12;
        document.title = newTitle + " today is " + dayName + " " + monthName + " " + day + ", " + year + " and the time is " + hour12 + ":" + minutes + " " + ampm;
      }

      // Save theme
      const selectedTheme = document.querySelector('input[name="theme"]:checked');
      if (selectedTheme) {
        applyTheme(selectedTheme.value);
        // Also update the header dropdown
        const headerThemeSelect = document.getElementById("theme-select");
        if (headerThemeSelect) headerThemeSelect.value = selectedTheme.value;
      }

      // Save font
      const selectedFont = document.querySelector('input[name="font"]:checked');
      if (selectedFont) {
        applyFont(selectedFont.value);
        // Also update the header dropdown
        const headerFontSelect = document.getElementById("font-select");
        if (headerFontSelect) headerFontSelect.value = selectedFont.value;
      }

      // Save font size
      const selectedFontSize = document.querySelector('input[name="fontSize"]:checked');
      if (selectedFontSize) {
        applyFontSize(selectedFontSize.value);
      }

      // Save sort preference
      const settingsSortSelect = document.getElementById("settings-sort-select");
      if (settingsSortSelect) {
        setSortPreference(settingsSortSelect.value);
        // Also update the header dropdown
        const headerSortSelect = document.getElementById("sort-select");
        if (headerSortSelect) headerSortSelect.value = settingsSortSelect.value;
      }

      // Close the modal
      settingsModal.classList.remove("active");
    });
  }

  // Theme radio buttons - live preview (apply immediately but don't save until Save is clicked)
  themeRadios.forEach(function(radio) {
    radio.addEventListener("change", function() {
      if (this.checked) {
        applyTheme(this.value);
      }
    });
  });

  // Font radio buttons - live preview (apply immediately but don't save until Save is clicked)
  fontRadios.forEach(function(radio) {
    radio.addEventListener("change", function() {
      if (this.checked) {
        applyFont(this.value);
      }
    });
  });

  // Font size radio buttons - live preview (apply immediately but don't save until Save is clicked)
  const fontSizeRadios = document.querySelectorAll('input[name="fontSize"]');
  fontSizeRadios.forEach(function(radio) {
    radio.addEventListener("change", function() {
      if (this.checked) {
        applyFontSize(this.value);
      }
    });
  });

  // Sort select - live preview (apply immediately but don't save until Save is clicked)
  if (sortSelect) {
    sortSelect.addEventListener("change", function() {
      setSortPreference(this.value);
    });
  }
}

function loadSettingsValues() {
  const THEME_KEY = "selectedTheme";
  const FONT_KEY = "selectedFont";
  const SORT_KEY = "bookmarkSortPreference";
  const CUSTOM_TITLE_KEY = "customTitle";

  // Load custom title
  const savedTitle = localStorage.getItem(CUSTOM_TITLE_KEY) || "Hello, Stitch";
  const titleInput = document.getElementById("settings-title-input");
  if (titleInput) {
    titleInput.value = savedTitle;
  }

  // Load theme
  const savedTheme = localStorage.getItem(THEME_KEY) || "default";
  const themeRadio = document.querySelector('input[name="theme"][value="' + savedTheme + '"]');
  if (themeRadio) themeRadio.checked = true;

  // Load font
  const savedFont = localStorage.getItem(FONT_KEY) || "buka-bird";
  const fontRadio = document.querySelector('input[name="font"][value="' + savedFont + '"]');
  if (fontRadio) fontRadio.checked = true;

  // Load font size
  const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || "16";
  const fontSizeRadio = document.querySelector('input[name="fontSize"][value="' + savedFontSize + '"]');
  if (fontSizeRadio) fontSizeRadio.checked = true;

  // Load sort preference
  const sortSelect = document.getElementById("settings-sort-select");
  if (sortSelect) {
    const savedSort = localStorage.getItem(SORT_KEY) || "frequency";
    sortSelect.value = savedSort;
  }
}

// ============================================
// GLOBAL APPLY THEME & FONT FUNCTIONS
// ============================================
function applyTheme(themeName) {
  document.body.className = "";
  if (themeName && themeName !== "default") {
    document.body.classList.add("theme-" + themeName);
  }
  localStorage.setItem("selectedTheme", themeName || "default");
}

function applyFont(fontName) {
  document.body.classList.remove("font-buka-bird", "font-fredoka");
  if (fontName && fontName !== "buka-bird") {
    document.body.classList.add("font-" + fontName);
  }
  localStorage.setItem("selectedFont", fontName || "buka-bird");
}

// Initialize settings modal on DOM ready
document.addEventListener("DOMContentLoaded", function() {
  initSettingsModal();
  
  // Load saved font size
  const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || "16";
  applyFontSize(savedFontSize);
  
  // Add event listeners for random buttons
  const randomThemeBtn = document.getElementById("random-theme-button");
  if (randomThemeBtn) {
    randomThemeBtn.addEventListener("click", randomizeTheme);
  }
  
  const randomFontBtn = document.getElementById("random-font-button");
  if (randomFontBtn) {
    randomFontBtn.addEventListener("click", randomizeFont);
  }
  
  const randomFontSizeBtn = document.getElementById("random-font-size-button");
  if (randomFontSizeBtn) {
    randomFontSizeBtn.addEventListener("click", randomizeFontSize);
  }
});

// Randomize Theme Function
function randomizeTheme() {
  const themes = ["default", "matrix", "ocean", "sunset", "forest", "midnight", "aurora", "rose", "lemon", "coral", "lavender", "nord", "dracula", "monokai", "cyberpunk"];
  const randomIndex = Math.floor(Math.random() * themes.length);
  const randomTheme = themes[randomIndex];
  
  // Apply the theme
  applyTheme(randomTheme);
  
  // Update the radio button selection in the modal
  const themeRadio = document.querySelector('input[name="theme"][value="' + randomTheme + '"]');
  if (themeRadio) {
    themeRadio.checked = true;
  }
}

// Randomize Font Function
function randomizeFont() {
  const fonts = ["buka-bird", "fredoka", "poppins", "roboto", "open-sans", "lato", "montserrat", "raleway", "nunito", "playfair"];
  const randomIndex = Math.floor(Math.random() * fonts.length);
  const randomFont = fonts[randomIndex];
  
  // Apply the font
  applyFont(randomFont);
  
  // Update the radio button selection in the modal
  const fontRadio = document.querySelector('input[name="font"][value="' + randomFont + '"]');
  if (fontRadio) {
    fontRadio.checked = true;
  }
}

// ============================================
// FONT SIZE FUNCTIONS
// ============================================
function applyFontSize(fontSize) {
  // Remove all font-size classes
  document.body.classList.remove("font-size-14", "font-size-16", "font-size-18", "font-size-20", "font-size-22", "font-size-24");
  
  // Add the selected font-size class
  if (fontSize && fontSize !== "16") {
    document.body.classList.add("font-size-" + fontSize);
  }
  localStorage.setItem(FONT_SIZE_KEY, fontSize || "16");
}

// Randomize Font Size Function
function randomizeFontSize() {
  const fontSizes = ["14", "16", "18", "20", "22", "24"];
  const randomIndex = Math.floor(Math.random() * fontSizes.length);
  const randomFontSize = fontSizes[randomIndex];
  
  // Apply the font size
  applyFontSize(randomFontSize);
  
  // Update the radio button selection in the modal
  const fontSizeRadio = document.querySelector('input[name="fontSize"][value="' + randomFontSize + '"]');
  if (fontSizeRadio) {
    fontSizeRadio.checked = true;
  }
}
