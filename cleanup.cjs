const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  fs.rmSync('frontend', { recursive: true, force: true });
  console.log('frontend deleted');
} catch (e) { console.error(e); }

const logsDir = 'Logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const files = fs.readdirSync('.');
const excludeFiles = ['README.md', 'SUBMISSION_COMPLETE.md', 'models.md'];

files.forEach(file => {
  if (file.endsWith('.md') && !excludeFiles.includes(file)) {
    fs.renameSync(file, path.join(logsDir, file));
  }
});
console.log('Markdown files moved to Logs.');

try {
  execSync('git init', { stdio: 'inherit' });
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "feat: final submission ready"', { stdio: 'inherit' });
  console.log('Git initialized and committed.');
} catch (e) { console.error('Git error:', e.message); }
