import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";
import {
  Button,
  Failure,
  Field,
  Loading,
  s,
  Screen,
} from "../../../../components/ui";
import { api, json, message, pathId, User } from "../../../../lib/api";
function utf8Bytes(value: string) {
  return Array.from(value).reduce((total, char) => {
    const point = char.codePointAt(0) ?? 0;
    return total + (point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4);
  }, 0);
}

export default function PersonEditor() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const valid = kind === "teachers" || kind === "students";
  const isNew = id === "new";
  const label = kind === "teachers" ? "professor" : "aluno";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const back = () =>
    router.replace({ pathname: "/admin/people/[kind]", params: { kind } });
  const request = useRef(0);
  const routeKey = `${kind}:${id}`;
  const [loadedKey, setLoadedKey] = useState("");
  const pending = loading || (!loadError && loadedKey !== routeKey);
  const load = useCallback(async () => {
    const current = ++request.current;
    if (!valid) return;
    setError("");
    setPassword("");
    if (isNew) {
      setName("");
      setEmail("");
      setPassword("");
      setLoadError("");
      setLoadedKey(`${kind}:${id}`);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const person = await api<User>(`/${kind}/${pathId(id)}`);
      if (current !== request.current) return;
      setLoadedKey(`${kind}:${id}`);
      setName(person.name);
      setEmail(person.email);
    } catch (e) {
      if (current === request.current) setLoadError(message(e));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [kind, id, isNew, valid]);
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        request.current++;
      };
    }, [load]),
  );
  async function submit() {
    if (busy || pending || loadError) return;
    setError("");
    if (name.trim().length < 3 || name.trim().length > 120) {
      setError("O nome deve ter entre 3 e 120 caracteres.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (
      (isNew || password.length > 0) &&
      (password.length < 8 || utf8Bytes(password) > 72)
    ) {
      setError("A senha deve ter ao menos 8 caracteres e no máximo 72 bytes em UTF-8.");
      return;
    }
    setBusy(true);
    try {
      await api<User>(
        isNew ? `/${kind}` : `/${kind}/${pathId(id)}`,
        json(isNew ? "POST" : "PUT", {
          name: name.trim(),
          email: email.trim(),
          ...(isNew || password ? { password } : {}),
        }),
      );
      setPassword("");
      back();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (!valid)
    return (
      <Screen>
        <Failure error="Tipo de cadastro inválido." />
        <Button
          title="Voltar à gestão"
          onPress={() => router.replace("/admin")}
        />
      </Screen>
    );
  return (
    <Screen>
      <Text style={s.label}>Pessoas que fazem a escola</Text>
      <Text style={s.title}>
        {isNew ? `Cadastrar ${label}` : `Editar ${label}`}
      </Text>
      {pending ? (
        <Loading />
      ) : loadError ? (
        <Failure
          error={loadError}
          retry={() => {
            void load();
          }}
        />
      ) : (
        <View style={s.card}>
          <Field
            label="Nome completo"
            value={name}
            onChangeText={setName}
            maxLength={120}
            autoComplete="name"
            editable={!busy}
          />
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!busy}
          />
          <Field
            label={isNew ? "Senha inicial" : "Nova senha (opcional)"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            maxLength={72}
            editable={!busy}
          />
          <Text style={s.muted}>
            {isNew
              ? "Use ao menos 8 caracteres e no máximo 72 bytes em UTF-8."
              : "Deixe a senha em branco para manter a senha atual. Por segurança, ela nunca é exibida."}
          </Text>
          {error && <Failure error={error} />}
          <Button
            title={
              busy
                ? "Salvando…"
                : isNew
                  ? "Criar cadastro"
                  : "Salvar alterações"
            }
            disabled={busy}
            onPress={() => {
              void submit();
            }}
          />
          <Button title="Cancelar" secondary disabled={busy} onPress={back} />
        </View>
      )}
    </Screen>
  );
}
