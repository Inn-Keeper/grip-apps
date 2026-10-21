const HISTORY_LIMIT = 50;

export const createHistory = (snapshot) => ({ past: [], present: snapshot, future: [] });

export const commitSnapshot = (history, snapshot) =>
  sameSnapshot(history.present, snapshot)
    ? history
    : { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: snapshot, future: [] };

export const undo = (history) => history.past.length === 0 ? history : {
  past: history.past.slice(0, -1),
  present: history.past.at(-1),
  future: [history.present, ...history.future],
};

export const redo = (history) => history.future.length === 0 ? history : {
  past: [...history.past, history.present].slice(-HISTORY_LIMIT),
  present: history.future[0],
  future: history.future.slice(1),
};

export const sameSnapshot = (a, b) => JSON.stringify(a) === JSON.stringify(b);

