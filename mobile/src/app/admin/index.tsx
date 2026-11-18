import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, s, Screen } from "../../components/ui";
import { useSession } from "../../lib/session";
export default function Admin() {
  const { user } = useSession();
  return (
    <Screen>
      <Text style={s.label}>Espaço de professores</Text>
      <Text style={s.title}>Cultive conhecimento.</Text>
      <Text style={s.text}>
        Olá, {user?.name}. Cuide das histórias e das pessoas que fazem sua
        escola acontecer.
      </Text>
      {[
        {
          number: "01",
          title: "Publicações",
          text: "Escreva novas ideias e mantenha o blog atualizado.",
          path: "/admin/posts",
        },
        {
          number: "02",
          title: "Professores",
          text: "Gerencie os educadores da sua comunidade.",
          kind: "teachers",
        },
        {
          number: "03",
          title: "Alunos",
          text: "Acompanhe e organize os acessos dos estudantes.",
          kind: "students",
        },
      ].map((item) => (
        <View key={item.number} style={s.card}>
          <Text style={s.label}>{item.number} · Gestão</Text>
          <Text style={s.h2}>{item.title}</Text>
          <Text style={s.muted}>{item.text}</Text>
          <Button
            title={`Gerenciar ${item.title.toLowerCase()}`}
            onPress={() =>
              item.kind
                ? router.push({
                    pathname: "/admin/people/[kind]",
                    params: { kind: item.kind },
                  })
                : router.push("/admin/posts")
            }
          />
        </View>
      ))}
      <Button
        title="Voltar ao blog"
        secondary
        onPress={() => router.replace("/")}
      />
    </Screen>
  );
}
