import { Guide, type Guide as GuideT } from "./schema";
import github from "../../data/seeds/github.json";
import slack from "../../data/seeds/slack.json";
import gmail from "../../data/seeds/gmail.json";
import library from "../../data/library.json";

/** Hand-researched starter guides, versioned in the repo and validated at load. */
export const SEEDS: GuideT[] = [github, slack, gmail].map((g) => Guide.parse(g));

/** Agent-generated guides that a person spot-checked against their sources, frozen in the repo. */
export const LIBRARY: GuideT[] = (library as unknown[]).map((g) => Guide.parse(g));

/** Everything in the curated library: starter guides first, then reviewed generated guides. */
export const CURATED: GuideT[] = [...SEEDS, ...LIBRARY];
