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
const FONT_FAMILIES = {
  "buka-bird": "Buka Bird",
  fredoka: "Fredoka",
  poppins: "Poppins",
  roboto: "Roboto",
  "open-sans": "Open Sans",
  lato: "Lato",
  montserrat: "Montserrat",
  raleway: "Raleway",
  nunito: "Nunito",
  playfair: "Playfair Display",
  oswald: "Oswald",
  ubuntu: "Ubuntu",
  "josefin-sans": "Josefin Sans",
  "josefin-slab": "Josefin Slab",
  merriweather: "Merriweather",
  quicksand: "Quicksand",
  comfortaa: "Comfortaa",
  cabin: "Cabin",
  karla: "Karla",
  lobster: "Lobster",
  bangers: "Bangers",
  "indie-flower": "Indie Flower",
  caveat: "Caveat",
  "amatic-sc": "Amatic SC",
  anton: "Anton",
  "maven-pro": "Maven Pro",
  ptsans: "PT Sans",
  "ptsans-narrow": "PT Sans Narrow",
  "ptsans-caption": "PT Sans Caption",
  serif: "PT Serif",
  oxygen: "Oxygen",
  inconsolata: "Inconsolata",
  "noto-sans": "Noto Sans",
  "noto-serif": "Noto Serif",
  varela: "Varela",
  "varela-round": "Varela Round",
  exo: "Exo",
  "exo-2": "Exo 2",
  "fjalla-one": "Fjalla One",
  orbitron: "Orbitron",
  rajdhani: "Rajdhani",
  teko: "Teko",
  "fira-sans": "Fira Sans",
  "fira-mono": "Fira Mono",
  audiowide: "Audiowide",
  boogaloo: "Boogaloo",
  "press-start-2p": "Press Start 2P",
  "titan-one": "Titan One",
  syncopate: "Syncopate"
};

function loadFontCatalog() {
  const fontLink = document.getElementById("google-fonts-link");
  if (!fontLink) return;
  const families = [...new Set(Object.values(FONT_FAMILIES))]
    .filter((family) => family !== FONT_FAMILIES["buka-bird"]);
  fontLink.href = `https://fonts.googleapis.com/css2?${families
    .map((family) => `family=${encodeURIComponent(family).replace(/%20/g, "+")}`)
    .join("&")}&display=swap`;
}
const SEARCH_HISTORY_KEY = "searchHistory";
const ARCHIVED_FOLDERS_KEY = "archivedFolders";
const BOOKMARK_ROOT_ID_KEY = "bookmarkRootFolderId";

function getArchivedFolders() {
  return safeLocalStorageGet(ARCHIVED_FOLDERS_KEY, [], (value) =>
    Array.isArray(value) && value.every((folder) => typeof folder === "string")
  );
}

function saveArchivedFolders(folders) {
  try {
    localStorage.setItem(ARCHIVED_FOLDERS_KEY, JSON.stringify(folders));
  } catch (e) {
    console.error("Failed to save archived folders:", e);
  }
}

function isFolderArchived(folderName) {
  return getArchivedFolders().indexOf(folderName) !== -1;
}

function toggleFolderArchive(folderName) {
  const folders = getArchivedFolders();
  const idx = folders.indexOf(folderName);
  if (idx === -1) folders.push(folderName);
  else folders.splice(idx, 1);
  saveArchivedFolders(folders);
}
const USAGE_PATTERNS_KEY = "usagePatterns";

/**
 * Add a search term to the persistent search history
 * @param {string} term - The search term to add
 */
function addToSearchHistory(term) {
  if (!term || term.trim() === '') return;
  
  term = term.trim();
  const history = getSearchHistory();
  
  const existingEntry = history.find(item => item.term === term);
  if (existingEntry) {
    existingEntry.count++;
    existingEntry.timestamp = Date.now();
  } else {
    history.push({
      term: term,
      count: 1,
      timestamp: Date.now()
    });

  }
  
  // Keep only the last 10 searches
  if (history.length > 10) {
    history.splice(0, history.length - 10);
  }
  
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

const pinnedSet = new Set(safeLocalStorageGet(PINS_KEY, [], (value) =>
  Array.isArray(value) && value.every((url) => typeof url === "string")
));
let isShowingPins = false;
let activeFilterKind = null;
let activeFilterValue = null;
const tagsByUrl = safeLocalStorageGet(TAGS_KEY, {}, (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value) &&
  Object.values(value).every((tags) => Array.isArray(tags) && tags.every((tag) => typeof tag === "string"))
);
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
  clearManualWorkModeOverride();
  document.body.classList.remove("work-mode-active");
  isShowingPins = false;
  activeFilterKind = "tag";
  activeFilterValue = tag.toLowerCase();
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
  updateFilterToolbarState();
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
  try {
    localStorage.setItem(TAGS_KEY, JSON.stringify(tagsByUrl));
  } catch (e) {
    console.error("Failed to save bookmark tags:", e);
  }
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

function showMissingBookmarkRoot(items) {
  const onboarding = document.getElementById("missing-bookmark-root");
  const select = document.getElementById("bookmark-root-folder-select");
  const error = document.getElementById("bookmark-root-folder-error");
  const loading = document.getElementById("loading-indicator");
  if (loading) loading.classList.add("hidden");
  if (!onboarding || !select) return;
  select.replaceChildren();
  const folders = (items[0]?.children || []).filter((node) => Array.isArray(node.children));
  folders.forEach((folder) => {
    const option = document.createElement("option");
    option.value = String(folder.id);
    option.textContent = folder.title || "Untitled folder";
    select.appendChild(option);
  });
  if (!folders.length) {
    if (error) error.textContent = "No bookmark folders are available. Create a folder in your browser's bookmark manager, then reload this page.";
  } else if (error) {
    error.textContent = "";
    const savedId = localStorage.getItem(BOOKMARK_ROOT_ID_KEY);
    if (folders.some((folder) => String(folder.id) === savedId)) select.value = savedId;
  }
  onboarding.hidden = false;
}

document.addEventListener("DOMContentLoaded", function() {
  const onboarding = document.getElementById("missing-bookmark-root");
  const select = document.getElementById("bookmark-root-folder-select");
  const save = document.getElementById("bookmark-root-folder-save");
  const error = document.getElementById("bookmark-root-folder-error");
  if (save && select) {
    save.addEventListener("click", function() {
      if (!select.value) {
        if (error) error.textContent = "Choose an available bookmark folder first.";
        return;
      }
      localStorage.setItem(BOOKMARK_ROOT_ID_KEY, select.value);
      if (onboarding) onboarding.hidden = true;
      refreshBookmarks();
    });
  }
});

chrome.bookmarks.getTree((items) => {
  try {
    console.log("[Stitch] getTree callback started");
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
    
    console.log("[Stitch] Main content shown, container:", !!container);
    
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
    const bookmarksBar = findBookmarkRoot(
      items,
      options.ROOT_FOLDER,
      localStorage.getItem(BOOKMARK_ROOT_ID_KEY)
    );

    if (!bookmarksBar) {
      showMissingBookmarkRoot(items);
      return;
    }
    document.getElementById("missing-bookmark-root").hidden = true;

    // Separate root bookmarks (bookmarks at root level) from folders
    const rootBookmarks = bookmarksBar.children.filter((node) => !node.children);
    const rootFolders = bookmarksBar.children.filter((node) => !!node.children && !isFolderArchived(node.title));

    // Create root column with title "/" for root-level bookmarks
    const rootColumn = {
      title: "/",
      children: [],
      folderId: bookmarksBar.id,
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
        folderId: node.id,
      };

      visit(column, node);

      columns.push(column);
    });

    currentColumns = columns;
    // Set flag to indicate bookmarks have been loaded
    bookmarksLoaded = true;
    
    console.log("[Stitch] Bookmarks loaded, columns:", columns.length, "rootBookmarks:", rootBookmarks.length, "rootFolders:", rootFolders.length);
    
    // Set default sort preference to "frequency" if not already set
    if (!localStorage.getItem(SORT_PREFERENCE_KEY)) {
      localStorage.setItem(SORT_PREFERENCE_KEY, "frequency");
    }
    // Update visit counts first, then render after counts are available
    updateVisitCounts(() => {
      console.log("[Stitch] updateVisitCounts callback, rendering bookmarks");
      updateDuplicates();
      autoTagAll();
      renderCurrent();
      console.log("[Stitch] renderCurrent called");
      generateFilterButtons(rootFolders);
      updateSortButton();
      autoApplyWorkMode();
      updateCloseAllVisibility();
      updateWorkModeButton();
    });
  } catch (e) {
    console.error("[Stitch] bookmarks init failed", e);
  }
});

function refreshBookmarks() {
  columns.length = 0;
  chrome.bookmarks.getTree((items) => {
    const bookmarksBar = findBookmarkRoot(
      items,
      options.ROOT_FOLDER,
      localStorage.getItem(BOOKMARK_ROOT_ID_KEY)
    );

    if (!bookmarksBar) {
      showMissingBookmarkRoot(items);
      return;
    }
    document.getElementById("missing-bookmark-root").hidden = true;

    // Separate root bookmarks (bookmarks at root level) from folders
    const rootBookmarks = bookmarksBar.children.filter((node) => !node.children);
    const rootFolders = bookmarksBar.children.filter((node) => !!node.children && !isFolderArchived(node.title));

    // Create root column with title "/" for root-level bookmarks
    const rootColumn = {
      title: "/",
      children: [],
      folderId: bookmarksBar.id,
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
        folderId: node.id,
      };

      visit(column, node);

      columns.push(column);
    });

    currentColumns = columns;
    bookmarksLoaded = true;
    updateVisitCounts();
    updateDuplicates();
    autoTagAll();
    renderCurrent();
    generateFilterButtons(rootFolders);
    updateSortButton();
    updateCloseAllVisibility();
    updateWorkModeButton();
    autoApplyWorkMode();
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
  if (!node.url || !isSafeBookmarkUrl(node.url)) return;
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
    parentId: node.parentId,
    index: node.index,
    manualOrder: column.children.length,
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
  let source, target;
  columns.forEach((col) => {
    col.children.forEach((bm) => {
      if (!source && bm.url === srcUrl) source = bm;
      if (!target && bm.url === dstUrl) target = bm;
    });
  });
  if (!source?.id || source.id === target?.id || !target?.parentId || !Number.isInteger(target.index)) return;
  moveBookmarkInBrowser(source.id, target.parentId, target.index, source.parentId, source.index);
}
window.moveBookmark = moveBookmark;

function moveBookmarkInBrowser(bookmarkId, parentId, index, sourceParentId, sourceIndex) {
  if (!chrome.bookmarks || !bookmarkId || !parentId) {
    console.error("Cannot move bookmark: bookmark API or destination is unavailable.");
    return;
  }

  const destination = { parentId: String(parentId) };
  if (Number.isInteger(index)) {
    destination.index = sourceParentId === parentId && Number.isInteger(sourceIndex) && sourceIndex < index
      ? index - 1
      : index;
  }

  chrome.bookmarks.move(String(bookmarkId), destination, () => {
    const error = chrome.runtime && chrome.runtime.lastError;
    if (error) {
      console.error("Failed to move bookmark:", error.message);
      if (typeof showToast === "function") showToast(`Could not move bookmark: ${error.message}`, "error");
      return;
    }
    refreshBookmarks();
  });
}
window.moveBookmarkInBrowser = moveBookmarkInBrowser;

function exportBookmarksToFile() {
  try {
    const data = JSON.stringify({
      format: "hello-stitch-bookmarks",
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmarks: createBookmarkExport(),
    }, null, 2);
    downloadBackup(data, "hello-stitch-bookmarks.json");
  } catch (e) {
    console.error("Bookmark export failed", e);
    alert(`Bookmark export failed: ${e.message}`);
  }
}

function exportFullBackupToFile() {
  try {
    const settings = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== BOOKMARK_ROOT_ID_KEY) settings[key] = localStorage.getItem(key);
    }
    const data = JSON.stringify({
      format: "hello-stitch-full-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmarks: createBookmarkExport(),
      settings,
    }, null, 2);
    downloadBackup(data, "hello-stitch-full-backup.json");
  } catch (e) {
    console.error("Full backup export failed", e);
    alert(`Full backup export failed: ${e.message}`);
  }
}

function createBookmarkExport() {
  return columns.map((column) => ({
    title: column.title,
    children: column.children.map((bookmark, manualOrder) => ({
      title: bookmark.title,
      url: bookmark.url,
      path: [...(bookmark.path || [])],
      manualOrder,
    })),
  }));
}

