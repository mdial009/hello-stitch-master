const fs = require('fs');
const path = 'hello-stitch-master/styles.css';
let css = fs.readFileSync(path, 'utf8');

const tabCSS = `
.settings-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #1a1a24;
  border-bottom: 1px solid #333;
  overflow-x: auto;
}

.settings-tab {
  padding: 0.5rem 1rem;
  border: 1.5px solid #ff9900;
  border-radius: 5px;
  background: #181818;
  color: #ff9900;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s;
}

.settings-tab:hover,
.settings-tab:focus {
  background: #ff9900;
  color: #181818;
}

.settings-tab.active {
  background: #ff9900;
  color: #181818;
}

.settings-tab-panel {
  display: none;
}

.settings-tab-panel.active {
  display: block;
}
`;

if (!css.includes('.settings-tabs')) {
  css += tabCSS;
  fs.writeFileSync(path, css);
  console.log('Added tab CSS');
} else {
  console.log('Tab CSS already exists');
}
