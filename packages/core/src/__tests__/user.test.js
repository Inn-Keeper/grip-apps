import { EMPTY_PROFILE_FORM, PROFILE_FIELDS, profileFormToUpdate, profileToForm, toggleFavoriteTech } from "../user.js";

describe("profile form helpers", () => {
  it("keeps the standard editable profile fields in one shared list", () => {
    expect(PROFILE_FIELDS.map((field) => field.key)).toEqual([
      "displayName",
      "headline",
      "targetRole",
      "location",
      "timezone",
      "githubUrl",
      "linkedinUrl",
      "portfolioUrl",
    ]);
    expect(EMPTY_PROFILE_FORM).toEqual({
      displayName: "",
      headline: "",
      targetRole: "",
      location: "",
      timezone: "",
      githubUrl: "",
      linkedinUrl: "",
      portfolioUrl: "",
    });
  });

  it("maps a loaded profile into the editable form without leaking auth-only fields", () => {
    expect(
      profileToForm({
        id: "user-1",
        email: "ada@example.com",
        displayName: "Ada",
        targetRole: "Staff Engineer",
        githubUrl: "https://github.com/ada",
        xp: 120,
      })
    ).toEqual({
      displayName: "Ada",
      headline: "",
      targetRole: "Staff Engineer",
      location: "",
      timezone: "",
      githubUrl: "https://github.com/ada",
      linkedinUrl: "",
      portfolioUrl: "",
    });
  });

  it("marks profile updates as onboarding-complete while preserving empty fields", () => {
    expect(profileFormToUpdate({ displayName: "Ada", targetRole: "Principal Engineer", useGithubTechsForPrep: true })).toEqual({
      displayName: "Ada",
      headline: "",
      targetRole: "Principal Engineer",
      location: "",
      timezone: "",
      githubUrl: "",
      linkedinUrl: "",
      portfolioUrl: "",
      useGithubTechsForPrep: true,
      onboardingCompleted: true,
    });
  });
});

describe("toggleFavoriteTech", () => {
  it("adds a missing favorite and removes an existing one", () => {
    expect(toggleFavoriteTech(["React"], "Python")).toEqual(["React", "Python"]);
    expect(toggleFavoriteTech(["React", "Python"], "React")).toEqual(["Python"]);
  });
});
