let exitToList = null;

export const setExitToList = (fn) => { exitToList = fn; };
export const clearExitToList = () => { exitToList = null; };
export const hasExitToList = () => !!exitToList;
export const runExitToList = () => { if (exitToList) exitToList(); };