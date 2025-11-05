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

  // Fix pattern: useMutation({ (args) => fn(), { -> useMutation({ mutationFn: (args) => fn(),
  const regex = /useMutation\(\{\s+\(([^)]*)\)\s*=>\s*([^,]+),\s+\{/g;

  const newContent = content.replace(regex, (match, args, fn) => {
    modified = true;
    return `useMutation({\n    mutationFn: (${args}) => ${fn},`;
  });

  if (modified) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('\n✓ All useMutation calls fixed!');
