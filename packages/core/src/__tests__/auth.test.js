import { friendlyAuthError } from "../auth.js";

describe("friendlyAuthError", () => {
  it("explains a disabled demo", () => {
    expect(friendlyAuthError("Anonymous sign-ins are disabled")).toMatch(/demo is not enabled/);
  });

  it("explains a rejected CAPTCHA", () => {
    expect(friendlyAuthError("captcha protection: request disallowed")).toMatch(/Security check failed/);
  });

  it("passes unknown messages through", () => {
    expect(friendlyAuthError("Invalid login credentials")).toBe("Invalid login credentials");
  });
});
