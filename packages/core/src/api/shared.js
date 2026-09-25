// Helpers shared by the api modules.

export const dateToUi = (iso) => (iso ? iso.split("-").reverse().join("-") : "");
export const dateToDb = (ddmmyyyy) => {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(ddmmyyyy || "");
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
};

export const fail = (error) => {
  // Preserve the original Supabase error (code, details, hint) as `cause` so
  // the surfaced message isn't the only thing left for debugging.
  throw new Error(error.message, { cause: error });
};
