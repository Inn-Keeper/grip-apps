import { stepState, workflowStep } from "../workflowState.js";

describe("workflowStep", () => {
  it("starts by asking for components", () => expect(workflowStep(0, 0)).toBe(1));
  it("asks for a connection once components exist", () => expect(workflowStep(2, 0)).toBe(2));
  it("asks for arrow details after a connection exists", () => expect(workflowStep(2, 1)).toBe(3));
  it("asks for the talk track once the design has been evaluated", () => expect(workflowStep(2, 1, true)).toBe(4));
  it("reaches the last step only once a grade exists", () => expect(workflowStep(2, 1, true, true)).toBe(5));
  it("does not skip the drawing steps when evaluated early", () => {
    expect(workflowStep(0, 0, true, true)).toBe(1);
    expect(workflowStep(2, 0, true, true)).toBe(2);
  });
});

describe("stepState", () => {
  it("reads a finished step as done, not as gone", () => {
    expect(stepState(1, 3)).toBe("done");
    expect(stepState(3, 3)).toBe("current");
    expect(stepState(4, 3)).toBe("todo");
  });
});
