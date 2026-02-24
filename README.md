# Predicate Snapshot Skill for OpenClaw

ML-powered DOM pruning that reduces browser prompt tokens by **up to 99.8%** while preserving actionable elements.

## Overview

This OpenClaw skill replaces the default accessibility tree snapshot with Predicate's ML-ranked DOM elements. Instead of sending 800+ elements (~18,000 tokens) to the LLM, it sends only the 50 most relevant elements (configurable) (~500 tokens).

### Real-World Demo Results

Tested with the included demo (`npm run demo`):

| Site | OpenClaw Snapshot (A11y Tree) | Predicate Snapshot | Savings |
|------|-----------|-----------|---------|
| slickdeals.net | 598,301 tokens (24,567 elements) | 1,283 tokens (50 elements) | **99.8%** |
| news.ycombinator.com | 16,484 tokens (681 elements) | 587 tokens (50 elements) | **96%** |
| example.com | 305 tokens (12 elements) | 164 tokens (4 elements) | **46%** |
| httpbin.org/html | 1,590 tokens (34 elements) | 164 tokens (4 elements) | **90%** |
| **Total** | **616,680 tokens** | **2,198 tokens** | **99.6%** |

> Ad-heavy sites like slickdeals.net show the most dramatic savings—from 598K tokens down to just 1.3K tokens. Simple pages like example.com have minimal elements, so savings are lower.

### Summary

| Approach | Tokens (avg) | Elements | Signal Quality |
|----------|--------|----------|----------------|
| Accessibility Tree | ~150,000+ | ~6,000+ | Low (noise) |
| Predicate Snapshot | ~500-1,300 | 50 | High (ML-ranked) |

## Quick Start

### 1. Install the Skill

**Via ClawHub (Recommended):**
```bash
npx clawdhub@latest install predicate-snapshot
```

**Manual Installation:**
```bash
git clone https://github.com/PredicateSystems/openclaw-predicate-skill ~/.openclaw/skills/predicate-snapshot
cd ~/.openclaw/skills/predicate-snapshot
npm install
npm run build
```

### 2. Get Your API Key

1. Go to [PredicateSystems.ai](https://www.PredicateSystems.ai)
2. Sign up for a free account (includes 500 free credits/month)
3. Navigate to **Settings > API Keys**
4. Click **Create New Key** and copy your key (starts with `sk-...`)

### 3. Configure the API Key

**Option A: Environment Variable (Recommended)**
```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export PREDICATE_API_KEY="sk-your-key-here"
```

**Option B: OpenClaw Config File**

Add to `~/.openclaw/config.yaml`:
```yaml
skills:
  predicate-snapshot:
    api_key: "sk-your-key-here"
    max_credits_per_session: 100  # Optional: limit credits per session
```

### 4. Verify Installation

```bash
# In OpenClaw, run:
/predicate-snapshot
```

If configured correctly, you'll see a ranked list of page elements.

## How It Works

### Does This Replace the Default A11y Tree?

**No, this skill does not automatically replace OpenClaw's default accessibility tree.** Instead, it provides an alternative snapshot command that you can use when you want better element ranking.

| Command | What It Does |
|---------|--------------|
| Default OpenClaw | Uses raw accessibility tree (~18,000 tokens) |
| `/predicate-snapshot` | Uses ML-ranked Predicate snapshot (~500 tokens) |
| `/predicate-snapshot-local` | Uses local heuristic ranking (free, no API) |

**To use Predicate snapshots in your workflow:**
1. Use `/predicate-snapshot` instead of the default page observation
2. Use `/predicate-act click <ID>` to interact with elements by their ID
3. The element IDs from Predicate snapshots work with `/predicate-act`

**Future:** OpenClaw may add configuration to set Predicate as the default snapshot provider.

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

Each ML-powered snapshot consumes 1 credit. Local snapshots are free.

## Development

### Run Demo

Compare token usage between accessibility tree and Predicate snapshot:

Get free credits for testing at https://www.PredicateSystems.ai

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
 TOTAL: 616,680 -> 2,198 tokens (99.6% reduction)
======================================================================

 MONTHLY COST PROJECTION (5,000 tasks × 5 snapshots = 25,000 snapshots)
   Accessibility Tree: $11,562.75 (LLM tokens only)
   Predicate Snapshot: $5.12 ($1.37 LLM + $3.75 API)
   Monthly Savings:    $11,557.63
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
- Issues: [GitHub Issues](https://github.com/PredicateSystems/openclaw-predicate-skill/issues)
- Discord: [Predicate Community](https://discord.gg/predicate)
