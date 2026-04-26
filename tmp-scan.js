const fs = require('fs');
const path = require('path');
const glob = require('glob');
const root = path.resolve('src');

const files = glob.sync('**/*.ts', { cwd: root, ignore: ['node_modules/**'] });
const candidates = [];

for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const re = /export const\s+\w+Handler\s*=\s*async\s*\(.*?\)\s*=>\s*\{/gs;
  let m;
  while ((m = re.exec(text)) !== null) {
    const start = m.index + m[0].length;
    const endIndex = text.indexOf('\n};', start);
    const body = text.slice(start, endIndex !== -1 ? endIndex : start + 1000);
    if (!/try\s*\{/.test(body)) {
      candidates.push({ file, handler: m[0].slice(0, m[0].indexOf('=')), offset: m.index });
      break;
    }
  }
}

if (candidates.length === 0) {
  console.log('NO_MISSING_TRY');
} else {
  for (const c of candidates) {
    console.log(`${c.file} ${c.handler}`);
  }
}