function downloadBackup(data, filename) {
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

let pendingBookmarkBackup = null;

function updateBookmarkImportRestoreUi(isFullBackup) {
  const restoreSettings = document.getElementById("bookmark-import-restore-settings");
  const warning = document.getElementById("bookmark-import-restore-warning");
  const confirmButton = document.getElementById("bookmark-import-confirm");
  const shouldRestoreSettings = isFullBackup && restoreSettings.checked;
  warning.hidden = !shouldRestoreSettings;
  confirmButton.textContent = shouldRestoreSettings ? "Merge & Restore Settings" : "Merge Bookmarks";
}

async function previewImportFromJson(json, requireFullBackup = false) {
  try {
    if (!chrome.bookmarks) throw new Error("Bookmark access is unavailable.");
    const backup = parseBookmarkBackup(JSON.parse(String(json)));
    if (requireFullBackup && !backup.isFullBackup) {
      throw new Error("Choose a full Hello Stitch backup to restore settings.");
    }
    const tree = await new Promise((resolve, reject) => {
      chrome.bookmarks.getTree((result) => {
        const error = chrome.runtime && chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve(result);
      });
    });
    const rootId = localStorage.getItem(BOOKMARK_ROOT_ID_KEY);
    const preview = analyzeBookmarkImport(backup.bookmarks, tree, options.ROOT_FOLDER, rootId);
    const stats = preview.stats;
    pendingBookmarkBackup = backup;
    const dialog = document.getElementById("bookmark-import-preview-modal");
    const summary = document.getElementById("bookmark-import-preview-summary");
    const counts = document.getElementById("bookmark-import-preview-counts");
    const items = document.getElementById("bookmark-import-preview-items");
    const settingsOption = document.getElementById("bookmark-import-settings-option");
    const restoreSettings = document.getElementById("bookmark-import-restore-settings");
    const error = document.getElementById("bookmark-import-preview-error");
    const totalBookmarks = backup.bookmarks.reduce((count, column) => count + column.children.length, 0);
    summary.textContent = `This backup contains ${totalBookmarks} bookmark${totalBookmarks === 1 ? "" : "s"}. Review the merge before applying it.`;
    counts.replaceChildren();
    [
      [`New bookmarks`, stats.created],
      [`Titles to update`, stats.updated],
      [`Already present`, stats.unchanged],
      [`Copies that will remain in other folders`, stats.duplicatesElsewhere],
    ].forEach(([label, count]) => {
      const item = document.createElement("li");
      item.textContent = `${count}: ${label}`;
      counts.appendChild(item);
    });
    items.replaceChildren();
    preview.items.slice(0, 50).forEach((bookmark) => {
      const item = document.createElement("div");
      item.className = "import-preview-item";
      const folderPath = bookmark.path.filter(Boolean).join(" / ") || "/";
      item.textContent = `${bookmark.action}: ${folderPath} — ${bookmark.title} (${bookmark.url})`;
      items.appendChild(item);
    });
    if (preview.items.length > 50) {
      const more = document.createElement("div");
      more.className = "import-preview-item";
      more.textContent = `Preview limited to the first 50 of ${preview.items.length} bookmarks.`;
      items.appendChild(more);
    }
    settingsOption.hidden = !backup.isFullBackup;
    restoreSettings.checked = backup.isFullBackup;
    updateBookmarkImportRestoreUi(backup.isFullBackup);
    error.textContent = "";
    dialog.classList.add("active");
    dialog.setAttribute("aria-hidden", "false");
    return true;
  } catch (e) {
    console.error("Import preview failed", e);
    alert(`Could not prepare import: ${e.message}`);
    return false;
  }
}

async function confirmBookmarkImport() {
  if (!pendingBookmarkBackup) return;
  const backup = pendingBookmarkBackup;
  const confirmButton = document.getElementById("bookmark-import-confirm");
  const error = document.getElementById("bookmark-import-preview-error");
  confirmButton.disabled = true;
  error.textContent = "";
  try {
    const stats = await importBookmarksToBrowser(
      backup.bookmarks,
      chrome.bookmarks,
      chrome.runtime,
      options.ROOT_FOLDER,
      localStorage.getItem(BOOKMARK_ROOT_ID_KEY)
    );
    const restoreSettings = backup.isFullBackup &&
      document.getElementById("bookmark-import-restore-settings").checked;
    closeImportPreview();
    refreshBookmarks();
    if (restoreSettings) {
      const currentRootId = localStorage.getItem(BOOKMARK_ROOT_ID_KEY);
      localStorage.clear();
      Object.entries(backup.settings).forEach(([key, value]) => {
        if (key !== BOOKMARK_ROOT_ID_KEY) localStorage.setItem(key, value);
      });
      if (currentRootId) localStorage.setItem(BOOKMARK_ROOT_ID_KEY, currentRootId);
      window.location.reload();
      return;
    }
    alert(`Merge complete: ${stats.created} added, ${stats.updated} titles updated, ${stats.unchanged} already present.`);
  } catch (e) {
    console.error("Bookmark merge failed", e);
    const partial = e.processedCount
      ? ` ${e.processedCount} entries were processed before the error; some changes may already be saved. Cancel and reopen the preview to review the current state before retrying.`
      : "";
    error.textContent = `Merge failed: ${e.message}.${partial}`;
  } finally {
    confirmButton.disabled = false;
  }
}

function closeImportPreview() {
  const dialog = document.getElementById("bookmark-import-preview-modal");
  if (dialog) {
    dialog.classList.remove("active");
    dialog.setAttribute("aria-hidden", "true");
  }
  updateBookmarkImportRestoreUi(false);
  pendingBookmarkBackup = null;
}

function readImportFile(file, requireFullBackup) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    void previewImportFromJson(reader.result, requireFullBackup);
  };
  reader.onerror = () => {
    console.error("Failed to read bookmark import file:", reader.error);
    alert("Import failed: the selected file could not be read.");
  };
  reader.readAsText(file);
}

function sortBookmarks(bookmarksArray, sortBy) {
  if (sortBy === "manual") return sortBookmarksInManualOrder(bookmarksArray);
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

const openedBookmarkTabIds = new Set();
const openedBookmarkWindows = new Set();
if (window.chrome && chrome.tabs && chrome.tabs.onRemoved) {
  chrome.tabs.onRemoved.addListener((tabId) => openedBookmarkTabIds.delete(tabId));
} else if (window.browser && browser.tabs && browser.tabs.onRemoved) {
  browser.tabs.onRemoved.addListener((tabId) => openedBookmarkTabIds.delete(tabId));
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
      chrome.tabs.create({ url: url, active: false }, (tab) => {
        const error = chrome.runtime && chrome.runtime.lastError;
        if (error) {
          console.error("Could not open bookmark tab:", error.message);
          if (typeof showToast === "function") showToast(`Could not open bookmark tab: ${error.message}`, "error");
          return;
        }
        if (tab && Number.isInteger(tab.id)) openedBookmarkTabIds.add(tab.id);
      });
    });
  } else if (window.browser && browser.tabs) {
    // Firefox browser context
    urls.forEach((url) => {
      browser.tabs.create({ url: url, active: false })
        .then((tab) => {
          if (tab && Number.isInteger(tab.id)) openedBookmarkTabIds.add(tab.id);
        })
        .catch((error) => {
          console.error("Could not open bookmark tab:", error);
          if (typeof showToast === "function") showToast(`Could not open bookmark tab: ${error.message}`, "error");
        });
    });
  } else {
    // Fallback for web context
    urls.forEach((url) => {
      const openedWindow = window.open(url, "_blank");
      if (openedWindow) openedBookmarkWindows.add(openedWindow);
    });
  }
}

