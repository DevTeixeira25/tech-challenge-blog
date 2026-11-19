import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export const colors = {
  ink: "#162E3D",
  green: "#246454",
  paper: "#F5F4EE",
  white: "#FFFFFF",
  muted: "#526773",
  line: "#D7E0DA",
  yellow: "#F2CE70",
  red: "#AD3434",
};
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  body: {
    padding: 22,
    gap: 18,
    width: "100%",
    maxWidth: 860,
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  between: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: colors.green,
    textTransform: "uppercase",
  },
  title: { fontSize: 32, fontWeight: "800", color: colors.ink, lineHeight: 39 },
  h2: { fontSize: 22, fontWeight: "700", color: colors.ink, lineHeight: 29 },
  text: { fontSize: 16, lineHeight: 25, color: colors.ink },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  input: {
    minHeight: 50,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: colors.white,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  field: { gap: 8 },
  fieldLabel: { fontSize: 15, fontWeight: "600", color: colors.ink },
  button: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green,
  },
  buttonText: { fontWeight: "700", fontSize: 15, color: colors.white },
  error: { color: colors.red, fontSize: 15, lineHeight: 23 },
  divider: { height: 1, backgroundColor: colors.line },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "#E8F1EB",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { color: colors.green, fontSize: 12, fontWeight: "700" },
});
export function Button({
  title,
  onPress,
  secondary,
  danger,
  disabled,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && { backgroundColor: "#E4EBE5" },
        danger && { backgroundColor: colors.red },
        { opacity: disabled ? 0.5 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: colors.ink }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 180, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Screen({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <SafeAreaView style={s.page} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.body}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Loading({ text = "Carregando…" }: { text?: string }) {
  return (
    <View
      style={[s.card, { alignItems: "center", padding: 30 }]}
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator color={colors.green} />
      <Text style={s.muted}>{text}</Text>
    </View>
  );
}
export function Failure({
  error,
  retry,
}: {
  error: string;
  retry?: () => void;
}) {
  return (
    <View style={s.card} accessibilityLiveRegion="polite">
      <Text style={s.error}>{error}</Text>
      {retry && <Button title="Tentar novamente" onPress={retry} secondary />}
    </View>
  );
}
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <View style={s.card}>
      <Text style={s.h2}>{title}</Text>
      <Text style={s.muted}>{text}</Text>
    </View>
  );
}
export function ConfirmDelete({
  name,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  name: string;
  busy: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#162E3DBB",
          justifyContent: "center",
          padding: 22,
        }}
      >
        <ScrollView
          style={{
            maxHeight: "90%",
            width: "100%",
            maxWidth: 540,
            alignSelf: "center",
            flexGrow: 0,
          }}
          contentContainerStyle={[s.card, { borderColor: colors.red }]}
          accessibilityViewIsModal
        >
          <Text accessibilityRole="header" style={s.h2}>
            Excluir {name}?
          </Text>
          <Text style={s.text}>
            Essa ação é permanente e não pode ser desfeita.
          </Text>
          {error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          ) : null}
          <View style={s.row}>
            <Button
              title={busy ? "Excluindo…" : "Sim, excluir"}
              onPress={onConfirm}
              disabled={busy}
              danger
            />
            <Button
              title="Cancelar"
              onPress={onCancel}
              disabled={busy}
              secondary
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
export function date(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
