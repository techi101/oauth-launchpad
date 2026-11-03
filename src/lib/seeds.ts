import { Guide, type Guide as GuideT } from "./schema";
import github from "../../data/seeds/github.json";
import slack from "../../data/seeds/slack.json";
import gmail from "../../data/seeds/gmail.json";

/** Hand-researched starter guides, versioned in the repo and validated at load. */
export const SEEDS: GuideT[] = [github, slack, gmail].map((g) => Guide.parse(g));
