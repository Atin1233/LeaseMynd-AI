"use client";

import { EmployerAuthProvider } from "~/lib/auth/EmployerAuthContext";

export default function EmployerLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmployerAuthProvider>{children}</EmployerAuthProvider>;
}
