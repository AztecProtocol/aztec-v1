const UNLIMITED = (2 ** 32) - 1;

export const defaultMaxAssets = 2 ** 12;
export const defaultMaxNotes = 2 ** 18;
export const defaultMaxRawNotes = 2 ** 18;
export const defaultMaxCallbacks = UNLIMITED;
export const defaultMaxProcesses = 2 ** 3;
export const defaultNotesPerBatch = 200;
export const defaultNotesPerSyncBatch = 1000;
export const defaultNotesPerDecryptionBatch = 100;
export const defaultSyncInterval = 1000;
