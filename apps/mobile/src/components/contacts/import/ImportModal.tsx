import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import type { Contact } from "@grip/core/api";
import {
  hasInvalidImportRows,
  importErrorKey,
  IMPORT_FILE_TYPES,
  IMPORT_MAX_BYTES,
  readImport,
  reviewImportRows,
  type ReviewRow as ImportRow,
} from "@grip/core/importReview";
import { importSummary } from "@grip/core/ledgerImport";
import { t } from "@grip/core/i18n";
import { colors, font, radius, space } from "@/theme";
import { Field, inputStyle } from "@/components/ui";
import { ledgerImport, postingReader } from "@/lib/api";
import { useImportContactsMutation } from "@/queries/contacts";
import { ReviewRow } from "./ReviewRow";

type Step = "upload" | "reading" | "review" | "confirm";
function Action({
  label,
  onPress,
  primary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.action,
        { backgroundColor: primary ? colors.accent : colors.surfaceHi, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Text style={{ color: primary ? colors.onAccent : colors.text, fontSize: font.size.body, fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ImportModal({
  contacts,
  onClose,
  onImported,
}: {
  contacts: Contact[];
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const abort = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const [step, setStep] = useState<Step>("upload");
  const [text, setText] = useState("");
  const [pasting, setPasting] = useState(false);
  const [readLinks, setReadLinks] = useState(true);
  const [readingLinks, setReadingLinks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [unplaced, setUnplaced] = useState<string[]>([]);
  const [unplacedOpen, setUnplacedOpen] = useState(false);
  const save = useImportContactsMutation();
  const reviewed = reviewImportRows(rows, contacts);
  const summary = importSummary(reviewed);
  const invalid = hasInvalidImportRows(reviewed);
  const title = {
    upload: t("quest.importTitle"),
    reading: t("quest.importReading"),
    review: t("quest.importReviewTitle"),
    confirm: t("quest.importConfirmTitle"),
  }[step];

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(title);
  }, [title]);

  const close = () => {
    if (!save.isPending) {
      abort.current?.abort();
      onClose();
    }
  };
  const parse = async (input: { text: string } | DocumentPicker.DocumentPickerAsset) => {
    if (!ledgerImport) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setError(null);
    setReadingLinks(false);
    setStep("reading");
    try {
      let payload: { text: string } | { filename: string; content_base64: string };
      if ("uri" in input) {
        const file = new File(input.uri);
        if (!IMPORT_FILE_TYPES.test(input.name)) throw { code: "unsupported_file" };
        if ((input.size ?? file.size) > IMPORT_MAX_BYTES) throw { code: "file_too_large" };
        payload = { filename: input.name, content_base64: await file.base64() };
      } else payload = input;
      if (controller.signal.aborted) return;
      const result = await readImport({
        ledger: ledgerImport,
        posting: postingReader,
        payload,
        contacts,
        readLinks,
        signal: controller.signal,
        newId: () => globalThis.expo.uuidv4(),
        onReadingLinks: () => setReadingLinks(true),
      });
      if (controller.signal.aborted) return;
      setRows(result.rows);
      setUnplaced(result.unplaced);
      setStep("review");
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(t(importErrorKey(cause as Error & { code?: string })));
      setStep("upload");
    }
  };
  const chooseFile = async () => {
    try {
      // Markdown MIME types vary across document providers; validate the extension ourselves.
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (mounted.current && !result.canceled && result.assets[0]) await parse(result.assets[0]);
    } catch {
      if (mounted.current) setError(t("quest.importFailed"));
    }
  };
  const confirm = () => {
    if (save.isPending || invalid || !summary.importing) return;
    const chosen = reviewed.filter((row) => row.included);
    save.mutate(chosen, {
      onSuccess: () => {
        onImported(chosen.length);
        onClose();
      },
    });
  };

  return (
    <Modal
      visible
      animationType="none"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[
          styles.screen,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <View
          accessibilityViewIsModal
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text
              accessibilityRole="header"
              style={styles.title}
            >
              {title}
            </Text>
            {step !== "reading" && (
              <Action
                label={t("quest.importClose")}
                onPress={close}
                disabled={save.isPending}
              />
            )}
          </View>
          <ScrollView
            key={step}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
          >
            {step === "upload" && (
              <>
                <Text style={styles.text}>{t("quest.importIntro")}</Text>
                {pasting ? (
                  <Field label={t("quest.importPasteLabel")}>
                    <TextInput
                      accessibilityLabel={t("quest.importPasteLabel")}
                      multiline
                      value={text}
                      onChangeText={setText}
                      style={[inputStyle, { minHeight: 180, textAlignVertical: "top" }]}
                    />
                  </Field>
                ) : (
                  <View style={styles.fileChoice}>
                    <Action
                      primary
                      label={t("quest.importChoose")}
                      onPress={() => void chooseFile()}
                    />
                    <Text style={styles.text}>{t("quest.importLimits")}</Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setPasting(!pasting);
                    setError(null);
                  }}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Text style={{ color: colors.accentBright, fontSize: font.size.body }}>
                    {pasting ? t("quest.importChoose") : t("quest.importPasteToggle")}
                  </Text>
                </Pressable>
                {postingReader && (
                  <View style={styles.toggle}>
                    <Switch
                      accessibilityLabel={t("quest.importReadLinks")}
                      value={readLinks}
                      onValueChange={setReadLinks}
                      trackColor={{ true: colors.accent }}
                    />
                    <Text style={[styles.text, { flex: 1 }]}>{t("quest.importReadLinks")}</Text>
                  </View>
                )}
                <Text style={styles.hint}>{t("quest.importPrivacy")}</Text>
                {error && (
                  <Text
                    accessibilityRole="alert"
                    style={styles.error}
                  >
                    {error}
                  </Text>
                )}
              </>
            )}
            {step === "reading" && (
              <View style={{ alignItems: "center", gap: space.lg, paddingVertical: space.xl }}>
                <ActivityIndicator
                  size="large"
                  color={colors.accent}
                />
                <Text
                  accessibilityLiveRegion="polite"
                  style={styles.text}
                >
                  {t(readingLinks ? "quest.importReadingLinks" : "quest.importReadingSub")}
                </Text>
              </View>
            )}
            {step === "review" && (
              <>
                <Text style={styles.text}>
                  {rows.length ? t("quest.importFound", { count: rows.length }) : t("quest.importNone")}
                </Text>
                {reviewed.map((row) => (
                  <ReviewRow
                    key={row.id}
                    row={row}
                    onChange={(patch) =>
                      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, ...patch } : item)))
                    }
                  />
                ))}
                {unplaced.length > 0 && (
                  <>
                    <Action
                      label={t("quest.importUnplaced", { count: unplaced.length })}
                      onPress={() => setUnplacedOpen(!unplacedOpen)}
                    />
                    {unplacedOpen &&
                      unplaced.map((line, index) => (
                        <Text
                          key={index}
                          style={styles.text}
                        >
                          {line}
                        </Text>
                      ))}
                  </>
                )}
              </>
            )}
            {step === "confirm" && (
              <>
                <Text style={[styles.text, { color: colors.textBright, fontSize: font.size.title }]}>
                  {t("quest.importConfirmNew", { count: summary.importing })}
                </Text>
                {summary.missingFollowUp > 0 && (
                  <Text style={styles.text}>{t("quest.importConfirmMissing", { count: summary.missingFollowUp })}</Text>
                )}
                {summary.skipped > 0 && (
                  <Text style={styles.text}>{t("quest.importConfirmSkipped", { count: summary.skipped })}</Text>
                )}
                {unplaced.length > 0 && (
                  <Text style={styles.text}>{t("quest.importConfirmUnplaced", { count: unplaced.length })}</Text>
                )}
                <Text style={styles.text}>{t("quest.importConfirmHelp")}</Text>
                {save.isError && (
                  <Text
                    accessibilityRole="alert"
                    style={styles.error}
                  >
                    {t("quest.importSaveFailed")}
                  </Text>
                )}
                {save.isPending && (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={styles.text}
                  >
                    {t("quest.importSaving")}
                  </Text>
                )}
              </>
            )}
          </ScrollView>
          <View style={styles.footer}>
            {invalid && (step === "review" || step === "confirm") && (
              <Text
                accessibilityLiveRegion="polite"
                style={styles.error}
              >
                {t("quest.importFixErrors")}
              </Text>
            )}
            <View style={styles.actions}>
              {step === "upload" && (
                <>
                  <Action
                    label={t("common.cancel")}
                    onPress={close}
                  />
                  {pasting && (
                    <Action
                      primary
                      label={t("quest.importRead")}
                      disabled={!text.trim()}
                      onPress={() => void parse({ text })}
                    />
                  )}
                </>
              )}
              {step === "reading" && (
                <Action
                  label={t("common.cancel")}
                  onPress={() => {
                    abort.current?.abort();
                    setStep("upload");
                  }}
                />
              )}
              {step === "review" && (
                <>
                  <Action
                    label={t("quest.importBack")}
                    onPress={() => setStep("upload")}
                  />
                  <Action
                    primary
                    label={t("quest.importReviewAction", { count: summary.importing })}
                    disabled={!summary.importing || invalid}
                    onPress={() => setStep("confirm")}
                  />
                </>
              )}
              {step === "confirm" && (
                <>
                  <Action
                    label={t("quest.importBackToReview")}
                    disabled={save.isPending}
                    onPress={() => setStep("review")}
                  />
                  <Action
                    primary
                    label={
                      save.isPending ? t("quest.importSaving") : t("quest.importContinue", { count: summary.importing })
                    }
                    disabled={save.isPending || invalid || !summary.importing}
                    onPress={confirm}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg },
  title: { flex: 1, color: colors.textBright, fontSize: font.size.heading, fontWeight: "700" },
  body: { padding: space.lg, gap: space.lg },
  text: { color: colors.textDim, fontSize: font.size.body, lineHeight: 20 },
  hint: { color: colors.textDim, fontSize: font.size.small, lineHeight: 18 },
  error: { color: colors.dangerBright, fontSize: font.size.body },
  toggle: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
  fileChoice: { padding: space.lg, gap: space.sm, backgroundColor: colors.well, borderRadius: radius.sm },
  footer: { borderTopWidth: 1, borderColor: colors.borderSoft, padding: space.lg, gap: space.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: space.sm },
  action: {
    minHeight: 44,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.sm,
    flexShrink: 1,
  },
});
