"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function Copyright() {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => null,
  );

  return <p className="text-sm text-muted-foreground">© {year ?? ""} Agendfix</p>;
}
