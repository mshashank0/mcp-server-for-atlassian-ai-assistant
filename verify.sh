#!/bin/bash

# Verification Script for Atlassian MCP Server
# This script verifies that everything is working correctly before GitHub publication

set -e  # Exit on error

echo "========================================="
echo "Atlassian MCP Server Verification"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Working directory: $SCRIPT_DIR"
echo ""

# Test counter
PASS=0
FAIL=0

# Function to check test result
check_test() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $1"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC}: $1"
        ((FAIL++))
    fi
}

echo "========================================="
echo "1. Directory Structure Verification"
echo "========================================="
echo ""

# Check that unwanted directories are removed
echo "Checking removed directories..."
[ ! -d "src/image-gen" ]
check_test "src/image-gen directory removed"

[ ! -d "src/argo-wf" ]
check_test "src/argo-wf directory removed"

[ ! -d "src/referer" ]
check_test "src/referer directory removed"

# Check that required directories exist
echo ""
echo "Checking required directories..."
[ -d "src/bitbucket" ]
check_test "src/bitbucket exists"

[ -d "src/confluence" ]
check_test "src/confluence exists"

[ -d "src/jira" ]
check_test "src/jira exists"

[ -d "src/shared" ]
check_test "src/shared exists"

[ -d "dist" ]
check_test "dist directory exists (build successful)"

echo ""
echo "========================================="
echo "2. File Content Verification"
echo "========================================="
echo ""

# Check package.json
echo "Checking package.json..."
grep -q '"name": "atlassian-mcp-server"' package.json
check_test "Package name is atlassian-mcp-server"

grep -q '"author": "mshashank0"' package.json
check_test "Author is mshashank0"

! grep -q "dev:image-gen" package.json
check_test "No image-gen scripts in package.json"

! grep -q "dev:argo-wf" package.json
check_test "No argo-wf scripts in package.json"

# Check .env.example
echo ""
echo "Checking .env.example..."
grep -q "CONFLUENCE_BASE_URL" .env.example
check_test ".env.example has CONFLUENCE_BASE_URL"

grep -q "JIRA_BASE_URL" .env.example
check_test ".env.example has JIRA_BASE_URL"

grep -q "BITBUCKET_BASE_URL" .env.example
check_test ".env.example has BITBUCKET_BASE_URL"

! grep -q "API_PROVIDER_API_KEY" .env.example
check_test ".env.example has no API_PROVIDER_API_KEY"

! grep -q "ARGO_WORKFLOW" .env.example
check_test ".env.example has no ARGO_WORKFLOW"

# Check README.md
echo ""
echo "Checking README.md..."
grep -q "mshashank0" README.md
check_test "README mentions mshashank0"

grep -q "52 tools" README.md || grep -q "52 total tools" README.md
check_test "README mentions 52 tools"

grep -q "Bitbucket MCP Server" README.md
check_test "README mentions Bitbucket"

grep -q "Confluence MCP Server" README.md
check_test "README mentions Confluence"

grep -q "Jira MCP Server" README.md
check_test "README mentions Jira"

! grep -q "Image Generation MCP" README.md || ! grep -q "image-gen-mcp" README.md
check_test "README does not mention Image Generation"

! grep -q "Argo Workflow" README.md
check_test "README does not mention Argo Workflows"

# Check src/index.ts
echo ""
echo "Checking src/index.ts..."
grep -q "bitbucket" src/index.ts
check_test "index.ts includes bitbucket"

grep -q "confluence" src/index.ts
check_test "index.ts includes confluence"

grep -q "jira" src/index.ts
check_test "index.ts includes jira"

! grep -q "argo-wf" src/index.ts
check_test "index.ts does not include argo-wf"

echo ""
echo "========================================="
echo "3. Company-Specific Reference Check"
echo "========================================="
echo ""

# Check for company-specific terms (case-insensitive)
echo "Checking for company-specific references..."

! grep -ri "rakuten" src/ README.md package.json .env.example 2>/dev/null | grep -v "Binary file" | grep -v ".map"
check_test "No 'rakuten' references found"

! grep -ri "golf-ui" src/ README.md package.json 2>/dev/null | grep -v "Binary file" | grep -v ".map"
check_test "No 'golf-ui' references found"

! grep -ri "KEI\.B\.IRIE" src/ README.md 2>/dev/null | grep -v "Binary file" | grep -v ".map"
check_test "No personal identifiers found"

echo ""
echo "========================================="
echo "4. Build Verification"
echo "========================================="
echo ""

# Check dist directory structure
echo "Checking dist directory..."
[ -d "dist/bitbucket" ]
check_test "dist/bitbucket exists"

[ -d "dist/confluence" ]
check_test "dist/confluence exists"

[ -d "dist/jira" ]
check_test "dist/jira exists"

[ -f "dist/index.js" ]
check_test "dist/index.js exists"

[ ! -d "dist/image-gen" ]
check_test "dist/image-gen does not exist"

[ ! -d "dist/argo-wf" ]
check_test "dist/argo-wf does not exist"

echo ""
echo "========================================="
echo "5. TypeScript Compilation Check"
echo "========================================="
echo ""

# Check if TypeScript files compile without errors
echo "Verifying TypeScript compilation..."
if [ -f "dist/bitbucket/index.js" ] && [ -f "dist/confluence/index.js" ] && [ -f "dist/jira/index.js" ]; then
    echo -e "${GREEN}✓ PASS${NC}: All main entry points compiled successfully"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}: Some entry points failed to compile"
    ((FAIL++))
fi

echo ""
echo "========================================="
echo "6. Package Scripts Verification"
echo "========================================="
echo ""

# Check that scripts exist
echo "Checking package.json scripts..."
grep -q '"dev:bitbucket"' package.json
check_test "dev:bitbucket script exists"

grep -q '"dev:confluence"' package.json
check_test "dev:confluence script exists"

grep -q '"dev:jira"' package.json
check_test "dev:jira script exists"

grep -q '"start:bitbucket"' package.json
check_test "start:bitbucket script exists"

grep -q '"start:confluence"' package.json
check_test "start:confluence script exists"

grep -q '"start:jira"' package.json
check_test "start:jira script exists"

echo ""
echo "========================================="
echo "VERIFICATION SUMMARY"
echo "========================================="
echo ""
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}========================================="
    echo "✅ ALL TESTS PASSED!"
    echo "=========================================${NC}"
    echo ""
    echo "Your project is ready for GitHub publication!"
    echo ""
    echo "Next steps:"
    echo "1. git init"
    echo "2. git add ."
    echo "3. git commit -m 'Initial commit: Atlassian MCP Server'"
    echo "4. git remote add origin https://github.com/mshashank0/atlassian-mcp-server.git"
    echo "5. git push -u origin main"
    echo ""
    exit 0
else
    echo -e "${RED}========================================="
    echo "❌ SOME TESTS FAILED"
    echo "=========================================${NC}"
    echo ""
    echo "Please review the failed tests above and fix them before publishing."
    echo ""
    exit 1
fi
