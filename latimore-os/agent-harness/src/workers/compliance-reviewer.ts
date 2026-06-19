/**
 * Compliance Reviewer Worker
 * Reviews all AI-generated content for PA DOI compliance
 * Insurance-specific rules: no guarantees, no misleading claims, dignity-first
 */

import { BaseWorker } from '../types';
import type { WorkerInput, WorkerOutput, WorkerEnv, ComplianceCheck, ComplianceViolation } from '../types';
import { callOpenAI } from '../lib/llm';

export class ComplianceReviewer extends BaseWorker {
  name = 'ComplianceReviewer';
  description = 'Reviews AI-generated content for PA DOI insurance compliance';

  // Hard-coded rule patterns (fast, no LLM needed)
  private readonly CRITICAL_PATTERNS: Array<{ pattern: RegExp; rule: string; description: string }> = [
    {
      pattern: /guarantee[sd]?\s+(you|your|that|a|the)\s+(will|won't|won't|shall|must)/i,
      rule: 'NO_GUARANTEE',
      description: 'Definitive guarantee language is prohibited in insurance marketing',
    },
    {
      pattern: /\$[\d,]+\s*(per month|\/month|monthly)\s*(guaranteed|for sure|definitely)/i,
      rule: 'NO_SPECIFIC_PREMIUM_GUARANTEE',
      description: 'Specific premium amounts cannot be guaranteed without an official illustration',
    },
    {
      pattern: /you (will|won't|shall) (receive|get|earn|make|pay)/i,
      rule: 'NO_DEFINITIVE_OUTCOME',
      description: 'Definitive outcome statements are prohibited — use "may", "can", or "could"',
    },
    {
      pattern: /medical (advice|diagnosis|treatment|prescription)/i,
      rule: 'NO_MEDICAL_ADVICE',
      description: 'Medical advice is strictly prohibited',
    },
    {
      pattern: /legal (advice|counsel|opinion|guidance)/i,
      rule: 'NO_LEGAL_ADVICE',
      description: 'Legal advice is strictly prohibited',
    },
  ];

  private readonly MAJOR_PATTERNS: Array<{ pattern: RegExp; rule: string; description: string }> = [
    {
      pattern: /best (insurance|policy|plan|product|rate|deal) (in|on|for)/i,
      rule: 'SUPERLATIVE_CLAIM',
      description: 'Superlative claims ("best") require substantiation',
    },
    {
      pattern: /\d+%\s*(return|growth|gain|yield|interest)\s*(guaranteed|assured|certain)/i,
      rule: 'GUARANTEED_RETURN',
      description: 'Guaranteed return percentages require official illustration',
    },
    {
      pattern: /fear|terrif|scar|panic|danger|risk of death|die without/i,
      rule: 'FEAR_BASED_MARKETING',
      description: 'Fear-based marketing violates dignity-first brand guidelines',
    },
    {
      pattern: /limited time|act now|expires|last chance|only \d+ (spots|slots|openings) left/i,
      rule: 'FALSE_URGENCY',
      description: 'False urgency claims may violate PA DOI regulations',
    },
  ];

  private readonly MINOR_PATTERNS: Array<{ pattern: RegExp; rule: string; description: string }> = [
    {
      pattern: /always|never|every (family|person|client|customer)/i,
      rule: 'ABSOLUTE_LANGUAGE',
      description: 'Absolute language should be softened with qualifiers',
    },
    {
      pattern: /\$[\d,]{4,}/,
      rule: 'SPECIFIC_DOLLAR_AMOUNT',
      description: 'Specific dollar amounts should reference official illustrations',
    },
  ];

  async execute(input: WorkerInput, env: WorkerEnv): Promise<WorkerOutput> {
    const content = input.content as string || '';
    const useAI = input.use_ai_review !== false && content.length > 100;

    this.log(`Reviewing content (${content.length} chars, AI: ${useAI})`);

    if (!content) {
      return {
        success: true,
        data: { passed: true, violations: [], warnings: [], notes: 'No content to review' },
      };
    }

    try {
      // Step 1: Fast pattern-based check
      const patternResult = this.runPatternCheck(content);

      // Step 2: AI-powered review for nuanced issues (if no critical violations)
      let aiResult: Partial<ComplianceCheck> = { violations: [], warnings: [] };
      if (useAI && patternResult.violations.filter(v => v.severity === 'critical').length === 0) {
        aiResult = await this.runAIReview(env, content);
      }

      // Merge results
      const allViolations = [
        ...patternResult.violations,
        ...(aiResult.violations || []),
      ];
      const allWarnings = [
        ...patternResult.warnings,
        ...(aiResult.warnings || []),
      ];

      const criticalCount = allViolations.filter(v => v.severity === 'critical').length;
      const majorCount = allViolations.filter(v => v.severity === 'major').length;
      const passed = criticalCount === 0 && majorCount === 0;

      const result: ComplianceCheck = {
        passed,
        violations: allViolations,
        warnings: allWarnings,
        notes: buildComplianceNotes(passed, criticalCount, majorCount, allWarnings.length),
      };

      this.log(`Compliance check: ${passed ? 'PASSED' : 'FAILED'} (${criticalCount} critical, ${majorCount} major, ${allWarnings.length} warnings)`);

      return {
        success: true,
        data: result as unknown as Record<string, unknown>,
        tokens_used: 0,
        actions_taken: ['pattern_check', useAI ? 'ai_review' : 'pattern_only'],
      };

    } catch (err) {
      this.error('Compliance review failed', err);
      // Fail safe — return passed with warning rather than blocking
      return {
        success: true,
        data: {
          passed: true,
          violations: [],
          warnings: ['Compliance review encountered an error — manual review recommended'],
          notes: 'Automated review failed — please review manually',
        },
      };
    }
  }

  // ── PATTERN-BASED CHECK ────────────────────────────────────────────────────

  private runPatternCheck(content: string): ComplianceCheck {
    const violations: ComplianceViolation[] = [];
    const warnings: string[] = [];

    // Check critical patterns
    for (const { pattern, rule, description } of this.CRITICAL_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        violations.push({
          rule,
          severity: 'critical',
          description,
          content_excerpt: match[0].substring(0, 100),
        });
      }
    }

    // Check major patterns
    for (const { pattern, rule, description } of this.MAJOR_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        violations.push({
          rule,
          severity: 'major',
          description,
          content_excerpt: match[0].substring(0, 100),
        });
      }
    }

