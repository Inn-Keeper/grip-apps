// Why the stage-velocity panel is empty. Out of the component so it can be
// tested without rendering.

/**
 * Whether the pipeline service had anything to average.
 *
 * Velocity comes from the gaps between a contact's consecutive status events,
 * so a contact with one event contributes no dwell interval. Two events for
 * the same contact is the whole bar — the service counts the same way.
 */
export const hasStageTransitions = (statusEvents = []) => {
  const seen = new Set();
  for (const { contactId } of statusEvents) {
    if (seen.has(contactId)) return true;
    seen.add(contactId);
  }
  return false;
};

/**
 * The locale key for an empty report.
 *
 * With no transitions recorded, empty is the correct answer and the message
 * says how to fill it. With transitions recorded, empty means the service
 * found none of them, which points at the service rather than at the user.
 */
export const velocityEmptyKey = (statusEvents) =>
  hasStageTransitions(statusEvents) ? "quest.velocityNoAverages" : "quest.velocityEmpty";
