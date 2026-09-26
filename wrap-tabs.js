const fs = require('fs');
const path = 'hello-stitch-master/index.html';
let html = fs.readFileSync(path, 'utf8');

// Find the settings-content div and restructure it with tab panels
const settingsContentStart = html.indexOf('<div class="settings-content">');
const settingsContentEnd = html.indexOf('</div>\n      <div class="settings-footer">');

if (settingsContentStart === -1 || settingsContentEnd === -1) {
  console.log('Could not find settings content boundaries');
  process.exit(1);
}

const beforeContent = html.slice(0, settingsContentStart);
const afterContent = html.slice(settingsContentEnd);

// Extract current content
let currentContent = html.slice(settingsContentStart + '<div class="settings-content">'.length, settingsContentEnd);

console.log('Current content length:', currentContent.length);
console.log('First 200 chars:', currentContent.slice(0, 200));

// Check if tab panels already exist
if (currentContent.includes('settings-tab-panel')) {
  console.log('Tab panels already exist in content');
} else {
  console.log('Need to wrap sections in tab panels');
  
  // Split by settings-section to get individual sections
  const sections = currentContent.split(/(?=<div class="settings-section">)/);
  
  console.log('Found', sections.length, 'sections');
  
  let tabPanels = '';
  
  // Group sections into tabs
  const tabs = {
    'tab-general': [],
    'tab-appearance': [],
    'tab-quick-links': [],
    'tab-behavior': [],
    'tab-backup': [],
    'tab-advanced': []
  };
  
  sections.forEach(function(section) {
    if (section.includes('Custom Title') || section.includes('Theme')) {
      tabs['tab-general'].push(section);
    } else if (section.includes('Font') || section.includes('Font Size')) {
      tabs['tab-appearance'].push(section);
    } else if (section.includes('Quick Links') || section.includes('Quick Link Order')) {
      tabs['tab-quick-links'].push(section);
    } else if (section.includes('Remember Scroll') || section.includes('Virtualization')) {
      tabs['tab-behavior'].push(section);
    } else if (section.includes('Automatic Backup')) {
      tabs['tab-backup'].push(section);
    } else if (section.includes('Custom CSS')) {
      tabs['tab-advanced'].push(section);
    } else {
      // Default to general if no match
      tabs['tab-general'].push(section);
    }
  });
  
  // Build tab panels HTML
  let newContent = '';
  for (const [tabId, sections] of Object.entries(tabs)) {
    const activeClass = tabId === 'tab-general' ? ' active' : '';
    newContent += '<div class="settings-tab-panel' + activeClass + '" id="' + tabId + '">';
    newContent += sections.join('');
    newContent += '</div>';
  }
  
  html = beforeContent + '<div class="settings-content">\n        ' + newContent + afterContent;
  fs.writeFileSync(path, html);
  console.log('Wrapped sections in tab panels');
}
