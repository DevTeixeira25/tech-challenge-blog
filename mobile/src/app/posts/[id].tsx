import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button, date, Failure, Loading, s, Screen } from "../../components/ui";
import { api, message, pathId, Post } from "../../lib/api";
import { useSession } from "../../lib/session";
export default function Reading() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    setError("");
    try {
      const result = await api<Post>(`/posts/${pathId(id)}`);
      if (current === request.current) setPost(result);
    } catch (e) {
      if (current === request.current) setError(message(e));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        request.current++;
      };
    }, [load]),
  );
  return (
    <Screen>
      {loading ? (
        <Loading />
      ) : error ? (
        <Failure
          error={error}
          retry={() => {
            void load();
          }}
        />
      ) : (
        post && (
          <>
            <Text style={s.label}>Uma ideia para levar adiante</Text>
            <Text selectable style={s.title}>
              {post.title}
            </Text>
            <View style={s.row}>
              <Text style={s.muted}>Por {post.author}</Text>
              <Text style={s.muted}>{date(post.createdAt)}</Text>
            </View>
            <View style={s.divider} />
            <Text selectable style={[s.text, { fontSize: 18, lineHeight: 30 }]}>
              {post.content}
            </Text>
            {post.updatedAt !== post.createdAt && (
              <Text style={s.muted}>Atualizado em {date(post.updatedAt)}</Text>
            )}
            {user?.role === "TEACHER" && (
              <Button
                title="Editar publicação"
                onPress={() =>
                  router.push({
                    pathname: "/admin/posts/[id]",
                    params: { id: post.id },
                  })
                }
              />
            )}
            <Button
              title="Voltar às publicações"
              secondary
              onPress={() => router.replace("/")}
            />
          </>
        )
      )}
    </Screen>
  );
}
