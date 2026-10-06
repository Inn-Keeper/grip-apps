import { beforeEach, expect, jest, test } from "@jest/globals";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { t } from "@grip/core/i18n";
import { renderWithClient } from "@/test/renderWithClient";

const mockSave = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockParse = jest.fn<(...args: unknown[]) => Promise<unknown>>();
jest.mock("@/lib/api", () => ({
  api: { importContacts: (...args: unknown[]) => mockSave(...args) },
  ledgerImport: { parseLedger: (...args: unknown[]) => mockParse(...args) },
  postingReader: null,
}));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({ File: jest.fn() }));
jest.mock("@react-native-community/datetimepicker", () => () => null);
jest.mock("react-native/Libraries/Components/TextInput/TextInput", () => ({ default: "TextInput" }));
// The native modal host needs a device window; keep the entire form real.
jest.mock("react-native/Libraries/Modal/Modal", () => {
  const { View } = require("react-native");
  return { default: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});

import { ImportModal } from "../ImportModal";

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.expo = { ...globalThis.expo, uuidv4: () => "11111111-1111-4111-8111-111111111111" };
  mockParse.mockResolvedValue({
    rows: [
      {
        name: "Test company",
        role: "",
        status: "Applied",
        date: null,
        stage_date: null,
        next_action_date: null,
        link: null,
        must_have_techs: [],
        source: "Test company",
        warnings: ["missing_role"],
      },
    ],
    unplaced: ["Unclear note"],
  });
});

test("review edits survive confirmation and a failed save retries the same ids", async () => {
  mockSave.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
  const onImported = jest.fn();
  const onClose = jest.fn();
  const view = await renderWithClient(
    <ImportModal
      contacts={[]}
      onImported={onImported}
      onClose={onClose}
    />,
  );
  await fireEvent.press(view.getByText(t("quest.importPasteToggle")));
  await fireEvent.changeText(view.getByLabelText(t("quest.importPasteLabel")), "Test company");
  await fireEvent.press(view.getByText(t("quest.importRead")));
  await waitFor(() => expect(view.getByText(t("quest.importReviewTitle"))).toBeTruthy());
  await fireEvent.changeText(view.getByLabelText(t("quest.importColRole")), "Developer");
  await waitFor(() => expect(view.queryByText(t("quest.importWarn.missing_role"))).toBeNull());
  await fireEvent.press(view.getByText(t("quest.importReviewAction", { count: 1 })));
  await waitFor(() => expect(view.getByText(t("quest.importConfirmUnplaced", { count: 1 }))).toBeTruthy());
  expect(mockSave).not.toHaveBeenCalled();
  await fireEvent.press(view.getByText(t("quest.importBackToReview")));
  expect(view.getByDisplayValue("Developer")).toBeTruthy();
  await fireEvent.press(view.getByText(t("quest.importReviewAction", { count: 1 })));
  await fireEvent.press(view.getByText(t("quest.importContinue", { count: 1 })));
  await waitFor(() => expect(view.getByText(t("quest.importSaveFailed"))).toBeTruthy());
  expect(onClose).not.toHaveBeenCalled();
  await fireEvent.press(view.getByText(t("quest.importContinue", { count: 1 })));
  await waitFor(() => expect(onImported).toHaveBeenCalledWith(1));
  expect(mockSave.mock.calls[0][0]).toEqual([
    expect.objectContaining({ role: "Developer", id: "11111111-1111-4111-8111-111111111111" }),
  ]);
  expect(mockSave.mock.calls[1][0]).toEqual(mockSave.mock.calls[0][0]);
});
