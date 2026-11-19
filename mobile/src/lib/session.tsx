import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { api, ApiError, configureSession, json, message, User } from "./api";
const key = "fase4.session";
const read = () =>
  Platform.OS === "web" ? Promise.resolve(null) : SecureStore.getItemAsync(key);
const save = (value: string | null) =>
  Platform.OS === "web"
    ? Promise.resolve()
    : value
      ? SecureStore.setItemAsync(key, value)
      : SecureStore.deleteItemAsync(key);
type Session = {
  user: User | null;
  loading: boolean;
  error: string;
  retry: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const logout = useCallback(async () => {
    configureSession(null);
    setUser(null);
    setError("");
    await save(null);
  }, []);
  const boot = useCallback(async () => {
    try {
      const token = await read();
      configureSession(token, () => {
        void logout().catch(() => {});
      });
      if (token) setUser(await api<User>("/auth/me"));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await logout();
      else setError(message(e));
    } finally {
      setLoading(false);
    }
  }, [logout]);
  // The initial effect hydrates session state asynchronously from SecureStore and the API.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Async session hydration requires publishing the result to context.
    void boot();
  }, [boot]);
  const login = async (email: string, password: string) => {
    const result = await api<{ token: string; user: User }>(
      "/auth/login",
      json("POST", { email, password }),
    );
    await save(result.token);
    configureSession(result.token);
    setUser(result.user);
    setError("");
  };
  return (
    <Context.Provider
      value={{
        user,
        loading,
        error,
        retry: () => {
          setLoading(true);
          setError("");
          void boot();
        },
        login,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("Sessão indisponível");
  return value;
}
