import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import {
  Button,
  colors,
  date,
  Empty,
  Failure,
  Loading,
  s,
  Screen,
} from "../components/ui";
import { api, message, Post } from "../lib/api";
import { useSession } from "../lib/session";
export default function Home() {
  const { user, logout } = useSession();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const request = useRef(0);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);
  const load = useCallback(async () => {
    const number = ++request.current;
    setLoading(true);
    setError("");
    try {
      const result = await api<Post[]>(
        search ? `/posts/search?q=${encodeURIComponent(search)}` : "/posts",
      );
      if (number === request.current) setPosts(result);
    } catch (e) {
      if (number === request.current) setError(message(e));
    } finally {
      if (number === request.current) setLoading(false);
    }
  }, [search]);
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        request.current++;
      };
    }, [load]),
  );
  const header = (
    <View style={{ gap: 20 }}>
      <View style={s.between}>
        <Text style={s.label}>Conhecimento em movimento</Text>
        {!user && (
          <Button
            title="Entrar"
            onPress={() => router.push("/login")}
            secondary
          />
        )}
      </View>
      <View>
        <Text style={s.title}>
          Ideias que ensinam.{`\n`}Histórias que conectam.
        </Text>
        <Text style={[s.text, { color: colors.muted, marginTop: 12 }]}>
          Um espaço para aprender, compartilhar e crescer juntos.
        </Text>
      </View>
      {user && (
        <View style={s.card}>
          <Text style={s.text}>Olá, {user.name.split(" ")[0]}.</Text>
          <Text style={s.muted}>
            {user.role === "TEACHER"
              ? "Professor · sua sala de ideias está pronta."
              : "Aluno · encontre sua próxima descoberta."}
          </Text>
          <View style={s.row}>
            {user.role === "TEACHER" && (
              <Button
                title="Gerenciar escola"
                onPress={() => router.push("/admin")}
              />
            )}
            <Button
              title="Sair da conta"
              secondary
              onPress={() => {
                void logout().catch((e) => setError(message(e)));
              }}
            />
          </View>
        </View>
      )}
      <TextInput
        accessibilityLabel="Buscar publicações"
        placeholder="Buscar por título ou conteúdo"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
        style={s.input}
        returnKeyType="search"
        autoCapitalize="none"
      />
      <View style={s.between}>
        <Text style={s.h2}>
          {search ? "Resultados da busca" : "Últimas publicações"}
        </Text>
        <Text style={s.muted}>
          {posts.length} {posts.length === 1 ? "texto" : "textos"}
        </Text>
      </View>
      {error && (
        <Failure
          error={error}
          retry={() => {
            void load();
          }}
        />
      )}
      {loading && posts.length === 0 && <Loading />}
      <View />
    </View>
  );
  return (
    <Screen scroll={false}>
      <FlatList
        data={error ? [] : posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.body}
        keyboardShouldPersistTaps="handled"
        refreshing={loading && posts.length > 0}
        onRefresh={() => {
          void load();
        }}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={
          !loading && !error ? (
            <Empty
              title={
                search
                  ? "Nenhum resultado por aqui"
                  : "Um novo capítulo começa aqui"
              }
              text={
                search
                  ? "Tente buscar com outras palavras."
                  : "As publicações da escola aparecerão neste espaço."
              }
            />
          ) : undefined
        }
        ListFooterComponent={
          <Text style={[s.muted, { textAlign: "center", paddingVertical: 24 }]}>
            saber · aprender transforma
          </Text>
        }
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ler ${item.title}, por ${item.author}`}
            onPress={() =>
              router.push({ pathname: "/posts/[id]", params: { id: item.id } })
            }
            style={({ pressed }) => [
              s.card,
              index === 0 &&
                !search && { borderTopWidth: 5, borderTopColor: colors.yellow },
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={s.label}>Leitura & descoberta</Text>
            <Text style={s.h2}>{item.title}</Text>
            <Text style={s.muted}>
              Por {item.author} · {date(item.createdAt)}
            </Text>
            <Text style={s.text} numberOfLines={3}>
              {item.content}
            </Text>
            <Text
              style={{ color: colors.green, fontWeight: "700", paddingTop: 6 }}
            >
              Continuar leitura →
            </Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}
