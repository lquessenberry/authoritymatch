import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const appsRoot = join(repoRoot, 'apps');
const primitiveFileNames = new Set([
  'button.tsx',
  'input.tsx',
  'label.tsx',
  'card.tsx',
  'dialog.tsx',
  'tabs.tsx',
  'select.tsx',
  'tooltip.tsx',
]);

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

if (!statSync(appsRoot).isDirectory()) {
  process.exit(0);
}

const allFiles = walk(appsRoot);
const duplicates = allFiles.filter((filePath) => {
  if (!filePath.includes('/components/ui/')) {
    return false;
  }
  const fileName = filePath.split('/').pop();
  if (!fileName || !primitiveFileNames.has(fileName)) {
    return false;
  }

  const source = readFileSync(filePath, 'utf8').trim();
  const isProxyModule =
    source.length > 0 &&
    source
      .split('\n')
      .every(
        (line) =>
          /from ['"]@authoritymatch\/ui['"]/.test(line) || line.trim() === ''
      );

  return !isProxyModule;
});

if (duplicates.length === 0) {
  console.log('✅ No duplicated app-local design-system primitives detected.');
  process.exit(0);
}

console.error(
  [
    '❌ Duplicated app-local design-system primitives detected.',
    'Move shared primitives to @authoritymatch/ui and import from the package instead.',
    ...duplicates.map((item) => ` - ${item.replace(`${repoRoot}/`, '')}`),
  ].join('\n')
);

process.exit(1);
