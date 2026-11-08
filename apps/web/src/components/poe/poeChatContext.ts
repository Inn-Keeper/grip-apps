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

export const PoeChatContext = createContext<PoeChatValue | null>(null);

/** Null outside the signed-in shell, where there is no chat. */
export function usePoeChat(): PoeChatValue | null {
  return useContext(PoeChatContext);
}
