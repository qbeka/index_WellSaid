import { createClient } from "@/lib/supabase/server";
import ConversationContent from "./conversation-content";

const ConversationPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let preferredLanguage = "en";

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .single();

    preferredLanguage = data?.preferred_language ?? "en";
  }

  return <ConversationContent preferredLanguage={preferredLanguage} />;
};

export default ConversationPage;
