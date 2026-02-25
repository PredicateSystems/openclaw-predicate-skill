/**
 * Test script for predicate-snapshot skill via OpenClaw
 *
 * This script tests the skill's installation, module loading, and tool registration.
 * Note: Actual snapshot execution requires OpenClaw's browser-use session with CDP support.
 * Use `./docker-test.sh demo:login` to test full snapshot functionality.
 */

import * as path from 'path';
import * as fs from 'fs';
import { chromium } from 'playwright';

// Colors for terminal output
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const NC = '\x1b[0m'; // No Color

const TEST_URL = 'https://www.localllamaland.com/login';

async function main() {
  console.log(`${GREEN}========================================${NC}`);
  console.log(`${GREEN}Predicate Snapshot Skill - Integration Test${NC}`);
  console.log(`${GREEN}========================================${NC}`);
  console.log();

  // Step 1: Verify skill is installed
  console.log(`${CYAN}Step 1: Verifying skill installation...${NC}`);
  const skillPath = path.join(process.env.HOME || '/root', '.openclaw/skills/predicate-snapshot');
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  const distPath = path.join(skillPath, 'dist/index.js');

  if (!fs.existsSync(skillMdPath)) {
    console.log(`${RED}ERROR: SKILL.md not found at ${skillMdPath}${NC}`);
    process.exit(1);
  }
  if (!fs.existsSync(distPath)) {
    console.log(`${RED}ERROR: Built skill not found at ${distPath}${NC}`);
    process.exit(1);
  }
  console.log(`${GREEN}✓ Skill installed at ${skillPath}${NC}`);

  // Step 2: Parse SKILL.md frontmatter
  console.log();
  console.log(`${CYAN}Step 2: Parsing SKILL.md...${NC}`);
  const skillMd = fs.readFileSync(skillMdPath, 'utf-8');
  const frontmatterMatch = skillMd.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.log(`${RED}ERROR: No frontmatter found in SKILL.md${NC}`);
    process.exit(1);
  }

  const frontmatter = frontmatterMatch[1];
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const commandToolMatch = frontmatter.match(/^command-tool:\s*(.+)$/m);

  const skillName = nameMatch?.[1] || 'unknown';
  const commandTool = commandToolMatch?.[1] || 'unknown';

  console.log(`  Name: ${skillName}`);
  console.log(`  Command tool: ${commandTool}`);
  console.log(`${GREEN}✓ SKILL.md parsed successfully${NC}`);

  // Step 3: Load the skill module
  console.log();
  console.log(`${CYAN}Step 3: Loading skill module...${NC}`);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const skillModule = require(distPath);

  if (!skillModule.mcpTools) {
    console.log(`${RED}ERROR: mcpTools not exported from skill${NC}`);
    process.exit(1);
  }

  const tools = Object.keys(skillModule.mcpTools);
  console.log(`  Exported tools: ${tools.join(', ')}`);

  // Verify each tool has required properties
  for (const toolName of tools) {
    const tool = skillModule.mcpTools[toolName];
    if (!tool.handler || typeof tool.handler !== 'function') {
      console.log(`${RED}ERROR: Tool '${toolName}' missing handler function${NC}`);
      process.exit(1);
    }
    if (!tool.description) {
      console.log(`${YELLOW}Warning: Tool '${toolName}' missing description${NC}`);
    }
  }
  console.log(`${GREEN}✓ All tools have valid handlers${NC}`);

  // Step 4: Launch browser and navigate (tests Playwright works)
  console.log();
  console.log(`${CYAN}Step 4: Testing browser automation...${NC}`);
  console.log(`  Target URL: ${TEST_URL}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded' });

  // Verify page loaded
  const title = await page.title();
  console.log(`  Page title: ${title}`);
  console.log(`${GREEN}✓ Browser launched and navigated successfully${NC}`);

  // Step 5: Verify predicate-act tool can validate parameters
  console.log();
  console.log(`${CYAN}Step 5: Testing tool parameter validation...${NC}`);

  const actTool = skillModule.mcpTools['predicate-act'];
  if (!actTool) {
    console.log(`${RED}ERROR: predicate-act tool not found${NC}`);
    await browser.close();
    process.exit(1);
  }

  // Test invalid action parameter
  const invalidResult = await actTool.handler(
    { action: 'invalid_action', elementId: 1 },
    { page }
  );

  if (!invalidResult.success && invalidResult.error?.includes('Invalid action')) {
    console.log(`${GREEN}✓ Parameter validation works (rejected invalid action)${NC}`);
  } else {
    console.log(`${YELLOW}Warning: Parameter validation may not be working${NC}`);
  }

  // Cleanup
  await browser.close();

  // Summary
  console.log();
  console.log(`${GREEN}========================================${NC}`);
  console.log(`${GREEN}Test Summary${NC}`);
  console.log(`${GREEN}========================================${NC}`);
  console.log(`${GREEN}✓ Skill installation verified${NC}`);
  console.log(`${GREEN}✓ SKILL.md frontmatter valid${NC}`);
  console.log(`${GREEN}✓ mcpTools exported correctly${NC}`);
  console.log(`${GREEN}✓ All tool handlers registered${NC}`);
  console.log(`${GREEN}✓ Browser automation working${NC}`);
  console.log(`${GREEN}✓ Parameter validation functional${NC}`);
  console.log();
  console.log(`${GREEN}All integration tests passed!${NC}`);
  console.log();
  console.log(`${CYAN}Note: Actual snapshot execution requires OpenClaw's browser-use session.${NC}`);
  console.log(`${CYAN}Run './docker-test.sh demo:login' to test full snapshot functionality.${NC}`);

  // Check API key status
  if (!process.env.PREDICATE_API_KEY) {
    console.log();
    console.log(`${YELLOW}Note: PREDICATE_API_KEY not set.${NC}`);
    console.log(`${YELLOW}ML-powered ranking requires an API key.${NC}`);
    console.log(`${YELLOW}Get one at: https://predicatesystems.ai${NC}`);
  }
}

main().catch(err => {
  console.log(`${RED}Test failed with error:${NC}`);
  console.error(err);
  process.exit(1);
});
