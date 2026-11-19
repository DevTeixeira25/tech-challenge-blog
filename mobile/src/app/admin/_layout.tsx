import { Stack, router } from "expo-router";
import { Text } from "react-native";
import { Button, colors, Loading, s, Screen } from "../../components/ui";
import { useSession } from "../../lib/session";
export default function AdminLayout() {
  const { user, loading } = useSession();
  if (loading)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (user?.role !== "TEACHER")
    return (
      <Screen>
        <Text style={s.label}>Área da escola</Text>
        <Text style={s.title}>Acesso exclusivo de professores</Text>
        <Text style={s.text}>
          Para gerenciar publicações e pessoas, entre com uma conta de
          professor.
        </Text>
        {!user && (
          <Button
            title="Entrar na conta"
            onPress={() => router.replace("/login")}
          />
        )}
        <Button
          title="Voltar ao blog"
          secondary
          onPress={() => router.replace("/")}
        />
      </Screen>
    );
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Gestão da escola" }} />
      <Stack.Screen name="posts/index" options={{ title: "Publicações" }} />
      <Stack.Screen
        name="posts/[id]"
        options={{ title: "Editor de publicação" }}
      />
      <Stack.Screen
        name="people/[kind]/index"
        options={{ title: "Pessoas da escola" }}
      />
      <Stack.Screen
        name="people/[kind]/[id]"
        options={{ title: "Cadastro da escola" }}
      />
    </Stack>
  );
}
