#!/bin/bash

# Test script for ampackage CLI with remote sources
set -e

echo "🧪 Testing ampackage CLI with remote sources..."

# Create a temporary test project
TEST_DIR="/tmp/ampackage-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "📁 Created test directory: $TEST_DIR"

# Test 1: Source management
echo "✅ Test 1: Source management"
echo "  - List default sources"
ampackage source list

echo "  - Add GitHub source"
ampackage source add test-github github https://github.com/abdulrahmanmousa/ampackage.git --branch main --path templates

echo "  - List sources after adding"
ampackage source list

# Test 2: List templates from all sources
echo "✅ Test 2: List templates from all sources"
ampackage list

# Test 3: List templates from specific source
echo "✅ Test 3: List templates from specific source"
ampackage list --source local

# Test 4: Add component from local source
echo "✅ Test 4: Add component from local source"
ampackage add component Button --source local
if [ -f "src/components/Button.tsx" ]; then
    echo "✅ Button component added from local source"
else
    echo "❌ Button component not found"
    exit 1
fi

# Test 5: Add component from GitHub source
echo "✅ Test 5: Add component from GitHub source"
ampackage add component Modal --source test-github
if [ -f "src/components/Modal.tsx" ]; then
    echo "✅ Modal component added from GitHub source"
else
    echo "❌ Modal component not found"
    exit 1
fi

# Test 6: Add multiple components
echo "✅ Test 6: Add multiple components"
ampackage add component Card Button --overwrite
if [ -f "src/components/Card.tsx" ]; then
    echo "✅ Multiple components added successfully"
else
    echo "❌ Multiple components not found"
    exit 1
fi

# Test 7: Add hook and utils
echo "✅ Test 7: Add hook and utils"
ampackage add hook useAuth
ampackage add util formatDate asyncUtils
if [ -f "src/hooks/useAuth.ts" ] && [ -f "src/utils/formatDate.ts" ] && [ -f "src/utils/asyncUtils.ts" ]; then
    echo "✅ Hooks and utils added successfully"
else
    echo "❌ Hooks or utils not found"
    exit 1
fi

# Test 8: Custom destination
echo "✅ Test 8: Custom destination"
ampackage add component Button --dest lib --overwrite
if [ -f "lib/components/Button.tsx" ]; then
    echo "✅ Custom destination works"
else
    echo "❌ Custom destination failed"
    exit 1
fi

# Test 9: Create and push new component
echo "✅ Test 9: Create and push new component"
mkdir -p src/components
cat > src/components/NewComponent.tsx << 'EOF'
import React from 'react';

interface NewComponentProps {
  title: string;
}

export const NewComponent: React.FC<NewComponentProps> = ({ title }) => {
  return <div className="new-component">{title}</div>;
};
EOF

ampackage push component NewComponent --overwrite
echo "✅ Push to local completed"

# Test 10: Non-existent template
echo "✅ Test 10: Non-existent template"
if ampackage add component NonExistent 2>&1 | grep -q "Template not found"; then
    echo "✅ Correctly failed for non-existent template"
else
    echo "❌ Should have shown error for non-existent template"
    exit 1
fi

# Test 11: Invalid source
echo "✅ Test 11: Invalid source"
if ampackage add component Button --source invalid-source 2>&1 | grep -q "not found"; then
    echo "✅ Correctly failed for invalid source"
else
    echo "❌ Should have shown error for invalid source"
    exit 1
fi

# Test 12: Remove source
echo "✅ Test 12: Remove source"
ampackage source remove test-github
echo "✅ Source removed successfully"

# Show final structure
echo "📁 Final project structure:"
find . -name "*.ts*" -type f | sort

echo "🎉 All remote source tests passed!"

# Cleanup
cd /
rm -rf "$TEST_DIR"
echo "🧹 Cleaned up test directory"