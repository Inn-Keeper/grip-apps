// Playbook replacement: request ordering and the account-scoped "attempt in progress" marker.

const MAX_STACK = 30; // grip-ai-api playbook_schemas.py
const MAX_ROLE = 120;

/**
 * The API has no favourites field: preferred techs go first (stack ones, plus catalogue-supported
 * ones outside the stack), then the rest of the stack.
 */
export function orderedTechs(snapshot, catalogue) {
  const known = new Set(catalogue);
  const stack = new Set(snapshot.techs);
  const preferred = snapshot.favoriteTechs.filter((tech) => stack.has(tech) || known.has(tech));
  return [...new Set([...preferred, ...snapshot.techs])].slice(0, MAX_STACK);
}

/** A replacement uses only saved preparation; private job/CV/notes are never resent. */
export function preparationRequest(snapshot, catalogue) {
  return {
    stack: orderedTechs(snapshot, catalogue),
    goal: snapshot.goal,
    brief: snapshot.brief,
    role: snapshot.role.slice(0, MAX_ROLE),
    job_text: "",
    cv_text: "",
    notes: [],
    locale: snapshot.locale,
  };
}

const key = (userId) => `grip.playbookAttempt.${userId}`;

/** Only id and start time: enough to say "interrupted" after a reload, nothing private. */
export function writeAttempt(storage, userId, attempt) {
  try {
    storage.setItem(key(userId), JSON.stringify({ id: attempt.id, startedAt: attempt.startedAt }));
  } catch {
    // Storage blocked: the interrupted notice is a nicety.
  }
}

export function readAttempt(storage, userId) {
  try {
    const value = JSON.parse(storage.getItem(key(userId)) ?? "null");
    return value && typeof value.id === "string" ? value : null;
  } catch {
    return null;
  }
}

export function clearAttempt(storage, userId) {
  try {
    storage.removeItem(key(userId));
  } catch {
    // ignore
  }
}
