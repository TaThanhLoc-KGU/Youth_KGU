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

  // Fix pattern 1: Extra indent before onSuccess/onError
  // Pattern: "    onSuccess: () => {\n      " -> "    onSuccess: () => {\n      "
  // But specifically when the next line is closing brace with extra indent
  // Replace "      }," with "    }," if it's closing onSuccess/onError

  const lines = content.split('\n');
  let newLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Fix: closing brace with extra spaces before onError/onSuccess
    if (line.match(/^\s{6}\},/) && i > 0) {
      const prevLine = lines[i - 1];
      // If previous line is inside a callback, reduce indent to 4 spaces
      if (prevLine.includes('toast.') || prevLine.includes('queryClient.') ||
          prevLine.includes('setData') || prevLine.includes('onSuccess') ||
          prevLine.includes('onError')) {
        line = line.replace(/^\s{6}/, '    ');
        modified = true;
      }
    }

    // Fix: onSuccess/onError with 6 spaces when should be 4
    if (line.match(/^\s{6}(onSuccess:|onError:|onSettled:|onMutate:)/) && i > 0) {
      const prevLine = lines[i - 1];
      // Only fix if it's in a useMutation context
      if (prevLine.includes('mutationFn:') || prevLine.includes('queryFn:') ||
          prevLine.includes('toast.') || prevLine.includes('queryClient.')) {
        line = line.replace(/^\s{6}/, '    ');
        modified = true;
      }
    }

    // Fix: closing brace "}" on same line as value with extra spaces
    // Pattern: "true }" or "null }" -> "true\n  }"
    if (line.match(/:\s*(true|false|null|{[^}]*})\s*\}$/) &&
        !line.includes('{')) {
      const match = line.match(/^(\s*)(.*?):\s*(true|false|null)\s*\}$/);
      if (match) {
        const indent = match[1];
        const rest = match[2];
        line = `${indent}${rest}: ${match[3]}`;
        newLines.push(line);
        newLines.push(`${indent.slice(0, -2)}}`);
        modified = true;
        continue;
      }
    }

    newLines.push(line);
  }

  const newContent = newLines.join('\n');

  if (modified) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('\n✓ All indentation issues fixed!');
