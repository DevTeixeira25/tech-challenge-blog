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
} from "../../../components/ui";
import { api, json, message, pathId, Post } from "../../../lib/api";
import { useSession } from "../../../lib/session";
export default function PostEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { user } = useSession();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState(user?.name || "");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const routeKey = `${id}`;
  const [loadedKey, setLoadedKey] = useState("");
  const pending = loading || (!loadError && loadedKey !== routeKey);
  const load = useCallback(async () => {
    const current = ++request.current;
    setError("");
    if (isNew) {
      setTitle("");
      setAuthor(user?.name || "");
      setContent("");
      setLoadError("");
      setLoadedKey(`${id}`);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const post = await api<Post>(`/posts/${pathId(id)}`);
      if (current !== request.current) return;
      setLoadedKey(`${id}`);
      setTitle(post.title);
      setAuthor(post.author);
      setContent(post.content);
    } catch (e) {
      if (current === request.current) setLoadError(message(e));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [id, isNew, user?.name]);
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
    if (
      !title.trim() ||
      title.trim().length > 200 ||
      !author.trim() ||
      author.trim().length > 120 ||
      !content.trim()
    ) {
      setError(
        "Preencha título (até 200 caracteres), autor (até 120) e conteúdo.",
      );
      return;
    }
    setBusy(true);
    try {
      await api<Post>(
        isNew ? "/posts" : `/posts/${pathId(id)}`,
        json(isNew ? "POST" : "PUT", {
          title: title.trim(),
          author: author.trim(),
          content: content.trim(),
        }),
      );
      router.replace("/admin/posts");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Text style={s.label}>Sua próxima ideia</Text>
      <Text style={s.title}>
        {isNew ? "Nova publicação" : "Editar publicação"}
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
            label="Título"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            editable={!busy}
          />
          <Field
            label="Autor"
            value={author}
            onChangeText={setAuthor}
            maxLength={120}
            editable={!busy}
          />
          <Field
            label="Conteúdo"
            value={content}
            onChangeText={setContent}
            multiline
            editable={!busy}
          />
          <Text style={s.muted}>
            O texto será publicado no blog e poderá ser lido por toda a
            comunidade.
          </Text>
          {error && <Failure error={error} />}
          <Button
            title={
              busy
                ? "Salvando…"
                : isNew
                  ? "Publicar texto"
                  : "Salvar alterações"
            }
            disabled={busy}
            onPress={() => {
              void submit();
            }}
          />
          <Button
            title="Cancelar"
            secondary
            disabled={busy}
            onPress={() => router.replace("/admin/posts")}
          />
        </View>
      )}
    </Screen>
  );
}
