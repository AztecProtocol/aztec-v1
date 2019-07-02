import {
    getAsset,
} from './database/asset';

export default {
    Query: {
        asset: getAsset,
    },
};
