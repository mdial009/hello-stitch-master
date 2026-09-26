const fs = require('fs');
const path = 'hello-stitch-master/index.html';
let html = fs.readFileSync(path, 'utf8');

// Find settings-content opening and closing
const contentOpen = html.indexOf('<div class="settings-content">');
const contentClose = html.indexOf('</div>\r\n\r\n      <div class="settings-footer">');

console.log('Content open:', contentOpen);
console.log('Content close:', contentClose);

if (contentOpen === -1 || contentClose === -1) {
  console.log('Could not find settings content');
  process.exit(1);
}

const before = html.slice(0, contentOpen + '<div class="settings-content">'.length);
const after = html.slice(contentClose);

let content = html.slice(contentOpen + '<div class="settings-content">'.length, contentClose);

console.log('Content length:', content.length);

// Check if already has tab panels
if (content.includes('settings-tab-panel')) {
  console.log('Already has tab panels');
  process.exit(0);
}

// Split into sections
const sections = content.split(/(?=<div class="settings-section">)/).filter(s => s.trim());

console.log('Found', sections.length, 'sections');

// Categorize sections
const tabs = {
  'tab-general': [],
  'tab-appearance': [],
  'tab-quick-links': [],
  'tab-behavior': [],
  'tab-backup': [],
  'tab-advanced': []
};

sections.forEach(section => {
  if (section.includes('Custom Title') || section.includes('Theme Selection')) {
    tabs['tab-general'].push(section);
  } else if (section.includes('Font Selection') || section.includes('Font Size')) {
    tabs['tab-appearance'].push(section);
  } else if (section.includes('Custom Quick Links') || section.includes('Quick Link Order')) {
    tabs['tab-quick-links'].push(section);
  } else if (section.includes('Remember Scroll') || section.includes('Virtualization')) {
    tabs['tab-behavior'].push(section);
  } else if (section.includes('Automatic Backup')) {
    tabs['tab-backup'].push(section);
  } else if (section.includes('Custom CSS')) {
    tabs['tab-advanced'].push(section);
  } else {
    tabs['tab-general'].push(section);
  }
});

// Build new content with tab panels
let newContent = '';
for (const [tabId, tabSections] of Object.entries(tabs)) {
  if (tabSections.length === 0) continue;
  const activeClass = tabId === 'tab-general' ? ' active' : '';
  newContent += '<div class="settings-tab-panel' + activeClass + '" id="' + tabId + '">';
  newContent += tabSections.join('');
  newContent += '</div>\n        ';
}

html = before + '\n        ' + newContent + '\n      ' + after;
fs.writeFileSync(path, html);
console.log('Successfully wrapped sections in tab panels');
