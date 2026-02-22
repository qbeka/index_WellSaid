import { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Text } from "./AccessibleText";
import {
  MapPin,
  Phone,
  Navigation,
  Hospital,
  Pill,
  Check,
} from "lucide-react-native";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Colors } from "../lib/colors";
import { supabase } from "../lib/supabase";
import { useI18n } from "../lib/i18n";

type NearbyPlace = {
  id: number;
  name: string;
  type: string;
  lat: number;
  lon: number;
  distance: number;
  phone?: string;
  address?: string;
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function NearbyProviders() {
  const { t } = useI18n();
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedPhone, setSavedPhone] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError("");
    setPlaces([]);
    setSearched(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError(t("travel.locationDenied"));
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;

      const query = `[out:json][timeout:10];(node["amenity"~"hospital|clinic|doctors|pharmacy"](around:5000,${latitude},${longitude});way["amenity"~"hospital|clinic|doctors|pharmacy"](around:5000,${latitude},${longitude}););out center body;`;

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();

      const results: NearbyPlace[] = (data.elements || [])
        .filter((el: any) => el.tags?.name)
        .map((el: any) => {
          const lat = el.lat || el.center?.lat;
          const lon = el.lon || el.center?.lon;
          return {
            id: el.id,
            name: el.tags.name,
            type: el.tags.amenity,
            lat,
            lon,
            distance: getDistance(latitude, longitude, lat, lon),
            phone: el.tags.phone || el.tags["contact:phone"] || undefined,
            address: [el.tags["addr:street"], el.tags["addr:housenumber"], el.tags["addr:city"]]
              .filter(Boolean)
              .join(", ") || undefined,
          };
        })
        .sort((a: NearbyPlace, b: NearbyPlace) => a.distance - b.distance);

      setPlaces(results);
      if (results.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setError(t("travel.searchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhone = async (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ hospital_phone: phone, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedPhone(phone);
      setTimeout(() => setSavedPhone(null), 3000);
    } catch {
      Alert.alert(t("common.error"), t("travel.saveFailed"));
    }
  };

  const handleCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone}`);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "pharmacy": return t("travel.pharmacy");
      case "hospital": return t("travel.hospital");
      case "clinic": return t("travel.clinic");
      case "doctors": return t("travel.doctor");
      default: return type;
    }
  };

  const renderPlace = ({ item }: { item: NearbyPlace }) => {
    const isPharmacy = item.type === "pharmacy";
    const Icon = isPharmacy ? Pill : Hospital;

    return (
      <View style={styles.card}>
        <View style={styles.cardIcon}>
          <Icon size={20} color={Colors.accent} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{getTypeLabel(item.type)}</Text>
            </View>
            <Text style={styles.distance}>{item.distance.toFixed(1)} km</Text>
          </View>
          {item.address && (
            <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
          )}
          {item.phone && (
            <View style={styles.phoneRow}>
              <Phone size={12} color={Colors.muted} />
              <Text style={styles.phoneText}>{item.phone}</Text>
            </View>
          )}
        </View>
        {item.phone && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, savedPhone === item.phone && styles.actionBtnSaved]}
              onPress={() => handleSavePhone(item.phone!)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Save ${item.name} phone to settings`}
            >
              {savedPhone === item.phone ? (
                <Check size={14} color={Colors.success} />
              ) : (
                <MapPin size={14} color={Colors.accent} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleCall(item.phone!)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Call ${item.name}`}
            >
              <Phone size={14} color={Colors.accent} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MapPin size={16} color={Colors.accent} />
        <Text style={styles.title}>{t("travel.nearbyTitle")}</Text>
      </View>
      <Text style={styles.desc}>{t("travel.nearbyDesc")}</Text>

      <TouchableOpacity
        style={styles.searchBtn}
        onPress={handleSearch}
        disabled={loading}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t("travel.findNearby")}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.accent} />
        ) : (
          <Navigation size={18} color={Colors.accent} />
        )}
        <Text style={styles.searchBtnText}>
          {loading ? t("travel.searching") : t("travel.findNearby")}
        </Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {places.length > 0 && (
        <FlatList
          data={places}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPlace}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      )}

      {searched && !loading && places.length === 0 && !error && (
        <Text style={styles.emptyText}>{t("travel.noResults")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
  },
  desc: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    lineHeight: 18,
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  searchBtnText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.danger,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
    textAlign: "center",
    paddingVertical: 20,
  },
  listContent: { gap: 10, paddingBottom: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: { flex: 1, gap: 3 },
  cardName: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
  },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
    color: Colors.accent,
    textTransform: "uppercase",
  },
  distance: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  address: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  phoneText: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.muted,
  },
  cardActions: { gap: 6 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnSaved: {
    borderColor: Colors.success,
    backgroundColor: "rgba(76,175,125,0.08)",
  },
});
