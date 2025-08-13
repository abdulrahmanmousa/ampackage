#!/bin/bash

# Test script for ampackage CLI
set -e

echo "🧪 Testing ampackage CLI..."

# Create a temporary test project
TEST_DIR="/tmp/ampackage-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "📁 Created test directory: $TEST_DIR"

# Test 1: List available templates
echo "✅ Test 1: List templates"
ampackage list

# Test 2: Add a single component
echo "✅ Test 2: Add single component"
ampackage add component Button
if [ -f "src/components/Button.tsx" ]; then
    echo "✅ Button component added successfully"
else
    echo "❌ Button component not found"
    exit 1
fi

# Test 3: Add multiple components
echo "✅ Test 3: Add multiple components"
ampackage add component Modal Card --overwrite
if [ -f "src/components/Modal.tsx" ] && [ -f "src/components/Card.tsx" ]; then
    echo "✅ Multiple components added successfully"
else
    echo "❌ Multiple components not found"
    exit 1
fi

# Test 4: Add hook
echo "✅ Test 4: Add hook"
ampackage add hook useAuth
if [ -f "src/hooks/useAuth.ts" ]; then
    echo "✅ Hook added successfully"
else
    echo "❌ Hook not found"
    exit 1
fi

# Test 5: Add utils
echo "✅ Test 5: Add utils"
ampackage add util formatDate asyncUtils
if [ -f "src/utils/formatDate.ts" ] && [ -f "src/utils/asyncUtils.ts" ]; then
    echo "✅ Utils added successfully"
else
    echo "❌ Utils not found"
    exit 1
fi

# Test 6: Custom destination
echo "✅ Test 6: Custom destination"
ampackage add component Button --dest lib
if [ -f "lib/components/Button.tsx" ]; then
    echo "✅ Custom destination works"
else
    echo "❌ Custom destination failed"
    exit 1
fi

# Test 7: Modify and push back
echo "✅ Test 7: Modify and push"
echo "// Modified by test" >> src/components/Button.tsx
ampackage push component Button --overwrite
echo "✅ Push completed"

echo "✅ Test 8: Non-existent template"
if ampackage add component NonExistent 2>&1 | grep -q "Template not found"; then
    echo "✅ Correctly failed for non-existent template"
else
    echo "❌ Should have shown error for non-existent template"
    exit 1
fi

# Show final structure
echo "📁 Final project structure:"
find . -name "*.ts*" -type f | sort

echo "🎉 All tests passed!"

# Cleanup
cd /
rm -rf "$TEST_DIR"
echo "🧹 Cleaned up test directory"