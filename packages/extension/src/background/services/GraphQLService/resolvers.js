import assetModel from '~database/models/asset';
import AuthService from '../AuthService';

const sessionValidation = query => async (_, args) => {
    await AuthService.validate(_, args);
    return query(_, args);
};

export default {
    Query: {
        asset: sessionValidation((_, args) => assetModel.get(args)),
    },
};
