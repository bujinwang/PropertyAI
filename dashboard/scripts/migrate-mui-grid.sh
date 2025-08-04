#!/bin/bash

# MUI Grid Migration Script
# This script migrates Grid components from old syntax to new MUI Grid v2 syntax

echo "🚀 Starting MUI Grid Migration..."
echo "=================================="

# Set the source directory
SRC_DIR="/Users/bujin/Documents/Projects/PropertyAI/dashboard/src"

# Counter for tracking changes
total_files=0
modified_files=0

# Function to process a single file
process_file() {
    local file="$1"
    local temp_file="${file}.tmp"
    local backup_file="${file}.backup"
    
    # Check if file contains Grid item patterns
    if grep -q "<Grid.*item" "$file"; then
        echo "📝 Processing: $(basename "$file")"
        
        # Create backup
        cp "$file" "$backup_file"
        
        # Apply transformations using sed
        sed -E 's/<Grid item ([^>]*)>/<Grid \1>/g' "$file" > "$temp_file"
        
        # Replace original file
        mv "$temp_file" "$file"
        
        # Clean up any double spaces
        sed -i '' 's/  / /g' "$file"
        
        echo "✅ Migrated: $(basename "$file")"
        ((modified_files++))
    fi
    
    ((total_files++))
}

# Find and process all TypeScript/JavaScript files
echo "🔍 Scanning for files to migrate..."
echo ""

find "$SRC_DIR" -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) | while read -r file; do
    process_file "$file"
done

echo ""
echo "📊 Migration Summary:"
echo "===================="
echo "Total files scanned: $total_files"
echo "Files modified: $modified_files"
echo "Files unchanged: $((total_files - modified_files))"

if [ $modified_files -gt 0 ]; then
    echo ""
    echo "✨ Migration completed successfully!"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Test your application: npm run dev"
    echo "2. Check for TypeScript errors: npm run type-check"
    echo "3. Run tests: npm test"
    echo "4. Review changes and commit them"
    echo ""
    echo "💾 Backup files created with .backup extension"
    echo "   You can remove them after confirming everything works:"
    echo "   find $SRC_DIR -name '*.backup' -delete"
else
    echo ""
    echo "🎉 No files needed migration - you're all set!"
fi

echo ""
echo "🔧 If you encounter any issues, you can restore from backups:"
echo "   find $SRC_DIR -name '*.backup' -exec sh -c 'mv \"\$1\" \"\${1%.backup}\"' _ {} \;"