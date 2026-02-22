import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabase";

type AccessibilityContextValue = {
  highLegibility: boolean;
  setHighLegibility: (val: boolean) => void;
  fontScale: number;
  lineHeightScale: number;
  fontWeight: "400" | "500" | "600" | "700";
  letterSpacing: number;
};

const AccessibilityContext = createContext<AccessibilityContextValue>({
  highLegibility: false,
  setHighLegibility: () => {},
  fontScale: 1,
  lineHeightScale: 1,
  fontWeight: "400",
  letterSpacing: 0,
});

export const AccessibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const [highLegibility, setHighLegibilityState] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("high_legibility")
        .eq("id", user.id)
        .single();
      if (data?.high_legibility) setHighLegibilityState(true);
    };
    load();
  }, []);

  const setHighLegibility = useCallback((val: boolean) => {
    setHighLegibilityState(val);
  }, []);

  const value = useMemo(
    () => ({
      highLegibility,
      setHighLegibility,
      fontScale: highLegibility ? 1.35 : 1,
      lineHeightScale: highLegibility ? 1.7 : 1,
      fontWeight: (highLegibility ? "700" : "400") as "400" | "500" | "600" | "700",
      letterSpacing: highLegibility ? 0.5 : 0,
    }),
    [highLegibility, setHighLegibility]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
