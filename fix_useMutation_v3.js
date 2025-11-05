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
  let newContent = content;

  // Pattern: useMutation(\n    (args) => fn,\n    onSuccess: -> useMutation({\n    mutationFn: (args) => fn,\n    onSuccess:
  // This handles the old v4 syntax with missing { for options object
  newContent = newContent.replace(
    /useMutation\(\s*\(([^)]*)\)\s*=>\s*([^,]+),\s*on(Success|Error):/g,
    (match, args, fn, handler) => {
      modified = true;
      return `useMutation({\n    mutationFn: (${args}) => ${fn},\n    on${handler}:`;
    }
  );

  // Fix cases where we have useMutation(\n    function expression\n    onSuccess:
  newContent = newContent.replace(
    /useMutation\(\s*\(([^)]*)\)\s*=>\s*\{([^}]*)\},\s*on(Success|Error):/g,
    (match, args, body, handler) => {
      modified = true;
      return `useMutation({\n    mutationFn: (${args}) => {\n${body}\n    },\n    on${handler}:`;
    }
  );

  // Fix the closing braces pattern: }, } -> })
  newContent = newContent.replace(
    /\s+\},\s+\}\s*\)/g,
    () => {
      modified = true;
      return '\n  })';
    }
  );

  // Fix another closing pattern
  newContent = newContent.replace(
    /\s+\},\s+}\s*$/gm,
    () => {
      modified = true;
      return '\n  })';
    }
  );

  if (modified) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('\n✓ All useMutation calls fixed!');
