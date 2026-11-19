import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { FlatList, Text, View } from "react-native";
import {
  Button,
  ConfirmDelete,
  Empty,
  Failure,
  Loading,
  s,
  Screen,
} from "../../../components/ui";
import { api, json, message, pathId, Post } from "../../../lib/api";
export default function ManagePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [target, setTarget] = useState<Post | null>(null);
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    setError("");
    try {
      const result = await api<Post[]>("/posts");
      if (current === request.current) setPosts(result);
    } catch (e) {
      if (current === request.current) setError(message(e));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        request.current++;
      };
    }, [load]),
  );
  async function remove() {
    if (!target) return;
    setBusy(true);
    setError("");
    try {
      await api(`/posts/${pathId(target.id)}`, json("DELETE"));
      setPosts((current) => current.filter((post) => post.id !== target.id));
      setTarget(null);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen scroll={false}>
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        contentContainerStyle={s.body}
        refreshing={loading && posts.length > 0}
        onRefresh={() => {
          void load();
        }}
        ListHeaderComponent={
          <View style={{ gap: 18, marginBottom: 18 }}>
            <Text style={s.label}>Conteúdo que aproxima</Text>
            <Text style={s.title}>Suas publicações</Text>
            <Button
              title="+ Nova publicação"
              onPress={() =>
                router.push({
                  pathname: "/admin/posts/[id]",
                  params: { id: "new" },
                })
              }
            />
            {error && (
              <Failure
                error={error}
                retry={() => {
                  void load();
                }}
              />
            )}
            {target && (
              <ConfirmDelete
                name={`“${target.title}”`}
                busy={busy}
                error={error}
                onCancel={() => setTarget(null)}
                onConfirm={() => {
                  void remove();
                }}
              />
            )}
            {loading && posts.length === 0 && <Loading />}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          !loading && !error ? (
            <Empty
              title="Comece uma nova conversa"
              text="Crie a primeira publicação da escola."
            />
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.h2}>{item.title}</Text>
            <Text style={s.muted}>Por {item.author}</Text>
            <Text style={s.text} numberOfLines={2}>
              {item.content}
            </Text>
            <View style={s.row}>
              <Button
                title="Editar"
                secondary
                disabled={busy || loading}
                onPress={() =>
                  router.push({
                    pathname: "/admin/posts/[id]",
                    params: { id: item.id },
                  })
                }
              />
              <Button
                title="Excluir"
                danger
                disabled={busy || loading}
                onPress={() => {
                  setError("");
                  setTarget(item);
                }}
              />
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
