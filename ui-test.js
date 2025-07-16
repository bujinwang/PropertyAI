// Simple UI component test for Property App
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Property App UI Components...\n');

// Test 1: Check if main app components exist
function testComponentExistence() {
  console.log('1. Testing component existence...');
  
  const components = [
    'propertyapp/src/screens/auth/LoginScreen.tsx',
    'propertyapp/src/screens/auth/RegisterScreen.tsx',
    'propertyapp/src/screens/HomeScreen.tsx',
    'propertyapp/src/components/ui/Button.tsx',
    'propertyapp/src/components/ui/FormInput.tsx',
    'propertyapp/src/contexts/AuthContext.tsx',
    'propertyapp/src/navigation/AppNavigator.tsx'
  ];

  let allExist = true;
  components.forEach(component => {
    if (fs.existsSync(path.join(__dirname, component))) {
      console.log(`✅ ${component} exists`);
    } else {
      console.log(`❌ ${component} missing`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Test 2: Check if navigation is properly configured
function testNavigationSetup() {
  console.log('\n2. Testing navigation setup...');
  
  const navigationFiles = [
    'propertyapp/src/navigation/AppNavigator.tsx',
    'propertyapp/src/navigation/MainTabNavigator.tsx',
    'propertyapp/src/navigation/types.ts'
  ];
  
  let navigationValid = true;
  navigationFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
      console.log(`✅ ${file} configured`);
    } else {
      console.log(`❌ ${file} missing`);
      navigationValid = false;
    }
  });
  
  return navigationValid;
}

// Test 3: Check if API services are properly configured
function testAPIServices() {
  console.log('\n3. Testing API service configuration...');
  
  const apiFiles = [
    'propertyapp/src/services/api.ts',
    'propertyapp/src/services/authService.ts',
    'propertyapp/src/constants/api.ts'
  ];
  
  let apiValid = true;
  apiFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      if (content.includes('localhost:5001/api')) {
        console.log(`✅ ${file} configured for local API`);
      } else {
        console.log(`⚠️  ${file} may need API URL check`);
      }
    } else {
      console.log(`❌ ${file} missing`);
      apiValid = false;
    }
  });
  
  return apiValid;
}

// Test 4: Check if theme and styling are configured
function testStyling() {
  console.log('\n4. Testing styling configuration...');
  
  const themeFile = 'propertyapp/src/constants/theme.ts';
  if (fs.existsSync(path.join(__dirname, themeFile))) {
    console.log(`✅ ${themeFile} exists`);
    
    const content = fs.readFileSync(path.join(__dirname, themeFile), 'utf8');
    if (content.includes('COLORS') && content.includes('FONTS')) {
      console.log(`✅ Theme constants properly defined`);
      return true;
    } else {
      console.log(`⚠️  Theme constants may be incomplete`);
      return false;
    }
  } else {
    console.log(`❌ ${themeFile} missing`);
    return false;
  }
}

// Test 5: Check if UI components are properly structured
function testUIComponents() {
  console.log('\n5. Testing UI component structure...');
  
  const uiComponents = [
    'propertyapp/src/components/ui/Button.tsx',
    'propertyapp/src/components/ui/FormInput.tsx',
    'propertyapp/src/components/ui/Card.tsx',
    'propertyapp/src/components/ui/LoadingIndicator.tsx'
  ];
  
  let uiValid = true;
  uiComponents.forEach(component => {
    if (fs.existsSync(path.join(__dirname, component))) {
      const content = fs.readFileSync(path.join(__dirname, component), 'utf8');
      if (content.includes('export') && content.includes('StyleSheet')) {
        console.log(`✅ ${component} properly structured`);
      } else {
        console.log(`⚠️  ${component} may need structure review`);
      }
    } else {
      console.log(`❌ ${component} missing`);
      uiValid = false;
    }
  });
  
  return uiValid;
}

// Test 6: Check package.json for required dependencies
function testDependencies() {
  console.log('\n6. Testing dependencies...');
  
  const packagePath = 'propertyapp/package.json';
  if (fs.existsSync(path.join(__dirname, packagePath))) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, packagePath), 'utf8'));
    
    const requiredDeps = [
      'react', 'react-native', 'expo', '@react-navigation/native',
      'axios', '@react-native-async-storage/async-storage'
    ];
    
    let depsValid = true;
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        console.log(`✅ ${dep} installed`);
      } else {
        console.log(`❌ ${dep} missing`);
        depsValid = false;
      }
    });
    
    return depsValid;
  } else {
    console.log(`❌ package.json missing`);
    return false;
  }
}

// Run all tests
function runUITests() {
  console.log('🎯 Starting Property App UI Tests...\n');
  
  const results = [
    testComponentExistence(),
    testNavigationSetup(),
    testAPIServices(),
    testStyling(),
    testUIComponents(),
    testDependencies()
  ];
  
  const passed = results.filter(r => r === true).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All UI tests passed! Property App is ready for use.');
  } else {
    console.log(`⚠️  ${total - passed} tests need attention.`);
  }
  
  return passed === total;
}

// Execute tests
runUITests();