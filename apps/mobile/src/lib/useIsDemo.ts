import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// True while the session is an anonymous (demo) user; flips when GitHub gets linked.
export function useIsDemo() {
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsDemo(!!data.session?.user.is_anonymous));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setIsDemo(!!session?.user.is_anonymous)
    );
    return () => sub.subscription.unsubscribe();
  }, []);
  return isDemo;
}
