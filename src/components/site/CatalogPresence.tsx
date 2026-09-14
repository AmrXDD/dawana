"use client";

import { createContext, useContext, type ReactNode } from "react";
import { NO_CATALOG, type CatalogPresence } from "@/lib/catalog-presence";

/* Hands the server's catalogue check to client components (the nav, the
   therapeutics scroller) without each one fetching it again. Defaults to
   "nothing to show", so a component rendered outside the provider hides
   catalogue links rather than linking to a page that may not exist. */
const CatalogContext = createContext<CatalogPresence>(NO_CATALOG);

export function CatalogProvider({
  value,
  children,
}: {
  value: CatalogPresence;
  children: ReactNode;
}) {
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export const useCatalogPresence = () => useContext(CatalogContext);
