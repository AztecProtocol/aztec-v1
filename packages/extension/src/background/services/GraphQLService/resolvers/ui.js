import userModel from '~/database/models/user';
import fetchAsset from './utils/fetchAsset';
import fetchAztecAccount from './utils/fetchAztecAccount';
import mergeResolvers from './utils/mergeResolvers';
import ConnectionService from '~/ui/services/ConnectionService';
import Web3Service from '~/helpers/Web3Service';
import base from './base';

const uiResolvers = {
    Account: {
        linkedPublicKey: async ({ address }) => Web3Service
            .useContract('AZTECAccountRegistry')
            .method('accountMapping')
            .call(address),
    },
    Query: {
        user: async (_, { id }) => userModel.get({
            id,
        }),
        asset: async (_, { id }) => {
            const {
                asset,
            } = await fetchAsset({
                address: id,
            });
            return asset;
        },
        account: async (_, { address }) => fetchAztecAccount({
            address,
        }),
        note: async (_, args) => {
            const {
                note: noteResponse,
            } = await ConnectionService.query({
                query: 'note',
                data: {
                    ...args,
                },
            });
            return noteResponse.note;
        },
    },
};

export default mergeResolvers(
    base,
    uiResolvers,
);
