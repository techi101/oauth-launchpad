import { describe, expect, it } from "vitest";
import { shortWait, shortWork } from "./display";
import { CURATED } from "./seeds";
import { toCard } from "./store";

describe("display labels", () => {
  it("shortens durations", () => {
    expect(shortWork("Estimate: about 2-4 hours to register the app")).toBe("2–4 hours");
    expect(shortWork("About an hour to create the app")).toBe("About 1 hour");
    expect(shortWait("Spotify's review of the app can take up to six weeks.")).toBe("Up to 6 weeks");
    expect(shortWait("Provider does not publish a turnaround we could verify.")).toBe("Not published");
  });
  it("prints every library card", () => {
    for (const g of CURATED) {
      const c = toCard(g);
      console.log([c.name, c.domain, c.workShort, c.waitShort].join(" | "));
      expect(c.domain).not.toBe("");
    }
  });
});