function closeOpenedBookmarkTabs() {
  const tabIds = Array.from(openedBookmarkTabIds);
  const openWindows = Array.from(openedBookmarkWindows).filter((openedWindow) => !openedWindow.closed);
  const total = tabIds.length + openWindows.length;
  if (!total) {
    if (typeof showToast === "function") showToast("No bookmark tabs opened from this page to close.", "info");
    return;
  }
  if (!confirm(`Close ${total} bookmark tab${total === 1 ? "" : "s"} opened from selected bookmarks? Other tabs will stay open.`)) return;

  const closeWindows = () => {
    openWindows.forEach((openedWindow) => openedWindow.close());
    openedBookmarkWindows.clear();
  };

  if (!tabIds.length) {
    closeWindows();
    if (typeof showToast === "function") showToast(`Closed ${total} bookmark tab${total === 1 ? "" : "s"}.`, "success");
    return;
  }

  if (window.chrome && chrome.tabs) {
    chrome.tabs.remove(tabIds, () => {
      const error = chrome.runtime && chrome.runtime.lastError;
      if (error) {
        console.error("Could not close opened bookmark tabs:", error.message);
        if (typeof showToast === "function") showToast(`Could not close bookmark tabs: ${error.message}`, "error");
        return;
      }
      tabIds.forEach((id) => openedBookmarkTabIds.delete(id));
      closeWindows();
      if (typeof showToast === "function") showToast(`Closed ${total} bookmark tab${total === 1 ? "" : "s"}.`, "success");
    });
  } else if (window.browser && browser.tabs) {
    browser.tabs.remove(tabIds).then(() => {
      tabIds.forEach((id) => openedBookmarkTabIds.delete(id));
      closeWindows();
      if (typeof showToast === "function") showToast(`Closed ${total} bookmark tab${total === 1 ? "" : "s"}.`, "success");
    }).catch((error) => {
      console.error("Could not close opened bookmark tabs:", error);
      if (typeof showToast === "function") showToast(`Could not close bookmark tabs: ${error.message}`, "error");
    });
  } else {
    console.error("Browser tab closing is unavailable in this context.");
    if (typeof showToast === "function") showToast("Browser tab closing is unavailable here.", "error");
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

function getSelectedBookmarkUrls() {
  const selected = window.selectedBookmarks;
  const urls = [];
  columns.forEach((column) => {
    column.children.forEach((bookmark) => {
      const key = bookmark.id ? String(bookmark.id) : bookmark.url;
      if (selected.has(key)) urls.push(bookmark.url);
    });
  });
  return urls;
}

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
  // Settings modal - Export/Import buttons
  const settingsExportBtn = document.getElementById("settings-export-button");
  const settingsExportFullBtn = document.getElementById("settings-export-full-button");
  const settingsImportBtn = document.getElementById("settings-import-button");
  const settingsImportFullBtn = document.getElementById("settings-import-full-button");
  const settingsImportFile = document.getElementById("settings-import-file");
  let requireFullBackup = false;

  // Settings modal - Export button
  if (settingsExportBtn) {
    settingsExportBtn.addEventListener("click", function() {
      exportBookmarksToFile();
    });
  }
  if (settingsExportFullBtn) {
    settingsExportFullBtn.addEventListener("click", exportFullBackupToFile);
  }

  // Settings modal - Import button
  if (settingsImportBtn) {
    settingsImportBtn.addEventListener("click", function() {
      requireFullBackup = false;
      settingsImportFile.accept = ".json,application/json";
      settingsImportFile.click();
    });
  }
  if (settingsImportFullBtn) {
    settingsImportFullBtn.addEventListener("click", function() {
      requireFullBackup = true;
      settingsImportFile.accept = ".json,application/json";
      settingsImportFile.click();
    });
  }

  // Settings modal - Import file change
  if (settingsImportFile) {
    settingsImportFile.addEventListener("change", function(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      readImportFile(file, requireFullBackup);
      e.target.value = "";
    });
  }

  const importPreview = document.getElementById("bookmark-import-preview-modal");
  const importCancel = document.getElementById("bookmark-import-cancel");
  const importConfirm = document.getElementById("bookmark-import-confirm");
  const restoreSettingsToggle = document.getElementById("bookmark-import-restore-settings");
  if (importCancel) importCancel.addEventListener("click", closeImportPreview);
  if (importConfirm) importConfirm.addEventListener("click", () => void confirmBookmarkImport());
  if (restoreSettingsToggle) {
    restoreSettingsToggle.addEventListener("change", function() {
      updateBookmarkImportRestoreUi(Boolean(pendingBookmarkBackup && pendingBookmarkBackup.isFullBackup));
    });
  }
  if (importPreview) {
    importPreview.addEventListener("click", (event) => {
      if (event.target === importPreview) closeImportPreview();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && importPreview?.classList.contains("active")) {
      closeImportPreview();
    }
  });

  const addQuicklinkButton = document.getElementById("add-quicklink-button");
  const quicklinkNameInput = document.getElementById("settings-quicklink-name");
  const quicklinkUrlInput = document.getElementById("settings-quicklink-url");
  const quicklinkCategoryInput = document.getElementById("settings-quicklink-category");
  const quicklinkNewTabInput = document.getElementById("settings-quicklink-new-tab");
  const quicklinkError = document.getElementById("quicklink-error");
  const quicklinkNameError = document.getElementById("quicklink-name-error");
  const quicklinkUrlError = document.getElementById("quicklink-url-error");

  function setQuicklinkError(message) {
    if (quicklinkError) quicklinkError.textContent = message || "";
  }

  function isValidUrl(value) {
    try {
      const hasHttpScheme = /^https?:\/\//i.test(value);
      const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(value);
      const hasHostPort = /^(?:[^/:?#]+|\[[^\]]+\]):\d+(?:[/?#]|$)/.test(value);
      if (hasScheme && !hasHttpScheme && !hasHostPort) return false;
      const normalized = value.match(/^https?:\/\//i) ? value.trim() : "https://" + value.trim();
      const parsed = new URL(normalized);
      return !/\s/.test(value) && !parsed.hostname.includes("%") &&
        (parsed.protocol === "http:" || parsed.protocol === "https:");
    } catch (e) {
      return false;
    }
  }

  function validateQuicklinkInputs(showEmptyErrors = false) {
    const label = quicklinkNameInput?.value.trim() || "";
    const url = quicklinkUrlInput?.value.trim() || "";
    const nameInvalid = !label;
    const urlInvalid = !url || !isValidUrl(url);
    const nameTouched = showEmptyErrors || quicklinkNameInput?.dataset.touched === "true";
    const urlTouched = showEmptyErrors || quicklinkUrlInput?.dataset.touched === "true";
    if (quicklinkNameError) quicklinkNameError.textContent = nameInvalid && nameTouched ? "Enter a button name." : "";
    if (quicklinkUrlError) {
      quicklinkUrlError.textContent = urlInvalid && urlTouched
        ? !url ? "Enter a URL." : "Enter a valid HTTP or HTTPS URL."
        : "";
    }
    quicklinkNameInput?.setAttribute("aria-invalid", String(nameInvalid && nameTouched));
    quicklinkUrlInput?.setAttribute("aria-invalid", String(urlInvalid && urlTouched));
    return !nameInvalid && !urlInvalid;
  }

  if (quicklinkNameInput) {
    quicklinkNameInput.addEventListener("input", function() {
      this.dataset.touched = "true";
      validateQuicklinkInputs();
      setQuicklinkError("");
    });
  }
  if (quicklinkUrlInput) {
    quicklinkUrlInput.addEventListener("input", function() {
      this.dataset.touched = "true";
      validateQuicklinkInputs();
      setQuicklinkError("");
    });
  }

  if (addQuicklinkButton) {
    addQuicklinkButton.addEventListener("click", function() {
      if (quicklinkNameInput) quicklinkNameInput.dataset.touched = "true";
      if (quicklinkUrlInput) quicklinkUrlInput.dataset.touched = "true";
      if (!validateQuicklinkInputs(true)) return;

      const label = quicklinkNameInput ? quicklinkNameInput.value.trim() : "";
      const url = quicklinkUrlInput ? quicklinkUrlInput.value.trim() : "";
      const linkUrl = url.match(/^https?:\/\//i) ? url.trim() : "https://" + url.trim();
      const links = loadCustomQuickLinks();
      links.push({
        label,
        url: linkUrl,
        category: quicklinkCategoryInput?.value.trim() || "General",
        newTab: Boolean(quicklinkNewTabInput?.checked)
      });
      if (!saveCustomQuickLinks(links)) return;
      renderCustomQuickLinks();
      renderCustomQuickLinksList();
      setQuicklinkError("");
      if (quicklinkNameError) quicklinkNameError.textContent = "";
      if (quicklinkUrlError) quicklinkUrlError.textContent = "";

      if (quicklinkNameInput) quicklinkNameInput.value = "";
      if (quicklinkUrlInput) quicklinkUrlInput.value = "";
      if (quicklinkCategoryInput) quicklinkCategoryInput.value = "";
      if (quicklinkNewTabInput) quicklinkNewTabInput.checked = false;
      quicklinkNameInput?.removeAttribute("aria-invalid");
      quicklinkUrlInput?.removeAttribute("aria-invalid");
      if (quicklinkNameInput) quicklinkNameInput.dataset.touched = "false";
      if (quicklinkUrlInput) quicklinkUrlInput.dataset.touched = "false";
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
      featuresModal.setAttribute("aria-hidden", "false");
      featuresCloseButton?.focus();
    });
  }

  // Close features modal
  if (featuresCloseButton && featuresModal) {
    const closeFeatures = function() {
      featuresModal.classList.remove("active");
      featuresModal.setAttribute("aria-hidden", "true");
      featuresInfoButton?.focus();
    };
    featuresCloseButton.addEventListener("click", closeFeatures);
    featuresModal.addEventListener("click", function(e) {
      if (e.target === featuresModal) closeFeatures();
    });
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && featuresModal.classList.contains("active")) {
        e.stopImmediatePropagation();
        closeFeatures();
      }
    });
  }

// Font dropdown functionality - now uses global function

  // Load saved font
  const savedFont = localStorage.getItem(FONT_KEY) || "poppins";
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
    Array.from(document.body.classList)
      .filter((className) => className.startsWith("theme-"))
      .forEach((className) => document.body.classList.remove(className));
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
    searchInput.addEventListener("input", function() {
      if (typeof highlightVisibleBookmarks === "function") highlightVisibleBookmarks(this.value);
      updateFilterToolbarState();
      debouncedFilterBookmarks();
    });
    searchInput.value = "";
  }

  setupMultiSelectListeners();

  const openBtn = document.getElementById("multi-open-button");
  const closeBtn = document.getElementById("multi-close-button");
  if (openBtn) {
    openBtn.addEventListener("click", function() {
      const urls = getSelectedBookmarkUrls();
      if (urls.length) openTabsSafely(urls);
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", clearMultiSelect);
  }

  const quickLinks = [
    { id: "chatgpt-button", url: "https://chat.openai.com/" },
    { id: "grok-button", url: "https://grok.com/" },
    { id: "amazon-button", url: "https://www.amazon.com/" },
    { id: "gemini-button", url: "https://gemini.google.com/" },
    { id: "reddit-button", url: "https://www.reddit.com/" },
    { id: "twitch-button", url: "https://www.twitch.tv/" },
    { id: "youtube-button", url: "https://www.youtube.com/" },
    { id: "instagram-button", url: "https://www.instagram.com/" },
    { id: "facebook-button", url: "https://www.facebook.com/" },
    { id: "notion-button", url: "https://www.notion.so/" },
    { id: "claude-button", url: "https://claude.ai/" },
  ];

  const QUICK_LINK_VISITS_KEY = "quickLinkVisits";
  const MOST_VISITED_QUICKLINKS_KEY = "showMostVisitedQuickLinks";
  const BUILT_IN_QUICKLINK_VISIBILITY_KEY = "builtInQuickLinkVisibility";
  const MOST_VISITED_LIMIT = 5;
  const CUSTOM_QUICKLINK_VISIBLE_LIMIT = 6;
  const MOST_VISITED_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;
  let mostVisitedSites = [];
  let mostVisitedRequestId = 0;

  function loadBuiltInQuickLinkVisibility() {
    const saved = safeLocalStorageGet(BUILT_IN_QUICKLINK_VISIBILITY_KEY, {}, (value) =>
      value !== null && typeof value === "object" && !Array.isArray(value) &&
      Object.values(value).every((visible) => typeof visible === "boolean")
    );
    return Object.fromEntries(quickLinks.map((link) => [link.id, saved[link.id] !== false]));
  }

  function applyBuiltInQuickLinkVisibility() {
    const visibility = loadBuiltInQuickLinkVisibility();
    quickLinks.forEach(function(link) {
      const button = document.getElementById(link.id);
      if (button) button.hidden = !visibility[link.id];
    });
  }

  function renderBuiltInQuickLinkVisibilitySettings() {
    const container = document.getElementById("quicklink-visibility-options");
    if (!container) return;
    const visibility = loadBuiltInQuickLinkVisibility();
    const status = document.getElementById("quicklink-visibility-status");
    container.replaceChildren();
    if (status) status.textContent = "Changes apply immediately.";

    quickLinks.forEach(function(link) {
      const button = document.getElementById(link.id);
      const labelText = button?.getAttribute("aria-label")?.replace(/^Open\s+/, "") || link.id.replace(/-button$/, "");
      const label = document.createElement("label");
      label.className = "quicklink-visibility-option";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = visibility[link.id];
      checkbox.addEventListener("change", function() {
        const nextVisibility = loadBuiltInQuickLinkVisibility();
        nextVisibility[link.id] = checkbox.checked;
        try {
          localStorage.setItem(BUILT_IN_QUICKLINK_VISIBILITY_KEY, JSON.stringify(nextVisibility));
        } catch (error) {
          console.error("Failed to save built-in quick-link visibility:", error);
          checkbox.checked = !checkbox.checked;
          if (status) status.textContent = "Could not save shortcut visibility; the previous setting is unchanged.";
          return;
        }
        applyBuiltInQuickLinkVisibility();
        if (status) status.textContent = `${labelText} ${checkbox.checked ? "shown" : "hidden"}.`;
      });
      label.append(checkbox, document.createTextNode(labelText));
      container.appendChild(label);
    });
  }

  applyBuiltInQuickLinkVisibility();

  function loadMostVisitedPreference() {
    return safeLocalStorageGet(MOST_VISITED_QUICKLINKS_KEY, false, (value) => typeof value === "boolean");
  }

  function getMostVisitedSites() {
    const query = {
      text: "",
      startTime: Date.now() - MOST_VISITED_LOOKBACK_MS,
      maxResults: 1000
    };

    if (typeof browser !== "undefined" && browser.history && typeof browser.history.search === "function") {
      return browser.history.search(query);
    }

    if (typeof chrome !== "undefined" && chrome.history && typeof chrome.history.search === "function") {
      return new Promise(function(resolve, reject) {
        chrome.history.search(query, function(results) {
          const error = chrome.runtime && chrome.runtime.lastError;
          if (error) {
            reject(new Error(error.message || "Browser history could not be read."));
            return;
          }
          resolve(results || []);
        });
      });
    }

    return Promise.reject(new Error("Browser history is unavailable."));
  }

  function getExcludedQuicklinkHosts() {
    const aliasHosts = [
      "chatgpt.com", "chat.openai.com", "gemini.google.com", "notion.site",
      "claude.ai", "amazon.com", "grok.com", "reddit.com", "twitch.tv",
      "youtube.com", "instagram.com", "facebook.com", "notion.so"
    ];
    const urls = quickLinks.map((link) => link.url)
      .concat(loadCustomQuickLinks().map((link) => link.url))
      .concat(aliasHosts.map((host) => `https://${host}/`));
    return new Set(urls.map(function(url) {
      try {
        return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
      } catch (error) {
        return "";
      }
    }).filter(Boolean));
  }

  function isExcludedQuicklinkHost(host, excludedHosts) {
    return Array.from(excludedHosts).some((excludedHost) =>
      host === excludedHost || host.endsWith(`.${excludedHost}`)
    );
  }

  function getFriendlySiteName(host) {
    const knownNames = {
      "app.ontheclock.com": "OnTheClock",
      "behavioralhealthsystems.com": "Behavioral Health Systems",
      "chatgpt.com": "ChatGPT",
      "github.com": "GitHub",
      "google.com": "Google",
      "linkedin.com": "LinkedIn",
      "microsoft.com": "Microsoft",
      "netsmart.com": "Netsmart",
      "notion.so": "Notion",
      "openai.com": "OpenAI",
      "reddit.com": "Reddit",
      "youtube.com": "YouTube"
    };
    if (host.includes("behavioralhealth")) return "Behavioral Health";
    const knownName = Object.entries(knownNames).find(([domain]) =>
      host === domain || host.endsWith(`.${domain}`)
    );
    if (knownName) return knownName[1];

    const labels = host.split(".");
    const secondLevel = labels[labels.length - 2] || host;
    const isCountryCodeDomain = /^(co|com|org|net|gov|ac)$/i.test(secondLevel) && labels.length > 2;
    const domain = isCountryCodeDomain ? labels[labels.length - 3] : secondLevel;
    return domain
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function renderMostVisitedQuickLinks() {
    const quickLinksContainer = document.querySelector(".quick-links");
    if (!quickLinksContainer) return;
    const existingSection = quickLinksContainer.querySelector(".most-visited-category");
    if (existingSection) existingSection.remove();
    if (!loadMostVisitedPreference() || !mostVisitedSites.length) return;

    const excludedHosts = getExcludedQuicklinkHosts();
    const visibleSites = mostVisitedSites
      .filter((site) => !isExcludedQuicklinkHost(site.host, excludedHosts))
      .slice(0, MOST_VISITED_LIMIT);
    if (!visibleSites.length) return;

    const section = document.createElement("section");
    section.className = "custom-quicklink-category most-visited-category";
    section.setAttribute("aria-label", "Frequent sites");
    const heading = document.createElement("h2");
    heading.className = "custom-quicklink-category-title";
    heading.textContent = "Frequent Sites";
    const group = document.createElement("div");
    group.className = "custom-quicklink-category-items";

    visibleSites.forEach(function(site) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-button quick-link-btn most-visited-quicklink";
      button.textContent = site.label;
      button.setAttribute("data-tooltip", `Open ${site.host}`);
      button.setAttribute("aria-label", `Open ${site.host}`);
      button.title = site.host;
      button.addEventListener("click", function() {
        window.location.href = site.url;
      });
      group.appendChild(button);
    });

    section.append(heading, group);
    quickLinksContainer.appendChild(section);
  }

  async function updateMostVisitedQuickLinks() {
    const status = document.getElementById("most-visited-quicklinks-status");
    const requestId = ++mostVisitedRequestId;
    if (!loadMostVisitedPreference()) {
      mostVisitedSites = [];
      renderMostVisitedQuickLinks();
      if (status) status.textContent = "Most visited site buttons are off.";
      return;
    }

    if (status) status.textContent = "Finding your most visited sites…";
    try {
      const historyItems = await getMostVisitedSites();
      if (requestId !== mostVisitedRequestId || !loadMostVisitedPreference()) return;

      const excludedHosts = getExcludedQuicklinkHosts();
      const seenHosts = new Set();
      mostVisitedSites = (historyItems || [])
        .filter((item) => item && typeof item.url === "string" && /^https?:/i.test(item.url))
        .map(function(item) {
          try {
            const parsed = new URL(item.url);
            const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
            return {
              host,
              url: `${parsed.protocol}//${parsed.host}/`,
              visits: Number.isFinite(item.visitCount) ? item.visitCount : 0,
              lastVisitTime: Number.isFinite(item.lastVisitTime) ? item.lastVisitTime : 0
            };
          } catch (error) {
            return null;
          }
        })
        .filter((site) => site && site.host && !isExcludedQuicklinkHost(site.host, excludedHosts))
        .sort((a, b) => b.visits - a.visits || b.lastVisitTime - a.lastVisitTime)
        .filter((site) => {
          if (seenHosts.has(site.host)) return false;
          seenHosts.add(site.host);
          return true;
        })
        .slice(0, MOST_VISITED_LIMIT)
        .map((site) => ({
          ...site,
          label: getFriendlySiteName(site.host)
        }));

      renderMostVisitedQuickLinks();
      if (status) {
        status.textContent = mostVisitedSites.length
          ? `Showing up to ${MOST_VISITED_LIMIT} most-visited sites active within the last 90 days.`
          : "No eligible sites found in your recent browser history.";
      }
    } catch (error) {
      if (requestId !== mostVisitedRequestId) return;
      console.error("Failed to read browser history for most-visited quick links:", error);
      if (status) status.textContent = `Could not load most visited sites: ${error.message}`;
    }
  }

  function getQuickLinkVisits() {
    return safeLocalStorageGet(QUICK_LINK_VISITS_KEY, {}, (value) =>
      value !== null && typeof value === "object" && !Array.isArray(value) &&
      Object.values(value).every((visits) => Number.isFinite(visits) && visits >= 0)
    );
  }

  function saveQuickLinkVisit(url) {
    const visits = getQuickLinkVisits();
    visits[url] = (visits[url] || 0) + 1;
    try {
      localStorage.setItem(QUICK_LINK_VISITS_KEY, JSON.stringify(visits));
    } catch (e) {
      console.error("Failed to save quick-link visit counts:", e);
    }
  }

  function getSortedQuickLinks() {
    const visits = getQuickLinkVisits();
    return quickLinks.slice().sort(function(a, b) {
      return (visits[b.url] || 0) - (visits[a.url] || 0);
    });
  }

  function reorderQuickLinks() {
    const container = document.querySelector(".quick-links");
    if (!container) return;
    const sorted = getSortedQuickLinks();
    sorted.forEach(function(link) {
      const btn = document.getElementById(link.id);
      const firstCustomCategory = container.querySelector(".most-visited-category, .custom-quicklink-category");
      if (btn) container.insertBefore(btn, firstCustomCategory);
    });
  }

  quickLinks.forEach(function(link) {
    const btn = document.getElementById(link.id);
    if (btn) {
      btn.addEventListener("click", function() {
        saveQuickLinkVisit(link.url);
        reorderQuickLinks();
        refreshQuickLinkFavicons();
        window.location.href = link.url;
      });
      const img = btn.querySelector("img.quick-link-favicon");
      if (img && !img.getAttribute("data-favicon-set")) {
        const faviconUrl = getFaviconUrl(link.url);
        if (faviconUrl) {
          img.src = faviconUrl;
        }
        img.setAttribute("data-favicon-set", "true");
      }
    }
  });

  reorderQuickLinks();

  const exportBtn = document.getElementById("export-button");
  if (exportBtn) exportBtn.addEventListener("click", exportBookmarksToFile);

  // Render custom quick links from settings
  renderCustomQuickLinks();
  renderCustomQuickLinksList();
  const mostVisitedToggle = document.getElementById("most-visited-quicklinks-enabled");
  const mostVisitedStatus = document.getElementById("most-visited-quicklinks-status");
  if (mostVisitedToggle) {
    mostVisitedToggle.checked = loadMostVisitedPreference();
    if (mostVisitedStatus && !mostVisitedToggle.checked) {
      mostVisitedStatus.textContent = "Most visited site buttons are off.";
    }
    mostVisitedToggle.addEventListener("change", function() {
      try {
        localStorage.setItem(MOST_VISITED_QUICKLINKS_KEY, String(this.checked));
      } catch (error) {
        console.error("Failed to save most-visited quick-link setting:", error);
        this.checked = loadMostVisitedPreference();
        if (mostVisitedStatus) mostVisitedStatus.textContent = "Could not save this setting; the previous preference is unchanged.";
        return;
      }
      void updateMostVisitedQuickLinks();
    });
  }
  if (loadMostVisitedPreference()) void updateMostVisitedQuickLinks();

  document.addEventListener("keydown", function(e) {
    if (e.target.tagName === "INPUT" || e.target.isContentEditable) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      document.querySelectorAll(".bookmark-checkbox").forEach(function(cb) { if (!cb.checked) cb.click(); });
      e.preventDefault();
    } else if (e.key === "o" && window.selectedBookmarks.size) {
      openTabsSafely(getSelectedBookmarkUrls());
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

  function loadCustomQuickLinks() {
    return safeLocalStorageGet("customQuickLinks", [], (value) =>
      Array.isArray(value) && value.every((link) => {
        if (!link || typeof link.label !== "string" || typeof link.url !== "string") return false;
        try {
          return ["http:", "https:"].includes(new URL(link.url).protocol) &&
            (link.category === undefined || typeof link.category === "string") &&
            (link.newTab === undefined || typeof link.newTab === "boolean");
        } catch (error) {
          return false;
        }
      })
    ).map((link) => ({
      ...link,
      category: link.category?.trim() || "General",
      newTab: link.newTab === true
    }));
  }

  function saveCustomQuickLinks(links) {
    try {
      localStorage.setItem("customQuickLinks", JSON.stringify(links || []));
      return true;
    } catch (e) {
      console.error("Failed to save custom quick links:", e);
      alert("Could not save custom quick links. Check available browser storage.");
      return false;
    }
  }

  function moveCustomQuickLink(fromIndex, toIndex) {
    const links = loadCustomQuickLinks();
    if (fromIndex < 0 || fromIndex >= links.length || toIndex < 0 || toIndex >= links.length || fromIndex === toIndex) return;
    const [moved] = links.splice(fromIndex, 1);
    links.splice(toIndex, 0, moved);
    if (!saveCustomQuickLinks(links)) return;
    renderCustomQuickLinks();
    renderCustomQuickLinksList();
  }

  function renderCustomQuickLinks() {
    const quickLinksContainer = document.querySelector(".quick-links");
    if (!quickLinksContainer) return;
    quickLinksContainer.querySelectorAll(".custom-quicklink-category").forEach((section) => section.remove());
    renderMostVisitedQuickLinks();

    const groupedLinks = new Map();
    loadCustomQuickLinks().forEach((link) => {
      const category = link.category || "General";
      if (!groupedLinks.has(category)) groupedLinks.set(category, []);
      groupedLinks.get(category).push(link);
    });

    let renderedLinkCount = 0;
    groupedLinks.forEach((links, category) => {
      const section = document.createElement("section");
      section.className = "custom-quicklink-category";
      section.setAttribute("aria-label", `${category} quick links`);
      const heading = document.createElement("h2");
      heading.className = "custom-quicklink-category-title";
      heading.textContent = category;
      const group = document.createElement("div");
      group.className = "custom-quicklink-category-items";
      let visibleInCategory = 0;

      links.forEach((link) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "search-button quick-link-btn quick-link-dynamic";
        button.hidden = renderedLinkCount >= CUSTOM_QUICKLINK_VISIBLE_LIMIT;
        button.dataset.quicklinkIndex = String(renderedLinkCount);
        if (!button.hidden) visibleInCategory += 1;
        renderedLinkCount += 1;
        button.setAttribute("data-tooltip", `Open ${link.label}${link.newTab ? " in a new tab" : ""}`);
        button.setAttribute("aria-label", `Open ${link.label}${link.newTab ? " in a new tab" : ""}`);
        const icon = document.createElement("span");
        icon.className = "btn-icon";
        icon.textContent = "🔗";
        button.append(icon, document.createTextNode(` ${link.label}`));
        button.addEventListener("click", function() {
          if (link.newTab) window.open(link.url, "_blank", "noopener,noreferrer");
          else window.location.href = link.url;
        });
        group.appendChild(button);
      });

      section.hidden = visibleInCategory === 0;
      section.append(heading, group);
      quickLinksContainer.appendChild(section);
    });

    if (renderedLinkCount > CUSTOM_QUICKLINK_VISIBLE_LIMIT) {
      let expanded = false;
      const expandButton = document.createElement("button");
      expandButton.type = "button";
      expandButton.className = "search-button quick-link-expand-toggle";
      expandButton.setAttribute("aria-expanded", "false");
      expandButton.textContent = `Show more links (${renderedLinkCount - CUSTOM_QUICKLINK_VISIBLE_LIMIT})`;
      expandButton.addEventListener("click", function() {
        expanded = !expanded;
        quickLinksContainer.querySelectorAll(".quick-link-dynamic").forEach((button) => {
          button.hidden = !expanded && Number(button.dataset.quicklinkIndex) >= CUSTOM_QUICKLINK_VISIBLE_LIMIT;
        });
        quickLinksContainer.querySelectorAll(".custom-quicklink-category:not(.most-visited-category)").forEach((section) => {
          section.hidden = !expanded && !section.querySelector(".quick-link-dynamic:not([hidden])");
        });
        expandButton.setAttribute("aria-expanded", String(expanded));
        expandButton.textContent = expanded
          ? "Show fewer links"
          : `Show more links (${renderedLinkCount - CUSTOM_QUICKLINK_VISIBLE_LIMIT})`;
      });
      quickLinksContainer.appendChild(expandButton);
    }
  }

  function renderCustomQuickLinksList() {
  const listContainer = document.getElementById("custom-quicklinks-list");
  if (!listContainer) return;

  const links = loadCustomQuickLinks();
  if (!links.length) {
    listContainer.innerHTML = "<p class=\"settings-hint\">No custom quick links yet.</p>";
    return;
  }

  const fragment = document.createDocumentFragment();
  links.forEach(function(link, index) {
    const item = document.createElement("div");
    item.className = "custom-quicklink-item";
    item.setAttribute("role", "listitem");
    item.draggable = true;
    item.dataset.index = String(index);
    item.setAttribute("aria-label", `${link.label}, ${link.category}, ${link.newTab ? "opens in new tab" : "opens in current tab"}. Drag to reorder.`);

    const dragHandle = document.createElement("span");
    dragHandle.className = "custom-quicklink-drag-handle";
    dragHandle.textContent = "⠿";
    dragHandle.title = "Drag to reorder";
    dragHandle.setAttribute("aria-hidden", "true");
    const details = document.createElement("div");
    details.className = "custom-quicklink-details";
    const name = document.createElement("strong");
    name.textContent = link.label;
    const metadata = document.createElement("span");
    metadata.textContent = `${link.category} · ${link.newTab ? "New tab" : "Current tab"}`;
    const url = document.createElement("span");
    url.className = "custom-quicklink-url";
    url.textContent = link.url;
    const newTabLabel = document.createElement("label");
    newTabLabel.className = "custom-quicklink-new-tab-option";
    const newTabCheckbox = document.createElement("input");
    newTabCheckbox.type = "checkbox";
    newTabCheckbox.checked = link.newTab;
    newTabCheckbox.setAttribute("aria-label", `Open ${link.label} in a new tab`);
    newTabCheckbox.addEventListener("change", () => {
      const currentLinks = loadCustomQuickLinks();
      if (!currentLinks[index]) return;
      currentLinks[index].newTab = newTabCheckbox.checked;
      if (!saveCustomQuickLinks(currentLinks)) {
        newTabCheckbox.checked = link.newTab;
        return;
      }
      renderCustomQuickLinks();
      metadata.textContent = `${link.category} · ${newTabCheckbox.checked ? "New tab" : "Current tab"}`;
      link.newTab = newTabCheckbox.checked;
    });
    newTabLabel.append(newTabCheckbox, document.createTextNode(" Open in new tab"));
    details.append(name, metadata, url, newTabLabel);

    const controls = document.createElement("div");
    controls.className = "custom-quicklink-controls";
    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.className = "settings-button settings-button-secondary";
    upButton.textContent = "↑";
    upButton.title = "Move up";
    upButton.setAttribute("aria-label", `Move ${link.label} up`);
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => moveCustomQuickLink(index, index - 1));

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.className = "settings-button settings-button-secondary";
    downButton.textContent = "↓";
    downButton.title = "Move down";
    downButton.setAttribute("aria-label", `Move ${link.label} down`);
    downButton.disabled = index === links.length - 1;
    downButton.addEventListener("click", () => moveCustomQuickLink(index, index + 1));

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "settings-button settings-button-secondary remove-quicklink-button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${link.label}`);
    removeButton.addEventListener("click", function() {
      const currentLinks = loadCustomQuickLinks();
      currentLinks.splice(index, 1);
      if (!saveCustomQuickLinks(currentLinks)) return;
      renderCustomQuickLinks();
      renderCustomQuickLinksList();
      renderBuiltInQuickLinkVisibilitySettings();
    });

    controls.append(upButton, downButton, removeButton);
    item.append(dragHandle, details, controls);
    fragment.appendChild(item);
  });
  listContainer.replaceChildren(fragment);

  listContainer.querySelectorAll(".custom-quicklink-item").forEach((item) => {
    item.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", item.dataset.index);
      event.dataTransfer.effectAllowed = "move";
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
    item.addEventListener("dragover", (event) => event.preventDefault());
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      const fromIndex = Number(event.dataTransfer.getData("text/plain"));
      let toIndex = Number(item.dataset.index);
      const rect = item.getBoundingClientRect();
      if (event.clientY > rect.top + rect.height / 2) toIndex += 1;
      if (fromIndex < toIndex) toIndex -= 1;
      toIndex = Math.max(0, Math.min(toIndex, loadCustomQuickLinks().length - 1));
      moveCustomQuickLink(fromIndex, toIndex);
    });
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"'`]/g, function(match) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;'
    }[match];
  });
}

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

  // Search History and Smart Suggestions initialization
  const searchHistoryToggle = document.getElementById("search-history-toggle");
  const smartSuggestionsToggle = document.getElementById("smart-suggestions-toggle");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  if (searchHistoryToggle) {
    searchHistoryToggle.addEventListener("click", function(e) {
      e.stopPropagation();
      this.classList.toggle("active");
      const panel = document.getElementById("search-history-panel");
      if (panel) {
        panel.classList.toggle("visible");
        if (panel.classList.contains("visible")) {
          updateSearchHistoryUI();
        }
      }
    });
  }

  if (smartSuggestionsToggle) {
    smartSuggestionsToggle.addEventListener("click", function(e) {
      e.stopPropagation();
      this.classList.toggle("active");
      const panel = document.getElementById("smart-suggestions-panel");
      if (panel) {
        panel.classList.toggle("visible");
        if (panel.classList.contains("visible")) {
          updateSmartSuggestionsUI();
        }
      }
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      if (confirm("Clear all search history?")) {
        clearSearchHistory();
        showToast("Search history cleared", "success");
      }
    });
  }

  // Close panels when clicking outside
  document.addEventListener("click", function(e) {
    const searchPanel = document.getElementById("search-history-panel");
    const suggestionsPanel = document.getElementById("smart-suggestions-panel");
    if (searchPanel && !searchPanel.contains(e.target) && e.target !== searchHistoryToggle) {
      searchPanel.classList.remove("visible");
      if (searchHistoryToggle) searchHistoryToggle.classList.remove("active");
    }
    if (suggestionsPanel && !suggestionsPanel.contains(e.target) && e.target !== smartSuggestionsToggle) {
      suggestionsPanel.classList.remove("visible");
      if (smartSuggestionsToggle) smartSuggestionsToggle.classList.remove("active");
    }
  });
});

