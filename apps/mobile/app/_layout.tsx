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
import { I18nProvider } from "../lib/i18n";
import { AccessibilityProvider } from "../lib/accessibility";

SplashScreen.preventAutoHideAsync();

const RootLayoutInner = () => {
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
      supabase
        .from("profiles")
        .select("first_name")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.first_name) {
            router.replace("/(tabs)");
          } else {
            router.replace("/(auth)/onboarding");
          }
        });
    }
  }, [session, ready, fontsLoaded, segments]);

  if (!fontsLoaded || !ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="schedule-call" options={{ presentation: "modal" }} />
      <Stack.Screen name="record-note" options={{ presentation: "modal" }} />
      <Stack.Screen name="record-session" options={{ presentation: "modal" }} />
      <Stack.Screen name="emergency" options={{ presentation: "modal" }} />
      <Stack.Screen name="health-note/[id]" />
      <Stack.Screen name="session/[id]" />
      <Stack.Screen name="document/[id]" />
      <Stack.Screen name="appointment/[id]" />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <I18nProvider>
      <AccessibilityProvider>
        <RootLayoutInner />
      </AccessibilityProvider>
    </I18nProvider>
  );
}
