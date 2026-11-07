import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Alert } from "react-native";
import { t } from "@grip/core/i18n";
import { ContactForm, EMPTY_CONTACT_FORM } from "../contacts/ContactForm";

// Typing into TextInput crashes this RN test renderer, so drafts change through the status pills.
const initial = { ...EMPTY_CONTACT_FORM, name: "Acme recruiter" };
const interviewing = t("enum.status.Interviewing");

describe("ContactForm save lifecycle", () => {
  it("keeps the draft and shows the error after a rejected save", async () => {
    const onSave = jest.fn();
    const view = await render(<ContactForm initial={initial} saving={false} error={null} onSave={onSave} onCancel={jest.fn()} />);
    await fireEvent.press(view.getByText(interviewing));
    await fireEvent.press(view.getByText(t("common.save")));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "Acme recruiter", status: "Interviewing" }));

    await view.rerender(<ContactForm initial={initial} saving={false} error="Save failed: offline" onSave={onSave} onCancel={jest.fn()} />);
    expect(view.getByLabelText(t("contacts.fieldName")).props.value).toBe("Acme recruiter");
    expect(view.getByText("Save failed: offline")).toBeTruthy();
    await fireEvent.press(view.getByText(t("common.save")));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ status: "Interviewing" }));
  });

  it("ignores another Save while the first is pending", async () => {
    const onSave = jest.fn();
    const view = await render(<ContactForm initial={initial} saving error={null} onSave={onSave} onCancel={jest.fn()} />);
    await fireEvent.press(view.getByText(`${t("common.saving")}…`));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("asks before Cancel drops a changed draft, not an untouched one", async () => {
    const onCancel = jest.fn();
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const view = await render(<ContactForm initial={initial} saving={false} error={null} onSave={jest.fn()} onCancel={onCancel} />);
    await fireEvent.press(view.getByText(t("common.cancel")));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await fireEvent.press(view.getByText(interviewing));
    await fireEvent.press(view.getByText(t("common.cancel")));
    expect(alert).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
