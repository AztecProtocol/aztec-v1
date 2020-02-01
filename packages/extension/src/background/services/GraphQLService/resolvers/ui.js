import userModel from '~/database/models/user';
import fetchAsset from './utils/fetchAsset';
import fetchAztecAccount from './utils/fetchAztecAccount';
import mergeResolvers from './utils/mergeResolvers';
import ConnectionService from '~/ui/services/ConnectionService';
import Web3Service from '~/helpers/Web3Service';
import base from './base';

const uiResolvers = {
    Account: {
        linkedPublicKey: async ({ address, linkedPublicKey }) => linkedPublicKey
            || Web3Service
                .useContract('AccountRegistry')
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
        account: async (_, { address }) => await fetchAztecAccount({
            address,
        }),
        note: async (_, args) => {
            const {
                note: noteResponse,
            } = await ConnectionService.query({
                query: 'note',
                data: {
                    ...args,
                    requestedFields: `
                        noteHash
                        metadata
                        viewingKey
                        status
                        asset {
                            address
                        }
                    `,
                },
            });

            const {
                note,
            } = noteResponse || {};

            if (!note) {
                return null;
            }

            return {
                ...note,
                asset: note.asset.address,
            };
        },
    },
};

export default mergeResolvers(
    base,
    uiResolvers,
);
