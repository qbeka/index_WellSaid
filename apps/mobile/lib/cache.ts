import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_TTL = 5 * 60 * 1000;

export const getCached = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(`cache:${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data as T;
  } catch {
    return null;
  }
};

export const setCache = async <T>(key: string, data: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(`cache:${key}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
};

export const fetchWithCache = async <T>(
  key: string,
  fetcher: () => PromiseLike<T> | Promise<T>
): Promise<{ data: T; fromCache: boolean }> => {
  try {
    const fresh = await fetcher();
    await setCache(key, fresh);
    return { data: fresh, fromCache: false };
  } catch {
    const cached = await getCached<T>(key);
    if (cached) return { data: cached, fromCache: true };
    return { data: [] as unknown as T, fromCache: true };
  }
};
