import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Contact } from "@grip/core/api";
import { api } from "@/lib/api";

export const contactsQueryKeys = {
  contacts: ["contacts"] as const,
  stories: ["stories"] as const,
  statusEvents: ["status-events"] as const,
};

type RetroDraft = { round: string; questions: string; wentWell: string; toImprove: string; struggledTechs: string[] };

export function useContactsQuery() {
  return useQuery<Contact[]>({ queryKey: contactsQueryKeys.contacts, queryFn: api.listContacts });
}

export function useContactStoriesQuery() {
  return useQuery({ queryKey: contactsQueryKeys.stories, queryFn: api.listStories });
}

export function useStatusEventsQuery() {
  return useQuery({ queryKey: contactsQueryKeys.statusEvents, queryFn: api.listStatusEvents });
}

function useInvalidateContacts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: contactsQueryKeys.contacts });
    queryClient.invalidateQueries({ queryKey: contactsQueryKeys.statusEvents });
  };
}

export function useSaveContactMutation() {
  const invalidate = useInvalidateContacts();
  return useMutation({ mutationFn: api.upsertContact, onSettled: invalidate });
}

export function useDeleteContactMutation() {
  const invalidate = useInvalidateContacts();
  return useMutation({ mutationFn: api.deleteContact, onSettled: invalidate });
}

export function useAddRetroMutation() {
  const invalidate = useInvalidateContacts();
  return useMutation({
    mutationFn: ({ contactId, retro }: { contactId: string; retro: RetroDraft }) =>
      api.addRetro(contactId, retro),
    onSettled: invalidate,
  });
}

export function useDeleteRetroMutation() {
  const invalidate = useInvalidateContacts();
  return useMutation({ mutationFn: api.deleteRetro, onSettled: invalidate });
}