function renderTitleWithUnderline(formattedTitle) {
  const parts = formattedTitle.split(/(<span class="stitch-underline">[\s\S]*?<\/span>)/g);
  return parts.map(function(part, index) {
    const underline = part.match(/^<span class="stitch-underline">([\s\S]*?)<\/span>$/);
    if (underline) {
      return `<span class="stitch-underline">${escapeHtml(underline[1])}</span>`;
    }
    return part
      .split("")
      .map(function(letter, i) { return "<span class=\"stitch-theme color" + (i % 8) + "\">" + escapeHtml(letter) + "</span>"; })
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
  clearManualWorkModeOverride();
  document.body.classList.remove("work-mode-active");
  isShowingPins = false;
  const input = document.getElementById("search-input").value.trim().toLowerCase();
  activeFilterKind = input ? "search" : null;
  activeFilterValue = input || null;
  const normalizedInput = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Add to search history if there's meaningful input
  if (input && input.length > 1) {
    addToSearchHistory(input);
  }

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
  updateFilterToolbarState();
}

function filterBy(category) {
  clearManualWorkModeOverride();
  document.body.classList.remove("work-mode-active");
  isShowingPins = false;
  const cat = category.toLowerCase();
  activeFilterKind = "folder";
  activeFilterValue = cat;
  
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
  updateFilterToolbarState();
}

// Search History Management
function getSearchHistory() {
  return safeLocalStorageGet(SEARCH_HISTORY_KEY, [], (value) =>
    Array.isArray(value) && value.every((item) =>
      item && typeof item.term === "string" &&
      Number.isFinite(item.count) && Number.isFinite(item.timestamp)
    )
  );
}

function clearSearchHistory() {
  localStorage.setItem(SEARCH_HISTORY_KEY, "[]");
  updateSearchHistoryUI();
}

function updateSearchHistoryUI() {
  const historyContainer = document.getElementById("search-history-container");
  if (!historyContainer) return;
  
  const history = getSearchHistory();
  historyContainer.innerHTML = "";
  
  if (history.length === 0) {
    historyContainer.innerHTML = '<div class="empty-history">No search history yet</div>';
    return;
  }
  
  history.forEach(item => {
    const historyItem = document.createElement("div");
    historyItem.className = "search-history-item";
    const term = document.createElement("span");
    term.className = "history-term";
    term.dataset.term = item.term;
    term.textContent = item.term;
    const count = document.createElement("span");
    count.className = "history-count";
    count.textContent = item.count > 1 ? `${item.count} searches` : "1 search";
    const clearButton = document.createElement("button");
    clearButton.className = "history-clear-btn";
    clearButton.dataset.term = item.term;
    clearButton.title = "Clear from history";
    clearButton.textContent = "×";
    historyItem.append(term, count, clearButton);

    term.addEventListener("click", function() {
      document.getElementById("search-input").value = this.dataset.term;
      filterBookmarks();
    });

    clearButton.addEventListener("click", function(e) {
      e.stopPropagation();
      removeFromSearchHistory(this.dataset.term);
    });
    
    historyContainer.appendChild(historyItem);
  });
}

function removeFromSearchHistory(term) {
  const history = getSearchHistory();
  const filtered = history.filter(item => item.term !== term);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
  updateSearchHistoryUI();
}

function updateSearchHistoryToggle() {
  const toggleBtn = document.getElementById("search-history-toggle");
  if (!toggleBtn) return;
  
  const history = getSearchHistory();
  toggleBtn.classList.toggle("has-history", history.length > 0);
}

// Usage Patterns Management
function recordUsagePattern(bookmarkUrl) {
  if (!bookmarkUrl) return;
  const patterns = getUsagePatterns();
  
  if (!patterns[bookmarkUrl]) {
    patterns[bookmarkUrl] = { accessCount: 0, lastAccessed: Date.now() };
  }
  
  patterns[bookmarkUrl].accessCount++;
  patterns[bookmarkUrl].lastAccessed = Date.now();
  
  // Keep only most accessed bookmarks (top 50)
  const sorted = Object.entries(patterns)
    .sort((a, b) => b[1].accessCount - a[1].accessCount)
    .slice(0, 50)
    .reduce((acc, [url, data]) => {
      acc[url] = data;
      return acc;
    }, {});
  
  localStorage.setItem(USAGE_PATTERNS_KEY, JSON.stringify(sorted));
}

function getUsagePatterns() {
  return safeLocalStorageGet(USAGE_PATTERNS_KEY, {}, (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.values(value).every((pattern) =>
      pattern && typeof pattern === "object" &&
      Number.isFinite(pattern.accessCount) && Number.isFinite(pattern.lastAccessed)
    )
  );
}

function getSmartSuggestions() {
  const history = getSearchHistory();
  const patterns = getUsagePatterns();
  const suggestions = [];
  
  // Get top recent searches
  const recentSearches = history.slice(0, 3).map(item => item.term);
  
  // Get most accessed bookmarks
  const recentAccesses = Object.entries(patterns)
    .sort((a, b) => b[1].lastAccessed - a[1].lastAccessed)
    .slice(0, 5)
    .map(([url]) => url);
  
  // Add recent searches to suggestions
  recentSearches.forEach(term => {
    suggestions.push({ type: 'search', term });
  });
  
  // Add frequently accessed bookmarks
  recentAccesses.forEach(url => {
    const bookmark = columns.flatMap(col => col.children).find(bm => bm.url === url);
    if (bookmark) {
      suggestions.push({ type: 'bookmark', bookmark });
    }
  });
  
  // Deduplicate while preserving order
  const seen = new Set();
  return suggestions.filter(suggestion => {
    const key = suggestion.type === 'search' ? suggestion.term : suggestion.bookmark.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6); // Limit to 6 suggestions
}

function updateSmartSuggestionsUI() {
  const suggestionsContainer = document.getElementById("smart-suggestions-container");
  if (!suggestionsContainer) return;
  
  const suggestions = getSmartSuggestions();
  suggestionsContainer.innerHTML = "";
  
  if (suggestions.length === 0) {
    suggestionsContainer.innerHTML = '<div class="empty-suggestions">No suggestions yet</div>';
    return;
  }
  
  suggestions.forEach(suggestion => {
    const suggestionEl = document.createElement("div");
    suggestionEl.className = "smart-suggestion";
    
    if (suggestion.type === 'search') {
      const icon = document.createElement("span");
      icon.className = "suggestion-icon";
      icon.textContent = "🔍";
      const text = document.createElement("span");
      text.className = "suggestion-text";
      text.textContent = `Search for "${suggestion.term}"`;
      suggestionEl.append(icon, text);
      suggestionEl.addEventListener('click', function() {
        document.getElementById("search-input").value = suggestion.term;
        filterBookmarks();
      });
    } else {
      const favicon = document.createElement("img");
      favicon.className = "suggestion-favicon";
      favicon.alt = "";
      const faviconUrl = suggestion.bookmark.faviconUrl || getFaviconUrl(suggestion.bookmark.url);
      if (faviconUrl) favicon.src = faviconUrl;
      else favicon.style.display = "none";
      const info = document.createElement("div");
      info.className = "suggestion-info";
      const title = document.createElement("span");
      title.className = "suggestion-title";
      title.textContent = suggestion.bookmark.title;
      const url = document.createElement("span");
      url.className = "suggestion-url";
      url.textContent = suggestion.bookmark.url.replace(/^https?:\/\//, "");
      info.append(title, url);
      suggestionEl.append(favicon, info);
      suggestionEl.addEventListener('click', function() {
        window.open(suggestion.bookmark.url, '_blank');
        // Record usage pattern when bookmark is opened
        recordUsagePattern(suggestion.bookmark.url);
      });
    }
    
    suggestionsContainer.appendChild(suggestionEl);
  });
}

function updateSearchHistoryAndSuggestionsUI() {
  updateSearchHistoryUI();
  updateSmartSuggestionsUI();
}

function showSearchHistoryPanel() {
  const historyPanel = document.getElementById("search-history-panel");
  const searchContainer = document.getElementById("search-container");
  if (!historyPanel || !searchContainer) return;
  
  historyPanel.style.display = historyPanel.style.display === 'none' ? 'block' : 'none';
  
  if (historyPanel.style.display === 'block') {
    updateSearchHistoryUI();
  }
}

function showSmartSuggestionsPanel() {
  const suggestionsPanel = document.getElementById("smart-suggestions-panel");
  const searchContainer = document.getElementById("search-container");
  if (!suggestionsPanel || !searchContainer) return;
  
  suggestionsPanel.style.display = suggestionsPanel.style.display === 'none' ? 'block' : 'none';
  
  if (suggestionsPanel.style.display === 'block') {
    updateSmartSuggestionsUI();
  }
}

function filterMostVisited() {
  clearManualWorkModeOverride();
  document.body.classList.remove("work-mode-active");
  isShowingPins = false;
  activeFilterKind = "most-visited";
  activeFilterValue = null;
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
      updateFilterToolbarState();
    });
  } else {
    resetFilters();
  }
  document.body.classList.remove("jobs-hours-active");
}

function filterPinned() {
  clearManualWorkModeOverride();
  document.body.classList.remove("work-mode-active");
  isShowingPins = true;
  activeFilterKind = "pinned";
  activeFilterValue = null;
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
  updateFilterToolbarState();
}

function filterJobsOnly() {
  clearManualWorkModeOverride();
  document.body.classList.remove("work-mode-active");
  isShowingPins = false;
  activeFilterKind = "jobs";
  activeFilterValue = null;
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
  updateFilterToolbarState();
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
    if (config.ariaPressed !== undefined) btn.setAttribute("aria-pressed", String(config.ariaPressed));
    if (config.clickHandler) btn.addEventListener("click", config.clickHandler);
    return btn;
  }

  function renderFolder(folder, depth = 0) {
    if (folder.children && folder.children.length) {
      const details = document.createElement("details");
      details.classList.add("folder-filter");
      details.setAttribute("data-depth", depth);
      const summary = document.createElement("summary");
      summary.textContent = folder.title;
      summary.className = "filter-folder-summary";
      summary.dataset.filterFolder = folder.title.toLowerCase();
      // Add data-depth attribute for CSS-based indentation
      summary.setAttribute("data-depth", depth);
      details.appendChild(summary);

      folder.children.filter(function(child) { return child.children && child.children.length; }).forEach(function(child) {
        details.appendChild(renderFolder(child, depth + 1));
      });

      const button = makeBtn({
        text: "Show \"" + folder.title + "\"",
        extraClasses: ["folder-filter-button"],
        clickHandler: function() { filterBy(folder.title.toLowerCase()); updateCloseAllVisibility(); }
      });
      button.dataset.filterFolder = folder.title.toLowerCase();
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

  const resetButton = makeBtn({ text: "🔄 Reset", title: "Clear search and active filters", extraClasses: ["reset-filter-button"], clickHandler: function() { resetFilters(); updateCloseAllVisibility(); } });
  const closeAllBtn = makeBtn({ id: "close-all-btn", text: "❌ Close All", title: "Collapse all folders", extraClasses: ["close-all-btn"], clickHandler: function() { document.querySelectorAll(".filter-buttons details[open]").forEach(function(d) { d.open = false; }); updateCloseAllVisibility(); } });
  const pinnedButton = makeBtn({ id: "filter-pinned", text: "📌 Pinned", title: "Show only pinned bookmarks", clickHandler: function() { filterPinned(); updateCloseAllVisibility(); } });
  const clearPinsButton = makeBtn({ id: "clear-pins", text: "🗑️ Clear Pins", title: "Remove all pinned bookmarks", clickHandler: function() { clearAllPins(); updateCloseAllVisibility(); } });
  const workModeGroup = document.createElement("details");
  workModeGroup.className = "work-mode-filter-group";
  const workModeSummary = document.createElement("summary");
  workModeSummary.textContent = "💼 Work Mode";
  workModeSummary.setAttribute("aria-label", "Work Mode controls");
  workModeGroup.appendChild(workModeSummary);
  const workModeControls = document.createElement("div");
  workModeControls.className = "work-mode-filter-controls";
  const configureWorkModeButton = makeBtn({ id: "configure-work-mode", text: "⚙️ Configure", title: "Configure work mode schedule, hours, and folders", clickHandler: function() { if (typeof showWorkModeModal === "function") showWorkModeModal(columns); } });
  const scheduleWorkModeButton = makeBtn({
    id: "filter-work-mode",
    text: "🗓️ Work Schedule: Off",
    title: "Toggle the automatic Work Mode schedule.",
    clickHandler: toggleWorkMode
  });
  const manualWorkModeButton = makeBtn({
    id: "manual-work-mode-button",
    text: "💼 Work Now: Off",
    title: "Temporarily show selected work folders, independent of the schedule.",
    clickHandler: toggleManualWorkMode
  });

  [configureWorkModeButton, scheduleWorkModeButton, manualWorkModeButton].forEach(function(btn) {
    workModeControls.appendChild(btn);
  });
  workModeGroup.appendChild(workModeControls);
  [workModeGroup, resetButton, clearPinsButton, closeAllBtn].forEach(function(btn) {
    filterButtonsContainer.appendChild(btn);
  });

  updateCloseAllVisibility();
  updateClearPinsVisibility();
  updateWorkModeButton();
  updateFilterToolbarState();
}

function resetFilters() {
  clearManualWorkModeOverride();
  document.body.classList.remove("work-mode-active");
  isShowingPins = false;
  activeFilterKind = null;
  activeFilterValue = null;
  currentColumns = columns;
  clearMultiSelect();
  renderCurrent();
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  document.querySelectorAll(".filter-buttons details[open]").forEach(function(d) { d.open = false; });
  document.body.classList.remove("jobs-hours-active");
  updateFilterToolbarState();
}

function updateFilterToolbarState() {
  const toolbar = document.getElementById("bookmark-filter-dropdown");
  if (!toolbar) return;
  const searchInput = document.getElementById("search-input");
  const hasActiveFilter = Boolean(
    activeFilterKind ||
    (searchInput && searchInput.value.trim()) ||
    isShowingPins ||
    document.body.classList.contains("work-mode-active") ||
    document.body.classList.contains("jobs-hours-active")
  );
  toolbar.classList.toggle("has-active-filter", hasActiveFilter);

  const resetButton = toolbar.querySelector(".reset-filter-button");
  if (resetButton) {
    resetButton.classList.toggle("is-active", hasActiveFilter);
    resetButton.setAttribute("aria-disabled", String(!hasActiveFilter));
  }

  toolbar.querySelectorAll("[data-filter-folder]").forEach(function(element) {
    const selected = activeFilterKind === "folder" && element.dataset.filterFolder === activeFilterValue;
    element.classList.toggle("is-active", selected);
    element.setAttribute("aria-current", selected ? "true" : "false");
    if (element.matches("button")) element.setAttribute("aria-pressed", String(selected));
  });
}

function updateCloseAllVisibility() {
  const closeAllBtn = document.getElementById("close-all-btn");
  if (!closeAllBtn) return;
  closeAllBtn.style.display = document.querySelector(".filter-buttons details.folder-filter[open]") ? "inline-block" : "none";
}

function updateClearPinsVisibility() {
  const clearPinsBtn = document.getElementById("clear-pins");
  if (!clearPinsBtn) return;
  // Show the button only when there are pinned bookmarks
  clearPinsBtn.style.display = pinnedSet.size > 0 ? "inline-block" : "none";
}

document.addEventListener("click", function(e) {
  if (e.target.tagName === "SUMMARY" && e.target.closest(".filter-buttons details.folder-filter")) {
    setTimeout(updateCloseAllVisibility, 10);
  }
});

document.addEventListener("click", function(e) {
  const btn = e.target.closest(".delete-bookmark-btn");
  if (!btn) return;
  e.preventDefault();
  const id = btn.getAttribute("data-bookmark-id");
  const title = btn.closest(".bookmark-item")?.querySelector(".bookmark-link")?.textContent || "this bookmark";
  if (!id) {
    console.error("Cannot delete bookmark without its browser bookmark ID.");
    return;
  }
  if (!confirm(`Delete "${title}"? This removes only this bookmark entry.`)) return;
  removeBookmarkById(chrome.bookmarks, chrome.runtime, id)
    .then(() => refreshBookmarks())
    .catch((error) => {
      console.error("Failed to delete bookmark:", error);
      alert(`Could not delete bookmark: ${error.message}`);
    });
});

// ============================================
// EDIT BOOKMARK FUNCTIONALITY
// ============================================

// Variable to store the current bookmark being edited
let currentEditingBookmarkId = null;

// Function to populate the folder dropdown in the edit modal
function populateEditFolderDropdown(selectedParentId) {
  const folderSelect = document.getElementById("edit-folder");
  if (!folderSelect) return;
  folderSelect.replaceChildren();
  chrome.bookmarks.getTree((items) => {
    const bookmarkRoot = findBookmarkRoot(
      items,
      options.ROOT_FOLDER,
      localStorage.getItem(BOOKMARK_ROOT_ID_KEY)
    );
    if (!bookmarkRoot) return;
    function addFolderOption(folder, path) {
      const option = document.createElement("option");
      option.value = String(folder.id);
      option.textContent = path;
      folderSelect.appendChild(option);
      (folder.children || []).filter((child) => Array.isArray(child.children))
        .forEach((child) => addFolderOption(child, `${path} / ${child.title}`));
    }
    addFolderOption(bookmarkRoot, bookmarkRoot.title || "/");
    if (selectedParentId) folderSelect.value = String(selectedParentId);
  });
}

// Function to open the edit modal with bookmark data
function openEditModal(bookmarkId, url, title) {
  const editModal = document.getElementById("edit-modal");
  const editTitleInput = document.getElementById("edit-title");
  const editUrlInput = document.getElementById("edit-url");
  const editFolderSelect = document.getElementById("edit-folder");
  
  if (!editModal || !editTitleInput || !editUrlInput || !editFolderSelect) {
    console.error("Edit modal elements not found");
    return;
  }
  
  if (!bookmarkId || !chrome.bookmarks) return;
  chrome.bookmarks.get(String(bookmarkId), (results) => {
    const error = chrome.runtime && chrome.runtime.lastError;
    const bookmark = Array.isArray(results) ? results[0] : null;
    if (error || !bookmark || bookmark.url !== url) {
      console.error("Could not find the selected bookmark to edit.", error);
      alert(`Could not find the selected bookmark${error ? `: ${error.message}` : "."}`);
      return;
    }
    currentEditingBookmarkId = bookmark.id;
    editTitleInput.value = title || bookmark.title || "";
    editUrlInput.value = url || bookmark.url || "";
    populateEditFolderDropdown(bookmark.parentId);
    editModal.classList.add("active");
  });
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
    if (!isSafeBookmarkUrl(newUrl)) throw new Error("Unsupported URL scheme");
  } catch (e) {
    alert("Please enter a valid URL");
    return;
  }
  
  if (!currentEditingBookmarkId) {
    console.error("No bookmark ID to update");
    return;
  }
  
  if (!newFolder) {
    alert("Choose a destination bookmark folder.");
    return;
  }
  updateBookmarkAndMove(chrome.bookmarks, chrome.runtime, currentEditingBookmarkId, {
    title: newTitle,
    url: newUrl,
  }, newFolder).then(() => {
    document.getElementById("edit-modal")?.classList.remove("active");
    refreshBookmarks();
  }).catch((error) => {
    console.error("Error updating bookmark:", error);
    alert(`Error updating bookmark: ${error.message}`);
  });
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
    
    const id = editBtn.getAttribute("data-bookmark-id");
    const url = editBtn.getAttribute("data-url");
    const title = editBtn.getAttribute("data-title");
    
    if (id && url) {
      openEditModal(id, url, title);
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

function showAnalytics() {
  const modal = document.getElementById("analytics-modal");
  if (!modal) return;
  initializeAnalyticsModal();

  const allBookmarks = columns.flatMap((column) => column.children || []);
  const folders = new Set();
  columns.forEach((column) => {
    if (column.title && column.title !== "/") folders.add(column.title);
    (column.children || []).forEach((bookmark) => {
      (bookmark.path || []).forEach((folder) => folders.add(folder));
    });
  });

  const invalidBookmarks = allBookmarks.filter((bookmark) => {
    if (!bookmark.url || !isSafeBookmarkUrl(bookmark.url)) return true;
    try {
      const url = new URL(bookmark.url);
      return !["http:", "https:"].includes(url.protocol);
    } catch (error) {
      return true;
    }
  });
  const duplicateUrls = new Set(
    allBookmarks.filter((bookmark) => bookmark.isDuplicate).map((bookmark) => normalizeUrl(bookmark.url))
  );
  const duplicateCount = allBookmarks.filter((bookmark) => bookmark.isDuplicate).length - duplicateUrls.size;
  const validCount = Math.max(0, allBookmarks.length - invalidBookmarks.length);
  const health = allBookmarks.length
    ? Math.max(0, Math.round(((validCount - duplicateCount) / allBookmarks.length) * 100))
    : 0;

  const metricValues = {
    "analytics-total": allBookmarks.length,
    "analytics-folders": folders.size,
    "analytics-broken": invalidBookmarks.length,
    "analytics-duplicates": duplicateCount,
    "analytics-health": `${health}%`
  };
  Object.entries(metricValues).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  });

  const healthValue = document.getElementById("analytics-health");
  if (healthValue) {
    healthValue.classList.remove("health-score-good", "health-score-fair", "health-score-poor");
    healthValue.classList.add(health >= 80 ? "health-score-good" : health >= 50 ? "health-score-fair" : "health-score-poor");
  }

  function renderAnalyticsList(id, entries, emptyMessage, formatEntry) {
    const list = document.getElementById(id);
    if (!list) return;
    list.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "analytics-empty";
      empty.textContent = emptyMessage;
      list.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "analytics-item";
      const label = document.createElement("span");
      label.className = "analytics-item-title";
      label.textContent = entry.label;
      const meta = document.createElement("span");
      meta.className = "analytics-item-meta";
      meta.textContent = entry.meta;
      item.append(label, meta);
      if (formatEntry) formatEntry(item, entry);
      list.appendChild(item);
    });
  }

  const domainCounts = new Map();
  allBookmarks.forEach((bookmark) => {
    try {
      const host = new URL(bookmark.url).hostname.replace(/^www\./i, "");
      if (host) domainCounts.set(host, (domainCounts.get(host) || 0) + 1);
    } catch (error) {
      // Invalid URLs are counted in the health summary, not grouped by domain.
    }
  });
  const topDomains = Array.from(domainCounts, ([label, count]) => ({
    label,
    count,
    meta: `${count} bookmark${count === 1 ? "" : "s"}`
  }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8);
  renderAnalyticsList("analytics-domains", topDomains, "Add bookmarks to see your top domains.");

  const mostVisited = [...allBookmarks]
    .sort((a, b) => (bookmarkVisitCounts[normalizeUrl(b.url)] || 0) - (bookmarkVisitCounts[normalizeUrl(a.url)] || 0))
    .slice(0, 5)
    .filter((bookmark) => (bookmarkVisitCounts[normalizeUrl(bookmark.url)] || 0) > 0)
    .map((bookmark) => ({
      label: bookmark.title || bookmark.url,
      meta: `${bookmarkVisitCounts[normalizeUrl(bookmark.url)]} visits`
    }));
  renderAnalyticsList("analytics-most-visited", mostVisited, "No visit history is available for your bookmarks yet.");

  const datedBookmarks = allBookmarks
    .filter((bookmark) => Number.isFinite(bookmark.dateAdded) && bookmark.dateAdded > 0)
    .map((bookmark) => ({
      label: bookmark.title || bookmark.url,
      dateAdded: bookmark.dateAdded,
      meta: new Date(bookmark.dateAdded).toLocaleDateString()
    }));
  const recent = [...datedBookmarks].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, 5);
  const oldest = [...datedBookmarks].sort((a, b) => a.dateAdded - b.dateAdded).slice(0, 5);
  renderAnalyticsList("analytics-recent", recent, "Bookmark dates will appear here when available.");
  renderAnalyticsList("analytics-oldest", oldest, "Bookmark dates will appear here when available.");
}

