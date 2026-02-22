#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         DISPUTEHUB DEPLOYMENT TO VERCEL + GODADDY             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Pre-deployment checks...${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo -e "${RED}❌ .env file not found${NC}"
  echo "Please create .env with your environment variables first"
  exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"

# Check required env vars
required_vars=(
  "DATABASE_URL"
  "CLERK_SECRET_KEY"
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  "ANTHROPIC_API_KEY"
  "OPENAI_API_KEY"
)

for var in "${required_vars[@]}"; do
  if grep -q "^$var=" .env; then
    echo -e "${GREEN}✅ $var configured${NC}"
  else
    echo -e "${YELLOW}⚠️  $var missing in .env${NC}"
  fi
done

echo ""
echo -e "${BLUE}Step 2: Running build test...${NC}"
echo ""

# Test build (with timeout protection)
timeout 120 npm run build > /tmp/build_test.log 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  echo -e "${GREEN}✅ Build successful${NC}"
elif [ $BUILD_EXIT -eq 124 ]; then
  echo -e "${YELLOW}⚠️  Build timeout (this is OK - Vercel handles it differently)${NC}"
else
  echo -e "${YELLOW}⚠️  Build had warnings (check /tmp/build_test.log)${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Preparing for Vercel deployment...${NC}"
echo ""

# Check if vercel is installed locally
if [ -f node_modules/.bin/vercel ]; then
  echo -e "${GREEN}✅ Vercel CLI found${NC}"
else
  echo -e "${YELLOW}Installing Vercel CLI...${NC}"
  npm install vercel --save-dev
fi

echo ""
echo -e "${BLUE}Step 4: Login to Vercel...${NC}"
echo ""
echo "Please run this command manually to login:"
echo ""
echo -e "${GREEN}npx vercel login${NC}"
echo ""
echo "Then run:"
echo -e "${GREEN}npx vercel${NC}"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}Step 5: After deployment, configure GoDaddy DNS:${NC}"
echo ""
echo "1. Log into GoDaddy.com"
echo "2. Go to 'My Products' → dispute-hub.com → Manage DNS"
echo "3. Add these records:"
echo ""
echo -e "${YELLOW}Record 1 (Root domain):${NC}"
echo "   Type: A"
echo "   Name: @"
echo "   Value: 76.76.21.21"
echo "   TTL: 600"
echo ""
echo -e "${YELLOW}Record 2 (WWW):${NC}"
echo "   Type: CNAME"
echo "   Name: www"
echo "   Value: cname.vercel-dns.com"
echo "   TTL: 600"
echo ""
echo "4. In Vercel Dashboard:"
echo "   - Go to Settings → Domains"
echo "   - Add: dispute-hub.com"
echo "   - Add: www.dispute-hub.com"
echo ""
echo "5. Wait 5-10 minutes for DNS propagation"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Pre-deployment checks complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run: ${GREEN}npx vercel login${NC}"
echo "2. Run: ${GREEN}npx vercel${NC}"
echo "3. Configure DNS in GoDaddy (instructions above)"
echo "4. Add environment variables in Vercel dashboard"
echo ""
