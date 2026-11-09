import { createContext, useContext } from "react";

export type Turn = { role: "user" | "poe"; text: string };
export type PoeChatValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  unavailable: boolean;
  messages: Turn[];
  pending: boolean;
  errorLine: string;
  send: (text: string) => Promise<boolean>;
};

// Saved per user so it survives refreshes; sign-out clears it (see App signOut).
export const poeHistoryKey = (userId: string) => `grip.poeChat.${userId}`;

export const PoeChatContext = createContext<PoeChatValue | null>(null);

/** Null outside the signed-in shell, where there is no chat. */
export function usePoeChat(): PoeChatValue | null {
  return useContext(PoeChatContext);
}