function initializeAnalyticsModal() {
  const modal = document.getElementById("analytics-modal");
  const closeButton = document.getElementById("analytics-close");
  const opener = document.getElementById("settings-analytics-button");
  if (!modal || !closeButton || modal.dataset.closeHandlersInitialized === "true") return;

  const close = function() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    opener?.focus();
  };
  closeButton.addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("active")) {
      event.stopImmediatePropagation();
      close();
    }
  });
  modal.dataset.closeHandlersInitialized = "true";
  modal.setAttribute("aria-hidden", "true");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAnalyticsModal, { once: true });
} else {
  initializeAnalyticsModal();
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
  const allowed = ["manual", "frequency", "date", "alphabetical"];
  if (!allowed.includes(sortBy)) return;
  localStorage.setItem(SORT_PREFERENCE_KEY, sortBy);
  const settingsSortSelect = document.getElementById("settings-sort-select");
  if (settingsSortSelect) settingsSortSelect.value = sortBy;
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
let manualWorkModeActive = false;

function applyWorkModeFilter(mode = "scheduled") {
  isShowingPins = false;
  const selected = getSavedWorkModeFolders();
  if (!selected.length) {
    activeFilterKind = null;
    activeFilterValue = null;
    currentColumns = columns;
    clearMultiSelect();
    renderCurrent();
    document.body.classList.remove("work-mode-active");
    document.body.classList.remove("work-mode-manual-active");
    if (mode === "manual") {
      manualWorkModeActive = false;
      updateWorkModeButton();
    }
    updateFilterToolbarState();
    return;
  }

  activeFilterKind = mode === "manual" ? "work-manual" : "work-scheduled";
  activeFilterValue = null;
  const newColumns = filterWorkModeColumns(columns, selected);

  currentColumns = newColumns;
  clearMultiSelect();
  renderCurrent();
  document.body.classList.remove("jobs-hours-active");
  document.body.classList.add("work-mode-active");
  document.body.classList.toggle("work-mode-manual-active", mode === "manual");
  updateFilterToolbarState();
}

function autoApplyWorkMode() {
  if (manualWorkModeActive) {
    applyWorkModeFilter("manual");
    return;
  }

  const workModeFolders = getSavedWorkModeFolders();
  const scheduleEnabled = getWorkModeEnabled();
  const withinWorkHours = typeof isWithinWorkHours === "function" && isWithinWorkHours();

  if (scheduleEnabled && withinWorkHours && workModeFolders.length) {
    applyWorkModeFilter("scheduled");
  } else if (document.body.classList.contains("work-mode-active")) {
    activeFilterKind = null;
    activeFilterValue = null;
    currentColumns = columns;
    clearMultiSelect();
    renderCurrent();
    document.body.classList.remove("work-mode-active");
    document.body.classList.remove("work-mode-manual-active");
    updateFilterToolbarState();
  }
}

function clearManualWorkModeOverride() {
  manualWorkModeActive = false;
  document.body.classList.remove("work-mode-manual-active");
  const button = document.getElementById("manual-work-mode-button");
  if (button) {
    button.textContent = "💼 Work Now: Off";
    button.setAttribute("aria-pressed", "false");
    button.title = "Temporarily show selected work folders, independent of the schedule.";
  }
}

function updateWorkModeButton() {
  const btn = document.getElementById("filter-work-mode");
  const scheduleEnabled = getWorkModeEnabled();
  if (btn) {
    const hasFolders = getSavedWorkModeFolders().length > 0;
    btn.textContent = scheduleEnabled ? "🗓️ Work Schedule: On" : "🗓️ Work Schedule: Off";
    btn.title = scheduleEnabled && !hasFolders
      ? "The schedule is enabled but no folders are selected. Configure Work Mode settings."
      : "Toggle the automatic Work Mode schedule. Configure hours and folders using the Work Mode settings button.";
    btn.setAttribute("aria-pressed", String(scheduleEnabled));
  }

  const manualButton = document.getElementById("manual-work-mode-button");
  if (manualButton) {
    manualButton.textContent = manualWorkModeActive ? "💼 Work Now: On" : "💼 Work Now: Off";
    manualButton.title = manualWorkModeActive
      ? "Turn off the temporary work folder filter."
      : "Temporarily show selected work folders, independent of the schedule.";
    manualButton.setAttribute("aria-pressed", String(manualWorkModeActive));
  }
  
  // Show/hide work mode dependent buttons based on work mode state
  const workModeDependentBtns = document.querySelectorAll(".work-mode-dependent");
  workModeDependentBtns.forEach(function(button) {
    if (button) {
      button.style.display = scheduleEnabled ? "inline-block" : "none";
    }
  });
  updateSettingsWorkModeSummary();
}

function updateSettingsWorkModeSummary() {
  const summary = document.getElementById("settings-work-mode-summary");
  if (!summary) return;

  const config = getWorkHoursConfig();
  const selectedFolders = getSavedWorkModeFolders();
  const selectedDays = [
    ["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"],
    ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]
  ].filter(([day]) => config.days[day]).map(([, label]) => label);
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const everyDay = selectedDays.length === 7;
  const weekdaysOnly = weekdays.every((day) => selectedDays.includes(day)) && selectedDays.length === 5;
  const daysLabel = everyDay ? "Every day" : weekdaysOnly ? "Weekdays" : selectedDays.length ? selectedDays.join(" · ") : "No active days";
  const timeLabel = typeof formatWorkModeTime === "function"
    ? `${formatWorkModeTime(config.startTime)}–${formatWorkModeTime(config.endTime)} ET`
    : `${config.startTime}–${config.endTime} ET`;
  const scheduleStatus = typeof getWorkModeScheduleStatus === "function"
    ? getWorkModeScheduleStatus(getWorkModeEnabled(), selectedFolders.length, config)
    : getWorkModeEnabled() ? "Schedule on" : "Schedule off";
  const manualStatus = manualWorkModeActive ? " Temporary Work Now filter is on." : "";
  summary.textContent = `${scheduleStatus}. ${daysLabel} · ${timeLabel} · ${selectedFolders.length} folder${selectedFolders.length === 1 ? "" : "s"} selected.${manualStatus}`;
}

