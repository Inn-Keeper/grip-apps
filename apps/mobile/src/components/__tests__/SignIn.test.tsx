import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { t } from "@grip/core/i18n";

const mockSignInAnonymously = jest.fn(async (_args: unknown) => ({ error: null }));
jest.mock("@/lib/supabase", () => ({
  supabase: { auth: { signInAnonymously: (args: unknown) => mockSignInAnonymously(args) } },
}));
jest.mock("react-native-webview", () => ({ WebView: () => null }));

import { SignIn } from "../SignIn";

describe("SignIn", () => {
  it("starts a demo session from the Try the demo button", async () => {
    const view = await render(<SignIn />);

    fireEvent.press(view.getByText(t("demo.try")));
    await waitFor(() => expect(mockSignInAnonymously).toHaveBeenCalledTimes(1));
    expect(mockSignInAnonymously).toHaveBeenCalledWith({ options: { captchaToken: undefined } });
  });
});
