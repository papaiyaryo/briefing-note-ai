import { expect, it } from "vitest";
import { COMPARISON_POINTS } from "../../src/lib/comparison";

it("既存7観点を同じ順で読み込める（runner readiness・app Redではない）", () => {
  expect(COMPARISON_POINTS.map(({ key }) => key)).toEqual([
    "strengths",
    "concerns",
    "impressions",
    "emphasizedPoints",
    "idealCandidate",
    "esPoints",
    "questions",
  ]);
});
