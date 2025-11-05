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

  // Fix pattern: extra indent before onSuccess/onError after mutationFn
  // Detect: "    mutationFn:" followed by "      onSuccess:" (extra 2 spaces)
  content = content.replace(
    /mutationFn:[^\n]*\n\s{6}(onSuccess:|onError:)/g,
    (match) => {
      modified = true;
      // Replace 6 spaces with 4 spaces
      return match.replace(/\n\s{6}/, '\n    ');
    }
  );

  // Another pattern: queryFn followed by extra indent in options
  content = content.replace(
    /queryFn:[^\n]*\n\s{6}(keepPreviousData:|retry:|onSuccess:|onError:)/g,
    (match) => {
      modified = true;
      return match.replace(/\n\s{6}/, '\n    ');
    }
  );

  // Fix pattern: closing brace on same line as property value
  content = content.replace(
    /:\s*true\s*\}/g,
    ': true\n  }'
  );

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('\n✓ All indentation issues fixed!');
