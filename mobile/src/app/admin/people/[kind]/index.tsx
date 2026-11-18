import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
} from "../../../../components/ui";
import { api, json, message, Page, pathId, User } from "../../../../lib/api";
export default function People() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const valid = kind === "teachers" || kind === "students";
  const label = kind === "teachers" ? "professores" : "alunos";
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [target, setTarget] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      const result = await api<Page<User>>(`/${kind}?page=${page}&pageSize=10`);
      if (current !== request.current) return;
      if (page > 1 && result.items.length === 0) {
        setPage(page - 1);
        return;
      }
      setData(result);
    } catch (e) {
      if (current === request.current) setError(message(e));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [kind, page, valid]);
  useFocusEffect(
    useCallback(() => {
      void load();
      setTarget(null);
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
      await api(`/${kind}/${pathId(target.id)}`, json("DELETE"));
      setTarget(null);
      await load();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (!valid)
    return (
      <Screen>
        <Empty
          title="Cadastro não encontrado"
          text="Escolha professores ou alunos na área de gestão."
        />
        <Button
          title="Voltar à gestão"
          onPress={() => router.replace("/admin")}
        />
      </Screen>
    );
  return (
    <Screen scroll={false}>
      <FlatList
        data={data?.items || []}
        keyExtractor={(person) => person.id}
        contentContainerStyle={s.body}
        refreshing={loading && !!data}
        onRefresh={() => {
          void load();
        }}
        ListHeaderComponent={
          <View style={{ gap: 18, marginBottom: 18 }}>
            <Text style={s.label}>Nossa comunidade</Text>
            <Text style={s.title}>
              {kind === "teachers" ? "Professores" : "Alunos"}
            </Text>
            <Text style={s.muted}>
              {data
                ? `${data.total} ${label} na escola`
                : "Organize os acessos da sua escola."}
            </Text>
            <Button
              title={
                kind === "teachers"
                  ? "+ Cadastrar professor"
                  : "+ Cadastrar aluno"
              }
              onPress={() =>
                router.push({
                  pathname: "/admin/people/[kind]/[id]",
                  params: { kind, id: "new" },
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
                name={target.name}
                busy={busy}
                error={error}
                onCancel={() => setTarget(null)}
                onConfirm={() => {
                  void remove();
                }}
              />
            )}
            {loading && !data && <Loading />}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          !loading && !error ? (
            <Empty
              title="A comunidade vai crescer"
              text={`Cadastre ${label} para começar.`}
            />
          ) : undefined
        }
        ListFooterComponent={
          data && data.totalPages > 1 ? (
            <View style={{ gap: 12, paddingVertical: 20 }}>
              <Text style={s.muted}>
                Página {data.page} de {data.totalPages}
              </Text>
              <View style={s.row}>
                <Button
                  title="Anterior"
                  secondary
                  disabled={loading || busy || page <= 1}
                  onPress={() => setPage(page - 1)}
                />
                <Button
                  title="Próxima"
                  secondary
                  disabled={loading || busy || page >= data.totalPages}
                  onPress={() => setPage(page + 1)}
                />
              </View>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.h2}>{item.name}</Text>
            <Text selectable style={s.muted}>
              {item.email}
            </Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>
                {item.role === "TEACHER" ? "Professor" : "Aluno"}
              </Text>
            </View>
            <View style={s.row}>
              <Button
                title="Ver e editar"
                secondary
                disabled={busy || loading}
                onPress={() =>
                  router.push({
                    pathname: "/admin/people/[kind]/[id]",
                    params: { kind, id: item.id },
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
