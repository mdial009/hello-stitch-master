const fs = require('fs');
const path = 'hello-stitch-master/index.html';
let html = fs.readFileSync(path, 'utf8');

// Find where tab-general ends (look for the closing div of theme section)
const themeEnd = html.indexOf('</div>\n        </div>\n      </div>', html.indexOf('Pistachio</span>'));
console.log('Theme end position:', themeEnd);

// Find the closing of settings-content
const settingsContentEnd = html.indexOf('</div>\n      <div class="settings-footer">');
console.log('Settings content end:', settingsContentEnd);

if (themeEnd === -1 || settingsContentEnd === -1) {
  console.log('Could not find boundaries');
  process.exit(1);
}

const afterTheme = html.slice(themeEnd + '</div>\n        </div>\n      </div>'.length, settingsContentEnd);
console.log('After theme length:', afterTheme.length);
console.log('First 200 chars after theme:', afterTheme.slice(0, 200));

// Check if already wrapped
if (afterTheme.includes('settings-tab-panel')) {
  console.log('Already wrapped in tab panels');
  process.exit(0);
}

// Wrap the remaining sections
const wrappedContent = `
        <div class="settings-tab-panel" id="tab-appearance">
          <!-- Font and Font Size are already in tab-appearance -->
        </div>
        
        <div class="settings-tab-panel" id="tab-quick-links">
          <!-- Quick Links sections -->
        </div>
        
        <div class="settings-tab-panel" id="tab-behavior">
          <!-- Behavior sections -->
        </div>
        
        <div class="settings-tab-panel" id="tab-backup">
          <!-- Backup sections -->
        </div>
        
        <div class="settings-tab-panel" id="tab-advanced">
          <!-- Advanced sections -->
        </div>
`;

html = html.slice(0, themeEnd + '</div>\n        </div>\n      </div>'.length) + wrappedContent + html.slice(settingsContentEnd);
fs.writeFileSync(path, html);
console.log('Added tab panel placeholders');