function updateSortButton() {
  const sortBy = localStorage.getItem(SORT_PREFERENCE_KEY) || "frequency";
  const manualBtn = document.getElementById("sort-manual");
  const frequencyBtn = document.getElementById("sort-frequency");
  const dateBtn = document.getElementById("sort-date");
  const alphabeticalBtn = document.getElementById("sort-alphabetical");

  [frequencyBtn, dateBtn, alphabeticalBtn, manualBtn].forEach(function(btn) {
    if (btn) {
      btn.classList.remove("active-sort");
      btn.style.opacity = "0.7";
    }
  });

  const activeBtn = sortBy === "manual" ? manualBtn : sortBy === "frequency" ? frequencyBtn : sortBy === "date" ? dateBtn : alphabeticalBtn;
  if (activeBtn) {
    activeBtn.classList.add("active-sort");
    activeBtn.style.opacity = "1";
  }
}

function toggleWorkMode() {
  const enableSchedule = !getWorkModeEnabled();
  const hasActiveDays = Object.values(getWorkHoursConfig().days).some(Boolean);
  if (enableSchedule && (!getSavedWorkModeFolders().length || !hasActiveDays)) {
    showWorkModeModal(columns);
    return;
  }

  localStorage.setItem("workModeEnabled", JSON.stringify(enableSchedule));
  updateWorkModeButton();
  autoApplyWorkMode();
}

function toggleManualWorkMode() {
  if (manualWorkModeActive) {
    manualWorkModeActive = false;
    document.body.classList.remove("work-mode-manual-active");
    autoApplyWorkMode();
    updateWorkModeButton();
    return;
  }

  if (!getSavedWorkModeFolders().length) {
    showWorkModeModal(columns);
    return;
  }

  manualWorkModeActive = true;
  applyWorkModeFilter("manual");
  updateWorkModeButton();
}

// Check work mode every minute to automatically apply during configured hours
const workModeIntervalId = setInterval(function() {
  if (getWorkModeEnabled() && getSavedWorkModeFolders().length > 0) {
    autoApplyWorkMode();
  }
}, 60000);

window.addEventListener('unload', function() {
  if (workModeIntervalId) {
    clearInterval(workModeIntervalId);
  }
});

// ===========================================
// SETTINGS MODAL FUNCTIONALITY
// ===========================================

function renderArchivedFoldersList() {
  const container = document.getElementById("archived-folders-list");
  if (!container) return;

  container.innerHTML = "";

  const allFolders = [];
  columns.forEach(function(col) {
    if (col.title && col.title !== "/") {
      allFolders.push(col.title);
    }
  });

  const archived = getArchivedFolders();

  if (!allFolders.length) {
    container.innerHTML = '<p class="settings-hint">No folders found.</p>';
    return;
  }

  allFolders.forEach(function(folderName) {
    const item = document.createElement("div");
    item.className = "settings-archived-item";

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = archived.indexOf(folderName) === -1;
    checkbox.setAttribute("aria-label", `Show ${folderName} in bookmarks`);

    const text = document.createElement("span");
    text.className = "settings-archived-name";
    text.textContent = folderName;
    const status = document.createElement("span");
    status.className = "settings-archived-status";
    status.textContent = checkbox.checked ? "Visible" : "Archived";

    label.appendChild(checkbox);
    label.appendChild(text);

    checkbox.addEventListener("change", function() {
      toggleFolderArchive(folderName);
      status.textContent = checkbox.checked ? "Visible" : "Archived";
      item.classList.toggle("is-archived", !checkbox.checked);
      refreshBookmarks();
    });

    item.appendChild(label);
    item.appendChild(status);
    item.classList.toggle("is-archived", !checkbox.checked);
    container.appendChild(item);
  });
}

function refreshQuickLinkFavicons() {
  document.querySelectorAll("img.quick-link-favicon").forEach((image) => {
    const faviconUrl = getFaviconUrl(image.getAttribute("data-url") || "");
    if (faviconUrl) {
      image.src = faviconUrl;
      image.style.display = "";
    } else {
      image.removeAttribute("src");
      image.style.display = "none";
    }
    image.setAttribute("data-favicon-set", "true");
  });
}

