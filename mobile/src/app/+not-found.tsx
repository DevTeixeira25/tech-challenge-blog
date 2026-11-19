import { router } from "expo-router";
import { Text } from "react-native";
import { Button, s, Screen } from "../components/ui";
export default function NotFound() {
  return (
    <Screen>
      <Text style={s.title}>Esta página se perdeu.</Text>
      <Text style={s.text}>Volte ao blog para descobrir novas ideias.</Text>
      <Button title="Ir para o blog" onPress={() => router.replace("/")} />
    </Screen>
  );
}
