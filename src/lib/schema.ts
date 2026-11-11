import { z } from "zod";

/**
 * The single shape every guide uses, whether hand-researched (seed) or
 * generated live by the research agent. Validated server-side before any
 * guide is saved or rendered.
 */

export const Audience = z.enum(["personal", "internal", "external"]);
export type Audience = z.infer<typeof Audience>;

export const AUDIENCE_LABEL: Record<Audience, string> = {
  personal: "Just me / testing",
  internal: "My own organisation",
  external: "External customers",
};

/** How we know a claim. Descriptive labels, never confidence percentages. */
export const Evidence = z.enum([
  "observed", // seen during a real setup attempt (page loaded, form inspected)
  "documented", // stated in official provider documentation (quote checked)
  "secondary", // stated by an integration platform / non-provider source
  "inferred", // reasoned from documented facts, not stated directly
  "unverified", // could not confirm from any fetched source
]);
export type Evidence = z.infer<typeof Evidence>;

export const Owner = z.enum(["agent", "developer", "admin", "provider"]);
export type Owner = z.infer<typeof Owner>;

const sourceIds = z.array(z.string()).default([]);

export const Source = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  retrieved: z.string(), // YYYY-MM-DD
  type: z.enum(["official", "secondary", "observation"]),
  /** Short supporting excerpt or note (keep quotations brief). */
  note: z.string().default(""),
});
export type Source = z.infer<typeof Source>;

export const Claim = z.object({
  text: z.string(),
  evidence: Evidence,
  sourceIds,
});
export type Claim = z.infer<typeof Claim>;

export const Step = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string().default(""),
  where: z.string().default(""), // direct link, or "" if none
  outcome: z.string().default(""),
  dependsOn: z.array(z.string()).default([]),
  owner: Owner,
  evidence: Evidence,
  sourceIds,
});
export type Step = z.infer<typeof Step>;

export const PHASES = [
  "Register & configure",
  "Test",
  "Launch to external users",
  "Review & ongoing",
] as const;

export const Phase = z.object({
  name: z.enum(PHASES),
  steps: z.array(Step).default([]),
});

export const Blocker = z.object({
  symptom: z.string(),
  cause: z.string(),
  nextAction: z.string(),
  owner: Owner,
  evidence: Evidence,
  sourceIds,
});

export const Permission = z.object({
  scope: z.string(),
  enables: z.string(),
  reviewImpact: z.string(),
  evidence: Evidence,
  sourceIds,
});

export const Attempt = z.object({
  date: z.string(),
  intended: z.string(),
  attempted: z.string(),
  result: z.string(),
  stoppedAt: z.string(),
  proves: z.string(),
  doesNotProve: z.string(),
  correction: z.string().default(""),
});
export type Attempt = z.infer<typeof Attempt>;

export const Guide = z.object({
  id: z.string(),
  kind: z.enum(["seed", "generated"]),
  status: z.enum(["complete", "partial"]),
  createdAt: z.string(),
  provider: z.object({
    name: z.string(),
    website: z.string().default(""),
    developerPortal: z.string().default(""),
  }),
  useCase: z.object({
    actions: z.string(),
    audience: Audience,
  }),
  summary: z.object({
    route: z.enum(["managed", "own_app", "unresolved"]),
    routeReason: z.string(),
    /** Whether a managed OAuth platform (Composio) already provides the app. */
    managedOAuth: z
      .object({
        status: z.enum(["available", "not_listed", "unknown"]),
        text: z.string(),
        sourceIds,
      })
      .optional(),
    difficulty: z.enum(["low", "medium", "high", "unknown"]),
    difficultyReason: z.string(),
    testingBeforeReview: Claim,
    mainBlocker: Claim,
    nextAction: z.string(),
  }),
  timing: z.object({
    activeWork: Claim, // developer hands-on time
    reviewWait: Claim, // external provider wait
    policyDeadlines: z.array(Claim).default([]), // usage-triggered deadlines
    costs: z.array(Claim).default([]),
  }),
  prerequisites: z.array(Claim).default([]),
  permissions: z.array(Permission).default([]),
  phases: z.array(Phase).default([]),
  blockers: z.array(Blocker).default([]),
  agentVsHuman: z.object({
    agentCan: z.array(z.string()).default([]),
    humanMust: z.array(z.string()).default([]),
  }),
  sources: z.array(Source).default([]),
  attempts: z.array(Attempt).default([]),
  uncertainties: z.array(z.string()).default([]),
  conflicts: z.array(z.string()).default([]),
  /** Library guides: a person's spot-check of the agent's output against the sources. */
  review: z
    .object({
      date: z.string(),
      checked: z.number(),
      confirmed: z.number(),
      notes: z.array(z.string()).default([]),
    })
    .optional(),
  /** Generated guides: what the research run did, for inspection. */
  researchLog: z.array(z.string()).default([]),
});
export type Guide = z.infer<typeof Guide>;
export type GuideInput = z.input<typeof Guide>;
