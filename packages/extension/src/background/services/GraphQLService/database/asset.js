export const getAsset = (_, args) => {
    console.log('getAsset', args);
    return {
        id: 'abc',
        balance: 500,
    };
};

export const getAssets = () => {};
