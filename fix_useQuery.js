const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walkSync(filepath, filelist);
    } else if (filepath.endsWith('.jsx')) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

const files = walkSync('frontend-react/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Pattern 1: useQuery('key', () => fn(), { options })
  // Convert to: useQuery({ queryKey: ['key'], queryFn: () => fn(), options })
  content = content.replace(
    /useQuery\(\s*['"]([^'"]+)['"]\s*,\s*\(\)\s*=>\s*([^,]+),\s*(\{[\s\S]*?\})\s*\)/g,
    (match, key, fn, options) => {
      modified = true;
      // Clean up options object
      const cleanOptions = options.replace(/^\{\s*/, '').replace(/\s*\}$/, '').trim();
      return `useQuery({\n    queryKey: ['${key}'],\n    queryFn: () => ${fn},\n    ${cleanOptions}\n  })`;
    }
  );

  // Pattern 2: useQuery(['key'], () => fn(), { options })
  content = content.replace(
    /useQuery\(\s*\[\s*['"]([^'"]+)['"]\s*\]\s*,\s*\(\)\s*=>\s*([^,]+),\s*(\{[\s\S]*?\})\s*\)/g,
    (match, key, fn, options) => {
      modified = true;
      const cleanOptions = options.replace(/^\{\s*/, '').replace(/\s*\}$/, '').trim();
      return `useQuery({\n    queryKey: ['${key}'],\n    queryFn: () => ${fn},\n    ${cleanOptions}\n  })`;
    }
  );

  // Pattern 3: useQuery('key', () => fn()) - without options
  content = content.replace(
    /useQuery\(\s*['"]([^'"]+)['"]\s*,\s*\(\)\s*=>\s*([^)]+)\s*\)/g,
    (match, key, fn) => {
      modified = true;
      return `useQuery({\n    queryKey: ['${key}'],\n    queryFn: () => ${fn}\n  })`;
    }
  );

  // Pattern 4: useQuery(['key'], () => fn()) - without options
  content = content.replace(
    /useQuery\(\s*\[\s*['"]([^'"]+)['"]\s*\]\s*,\s*\(\)\s*=>\s*([^)]+)\s*\)/g,
    (match, key, fn) => {
      modified = true;
      return `useQuery({\n    queryKey: ['${key}'],\n    queryFn: () => ${fn}\n  })`;
    }
  );

  // Pattern 5: useQuery('key', () => fn(), { ... }) where fn is a function call
  content = content.replace(
    /useQuery\(\s*['"]([^'"]+)['"]\s*,\s*\(\)\s*=>\s*([a-zA-Z_]\w*\.[a-zA-Z_]\w*\([^)]*\))\s*,\s*(\{[\s\S]*?\})\s*\)/g,
    (match, key, fn, options) => {
      modified = true;
      const cleanOptions = options.replace(/^\{\s*/, '').replace(/\s*\}$/, '').trim();
      return `useQuery({\n    queryKey: ['${key}'],\n    queryFn: () => ${fn},\n    ${cleanOptions}\n  })`;
    }
  );

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('\n✓ All useQuery calls fixed!');
