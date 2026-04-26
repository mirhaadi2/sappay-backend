const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', 'src', 'modules');

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (stat.isFile() && full.endsWith('controller.ts')) {
      files.push(full);
    }
  }
  return files;
}

function updateFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  const hasResponseImport = /import\s+\{[^}]*\bResponse\b[^}]*\}\s+from\s+['\"]express['\"];/.test(content);
  const hasNextFunctionImport = /import\s+\{[^}]*\bNextFunction\b[^}]*\}\s+from\s+['\"]express['\"];/.test(content);

  if (hasResponseImport && !hasNextFunctionImport) {
    content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['\"]express['\"];?/, (match, inside) => {
      const trimmed = inside.trim();
      if (trimmed.includes('NextFunction')) return match;
      return `import { ${trimmed}, NextFunction } from 'express';`;
    });
  }

  const signaturePattern = /export const\s+([A-Za-z0-9_]+)\s*=\s*async\s*\(([^\)]*req:[^,]+,\s*res:\s*Response)([^)]*)\)\s*=>\s*\{/g;
  content = content.replace(signaturePattern, (match, name, firstPart, rest) => {
    if (match.includes('next: NextFunction')) return match;
    return match.replace(/res:\s*Response/, 'res: Response, next: NextFunction');
  });

  const catchPattern = /catch\s*\(\s*([^\)]+)\s*\)\s*\{([\s\S]*?)(?:return\s+)?res\.status\([^\)]+\)\.json\([^;]*\);([\s\S]*?)\}/g;
  content = content.replace(catchPattern, (fullMatch, errVar, inner, trailing) => {
    if (fullMatch.includes('next(')) return fullMatch;
    return `catch (${errVar}) {\n${inner.trim() ? '        ' : ''}next(${errVar});\n    }`;
  });

  // Replace catch blocks that do not use res.status but return res.json in catch
  const simpleCatchPattern = /catch\s*\(\s*([^\)]+)\s*\)\s*\{([\s\S]*?)res\.json\([^;]*\);([\s\S]*?)\}/g;
  content = content.replace(simpleCatchPattern, (fullMatch, errVar, inner, trailing) => {
    if (fullMatch.includes('next(')) return fullMatch;
    return `catch (${errVar}) {\n${inner.trim() ? '        ' : ''}next(${errVar});\n    }`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    return true;
  }
  return false;
}

const files = walk(modulesDir);
const patched = [];
for (const file of files) {
  try {
    if (updateFile(file)) {
      patched.push(file);
    }
  } catch (err) {
    console.error('Error patching', file, err);
  }
}

console.log('Patched files:', patched.length);
for (const file of patched) {
  console.log(file);
}
