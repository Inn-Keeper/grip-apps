import { computeReadiness, readinessSignals } from "../readiness.js";
import { t } from "../i18n.js";
import { COMPETENCIES } from "../stories.js";

describe("computeReadiness", () => {
  it("averages prep accuracy over the posting stack, counting unattempted as 0", () => {
    const r = computeReadiness({
      postingTechs: ["React", "Kubernetes"],
      answers: { React: { correct: 8, wrong: 2 } }, // 80%; Kubernetes 0%
    });
    expect(r.prep).toBe(40);
  });

  it("never turns story coverage into a readiness percentage", () => {
    const r = computeReadiness({ stories: COMPETENCIES.map((competency) => ({ competency })) });
    expect(r.storyCovered).toBe(COMPETENCIES.length);
    expect(r.storyTotal).toBe(COMPETENCIES.length);
    expect(r).not.toHaveProperty("overall");
    expect(r).not.toHaveProperty("stories");
    expect(r.prep).toBeNull();
    expect(r.arch).toBeNull();
  });

  it("counts mixed attempted and unattempted role techs, and no attempts as 0", () => {
    expect(computeReadiness({ postingTechs: ["Go"] }).prep).toBe(0);
    const r = computeReadiness({ postingTechs: ["Go", "SQL", "AWS"], answers: { Go: { correct: 3, wrong: 0 }, SQL: { correct: 0, wrong: 0 } } });
    expect(r.prep).toBe(33);
  });

  it("counts each valid competency once", () => {
    const stories = [
      { competency: COMPETENCIES[0] },
      { competency: COMPETENCIES[0] }, // duplicate competency counts once
      { competency: COMPETENCIES[1] },
      { competency: "Not-a-competency" },
    ];
    const r = computeReadiness({ stories });
    expect(r.storyCovered).toBe(2);
  });

  it("keeps missing parts null instead of zeroing them", () => {
    const r = computeReadiness({
      stories: [{ competency: COMPETENCIES[0] }],
      boards: [
        { topology: 80, talkGrade: null },
        { topology: 100, talkGrade: null },
      ],
    });
    expect(r.prep).toBeNull();
    expect(r.archTopology).toBe(90);
    expect(r.archTalk).toBeNull();
    expect(r.arch).toBeNull();
  });

  it("is honest about a cold start", () => {
    const r = computeReadiness({});
    expect(r).toEqual({ prep: null, storyCovered: 0, storyTotal: COMPETENCIES.length, arch: null, archTopology: null, archTalk: null });
  });

  it("shows topology without calling unassessed diagrams design readiness", () => {
    const boards = Array.from({ length: 5 }, () => ({ topology: 100, talkGrade: null }));
    const r = computeReadiness({ boards });
    expect(r.archTopology).toBe(100);
    expect(r.archTalk).toBeNull();
    expect(r.arch).toBeNull();
  });

  it("uses assessed reasoning grades for design readiness", () => {
    const r = computeReadiness({ boards: [{ topology: 100, talkGrade: 60 }] });
    expect(r.arch).toBe(80);
    expect(r.archTalk).toBe(60);
  });

  it("averages only graded boards while keeping topology visible for all", () => {
    const r = computeReadiness({
      boards: [
        { topology: 100, talkGrade: null },
        { topology: 40, talkGrade: 60 },
      ],
    });
    expect(r.archTopology).toBe(70);
    expect(r.archTalk).toBe(60);
    expect(r.arch).toBe(50);
  });
});

describe("readinessSignals", () => {
  const values = (signals) => Object.fromEntries(signals.map((s) => [s.id, s.value]));

  it("names each signal separately and never a composite", () => {
    const v = values(readinessSignals({ postingTechs: ["Go"], answers: { Go: { correct: 1, wrong: 1 } }, stories: [{ competency: COMPETENCIES[0] }], boards: [] }));
    expect(v).toEqual({ prep: "50%", stories: t("plan.storyCount", { covered: 1, total: COMPETENCIES.length }), design: t("plan.notAssessed") });
  });

  it("asks for role technologies when the posting has none", () => {
    expect(values(readinessSignals({ postingTechs: [], answers: {}, stories: [], boards: [] })).prep).toBe(t("plan.addRoleTechs"));
  });

  it("shows loading or failed inputs as unavailable, not zero", () => {
    const v = values(readinessSignals({ postingTechs: ["Go"], answers: null, stories: null, boards: null }));
    expect(v).toEqual({ prep: t("plan.unavailable"), stories: t("plan.unavailable"), design: t("plan.unavailable") });
  });

  it("shows an assessed design score", () => {
    expect(values(readinessSignals({ postingTechs: [], answers: {}, stories: [], boards: [{ topology: 100, talkGrade: 60 }] })).design).toBe("80%");
  });
});
