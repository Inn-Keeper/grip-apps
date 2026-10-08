import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../lib/api";
import { pipeline } from "../lib/api";
import { archBoardQueryKeys } from "../archBoard/queries";
import type { Retro } from "./types";

export const contactsQueryKeys = {
  contacts: ["contacts"] as const,
  stories: ["stories"] as const,
  statusEvents: ["status-events"] as const,
  velocity: ["pipeline-velocity"] as const,
};

export function useContactsQuery() {
  return useQuery({ queryKey: contactsQueryKeys.contacts, queryFn: api.listContacts });
}

export function useContactStoriesQuery() {
  return useQuery({ queryKey: contactsQueryKeys.stories, queryFn: api.listStories });
}

export function useStatusEventsQuery() {
  return useQuery({ queryKey: contactsQueryKeys.statusEvents, queryFn: api.listStatusEvents });
}

// Shares the Prep tab's ["scores"] cache — readiness reads, never writes.
export function useScoresQuery() {
  return useQuery({ queryKey: ["scores"], queryFn: api.getScores });
}

// Readiness scores and story links; board saves and deletes invalidate it.
export function useBoardsQuery() {
  return useQuery({ queryKey: archBoardQueryKeys.boardOverviews, queryFn: api.listBoardOverviews });
}

// Local const so the null check narrows inside the closure below; an imported
// binding does not.
const velocityClient = pipeline;
export const pipelineConfigured = velocityClient !== null;

// skipToken, not `enabled`, so the query is typed as never-run rather than
// pending: with no pipeline service configured the rail hides the panel.
export function usePipelineVelocityQuery() {
  return useQuery({
    queryKey: contactsQueryKeys.velocity,
    queryFn: velocityClient ? () => velocityClient.getVelocity() : skipToken,
    retry: false,
  });
}

function useInvalidateContacts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: contactsQueryKeys.contacts });
    queryClient.invalidateQueries({ queryKey: contactsQueryKeys.statusEvents });
    queryClient.invalidateQueries({ queryKey: contactsQueryKeys.velocity });
  };
}

export function useSaveContactMutation() {
  const invalidate = useInvalidateContacts();
  return useMutation({ mutationFn: api.upsertContact, onSettled: invalidate });
}

export function useImportContactsMutation() {
  const invalidate = useInvalidateContacts();
  // onSettled, not onSuccess: a timed-out save may still have landed, so refetch either way.
  return useMutation({ mutationFn: api.importContacts, onSettled: invalidate });
}

export function useDeleteContactMutation() {
  const invalidate = useInvalidateContacts();
  return useMutation({ mutationFn: api.deleteContact, onSettled: invalidate });
}

export function useAddRetroMutation() {
  const invalidate = useInvalidateContacts();
  return useMutation({
    mutationFn: ({ contactId, retro }: { contactId: string; retro: Omit<Retro, "id" | "date"> }) =>
      api.addRetro(contactId, retro),
    onSettled: invalidate,
  });
}

export function useDeleteRetroMutation() {
  const invalidate = useInvalidateContacts();
  return useMutation({ mutationFn: api.deleteRetro, onSettled: invalidate });
}