function initSettingsModal() {
  const settingsModal = document.getElementById("settings-modal");
  const settingsButton = document.getElementById("settings-button");
  const settingsClose = document.getElementById("settings-close");
  const settingsSave = document.getElementById("settings-save");
  const settingsRestoreDefaults = document.getElementById("settings-restore-defaults");
  const settingsUnsavedIndicator = document.getElementById("settings-unsaved-indicator");
  const settingsTitleInput = document.getElementById("settings-title-input");
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const fontRadios = document.querySelectorAll('input[name="font"]');
  const sortSelect = document.getElementById("settings-sort-select");
  const remoteFaviconsToggle = document.getElementById("remote-favicons-enabled");
  const remoteFaviconsStatus = document.getElementById("remote-favicons-status");

  if (!settingsModal || !settingsButton) return;
  loadFontCatalog();
  const themePreviewAccents = {
    default: "#ff9900", auto: "#a8b4c8", matrix: "#00ff00", ocean: "#00bfff",
    sunset: "#ff6b6b", forest: "#7cfc00", midnight: "#6c5ce7", aurora: "#00ff9f",
    rose: "#ff6b9d", lemon: "#fff200", coral: "#ff7f50", lavender: "#e6e6fa",
    nord: "#88c0d0", dracula: "#bd93f9", monokai: "#f92672", cyberpunk: "#ff00ff",
    amber: "#ffb000", teal: "#20c997", indigo: "#6c5ce7", emerald: "#2ecc71",
    ruby: "#e74c3c", sapphire: "#3498db", amethyst: "#9b59b6", copper: "#e67e22",
    jade: "#00b894", crimson: "#c0392b", slate: "#95a5a6", mint: "#00d2a0",
    tangerine: "#ff8c42", violet: "#8e44ad", sky: "#00b4d8", persimmon: "#ff6348",
    graphite: "#bdc3c7", "neon-green": "#39ff14", "hot-pink": "#ff69b4",
    arctic: "#a8e6cf", sunflower: "#ffc300", magenta: "#ff00ff", steel: "#7f8c8d",
    peach: "#ffccbc", electric: "#00e5ff", moss: "#8bc34a", plum: "#ce93d8",
    rust: "#d35400", cloud: "#ecf0f1", "neon-blue": "#00d4ff", butter: "#fff176",
    scarlet: "#ff1744", honey: "#ffab40", phantom: "#cfd8dc", barbie: "#ff00e5",
    blizzard: "#e0f7fa", toxic: "#adff2f", frost: "#b3e5fc", garnet: "#c2185b",
    royal: "#4169e1", pistachio: "#a3d977"
  };
  document.querySelectorAll(".settings-section-theme .theme-preview").forEach((preview) => {
    const option = preview.closest(".settings-option");
    const radio = option?.querySelector('input[name="theme"]');
    if (!radio) return;
    preview.textContent = "Aa";
    option.style.setProperty("--theme-preview-accent", themePreviewAccents[radio.value] || "#ff9900");
    preview.setAttribute("aria-hidden", "true");
  });
  document.querySelectorAll(".settings-section-font .font-preview").forEach((preview) => {
    const option = preview.closest(".settings-option");
    const radio = option && option.querySelector('input[name="font"]');
    const label = option && option.querySelector("span");
    if (!radio || !label || !FONT_FAMILIES[radio.value]) return;
    preview.textContent = label.textContent.trim();
    preview.style.fontFamily = `"${FONT_FAMILIES[radio.value]}", sans-serif`;
    preview.setAttribute("aria-hidden", "true");
  });

  let settingsHasChanges = false;
  let settingsSnapshot = null;
  let settingsOpener = null;
  const previewSettingKeys = [
    "customTitle",
    "selectedTheme",
    "selectedFont",
    FONT_SIZE_KEY,
    SORT_PREFERENCE_KEY,
    ANIMATIONS_KEY,
    MOTION_PREFERENCES_KEY
  ];

  function captureSettingsSnapshot() {
    return Object.fromEntries(previewSettingKeys.map((key) => [key, localStorage.getItem(key)]));
  }

  function markSettingsChanged() {
    settingsHasChanges = true;
    if (settingsUnsavedIndicator) {
      settingsUnsavedIndicator.classList.add("visible");
    }
  }

  function clearSettingsChanges() {
    settingsHasChanges = false;
    if (settingsUnsavedIndicator) {
      settingsUnsavedIndicator.classList.remove("visible");
    }
  }

  function restoreSettingsSnapshot() {
    if (!settingsSnapshot) return;
    previewSettingKeys.forEach((key) => {
      const value = settingsSnapshot[key];
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    });

    applyTheme(settingsSnapshot.selectedTheme || "default");
    applyFont(settingsSnapshot.selectedFont || "poppins");
    applyFontSize(settingsSnapshot[FONT_SIZE_KEY] || "20");
    applyMotionPreferences(loadMotionPreferences());
    setSortPreference(settingsSnapshot[SORT_PREFERENCE_KEY] || "frequency");

    previewSettingKeys.forEach((key) => {
      const value = settingsSnapshot[key];
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    });
  }

  function closeSettingsModal(discardChanges) {
    if (discardChanges && settingsHasChanges) {
      restoreSettingsSnapshot();
      loadSettingsValues();
    }
    if (settingsSearchInput) {
      settingsSearchInput.value = "";
      updateSettingsSearchResults();
    }
    clearSettingsChanges();
    settingsModal.classList.remove("active");
    settingsModal.setAttribute("aria-hidden", "true");
    if (settingsOpener && typeof settingsOpener.focus === "function") settingsOpener.focus();
  }

  function setupOptionFilter(inputId, optionSelector) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const section = input.closest(".settings-section");
    const grid = section && section.querySelector(".settings-grid");
    if (!grid) return;

    input.addEventListener("input", function() {
      const searchTerm = this.value.toLowerCase().trim();
      grid.querySelectorAll(optionSelector).forEach(function(option) {
        const label = option.querySelector("span");
        option.hidden = Boolean(searchTerm) && !(label && label.textContent.toLowerCase().includes(searchTerm));
      });
    });
  }

  function updateCurrentChoice(inputName, outputId, fallback, suffix = "") {
    const selectedOption = document.querySelector(`input[name="${inputName}"]:checked`);
    const label = selectedOption && selectedOption.closest(".settings-option")?.querySelector("span");
    const output = document.getElementById(outputId);
    if (output) output.textContent = `${label ? label.textContent.trim() : fallback}${suffix}`;
  }

  function updateCurrentAppearanceChoices() {
    updateCurrentChoice("theme", "settings-current-theme", "Default");
    updateCurrentChoice("font", "settings-current-font", "Poppins");
    updateCurrentChoice("fontSize", "settings-current-font-size", "20px");

    const sizes = Array.from(document.querySelectorAll('input[name="fontSize"]'))
      .map((input) => Number(input.value))
      .filter(Number.isFinite);
    const range = document.getElementById("settings-font-size-range");
    if (range && sizes.length) {
      range.textContent = `Available: ${Math.min(...sizes)}-${Math.max(...sizes)} px`;
    }
  }

  function getSettingsFocusableElements() {
    return Array.from(settingsModal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.getClientRects().length > 0);
  }

  const settingsSearchInput = document.getElementById("settings-search-input");
  const settingsSearchResults = document.getElementById("settings-search-results");
  const settingsSearchStatus = document.getElementById("settings-search-status");

  function normalizeSettingsSearchText(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function updateSettingsSearchResults() {
    if (!settingsSearchInput || !settingsSearchResults) return;
    const query = settingsSearchInput.value.trim();
    settingsSearchResults.replaceChildren();
    if (!query) {
      settingsSearchResults.hidden = true;
      settingsSearchInput.setAttribute("aria-expanded", "false");
      if (settingsSearchStatus) settingsSearchStatus.textContent = "";
      return;
    }

    const terms = normalizeSettingsSearchText(query).split(/\s+/).filter(Boolean);
    const matches = [];
    settingsModal.querySelectorAll(".settings-tab-panel .settings-section").forEach((section) => {
      const panel = section.closest(".settings-tab-panel");
      const tabName = panel?.dataset.tabPanel;
      const tab = tabName && settingsModal.querySelector(`.settings-tab[data-tab="${tabName}"]`);
      const header = section.querySelector(".settings-section-header");
      if (!tab || !header) return;

      const heading = header.cloneNode(true);
      heading.querySelectorAll("button").forEach((button) => button.remove());
      const sectionTitle = heading.textContent.trim();
      const searchableText = normalizeSettingsSearchText(
        section.textContent + " " + Array.from(section.querySelectorAll("input, select, textarea"))
          .map((element) => `${element.getAttribute("placeholder") || ""} ${element.getAttribute("aria-label") || ""}`)
          .join(" ")
      );
      if (!terms.every((term) => searchableText.includes(term))) return;

      const optionLabels = Array.from(section.querySelectorAll(".settings-option"))
        .filter((option) => {
          const optionText = normalizeSettingsSearchText(option.textContent);
          return terms.every((term) => optionText.includes(term));
        })
        .map((option) => option.querySelector("span")?.textContent.trim())
        .filter(Boolean);

      matches.push({ section, tab, sectionTitle, optionLabels });
    });

    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "settings-search-empty";
      empty.textContent = "No matching settings. Try a different keyword.";
      settingsSearchResults.appendChild(empty);
    } else {
      matches.slice(0, 8).forEach((match) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "settings-search-result";
        const category = match.tab.textContent.trim().replace(/^[^\p{L}\p{N}]+\s*/u, "");
        const title = document.createElement("strong");
        title.textContent = match.sectionTitle;
        const detail = document.createElement("span");
        detail.textContent = `${category}${match.optionLabels.length ? ` · ${match.optionLabels.slice(0, 2).join(", ")}` : ""}`;
        button.append(title, detail);
        button.addEventListener("click", function() {
          match.tab.click();
          match.section.classList.remove("collapsed");

          const localFilter = match.section.querySelector(
            "#theme-search-input, #font-search-input, #font-size-search-input"
          );
          if (localFilter && match.optionLabels.length) {
            localFilter.value = match.optionLabels[0];
            localFilter.dispatchEvent(new Event("input", { bubbles: true }));
          }

          settingsSearchInput.value = "";
          updateSettingsSearchResults();
          requestAnimationFrame(() => {
            match.section.scrollIntoView({ behavior: "smooth", block: "start" });
            if (localFilter && match.optionLabels.length) localFilter.focus({ preventScroll: true });
            else {
              const sectionHeader = match.section.querySelector(".settings-section-header");
              if (sectionHeader) {
                sectionHeader.tabIndex = -1;
                sectionHeader.focus({ preventScroll: true });
              }
            }
          });
        });
        settingsSearchResults.appendChild(button);
      });
    }

    settingsSearchResults.hidden = false;
    settingsSearchInput.setAttribute("aria-expanded", "true");
    if (settingsSearchStatus) {
      settingsSearchStatus.textContent = matches.length
        ? `${matches.length} matching setting section${matches.length === 1 ? "" : "s"}.`
        : "No matching settings.";
    }
  }

  if (settingsSearchInput && settingsSearchResults) {
    settingsSearchInput.addEventListener("input", updateSettingsSearchResults);
    settingsSearchInput.addEventListener("keydown", function(event) {
      const resultButtons = Array.from(settingsSearchResults.querySelectorAll(".settings-search-result"));
      if (event.key === "ArrowDown" && resultButtons.length) {
        event.preventDefault();
        resultButtons[0].focus();
      } else if (event.key === "Enter" && resultButtons.length) {
        event.preventDefault();
        resultButtons[0].click();
      } else if (event.key === "Escape" && this.value) {
        event.preventDefault();
        event.stopPropagation();
        this.value = "";
        updateSettingsSearchResults();
      }
    });
    settingsSearchResults.addEventListener("keydown", function(event) {
      const resultButtons = Array.from(settingsSearchResults.querySelectorAll(".settings-search-result"));
      const currentIndex = resultButtons.indexOf(document.activeElement);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        resultButtons[(currentIndex + direction + resultButtons.length) % resultButtons.length]?.focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        settingsSearchInput.focus();
        settingsSearchInput.value = "";
        updateSettingsSearchResults();
      }
    });
  }

  const settingsInputs = settingsModal.querySelectorAll(
    'input[name="theme"], input[name="font"], input[name="fontSize"], input[name="motionOption"], #settings-title-input, #settings-sort-select'
  );
  settingsInputs.forEach(function(input) {
    input.addEventListener("change", markSettingsChanged);
    input.addEventListener("input", markSettingsChanged);
  });

  if (remoteFaviconsToggle) {
    remoteFaviconsToggle.checked = safeLocalStorageGet(
      "remoteFaviconsEnabled",
      false,
      (value) => typeof value === "boolean"
    );
    remoteFaviconsToggle.addEventListener("change", function() {
      const enabled = this.checked;
      const saveSetting = (allowed) => {
        if (!allowed) {
          this.checked = false;
          try {
            localStorage.setItem("remoteFaviconsEnabled", "false");
            refreshQuickLinkFavicons();
            refreshBookmarks();
          } catch (e) {
            console.error("Failed to save favicon privacy setting:", e);
          }
          if (remoteFaviconsStatus) {
            remoteFaviconsStatus.textContent = "Permission was not granted; remote favicon lookups remain off.";
          }
          return;
        }

        try {
          localStorage.setItem("remoteFaviconsEnabled", String(enabled));
          if (remoteFaviconsStatus) {
            remoteFaviconsStatus.textContent = enabled
              ? "Remote favicon lookups are enabled."
              : "Remote favicon lookups are disabled.";
          }
          refreshQuickLinkFavicons();
          refreshBookmarks();
        } catch (e) {
          console.error("Failed to save favicon privacy setting:", e);
          this.checked = !enabled;
          if (remoteFaviconsStatus) {
            remoteFaviconsStatus.textContent = "Could not save this setting; the previous preference is unchanged.";
          }
        }
      };

      if (!enabled) {
        saveSetting(true);
        return;
      }

      if (!chrome.permissions || typeof chrome.permissions.request !== "function") {
        console.error("Optional host permissions are unavailable in this browser.");
        saveSetting(false);
        return;
      }
      chrome.permissions.request({ origins: ["https://www.google.com/*"] }, (granted) => {
        const error = chrome.runtime && chrome.runtime.lastError;
        if (error) {
          console.error("Could not request favicon permission:", error.message);
          saveSetting(false);
          return;
        }
        saveSetting(granted === true);
      });
    });
  }

  // Open modal
  settingsButton.addEventListener("click", function() {
    settingsOpener = document.activeElement;
    settingsSnapshot = captureSettingsSnapshot();
    loadSettingsValues();
    updateCurrentAppearanceChoices();
    renderArchivedFoldersList();
    ["theme-search-input", "font-search-input", "font-size-search-input"].forEach(function(id) {
      const input = document.getElementById(id);
      if (input) {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    clearSettingsChanges();
    settingsModal.classList.add("active");
    settingsModal.setAttribute("aria-hidden", "false");
    if (settingsClose) settingsClose.focus();
  });

  // Tab switching
  const tabButtons = document.querySelectorAll(".settings-tab");
  const tabPanels = document.querySelectorAll(".settings-tab-panel");
  tabButtons.forEach(function(btn) {
    btn.addEventListener("click", function() {
      const tabName = this.getAttribute("data-tab");
      tabButtons.forEach(function(b) {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
        b.setAttribute("tabindex", "-1");
      });
      tabPanels.forEach(function(panel) { panel.classList.remove("active"); });
      this.classList.add("active");
      this.setAttribute("aria-selected", "true");
      this.setAttribute("tabindex", "0");
      const targetPanel = document.querySelector('.settings-tab-panel[data-tab-panel="' + tabName + '"]');
      if (targetPanel) targetPanel.classList.add("active");
      const settingsContent = document.querySelector(".settings-content");
      if (settingsContent) settingsContent.scrollTop = 0;
    });

    btn.addEventListener("keydown", function(event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const currentIndex = Array.from(tabButtons).indexOf(this);
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (currentIndex + direction + tabButtons.length) % tabButtons.length;
      tabButtons[nextIndex].focus();
      tabButtons[nextIndex].click();
    });
  });

  setupOptionFilter("theme-search-input", ".settings-option");
  setupOptionFilter("font-search-input", ".settings-option");
  setupOptionFilter("font-size-search-input", ".settings-option");
  themeRadios.forEach((radio) => radio.addEventListener("change", updateCurrentAppearanceChoices));
  fontRadios.forEach((radio) => radio.addEventListener("change", updateCurrentAppearanceChoices));
  document.querySelectorAll('input[name="fontSize"]').forEach((radio) => {
    radio.addEventListener("change", updateCurrentAppearanceChoices);
  });

  // Close modal
  if (settingsClose) {
    settingsClose.addEventListener("click", function() {
      closeSettingsModal(true);
    });
  }

  // Close on backdrop click
  settingsModal.addEventListener("click", function(e) {
    if (e.target === settingsModal) {
      closeSettingsModal(true);
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", function(e) {
    if (!settingsModal.classList.contains("active")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeSettingsModal(true);
      return;
    }
    if (e.key !== "Tab") return;

    const focusableElements = getSettingsFocusableElements();
    if (!focusableElements.length) {
      e.preventDefault();
      settingsModal.focus();
      return;
    }
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (e.shiftKey && (document.activeElement === firstElement || !settingsModal.contains(document.activeElement))) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && (document.activeElement === lastElement || !settingsModal.contains(document.activeElement))) {
      e.preventDefault();
      firstElement.focus();
    }
  });

  // Restore Defaults button handler
  if (settingsRestoreDefaults) {
    settingsRestoreDefaults.addEventListener("click", function() {
      if (!confirm("Reset the title, theme, font, text size, sorting, and animation preferences? Work Mode and bookmark data will be preserved.")) return;

      localStorage.removeItem("customTitle");
      applyTheme("default");
      applyFont("poppins");
      applyFontSize("20");
      applyAnimations(true);

      if (themeRadios.length) themeRadios.forEach(function(r) { r.checked = r.value === "default"; });
      if (fontRadios.length) fontRadios.forEach(function(r) { r.checked = r.value === "poppins"; });
      const fontSizeRadios = document.querySelectorAll('input[name="fontSize"]');
      if (fontSizeRadios.length) fontSizeRadios.forEach(function(r) { r.checked = r.value === "20"; });
      document.querySelectorAll('input[name="motionOption"]').forEach(function(input) {
        input.checked = true;
      });
      if (sortSelect) sortSelect.value = "frequency";

      if (settingsTitleInput) settingsTitleInput.value = "Hello, Stitch";
      setSortPreference("frequency");
      updateCurrentAppearanceChoices();
      ["theme-search-input", "font-search-input", "font-size-search-input"].forEach(function(id) {
        const input = document.getElementById(id);
        if (input) {
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      markSettingsChanged();
    });
  }

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
       }

      // Save font
       const selectedFont = document.querySelector('input[name="font"]:checked');
       if (selectedFont) {
         applyFont(selectedFont.value);
       }

       // Save font size
       const selectedFontSize = document.querySelector('input[name="fontSize"]:checked');
       if (selectedFontSize) {
         applyFontSize(selectedFontSize.value);
       }

       applyMotionPreferences(readMotionPreferencesFromSettings());

       const settingsSortSelect = document.getElementById("settings-sort-select");
      if (settingsSortSelect) {
        setSortPreference(settingsSortSelect.value);
        const headerSortSelect = document.getElementById("settings-sort-select");
        if (headerSortSelect) headerSortSelect.value = settingsSortSelect.value;
      }

       closeSettingsModal(false);
     });
   }

  // Appearance controls preview immediately; closing without saving restores the snapshot.
  themeRadios.forEach(function(radio) {
    radio.addEventListener("change", function() {
      if (this.checked) {
        applyTheme(this.value);
      }
    });
  });

  // Font radio buttons - live preview (apply immediately but don't save until Save is called)
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
   [
     ["sort-manual", "manual"],
     ["sort-frequency", "frequency"],
     ["sort-date", "date"],
     ["sort-alphabetical", "alphabetical"],
   ].forEach(function([id, preference]) {
     const button = document.getElementById(id);
     if (button) button.addEventListener("click", function() {
       markSettingsChanged();
       setSortPreference(preference);
     });
   });

   // Motion preferences preview immediately and are restored if Settings is discarded.
   document.querySelectorAll('input[name="motionOption"]').forEach(function(input) {
     input.addEventListener("change", function() {
       applyMotionPreferences(readMotionPreferencesFromSettings());
     });
   });

   const settingsCollapseAllBtn = document.getElementById("settings-collapse-all-button");
  if (settingsCollapseAllBtn) {
    settingsCollapseAllBtn.addEventListener("click", function() {
      document.querySelectorAll(".dynamic-column").forEach(function(col) {
        col.classList.add("collapsed");
        const btn = col.querySelector(".collapse-toggle");
        const ul = col.querySelector("ul");
        if (btn) btn.classList.add("collapsed");
        if (ul) ul.style.display = "none";
      });
    });
  }

  const settingsExpandAllBtn = document.getElementById("settings-expand-all-button");
  if (settingsExpandAllBtn) {
    settingsExpandAllBtn.addEventListener("click", function() {
      document.querySelectorAll(".dynamic-column").forEach(function(col) {
        col.classList.remove("collapsed");
        const btn = col.querySelector(".collapse-toggle");
        const ul = col.querySelector("ul");
        if (btn) btn.classList.remove("collapsed");
        if (ul) ul.style.display = "";
      });
    });
  }

  const settingsResetLayoutBtn = document.getElementById("settings-reset-layout-button");
  if (settingsResetLayoutBtn) {
    settingsResetLayoutBtn.addEventListener("click", function() {
      document.querySelectorAll(".dynamic-column").forEach(function(col) {
        col.classList.remove("collapsed");
        const btn = col.querySelector(".collapse-toggle");
        const ul = col.querySelector("ul");
        if (btn) btn.classList.remove("collapsed");
        if (ul) ul.style.display = "";
      });
      renderCurrent();
    });
  }

  const settingsCompactModeBtn = document.getElementById("settings-compact-mode-button");
  if (settingsCompactModeBtn) {
    settingsCompactModeBtn.addEventListener("click", function() {
      document.body.classList.toggle("compact-mode");
      const isCompact = document.body.classList.contains("compact-mode");
      if (isCompact) {
        settingsCompactModeBtn.classList.add("active");
      } else {
        settingsCompactModeBtn.classList.remove("active");
      }
    });
  }

  const settingsAnalyticsBtn = document.getElementById("settings-analytics-button");
  if (settingsAnalyticsBtn) {
    settingsAnalyticsBtn.addEventListener("click", function() {
      const modal = document.getElementById("analytics-modal");
      if (modal) {
        initializeAnalyticsModal();
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        document.getElementById("analytics-close")?.focus();
        if (typeof showAnalytics === "function") {
          showAnalytics();
        }
      }
    });
  }

  const settingsReloadBtn = document.getElementById("settings-reload-button");
  if (settingsReloadBtn) {
    settingsReloadBtn.addEventListener("click", function() {
      if (typeof refreshBookmarks === "function") {
        refreshBookmarks();
      }
    });
  }

  const settingsCloseOpenedTabsBtn = document.getElementById("settings-close-opened-tabs-button");
  if (settingsCloseOpenedTabsBtn) {
    settingsCloseOpenedTabsBtn.addEventListener("click", closeOpenedBookmarkTabs);
  }

  const settingsWorkModeConfigureBtn = document.getElementById("settings-work-mode-configure-button");
  if (settingsWorkModeConfigureBtn) {
    settingsWorkModeConfigureBtn.addEventListener("click", function() {
      if (typeof showWorkModeModal === "function") showWorkModeModal(columns);
    });
  }

  const feedbackLink = document.getElementById("settings-feedback-link");
  const extensionVersion = document.getElementById("settings-extension-version");
  const runtime = window.chrome?.runtime || window.browser?.runtime;
  const version = runtime?.getManifest ? runtime.getManifest().version : "0.17";
  if (extensionVersion) extensionVersion.textContent = `v${version}`;
  if (feedbackLink) {
    const feedbackBody = [
      "What were you trying to do?",
      "",
      "What happened?",
      "",
      "Extension version: " + version,
      "",
      "Please do not include passwords or sensitive bookmark information."
    ].join("\n");
    feedbackLink.href = `mailto:madanyx@gmail.com?subject=${encodeURIComponent("Hello Stitch feedback")}&body=${encodeURIComponent(feedbackBody)}`;
  }

  ["random-theme-button", "random-font-button", "random-font-size-button"].forEach(function(id) {
    const button = document.getElementById(id);
    if (button) button.addEventListener("click", markSettingsChanged);
  });
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
  const remoteFaviconsToggle = document.getElementById("remote-favicons-enabled");
  if (remoteFaviconsToggle) {
    remoteFaviconsToggle.checked = safeLocalStorageGet(
      "remoteFaviconsEnabled",
      false,
      (value) => typeof value === "boolean"
    );
  }

  // Load theme
  const savedTheme = localStorage.getItem(THEME_KEY) || "default";
  const themeRadio = document.querySelector('input[name="theme"][value="' + savedTheme + '"]');
  if (themeRadio) themeRadio.checked = true;

  // Load font
  const savedFont = localStorage.getItem(FONT_KEY) || "poppins";
  const fontRadio = document.querySelector('input[name="font"][value="' + savedFont + '"]');
  if (fontRadio) fontRadio.checked = true;

  // Load font size
  const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || "20";
  const fontSizeRadio = document.querySelector('input[name="fontSize"][value="' + savedFontSize + '"]');
  if (fontSizeRadio) fontSizeRadio.checked = true;

   // Load sort preference
   const sortSelect = document.getElementById("settings-sort-select");
   if (sortSelect) {
     const savedSort = localStorage.getItem(SORT_KEY) || "frequency";
     sortSelect.value = savedSort;
   }

   const savedMotionPreferences = loadMotionPreferences();
   document.querySelectorAll('input[name="motionOption"]').forEach(function(input) {
     input.checked = savedMotionPreferences[input.value];
   });
}

// ============================================
// GLOBAL APPLY THEME & FONT FUNCTIONS
// ============================================
function applyTheme(themeName) {
  Array.from(document.body.classList)
    .filter((className) => className.startsWith("theme-"))
    .forEach((className) => document.body.classList.remove(className));
  if (themeName && themeName !== "default") {
    document.body.classList.add("theme-" + themeName);
  }
  localStorage.setItem("selectedTheme", themeName || "default");

  if (themeName === "auto") {
    applySystemTheme();
  }
}

let systemThemeMediaQuery = null;

function applySystemTheme() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.remove("theme-midnight", "theme-default");
  if (isDark) {
    document.body.classList.add("theme-midnight");
  } else {
    document.body.classList.add("theme-default");
  }
}

