// Data layer: Supabase queries + snake_case<->camelCase and date mapping.
// UI keeps DD-MM-YYYY strings; Postgres stores real dates.
// One module per domain under ./api; this file keeps the public types and entry point.
import { boardsApi } from "./api/boards.js";
import { contactsApi } from "./api/contacts.js";
import { profileApi } from "./api/profile.js";
import { scenariosApi } from "./api/scenarios.js";
import { scoresApi } from "./api/scores.js";
import { storiesApi } from "./api/stories.js";

export { dateToDb, dateToUi } from "./api/shared.js";

/**
 * @typedef {object} Retro
 * @property {string} id
 * @property {string} round
 * @property {string} questions
 * @property {string} wentWell
 * @property {string} toImprove
 * @property {string[]} struggledTechs
 * @property {string} date
 */

/**
 * @typedef {object} Contact
 * @property {string} [id]
 * @property {string} name
 * @property {string} status
 * @property {string} role
 * @property {string} link
 * @property {string} note
 * @property {string} date
 * @property {string} nextAction
 * @property {string} nextActionDate
 * @property {string[]} postingTechs
 * @property {Retro[]} [retros]
 */

/**
 * @typedef {object} Story
 * @property {string} [id]
 * @property {string} title
 * @property {string} competency
 * @property {string} situation
 * @property {string} task
 * @property {string} action
 * @property {string} result
 * @property {string | null} [scenarioId] Arch Board scenario (built-in key or custom uuid)
 */

/**
 * @typedef {object} Scores
 * @property {number} xp
 * @property {Record<string, { correct: number, wrong: number }>} answers
 */

/**
 * @typedef {object} AccuracyPoint
 * @property {string} date
 * @property {number} accuracy
 * @property {number} correct
 * @property {number} total
 */

/**
 * @typedef {object} SavedBoard
 * @property {string} [id]
 * @property {string} title
 * @property {string} scenarioId
 * @property {string | null} [storyId] the story this board was designed for
 * @property {import("./arch.js").BoardNode[]} nodes
 * @property {import("./arch.js").BoardEdge[]} edges
 * @property {{ sections: Record<string, string>, rating: number | null }} [talkTrack]
 * @property {number | null} [talkGrade]
 * @property {string | null} [shareToken]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {object} BoardSummary
 * @property {string} id
 * @property {string} title
 * @property {string} scenarioId
 * @property {string | null} [storyId]
 * @property {string | null} shareToken
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {object} User
 * @property {string} id
 * @property {string} displayName
 * @property {string} email
 * @property {string} avatarUrl
 * @property {string} headline
 * @property {string} targetRole
 * @property {string} location
 * @property {string} portfolioUrl
 * @property {string} githubUrl
 * @property {boolean} useGithubTechsForPrep
 * @property {string[]} cvTechs
 * @property {string} linkedinUrl
 * @property {string} timezone
 * @property {boolean} onboardingCompleted
 * @property {number} xp
 * @property {string | null} createdAt
 * @property {string | null} updatedAt
 */

/**
 * @typedef {object} SupabaseClient
 * @property {(table: string) => object} from
 * Minimal Supabase client interface for type safety
 */

/**
 * Binds the data layer to a Supabase client (browser or React Native).
 * @param {SupabaseClient} supabase
 * @returns {{
 *   listContacts(): Promise<Contact[]>,
 *   upsertContact(contact: Contact): Promise<void>,
 *   deleteContact(id: string | undefined): Promise<void>,
 *   addRetro(contactId: string, retro: Omit<Retro, "id" | "date"> & { date?: string }): Promise<void>,
 *   deleteRetro(id: string): Promise<void>,
 *   listStories(): Promise<Story[]>,
 *   upsertStory(story: Story): Promise<void>,
 *   deleteStory(id: string | undefined): Promise<void>,
 *   getScores(): Promise<Scores>,
 *   getAccuracyTimeline(): Promise<AccuracyPoint[]>,
 *   getReviewQueue(): Promise<import("./review.js").ReviewEntry[]>,
 *   getQuestions(args: { techs: string[], difficulty: string, limit?: number }): Promise<{ id: string, tech: string, category: string, difficulty: string, prompt: string, options: string[], correct: number, explanation: string | null }[]>,
 *   recordAnswer(tech: string, correct: boolean, source: string, difficulty: string | null, requestId: string): Promise<void>,
 *   addXp(points: number): Promise<void>,
 *   resetScores(): Promise<Scores>,
 *   listBoards(): Promise<SavedBoard[]>,
 *   listBoardSummaries(): Promise<BoardSummary[]>,
 *   getBoard(id: string): Promise<SavedBoard>,
 *   upsertBoard(board: SavedBoard): Promise<SavedBoard>,
 *   deleteBoard(id: string | undefined): Promise<void>,
 *   setBoardSharing(id: string, enable: boolean): Promise<string | null>,
 *   getSharedBoard(token: string): Promise<{ title: string, scenarioId: string, nodes: import("./arch.js").BoardNode[], edges: import("./arch.js").BoardEdge[], updatedAt: string } | null>,
 *   listCustomScenarios(): Promise<{ id: string, name: string, brief: string, budget: number, checks: object[] }[]>,
 *   upsertCustomScenario(s: object): Promise<object>,
 *   deleteCustomScenario(id: string): Promise<void>,
 *   listStatusEvents(): Promise<{ contactId: string, status: string, createdAt: string }[]>,
 *   getUser(): Promise<User | null>,
 *   updateProfile(profile: Partial<User>): Promise<User>
 * }}
 */
export function createApi(supabase) {
  return {
    ...contactsApi(supabase),
    ...storiesApi(supabase),
    ...boardsApi(supabase),
    ...scenariosApi(supabase),
    ...scoresApi(supabase),
    ...profileApi(supabase),
  };
}
