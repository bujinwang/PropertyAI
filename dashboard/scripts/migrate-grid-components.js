const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (!['node_modules', '.git', 'build', 'dist', '.next'].includes(file)) {
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
    
    // Pattern to match Grid components with item prop
    // This regex looks for <Grid followed by item and then any responsive props
    const gridItemPattern = /<Grid\s+item\s+([^>]*?)>/g;
    
    // Replace Grid item components
    content = content.replace(gridItemPattern, (match, props) => {
      modified = true;
      // Remove 'item' from the props and keep the rest
      const cleanedProps = props.trim();
      if (cleanedProps) {
        return `<Grid ${cleanedProps}>`;
      } else {
        return '<Grid>';
      }
    });
    
    // Also handle cases where item appears after other props
    const gridItemPattern2 = /<Grid\s+([^>]*?)\s+item\s+([^>]*?)>/g;
    content = content.replace(gridItemPattern2, (match, beforeProps, afterProps) => {
      modified = true;
      const allProps = [beforeProps.trim(), afterProps.trim()].filter(p => p).join(' ');
      if (allProps) {
        return `<Grid ${allProps}>`;
      } else {
        return '<Grid>';
      }
    });
    
    // Handle cases where item appears between other props
    const gridItemPattern3 = /<Grid\s+([^>]*?)\s+item\s+([^>]*?)>/g;
    content = content.replace(gridItemPattern3, (match, beforeProps, afterProps) => {
      modified = true;
      const allProps = [beforeProps.trim(), afterProps.trim()].filter(p => p).join(' ');
      if (allProps) {
        return `<Grid ${allProps}>`;
      } else {
        return '<Grid>';
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Migrated: ${filePath}`);
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
  console.log('🚀 Starting MUI Grid migration...\n');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);
  
  let totalFiles = 0;
  let migratedFiles = 0;
  
  files.forEach(file => {
    totalFiles++;
    if (migrateGridComponents(file)) {
      migratedFiles++;
    }
  });
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files migrated: ${migratedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - migratedFiles}`);
  
  if (migratedFiles > 0) {
    console.log('\n✨ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test your application to ensure everything works correctly');
    console.log('   2. Check for any TypeScript errors');
    console.log('   3. Review the changes and commit them');
  } else {
    console.log('\n🎉 No files needed migration - you\'re all set!');
  }
}

// Run the migration
if (require.main === module) {
  migrateAllGridComponents();
}

module.exports = { migrateAllGridComponents, migrateGridComponents };