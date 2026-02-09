#!/bin/bash
#
# validate-articles.sh
# Check all existing articles for missing frontmatter fields
#

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo "🔍 Validating all articles in content/news/..."
echo ""

ERRORS=0
CHECKED=0

for file in content/news/*.md; do
    [ -f "$file" ] || continue
    CHECKED=$((CHECKED + 1))
    
    FRONTMATTER=$(sed -n '/^---$/,/^---$/p' "$file" | head -50)
    FILE_ERRORS=0
    
    # Check for image: field
    if ! echo "$FRONTMATTER" | grep -q "^image:"; then
        if [ $FILE_ERRORS -eq 0 ]; then
            echo -e "${YELLOW}📄 $file${NC}"
        fi
        echo -e "   ${RED}❌ Missing 'image:' field${NC}"
        FILE_ERRORS=$((FILE_ERRORS + 1))
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary: $CHECKED articles checked"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ $ERRORS article(s) missing 'image:' field${NC}"
    echo ""
    echo "To fix, add to each article's frontmatter:"
    echo 'image: "https://images.unsplash.com/photo-XXXXXX?w=800&h=420&fit=crop"'
    exit 1
else
    echo -e "${GREEN}✅ All articles have required frontmatter fields${NC}"
    exit 0
fi
