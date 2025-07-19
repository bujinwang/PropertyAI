#!/usr/bin/env node

/**
 * Performance Optimization Verification Script
 * Verifies that all performance optimizations have been implemented correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying AI Component Performance Optimizations...\n');

const checks = [];

// Check 1: Verify React.memo() usage in AI components
const aiComponentsDir = path.join(__dirname, '../src/design-system/components/ai');
const aiComponents = ['AIGeneratedContent.tsx', 'ConfidenceIndicator.tsx', 'SuggestionChip.tsx'];

aiComponents.forEach(component => {
  const filePath = path.join(aiComponentsDir, component);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasMemo = content.includes('memo(') && content.includes('from \'react\'');
    const hasDisplayName = content.includes('.displayName =');
    
    checks.push({
      name: `${component} - React.memo()`,
      passed: hasMemo,
      message: hasMemo ? '✅ Uses React.memo()' : '❌ Missing React.memo()'
    });
    
    checks.push({
      name: `${component} - Display Name`,
      passed: hasDisplayName,
      message: hasDisplayName ? '✅ Has displayName' : '❌ Missing displayName'
    });
  }
});

// Check 2: Verify useMemo() usage for expensive calculations
aiComponents.forEach(component => {
  const filePath = path.join(aiComponentsDir, component);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasUseMemo = content.includes('useMemo(');
    
    checks.push({
      name: `${component} - useMemo()`,
      passed: hasUseMemo,
      message: hasUseMemo ? '✅ Uses useMemo()' : '❌ Missing useMemo()'
    });
  }
});

// Check 3: Verify useCallback() usage for event handlers (only for components that need it)
const componentsWithEventHandlers = ['AIGeneratedContent.tsx', 'SuggestionChip.tsx'];
componentsWithEventHandlers.forEach(component => {
  const filePath = path.join(aiComponentsDir, component);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasUseCallback = content.includes('useCallback(');
    
    checks.push({
      name: `${component} - useCallback()`,
      passed: hasUseCallback,
      message: hasUseCallback ? '✅ Uses useCallback()' : '❌ Missing useCallback()'
    });
  }
});

// Check 4: Verify lazy loading setup
const lazyFilePath = path.join(aiComponentsDir, 'lazy.ts');
if (fs.existsSync(lazyFilePath)) {
  const content = fs.readFileSync(lazyFilePath, 'utf8');
  const hasLazyImports = content.includes('lazy(') && content.includes('import(');
  
  checks.push({
    name: 'Lazy Loading Setup',
    passed: hasLazyImports,
    message: hasLazyImports ? '✅ Lazy loading configured' : '❌ Missing lazy loading'
  });
}

// Check 5: Verify performance utilities
const perfUtilsPath = path.join(__dirname, '../src/utils/ai-performance.ts');
if (fs.existsSync(perfUtilsPath)) {
  const content = fs.readFileSync(perfUtilsPath, 'utf8');
  const hasCache = content.includes('aiCalculationCache');
  const hasMemoHooks = content.includes('useConfidenceLevel') && content.includes('useConfidenceColor');
  
  checks.push({
    name: 'Performance Utilities - Caching',
    passed: hasCache,
    message: hasCache ? '✅ AI calculation cache implemented' : '❌ Missing cache implementation'
  });
  
  checks.push({
    name: 'Performance Utilities - Memo Hooks',
    passed: hasMemoHooks,
    message: hasMemoHooks ? '✅ Memoization hooks available' : '❌ Missing memoization hooks'
  });
}

// Check 6: Verify Vite configuration optimizations
const viteConfigPath = path.join(__dirname, '../vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const content = fs.readFileSync(viteConfigPath, 'utf8');
  const hasManualChunks = content.includes('manualChunks') && content.includes('ai-core');
  const hasTreeShaking = content.includes('treeshake');
  
  checks.push({
    name: 'Vite Config - Manual Chunks',
    passed: hasManualChunks,
    message: hasManualChunks ? '✅ AI components chunking configured' : '❌ Missing manual chunks'
  });
  
  checks.push({
    name: 'Vite Config - Tree Shaking',
    passed: hasTreeShaking,
    message: hasTreeShaking ? '✅ Tree shaking optimized' : '❌ Missing tree shaking config'
  });
}

// Check 7: Verify bundle analysis script
const bundleAnalysisPath = path.join(__dirname, 'analyze-bundle.js');
const bundleAnalysisExists = fs.existsSync(bundleAnalysisPath);

checks.push({
  name: 'Bundle Analysis Script',
  passed: bundleAnalysisExists,
  message: bundleAnalysisExists ? '✅ Bundle analysis script created' : '❌ Missing bundle analysis'
});

// Check 8: Verify performance monitoring component
const perfMonitorPath = path.join(__dirname, '../src/components/performance/AIPerformanceMonitor.tsx');
const perfMonitorExists = fs.existsSync(perfMonitorPath);

checks.push({
  name: 'Performance Monitor Component',
  passed: perfMonitorExists,
  message: perfMonitorExists ? '✅ Performance monitor implemented' : '❌ Missing performance monitor'
});

// Display results
console.log('📊 Performance Optimization Results:\n');

let passedChecks = 0;
let totalChecks = checks.length;

checks.forEach(check => {
  console.log(`  ${check.message}`);
  if (check.passed) passedChecks++;
});

console.log(`\n📈 Summary: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 All performance optimizations implemented successfully!');
  
  console.log('\n💡 Performance Benefits:');
  console.log('  • React.memo() prevents unnecessary re-renders');
  console.log('  • useMemo() caches expensive calculations');
  console.log('  • useCallback() prevents child re-renders');
  console.log('  • Lazy loading reduces initial bundle size');
  console.log('  • Code splitting enables better caching');
  console.log('  • Tree shaking removes unused code');
  console.log('  • Performance monitoring tracks metrics');
  
  console.log('\n🚀 Next Steps:');
  console.log('  • Run "npm run analyze" to check bundle sizes');
  console.log('  • Monitor performance in development with the overlay');
  console.log('  • Test lazy loading with network throttling');
  console.log('  • Profile components with React DevTools');
  
  process.exit(0);
} else {
  console.log('\n⚠️  Some optimizations are missing or incomplete.');
  console.log('Please review the failed checks above.');
  process.exit(1);
}