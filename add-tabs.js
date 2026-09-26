const fs = require('fs');
const path = 'hello-stitch-master/index.html';
let html = fs.readFileSync(path, 'utf8');

const tabJS = `<script>
  document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.settings-tab');
    const panels = document.querySelectorAll('.settings-tab-panel');
    
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        const target = this.getAttribute('data-tab');
        
        tabs.forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        
        panels.forEach(function(panel) { panel.classList.remove('active'); });
        const targetPanel = document.getElementById(target);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  });
</script>`;

if (!html.includes('settings-tab-panel')) {
  console.log('No tab panels found');
} else {
  console.log('Tab panels found, adding tab switching JS');
  html = html.replace('</body>', tabJS + '</body>');
  fs.writeFileSync(path, html);
  console.log('Done');
}
