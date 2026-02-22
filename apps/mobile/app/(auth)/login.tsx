import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { Colors } from "../../lib/colors";
import { supabase } from "../../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID!;

const reversedClientId = IOS_CLIENT_ID.split(".").reverse().join(".");
const redirectUri = `${reversedClientId}:/oauthredirect`;

const GoogleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18">
    <Path
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      fill="#4285F4"
    />
    <Path
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      fill="#34A853"
    />
    <Path
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      fill="#FBBC05"
    />
    <Path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      fill="#EA4335"
    />
  </Svg>
);

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState("");
  const [hashedNonce, setHashedNonce] = useState("");

  useEffect(() => {
    const generateNonce = async () => {
      const raw = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        String(Date.now()) + Math.random()
      );

      const hashed = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        raw
      );

      setNonce(raw);
      setHashedNonce(hashed);
    };

    generateNonce();
  }, []);

  const handleGoogleSignIn = async () => {
    if (loading || !hashedNonce) return;
    setLoading(true);
    setError("");

    try {
      const codeVerifier = nonce + nonce;
      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      const codeChallengeB64 = codeChallenge
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(IOS_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent("openid email profile")}` +
        `&code_challenge=${encodeURIComponent(codeChallengeB64)}` +
        `&code_challenge_method=S256` +
        `&nonce=${encodeURIComponent(hashedNonce)}`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      if (result.type !== "success") return;

      const resultUrl = new URL(result.url);
      const code = resultUrl.searchParams.get("code");
      if (!code) throw new Error("Google did not return an authorization code.");

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: IOS_CLIENT_ID,
          code,
          code_verifier: codeVerifier,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }).toString(),
      });

      const tokens = await tokenRes.json();
      if (!tokens.id_token) throw new Error(tokens.error_description || "Token exchange failed.");

      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: tokens.id_token,
        nonce,
      });

      if (signInError) throw signInError;
    } catch (e: any) {
      const msg = e?.message || "Something went wrong. Please try again.";
      setError(msg);
      Alert.alert("Sign in failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.brandingArea}>
            <Text style={styles.appName}>WellSaid</Text>
            <View style={styles.textGroup}>
              <Text style={styles.headline}>
                Making healthcare easier for all
              </Text>
              <Text style={styles.subtext}>
                Sign into your account below
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.googleBtn,
                (loading || !hashedNonce) && styles.googleBtnDisabled,
              ]}
              onPress={handleGoogleSignIn}
              disabled={loading || !hashedNonce}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
            >
              {loading ? (
                <ActivityIndicator color={Colors.foreground} size="small" />
              ) : (
                <View style={styles.googleBtnContent}>
                  <GoogleIcon />
                  <Text style={styles.googleBtnText}>
                    Continue with Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  brandingArea: {
    alignItems: "center",
    gap: 12,
    marginBottom: 40,
  },
  appName: {
    fontSize: 30,
    fontFamily: "DancingScript_700Bold",
    color: Colors.accent,
    letterSpacing: -0.5,
  },
  textGroup: {
    alignItems: "center",
    gap: 4,
  },
  headline: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
  },
  subtext: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  actions: {
    width: "100%",
    maxWidth: 400,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.danger,
    textAlign: "center",
  },
  googleBtn: {
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  googleBtnDisabled: {
    opacity: 0.5,
  },
  googleBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  googleBtnText: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
  },
});
