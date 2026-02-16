"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function MfaGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`);
        return;
      }
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setChecking(false);
      if (error) {
        setAllowed(true);
        return;
      }
      if (data?.nextLevel === "aal2" && data?.currentLevel === "aal1") {
        router.replace(
          `/mfa-verify?redirect=${encodeURIComponent(pathname || "/dashboard")}`
        );
      } else {
        setAllowed(true);
      }
    })();
  }, [router, pathname]);

  if (checking || !allowed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