function setupSystemThemeListener() {
  if (systemThemeMediaQuery) {
    systemThemeMediaQuery.removeListener(applySystemTheme);
  }
  systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  systemThemeMediaQuery.addListener(applySystemTheme);
}

function applyFont(fontName) {
  const fontFamily = FONT_FAMILIES[fontName] || FONT_FAMILIES.poppins;
  Array.from(document.body.classList)
    .filter((className) => className.startsWith("font-") && !className.startsWith("font-size-"))
    .forEach((className) => document.body.classList.remove(className));
  if (!FONT_FAMILIES[fontName]) fontName = "poppins";
  document.body.classList.toggle("font-" + fontName, fontName !== "buka-bird");
  document.body.style.fontFamily = `"${fontFamily}", ${fontName === "fira-mono" || fontName === "inconsolata" ? "monospace" : fontName === "serif" || fontName === "josefin-slab" || fontName === "merriweather" || fontName === "noto-serif" || fontName === "playfair" ? "serif" : "sans-serif"}`;
  localStorage.setItem("selectedFont", fontName);
}

// Initialize settings modal on DOM ready
document.addEventListener("DOMContentLoaded", function() {
  initSettingsModal();
  
  // Load saved font size
  const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || "20";
  applyFontSize(savedFontSize);
  
  // Load saved motion preferences
  applyMotionPreferences(loadMotionPreferences());

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
  const themes = ["default", "matrix", "ocean", "sunset", "forest", "midnight", "aurora", "rose", "lemon", "coral", "lavender", "nord", "dracula", "monokai", "cyberpunk", "amber", "teal", "indigo", "emerald", "ruby", "sapphire", "amethyst", "copper", "jade", "crimson", "slate", "mint", "tangerine", "violet", "sky", "persimmon", "graphite", "neon-green", "hot-pink", "arctic", "sunflower", "magenta", "steel", "peach", "electric", "moss", "plum", "rust", "cloud", "neon-blue", "butter", "scarlet", "honey", "phantom", "barbie", "blizzard", "toxic", "frost", "garnet", "royal", "pistachio"];
  const randomIndex = Math.floor(Math.random() * themes.length);
  const randomTheme = themes[randomIndex];
  
  // Apply the theme
  applyTheme(randomTheme);
  
  // Update the radio button selection in the modal
  const themeRadio = document.querySelector('input[name="theme"][value="' + randomTheme + '"]');
  if (themeRadio) {
    themeRadio.checked = true;
    const search = document.getElementById("theme-search-input");
    if (search) {
      search.value = "";
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }
    themeRadio.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

// Randomize Font Function
function randomizeFont() {
  const fonts = Array.from(document.querySelectorAll('input[name="font"]'), (radio) => radio.value);
  const randomIndex = Math.floor(Math.random() * fonts.length);
  const randomFont = fonts[randomIndex];
  
  // Apply the font
  applyFont(randomFont);
  
  // Update the radio button selection in the modal
  const fontRadio = document.querySelector('input[name="font"][value="' + randomFont + '"]');
  if (fontRadio) {
    fontRadio.checked = true;
    const search = document.getElementById("font-search-input");
    if (search) {
      search.value = "";
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }
    fontRadio.dispatchEvent(new Event("change", { bubbles: true }));
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
  localStorage.setItem(FONT_SIZE_KEY, fontSize || "20");
}

// ============================================
// ANIMATIONS FUNCTIONS
// ============================================
const ANIMATIONS_KEY = "animationsEnabled";
const MOTION_PREFERENCES_KEY = "motionPreferences";
const MOTION_OPTION_NAMES = ["transitions", "panels", "loading", "feedback"];
const DEFAULT_MOTION_PREFERENCES = Object.freeze({
  transitions: true,
  panels: true,
  loading: true,
  feedback: true
});

function loadMotionPreferences() {
  const savedPreferences = localStorage.getItem(MOTION_PREFERENCES_KEY);
  if (savedPreferences !== null) {
    try {
      const parsedPreferences = JSON.parse(savedPreferences);
      return Object.fromEntries(MOTION_OPTION_NAMES.map((name) => [
        name,
        typeof parsedPreferences[name] === "boolean" ? parsedPreferences[name] : DEFAULT_MOTION_PREFERENCES[name]
      ]));
    } catch (error) {
      console.error("Could not read saved motion preferences:", error);
      return { ...DEFAULT_MOTION_PREFERENCES };
    }
  }

  const legacyEnabled = localStorage.getItem(ANIMATIONS_KEY) !== "false";
  return Object.fromEntries(MOTION_OPTION_NAMES.map((name) => [name, legacyEnabled]));
}

function readMotionPreferencesFromSettings() {
  return Object.fromEntries(MOTION_OPTION_NAMES.map((name) => [
    name,
    document.querySelector(`input[name="motionOption"][value="${name}"]`)?.checked === true
  ]));
}

function applyMotionPreferences(preferences) {
  const normalizedPreferences = Object.fromEntries(MOTION_OPTION_NAMES.map((name) => [
    name,
    typeof preferences[name] === "boolean" ? preferences[name] : DEFAULT_MOTION_PREFERENCES[name]
  ]));
  document.body.classList.toggle("no-motion-transitions", !normalizedPreferences.transitions);
  document.body.classList.toggle("no-motion-panels", !normalizedPreferences.panels);
  document.body.classList.toggle("no-motion-loading", !normalizedPreferences.loading);
  document.body.classList.toggle("no-motion-feedback", !normalizedPreferences.feedback);
  localStorage.setItem(MOTION_PREFERENCES_KEY, JSON.stringify(normalizedPreferences));
  localStorage.setItem(ANIMATIONS_KEY, Object.values(normalizedPreferences).every(Boolean) ? "true" : "false");
}

function applyAnimations(enabled) {
  const preferences = Object.fromEntries(MOTION_OPTION_NAMES.map((name) => [name, enabled]));
  applyMotionPreferences(preferences);
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
    const search = document.getElementById("font-size-search-input");
    if (search) {
      search.value = "";
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }
    fontSizeRadio.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
