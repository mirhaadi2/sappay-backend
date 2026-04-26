const fs = require('fs');
const path = require('path');
const glob = require('glob');
const root = path.join(process.cwd(), 'src');
const files = glob.sync('**/*controller.ts', { cwd: root, nodir: true });
const issues = [];
const handlerRegex = /export\s+const\s+(\w+)\s*=\s*async\s*\(([^)]*)\)\s*=>\s*\{/g;
for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  let match;
  while ((match = handlerRegex.exec(text))) {
    const [full, name, args] = match;
    const bodyStart = match.index + full.length;
    const bodyEnd = text.indexOf('\n};', bodyStart);
    if (bodyEnd === -1) continue;
    const body = text.slice(bodyStart, bodyEnd);
    const hasTry = /try\s*\{/.test(body);
    const takesNext = /\bnext\b/.test(args);
    if (!hasTry || !takesNext) {
      issues.push({ file, name, args, hasTry, takesNext });
    }
  }
}
console.log(JSON.stringify(issues, null, 2));
