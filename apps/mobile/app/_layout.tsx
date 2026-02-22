import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { DancingScript_700Bold } from "@expo-google-fonts/dancing-script";
import * as SplashScreen from "expo-splash-screen";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DancingScript_700Bold,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready || !fontsLoaded) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, ready, fontsLoaded, segments]);

  if (!fontsLoaded || !ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="schedule-call" options={{ presentation: "modal" }} />
      <Stack.Screen name="record-note" options={{ presentation: "modal" }} />
      <Stack.Screen name="health-note/[id]" />
      <Stack.Screen name="session/[id]" />
      <Stack.Screen name="document/[id]" />
      <Stack.Screen name="appointment/[id]" />
    </Stack>
  );
}
