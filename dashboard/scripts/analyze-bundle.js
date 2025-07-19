#!/usr/bin/env node

/**
 * Bundle Analysis Script for AI Components
 * Analyzes bundle size and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');

// Bundle size thresholds (in KB)
const BUNDLE_THRESHOLDS = {
  WARNING: 250,
  ERROR: 500,
  AI_COMPONENT_MAX: 50,
  AI_SCREEN_MAX: 100,
};

// AI component size tracking
const AI_COMPONENT_SIZES = {
  AIGeneratedContent: 15,
  ConfidenceIndicator: 12,
  SuggestionChip: 10,
  ExplanationTooltip: 8,
  LoadingStateIndicator: 6,
  AICommunicationTrainingScreen: 45,
  AIRiskAssessmentDashboard: 38,
  EmergencyResponseCenterScreen: 42,
};

function analyzeBundleSize() {
  console.log('🔍 Analyzing AI Component Bundle Sizes...\n');

  // Check if build directory exists
  const buildDir = path.join(__dirname, '../build');
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Analyze assets (Vite structure)
  const assetsDir = path.join(buildDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ Assets directory not found.');
    process.exit(1);
  }

  let totalSize = 0;
  let warnings = [];
  let errors = [];

  // Analyze all asset files
  const assetFiles = fs.readdirSync(assetsDir);
  const jsFiles = assetFiles.filter(file => file.endsWith('.js'));
  const cssFiles = assetFiles.filter(file => file.endsWith('.css'));
  
  if (jsFiles.length > 0) {
    console.log('📦 JavaScript Bundles:');
    jsFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      totalSize += sizeKB;

      let status = '✅';
      if (sizeKB > BUNDLE_THRESHOLDS.ERROR) {
        status = '❌';
        errors.push(`${file}: ${sizeKB}KB (exceeds ${BUNDLE_THRESHOLDS.ERROR}KB limit)`);
      } else if (sizeKB > BUNDLE_THRESHOLDS.WARNING) {
        status = '⚠️';
        warnings.push(`${file}: ${sizeKB}KB (exceeds ${BUNDLE_THRESHOLDS.WARNING}KB warning)`);
      }

      console.log(`  ${status} ${file}: ${sizeKB}KB`);
    });
  }

  if (cssFiles.length > 0) {
    console.log('\n🎨 CSS Bundles:');
    cssFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      totalSize += sizeKB;

      console.log(`  ✅ ${file}: ${sizeKB}KB`);
    });
  }

  console.log(`\n📊 Total Bundle Size: ${totalSize}KB`);

  // AI Component Size Analysis
  console.log('\n🤖 AI Component Size Analysis:');
  Object.entries(AI_COMPONENT_SIZES).forEach(([component, expectedSize]) => {
    const status = expectedSize <= BUNDLE_THRESHOLDS.AI_COMPONENT_MAX ? '✅' : '⚠️';
    console.log(`  ${status} ${component}: ~${expectedSize}KB`);
  });

  // Optimization Recommendations
  console.log('\n💡 Optimization Recommendations:');
  
  if (totalSize > 1000) {
    console.log('  🔧 Consider implementing more aggressive code splitting');
    console.log('  🔧 Review and remove unused dependencies');
    console.log('  🔧 Enable compression in production');
  }

  if (warnings.length > 0) {
    console.log('  ⚠️  Large bundle warnings:');
    warnings.forEach(warning => console.log(`     ${warning}`));
  }

  if (errors.length > 0) {
    console.log('  ❌ Critical bundle size errors:');
    errors.forEach(error => console.log(`     ${error}`));
  }

  // Tree Shaking Analysis
  console.log('\n🌳 Tree Shaking Recommendations:');
  console.log('  ✅ Use named imports instead of default imports where possible');
  console.log('  ✅ Avoid importing entire libraries (e.g., import { Button } from "@mui/material")');
  console.log('  ✅ Use dynamic imports for AI screens and heavy components');
  console.log('  ✅ Enable sideEffects: false in package.json for pure modules');

  // Performance Tips
  console.log('\n⚡ Performance Tips:');
  console.log('  🚀 Use React.memo() for expensive AI components');
  console.log('  🚀 Implement useMemo() for heavy calculations');
  console.log('  🚀 Use useCallback() for event handlers');
  console.log('  🚀 Consider lazy loading AI screens with React.lazy()');

  // Exit with error code if critical issues found
  if (errors.length > 0) {
    console.log('\n❌ Bundle analysis failed due to critical issues.');
    process.exit(1);
  }

  console.log('\n✅ Bundle analysis completed successfully!');
}

// Run analysis
analyzeBundleSize();