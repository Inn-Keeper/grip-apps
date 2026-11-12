import { buildStoryAssessment, createStoryGradeApi, currentStoryGrade } from "../storyGrade.js";

const story = { id: "s1", competency: "Delivery", title: "Fix", situation: "a", task: "b", action: "c", result: "d" };
const result = { score: 75, suggestion: { sections: [], hardest_followup: "Why?" } };

describe("currentStoryGrade", () => {
  it("returns the saved grade while the story is unchanged", () => {
    const graded = { ...story, assessment: buildStoryAssessment(story, result) };
    expect(currentStoryGrade(graded)).toBe(result);
  });

  it("returns null once a graded field changes, and when nothing was saved", () => {
    const assessment = buildStoryAssessment(story, result);
    expect(currentStoryGrade({ ...story, result: "edited", assessment })).toBeNull();
    expect(currentStoryGrade(story)).toBeNull();
  });
});

describe("createStoryGradeApi", () => {
  afterEach(() => { delete global.fetch; });

  it("sends the four sections and surfaces the service error code", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: { code: "nothing_to_grade", message: "Write the story first." } }),
    });
    const api = createStoryGradeApi(async () => "token", "http://ai/");
    await expect(api.gradeStory(story)).rejects.toMatchObject({ code: "nothing_to_grade", status: 422 });
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe("http://ai/api/v1/ai/grade-story");
    expect(JSON.parse(init.body)).toEqual({
      story_id: "s1",
      competency: "Delivery",
      title: "Fix",
      sections: { situation: "a", task: "b", action: "c", result: "d" },
    });
  });
});
