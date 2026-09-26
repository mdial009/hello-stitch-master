const fs = require('fs');
const path = 'hello-stitch-master/index.html';
let html = fs.readFileSync(path, 'utf8');

// Find the end of theme section (after random theme button)
const themeEndMarker = '<button id="random-theme-button" class="settings-random-btn" title="Randomize theme">🎲 Random</button>';
const themeEnd = html.indexOf(themeEndMarker);
console.log('Theme end position:', themeEnd);

if (themeEnd === -1) {
  console.log('Could not find theme end marker');
  process.exit(1);
}

// Find the closing of settings-content
const contentCloseMarker = '</div>\r\n\r\n      </div>\r\n      <div class="settings-footer">';
const contentClose = html.indexOf(contentCloseMarker);
console.log('Content close position:', contentClose);

if (contentClose === -1) {
  console.log('Could not find content close marker');
  process.exit(1);
}

// Extract everything between theme end and content close
const between = html.slice(themeEnd + themeEndMarker.length, contentClose);
console.log('Between length:', between.length);
console.log('First 100 chars:', between.slice(0, 100));

// Check if already wrapped
if (between.includes('settings-tab-panel')) {
  console.log('Already wrapped in tab panels');
  process.exit(0);
}

// Wrap the remaining content in tab panels
const wrapped = `
        </div>
        
        <div class="settings-tab-panel" id="tab-appearance">
          <!-- Font and Font Size sections will go here -->
        </div>
        
        <div class="settings-tab-panel" id="tab-quick-links">
          <!-- Quick Links sections will go here -->
        </div>
        
        <div class="settings-tab-panel" id="tab-behavior">
          <!-- Behavior sections will go here -->
        </div>
        
        <div class="settings-tab-panel" id="tab-backup">
          <!-- Backup sections will go here -->
        </div>
        
        <div class="settings-tab-panel" id="tab-advanced">
          <!-- Advanced sections will go here -->
        </div>
      </div>`;

html = html.slice(0, themeEnd + themeEndMarker.length) + wrapped + html.slice(contentClose);
fs.writeFileSync(path, html);
console.log('Successfully wrapped remaining sections in tab panels');
