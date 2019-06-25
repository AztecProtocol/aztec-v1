const utils = {
    notePrefix: (id) => `n:${id}`,
    assetPrefix: (id) => `a:${id}`,
    assetValuePrefix:  (assetId, groupId) => `a:${assetId}:v:${groupId}`,
    getNoteGroupId: (value) => Math.floor(value / 20),
};

export default utils;
