import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors, Failure, Loading, Screen } from "../components/ui";
import { SessionProvider, useSession } from "../lib/session";
function Navigation() {
  const { loading, error, retry } = useSession();
  if (loading || error)
    return (
      <Screen>
        {loading ? (
          <Loading text="Preparando sua sessão…" />
        ) : (
          <Failure error={error} retry={retry} />
        )}
      </Screen>
    );
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="index" options={{ title: "saber • blog escolar" }} />
      <Stack.Screen name="login" options={{ title: "Sua conta" }} />
      <Stack.Screen name="posts/[id]" options={{ title: "Leitura" }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
    </Stack>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Navigation />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
