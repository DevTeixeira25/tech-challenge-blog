import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Failure, Field, s, Screen } from "../components/ui";
import { message } from "../lib/api";
import { useSession } from "../lib/session";
export default function Login() {
  const { login, user } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setError("");
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      password.length < 6
    ) {
      setError(
        "Informe um e-mail válido e uma senha com ao menos 6 caracteres.",
      );
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      setPassword("");
      router.replace("/");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Text style={s.label}>Bem-vindo de volta</Text>
      <Text style={s.title}>Aprender é melhor{`\n`}em comunidade.</Text>
      <Text style={s.text}>
        Entre com sua conta de aluno ou professor. Seu perfil é reconhecido pela
        escola.
      </Text>
      {user ? (
        <Button
          title="Ir para publicações"
          onPress={() => router.replace("/")}
        />
      ) : (
        <View style={s.card}>
          <Text style={s.h2}>Acesse sua conta</Text>
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={!busy}
          />
          <Field
            label="Senha"
            value={password}
            onChangeText={setPassword}
            autoComplete="current-password"
            secureTextEntry
            editable={!busy}
            onSubmitEditing={() => {
              void submit();
            }}
          />
          {error && <Failure error={error} />}
          <Button
            title={busy ? "Entrando…" : "Entrar"}
            onPress={() => {
              void submit();
            }}
            disabled={busy}
          />
          <Text style={s.muted}>
            Precisa de acesso? Procure um professor ou a coordenação da sua
            escola.
          </Text>
        </View>
      )}
      <Button
        title="Continuar como visitante"
        secondary
        onPress={() => router.replace("/")}
      />
    </Screen>
  );
}
