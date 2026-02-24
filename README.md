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

### Why Fewer Elements Is Better

You might wonder: "Isn't 50 elements vs 24,567 elements comparing apples to oranges?"

**No—and here's why:**

1. **Most elements are noise.** Of those 24,567 elements on slickdeals.net, the vast majority are:
   - Ad iframes and tracking pixels
   - Hidden elements and overlays
   - Decorative containers (`<div>`, `<span>`)
   - Non-interactive text nodes
   - Duplicate/redundant elements

2. **LLMs need actionable elements and enough context to reason.** For browser automation, the agent needs to:
   - Click buttons and links
   - Fill form fields
   - Read key content for decision-making

   Predicate's ML ranking identifies the ~50 most relevant elements—including both interactive controls and contextual text—while filtering out the noise.

3. **More elements = worse performance.** Sending 600K tokens to an LLM causes:
   - Higher latency (slower responses)
   - Higher cost ($11K+/month vs $5/month)
   - Context window overflow on complex pages
   - More hallucinations from irrelevant context

4. **Quality over quantity.** Predicate's snapshot includes:
   - ML-ranked importance scores
   - Dominant group detection (for ordinal tasks like "click 3rd item")
   - Visual cues (is_primary, position)
   - Semantic role information

   This structured context helps LLMs make better decisions than a raw element dump.

**The goal isn't to preserve all elements—it's to preserve the right elements.**

### Proven in Production

- **Small local LLM model (3B) success**: The Predicate Snapshot engine powered a complex browser automation task using only a 3B parameter local model—[featured on Hacker News front page](https://news.ycombinator.com/item?id=46790127)
- **Deep dive**: Read why the accessibility tree alone isn't enough for web automation: [Why A11y Alone Isn't Enough](https://predicatesystems.ai/blog/why-ax-alone-isnt-enough)

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
2. Sign up for a **free account (includes 500 free credits/month)**
3. Navigate to **Dashboard > API Keys**
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

### Run LLM Action Demo

Test that Predicate snapshots work for real browser automation with an LLM.

**Setup:**

1. Copy the example env file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your OpenAI API key:
```bash
# .env
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: for ML-ranked snapshots
PREDICATE_API_KEY=sk-your-predicate-api-key-here
```

3. Run the demo:
```bash
npm run demo:llm

# With visible browser and element overlay (for debugging)
npm run demo:llm -- --headed --overlay
```

**Alternative LLM providers:**
```bash
# Anthropic Claude
ANTHROPIC_API_KEY=sk-... npm run demo:llm

# Local LLM (Ollama)
SENTIENCE_LOCAL_LLM_BASE_URL=http://localhost:11434/v1 npm run demo:llm
```

**Flags:**
- `--headed` - Run browser in visible window (not headless)
- `--overlay` - Show green borders around captured elements (requires `--headed`)

This demo compares:
- **Tokens**: A11y tree vs Predicate snapshot input size
- **Latency**: Total time including LLM response
- **Success**: Whether the LLM correctly identifies the target element

**Example output:**
```
======================================================================
 LLM Browser Navigation COMPARISON: A11y Tree vs. Predicate Snapshot
======================================================================
Using OpenAI provider
Model: gpt-4o-mini
Running in headed mode (visible browser window)
Overlay enabled: elements will be highlighted with green borders
Predicate snapshots: REAL (ML-ranked)
======================================================================

Task: Click first news link on HN

  [A11y Tree] Click first news link on HN
    Chose element: 48
    Tokens: 35191, Latency: 3932ms
  [Predicate] Click first news link on HN
    Chose element: 48
    Tokens: 864, Latency: 2477ms

Task: Click More link on HN

  [A11y Tree] Click More link on HN
    Chose element: 1199
    Tokens: 35179, Latency: 2366ms
  [Predicate] Click More link on HN
    Chose element: 11
    Tokens: 861, Latency: 1979ms

Task: Click search on Example.com

  [A11y Tree] Click search on Example.com
    Chose element: 7
    Tokens: 272, Latency: 492ms
  [Predicate] Click search on Example.com
    Chose element: 6
    Tokens: 44, Latency: 6255ms

======================================================================
 RESULTS SUMMARY
======================================================================

┌─────────────────────────────────────────────────────────────────────┐
│ Metric              │ A11y Tree        │ Predicate        │ Δ       │
├─────────────────────────────────────────────────────────────────────┤
│ Total Tokens        │            70642 │             1769 │ -97%    │
│ Avg Tokens/Task     │            23547 │              590 │         │
│ Total Latency (ms)  │             6790 │            10711 │ -58%    │
│ Success Rate        │              3/3 │              3/3 │         │
└─────────────────────────────────────────────────────────────────────┘

Key Insight: Predicate snapshots use ~97% fewer tokens
while achieving the same task success rate.
```

> **Note:** Latency includes network time for ML ranking via the Predicate gateway. Token savings translate directly to cost savings—97% fewer tokens = 97% lower LLM costs.

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
│   ├── compare.ts    # Token comparison demo
│   └── llm-action.ts # LLM action comparison demo
├── SKILL.md          # OpenClaw skill manifest
└── package.json
```

## Dependencies

- `@predicatesystems/runtime` - Predicate SDK with PredicateContext
- `playwright` (peer) - Browser automation

## License

(MIT OR Apache-2.0)

## Support

- Documentation: [predicatesystems.ai/docs](https://predicatesystems.ai/docs)
- Issues: [GitHub Issues](https://github.com/PredicateSystems/openclaw-predicate-skill/issues)
