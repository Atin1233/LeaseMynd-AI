"use client";

import { EmployeeAuthProvider } from "~/lib/auth/EmployeeAuthContext";

export default function EmployeeLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmployeeAuthProvider>{children}</EmployeeAuthProvider>;
}
