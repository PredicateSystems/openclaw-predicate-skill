#!/bin/bash
# Docker test script for predicate-snapshot skill
# Usage: ./docker-test.sh [skill|demo:login|demo|demo:llm]
#
# Options:
#   skill       Test skill integration with OpenClaw (default)
#   demo:login  Run the login demo directly
#   demo        Run basic comparison demo
#   demo:llm    Run LLM action demo

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Predicate Snapshot Skill - Docker Test${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "Test site: ${YELLOW}https://www.localllamaland.com/login${NC}"
echo -e "This is a fake login site with intentional challenges:"
echo -e "  - Delayed hydration (~600ms)"
echo -e "  - Button disabled until form filled"
echo -e "  - Late-loading profile content"
echo

# Check for environment variables
if [ -z "$PREDICATE_API_KEY" ]; then
    echo -e "${YELLOW}Note: PREDICATE_API_KEY not set. Using local heuristic mode.${NC}"
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}Note: ANTHROPIC_API_KEY not set. LLM features disabled.${NC}"
fi

# Create output directory
mkdir -p test-output

# Default test to run
TEST_MODE="${1:-skill}"

echo
echo -e "${CYAN}Building Docker image...${NC}"
docker build -t predicate-snapshot-test .

echo
case "$TEST_MODE" in
    skill)
        echo -e "${GREEN}Running: OpenClaw skill integration test${NC}"
        echo -e "${CYAN}This tests the skill as OpenClaw would load and use it.${NC}"
        echo
        docker run --rm -it \
            -e PREDICATE_API_KEY="${PREDICATE_API_KEY:-}" \
            -e ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
            -v "$(pwd)/test-output:/app/test-output" \
            predicate-snapshot-test \
            npx ts-node test-skill.ts
        ;;
    demo:login|demo|demo:llm)
        echo -e "${GREEN}Running: npm run ${TEST_MODE}${NC}"
        echo -e "${CYAN}This runs the demo script directly (SDK-level test).${NC}"
        echo
        docker run --rm -it \
            -e PREDICATE_API_KEY="${PREDICATE_API_KEY:-}" \
            -e ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
            -e HEADLESS=true \
            -v "$(pwd)/test-output:/app/test-output" \
            predicate-snapshot-test \
            npm run "$TEST_MODE"
        ;;
    *)
        echo -e "${RED}Unknown test mode: ${TEST_MODE}${NC}"
        echo "Usage: ./docker-test.sh [skill|demo:login|demo|demo:llm]"
        exit 1
        ;;
esac

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test complete!${NC}"
echo -e "${GREEN}========================================${NC}"

# Check for trace files
if [ -d "test-output" ] && [ "$(ls -A test-output 2>/dev/null)" ]; then
    echo -e "${GREEN}Trace files saved to: ./test-output/${NC}"
    ls -la test-output/
fi
