"use client";
import { useEffect, useState } from "react";

export type UserProfile = {
  id: string;
  email: string;
  businessName: string;
  ownerName: string;
  phone: string | null;
  language: string;
  accountType: string;
  logoUrl: string | null;
};

let cachedUser: UserProfile | null = null;
const listeners: Array<(u: UserProfile | null) => void> = [];

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(cachedUser);

  useEffect(() => {
    listeners.push(setUser);
    if (!cachedUser) {
      fetch("/api/auth/me")
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          cachedUser = d;
          listeners.forEach(fn => fn(d));
        })
        .catch(() => {});
    }
    return () => {
      const idx = listeners.indexOf(setUser);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const refresh = () => {
    cachedUser = null;
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      cachedUser = d;
      listeners.forEach(fn => fn(d));
    });
  };

  return { user, refresh };
}
