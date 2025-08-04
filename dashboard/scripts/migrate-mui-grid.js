const fs = require('fs');
const path = require('path');

// Function to recursively find all files
function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      if (!['node_modules', '.git', 'build', 'dist', '.next', 'coverage'].includes(file)) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Function to migrate Grid components in a file
function migrateGridComponents(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;
    
    // Pattern 1: <Grid item xs={...} sm={...} md={...}> -> <Grid xs={...} sm={...} md={...}>
    const pattern1 = /<Grid\s+item\s+([^>]*?)>/g;
    content = content.replace(pattern1, (match, props) => {
      modified = true;
      return `<Grid ${props.trim()}>`;
    });
    
    // Pattern 2: <Grid xs={...} item sm={...}> -> <Grid xs={...} sm={...}>
    const pattern2 = /<Grid\s+([^>]*?)\s+item\s+([^>]*?)>/g;
    content = content.replace(pattern2, (match, beforeProps, afterProps) => {
      modified = true;
      const allProps = [beforeProps.trim(), afterProps.trim()].filter(p => p).join(' ');
      return `<Grid ${allProps}>`;
    });
    
    // Pattern 3: <Grid item> -> <Grid>
    const pattern3 = /<Grid\s+item\s*>/g;
    content = content.replace(pattern3, () => {
      modified = true;
      return '<Grid>';
    });
    
    // Clean up any double spaces
    content = content.replace(/\s+/g, ' ').replace(/>\s+</g, '><');
    
    if (modified && content !== originalContent) {
      // Create backup
      fs.writeFileSync(filePath + '.backup', originalContent, 'utf8');
      
      // Write updated content
      fs.writeFileSync(filePath, content, 'utf8');
      
      console.log(`✅ Migrated: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main migration function
function migrateAllGridComponents() {
  console.log('🚀 Starting MUI Grid Migration...\n');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);
  
  let totalFiles = 0;
  let migratedFiles = 0;
  
  console.log(`🔍 Found ${files.length} files to scan...\n`);
  
  files.forEach(file => {
    totalFiles++;
    if (migrateGridComponents(file)) {
      migratedFiles++;
    }
  });
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files migrated: ${migratedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - migratedFiles}`);
  
  if (migratedFiles > 0) {
    console.log('\n✨ Migration completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Test your application: npm run dev');
    console.log('   2. Check for TypeScript errors: npm run type-check');
    console.log('   3. Run tests: npm test');
    console.log('   4. Review changes and commit them');
    console.log('\n💾 Backup files created with .backup extension');
    console.log('   Remove them after confirming everything works:');
    console.log('   find src -name "*.backup" -delete');
  } else {
    console.log('\n🎉 No files needed migration - you\'re all set!');
  }
  
  console.log('\n🔧 To restore from backups if needed:');
  console.log('   find src -name "*.backup" -exec sh -c \'mv "$1" "${1%.backup}"\' _ {} \\;');
}

// Run the migration
if (require.main === module) {
  migrateAllGridComponents();
}

module.exports = { migrateAllGridComponents, migrateGridComponents };