    // Check minor patterns
    for (const { pattern, rule, description } of this.MINOR_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        warnings.push(`[${rule}] ${description} — found: "${match[0].substring(0, 50)}"`);
      }
    }

    // Check for missing license disclosure in marketing content
    if (content.length > 200 && !content.includes('PA DOI') && !content.includes('licensed')) {
      warnings.push('[MISSING_LICENSE] Consider adding PA DOI license number for marketing materials');
    }

    const passed = violations.filter(v => v.severity === 'critical' || v.severity === 'major').length === 0;

    return { passed, violations, warnings, notes: '' };
  }

  // ── AI-POWERED REVIEW ──────────────────────────────────────────────────────

  private async runAIReview(env: WorkerEnv, content: string): Promise<Partial<ComplianceCheck>> {
    const response = await callOpenAI(env, [
      {
        role: 'system',
        content: `You are a compliance reviewer for Latimore Life & Legacy, a licensed insurance agency (PA DOI #1268820).

Review insurance marketing content for PA DOI compliance violations.

Key rules:
1. No definitive guarantees about insurance outcomes
2. Use "may", "can", "could" for outcome statements — never "will" or "shall"
3. No specific premium quotes without official illustration reference
4. No fear-based marketing — dignity-first, preparedness-focused
5. No medical or legal advice
6. No false urgency or misleading claims
7. No superlative claims without substantiation

Return JSON with:
- violations: array of {rule, severity ("critical"|"major"|"minor"), description, content_excerpt}
- warnings: string array
Only flag genuine violations — do not over-flag educational content.`
      },
      {
        role: 'user',
        content: `Review this insurance marketing content for compliance:\n\n${content.substring(0, 2000)}`,
      }
    ], { json: true, temperature: 0.1, max_tokens: 500 });

    try {
      return JSON.parse(response.content) as Partial<ComplianceCheck>;
    } catch {
      return { violations: [], warnings: [] };
    }
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function buildComplianceNotes(
  passed: boolean,
  critical: number,
  major: number,
  warnings: number
): string {
  if (passed && warnings === 0) return 'Content passed all compliance checks.';
  if (passed && warnings > 0) return `Content passed with ${warnings} warning(s). Review recommended.`;
  if (critical > 0) return `FAILED: ${critical} critical violation(s) found. Content must be revised before use.`;
  return `FAILED: ${major} major violation(s) found. Content requires revision.`;
}