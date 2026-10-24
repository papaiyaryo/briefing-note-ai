"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ComparisonSession } from "../../lib/companyComparison/session";
const Context = createContext<ComparisonSession | null>(null);
export function ComparisonSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session] = useState(() => new ComparisonSession());
  return <Context.Provider value={session}>{children}</Context.Provider>;
}
export function useOptionalComparisonSession() {
  const session = useContext(Context);
  return session instanceof ComparisonSession ? session : null;
}
export function useComparisonRevision(session: ComparisonSession) {
  const [revision, setRevision] = useState(session.revision);
  useEffect(
    () => session.subscribe(() => setRevision(session.revision)),
    [session],
  );
  return revision;
}
