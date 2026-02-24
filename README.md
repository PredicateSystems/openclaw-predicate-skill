# Predicate Snapshot Skill for OpenClaw

ML-powered DOM pruning that reduces browser prompt tokens by **97%** while preserving actionable elements.

## Overview

This OpenClaw skill replaces the default accessibility tree snapshot with Predicate's ML-ranked DOM elements. Instead of sending 800+ elements (~18,000 tokens) to the LLM, it sends only the 50 most relevant elements (~500 tokens).

### Real-World Demo Results

Tested on bot-friendly sites with the included demo (`npm run demo`):

| Site | A11y Tree | Predicate | Savings |
|------|-----------|-----------|---------|
| news.ycombinator.com | 16,484 tokens (681 elements) | 587 tokens (50 elements) | **96%** |
| example.com | 305 tokens (12 elements) | 164 tokens (4 elements) | **46%** |
| httpbin.org/html | 1,590 tokens (34 elements) | 164 tokens (4 elements) | **90%** |
| **Total** | **18,379 tokens** | **915 tokens** | **95%** |

> Note: Simple pages like example.com have minimal elements, so savings are lower. Complex pages like Hacker News show the full benefit.

### Summary

| Approach | Tokens | Elements | Signal Quality |
|----------|--------|----------|----------------|
| Accessibility Tree | ~18,000 | ~800 | Low (noise) |
| Predicate Snapshot | ~500-900 | 50 | High (ML-ranked) |

## Installation

### Via ClawHub (Recommended)

```bash
npx clawdhub@latest install predicate-snapshot
```

### Manual Installation

```bash
git clone https://github.com/predicate-systems/predicate-snapshot-skill ~/.openclaw/skills/predicate-snapshot
cd ~/.openclaw/skills/predicate-snapshot
npm install
npm run build
```

## Configuration

### API Key

Get your free API key at [predicate.systems/keys](https://predicate.systems/keys)

Set via environment variable:

```bash
export PREDICATE_API_KEY="sk-..."
```

Or in `~/.openclaw/config.yaml`:

```yaml
skills:
  predicate-snapshot:
    api_key: "sk-..."
    max_credits_per_session: 100
```

## Usage

### Capture Snapshot

```
/predicate-snapshot [--limit=50] [--include-ordinal]
```

Returns a pipe-delimited table of ranked elements:

```
ID|role|text|imp|is_primary|docYq|ord|DG|href
42|button|Add to Cart|0.95|true|320|1|cart-actions|
15|button|Buy Now|0.92|true|340|2|cart-actions|
23|link|Product Details|0.78|false|400|0||/dp/...
```

### Execute Actions

```bash
/predicate-act click 42        # Click element by ID
/predicate-act type 15 "query" # Type into element
/predicate-act scroll 23       # Scroll to element
```

### Local Mode (Free)

```
/predicate-snapshot-local [--limit=50]
```

Uses heuristic ranking without ML API calls. Lower accuracy but no credits consumed.

## Example Workflow

```
1. /predicate-snapshot              # Get ranked elements
2. /predicate-act click 42          # Click "Add to Cart"
3. /predicate-snapshot              # Refresh after action
4. Verify cart updated
```

## Output Format

| Column | Description |
|--------|-------------|
| ID | Unique element identifier for `/predicate-act` |
| role | ARIA role (button, link, textbox, etc.) |
| text | Visible text content (truncated to 30 chars) |
| imp | Importance score (0.0-1.0, ML-ranked) |
| is_primary | Whether element is a primary action |
| docYq | Vertical position in document |
| ord | Ordinal within dominant group |
| DG | Dominant group identifier |
| href | Link URL if applicable |

## Pricing

| Tier | Credits/Month | Price |
|------|---------------|-------|
| Hobby | 500 | Free |
| Builder | 20,000 | $19/mo |
| Pro | 40,000 | $49/mo |
| Teams | 120,000 | $149/mo |
| Enterprise | Custom | Contact us |

Each ML-powered snapshot consumes 1 credit. Local snapshots are free.

## Development

### Run Demo

Compare token usage between accessibility tree and Predicate snapshot:

```bash
# With API key (REAL ML-ranked snapshots)
PREDICATE_API_KEY=sk-... npm run demo

# Without API key (uses extension's local ranking)
npm run demo
```

Example output:
```
======================================================================
 TOKEN USAGE COMPARISON: Accessibility Tree vs. Predicate Snapshot
======================================================================
 Mode: PredicateBrowser with extension loaded
 Snapshots: REAL (API key detected)
======================================================================

Analyzing: https://news.ycombinator.com
  Capturing accessibility tree...
  Capturing Predicate snapshot (REAL - ML-ranked via API)...

======================================================================
 RESULTS
======================================================================

news.ycombinator.com (REAL)
  +---------------------------------------------------------+
  | Accessibility Tree:   16,484 tokens (681 elements)      |
  | Predicate Snapshot:      587 tokens (50 elements)       |
  | Savings:                  96%                           |
  +---------------------------------------------------------+

======================================================================
 TOTAL: 18,379 -> 915 tokens (95% reduction)
======================================================================

 MONTHLY COST PROJECTION (5,000 tasks, Claude Sonnet)
   Accessibility Tree: $1.38
   Predicate Snapshot: $0.07
   Monthly Savings:    $1.31
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Architecture

```
predicate-snapshot-skill/
├── src/
│   ├── index.ts      # MCP tool definitions
│   ├── snapshot.ts   # PredicateSnapshotTool implementation
│   └── act.ts        # PredicateActTool implementation
├── demo/
│   └── compare.ts    # Token comparison demo
├── SKILL.md          # OpenClaw skill manifest
└── package.json
```

## Dependencies

- `@predicatesystems/runtime` - Predicate SDK with PredicateContext
- `playwright` (peer) - Browser automation

## License

(MIT OR Apache-2.0)

## Support

- Documentation: [predicate.systems/docs](https://predicate.systems/docs)
- Issues: [GitHub Issues](https://github.com/predicate-systems/predicate-snapshot-skill/issues)
- Discord: [Predicate Community](https://discord.gg/predicate)
