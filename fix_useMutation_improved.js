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

  // Pattern 1: useMutation({ (args) => ..., { -> useMutation({ mutationFn: (args) => ...,
  let newContent = content;

  // Find all useMutation({ patterns and fix them
  newContent = newContent.replace(/useMutation\(\{\s+\(([^)]*)\)\s*=>/g, (match, args) => {
    modified = true;
    return `useMutation({\n    mutationFn: (${args}) =>`;
  });

  // Fix closing brace - find }, { at the end of mutation function and remove extra brace
  newContent = newContent.replace(/,\s+\{\s+onSuccess:/g, (match) => {
    modified = true;
    return ',\n    onSuccess:';
  });

  newContent = newContent.replace(/,\s+\{\s+onError:/g, (match) => {
    modified = true;
    return ',\n    onError:';
  });

  // Fix double closing braces
  newContent = newContent.replace(/\},\s+\},\s+\)/g, (match) => {
    modified = true;
    return '\n  })\n';
  });

  // Additional pattern: if there's a loose closing }, try to match with previous structure
  newContent = newContent.replace(/    \},\s+\},\s+\)/g, (match) => {
    modified = true;
    return '  })';
  });

  if (modified) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('\n✓ All useMutation calls fixed!');
