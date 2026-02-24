/**
 * Predicate Snapshot Tool
 *
 * Captures ML-ranked DOM snapshots using @predicatesystems/runtime.
 * Returns compact pipe-delimited format optimized for LLM consumption.
 */

import { backends } from '@predicatesystems/runtime';
import type { ToolContext, ToolResult } from './index';

export interface SnapshotOptions {
  useLocal?: boolean;
}

export interface SnapshotParams {
  limit?: number;
  includeOrdinal?: boolean;
}

export class PredicateSnapshotTool {
  private useLocal: boolean;

  constructor(options: SnapshotOptions = {}) {
    this.useLocal = options.useLocal ?? false;
  }

  async execute(params: SnapshotParams, context: ToolContext): Promise<ToolResult> {
    const limit = params.limit ?? 50;

    try {
      // Validate context
      if (!context.browserSession && !context.page) {
        return {
          success: false,
          error: 'No browser context available. Ensure OpenClaw has an active browser session.',
        };
      }

      // Check for API key (unless using local mode)
      const apiKey = process.env.PREDICATE_API_KEY;
      if (!this.useLocal && !apiKey) {
        return {
          success: false,
          error:
            'PREDICATE_API_KEY required for ML-powered snapshots. ' +
            'Get one at https://predicate.systems/keys or use /predicate-snapshot-local for free local mode.',
        };
      }

      // Create PredicateContext and build snapshot
      const ctx = new backends.PredicateContext({
        predicateApiKey: this.useLocal ? undefined : apiKey,
        topElementSelector: {
          byImportance: Math.min(limit, 60),
          fromDominantGroup: 15,
          byPosition: 10,
        },
      });

      const result = await ctx.build(context.browserSession);

      if (!result || !result.promptBlock) {
        return {
          success: false,
          error: 'Snapshot returned empty result',
        };
      }

      // Build response with metadata
      const response = this.formatResponse(result, limit, this.useLocal);

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Snapshot failed: ${message}`,
      };
    }
  }

  private formatResponse(
    result: backends.SentienceContextState,
    limit: number,
    isLocal: boolean
  ): string {
    const lines: string[] = [];

    // Header with metadata
    lines.push(`# Predicate Snapshot${isLocal ? ' (Local)' : ''}`);
    lines.push(`# URL: ${result.url ?? 'unknown'}`);
    lines.push(`# Elements: showing top ${limit}`);
    lines.push(`# Format: ID|role|text|imp|is_primary|docYq|ord|DG|href`);
    lines.push('');

    // Element data (promptBlock contains the formatted output)
    lines.push(result.promptBlock);

    return lines.join('\n');
  }
}

/**
 * Standalone function for direct usage
 */
export async function takePredicateSnapshot(
  context: ToolContext,
  options: SnapshotParams & SnapshotOptions = {}
): Promise<ToolResult> {
  const tool = new PredicateSnapshotTool({ useLocal: options.useLocal });
  return tool.execute(options, context);
}
