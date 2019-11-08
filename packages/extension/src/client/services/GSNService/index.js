import {
    GSNProvider,
} from '@openzeppelin/gsn-provider';
import {
    generate
} from "ethereumjs-wallet";
import Web3Service from '~/utils/Web3Service';
import {
    AZTECAccountRegistryGSNConfig,
} from '~/config/contracts';
import approveFunction from '~utils/approveGSNFunction';


const web3Service = new Web3Service();

const handleAction = async (data) => {
    let response = {};
    const {
        action,
    } = data;
    const { address } = web3Service.account;

    switch (action) {
        case 'gsn.zkAsset.confidentialTransfer': {
            const {
                response: {
                    assetAddress,
                    proofData,
                    signatures,
                },
            } = data;
            await web3Service
                .useContract('AZTECAccountRegistryGSN')
                .method('confidentialTransfer')
                .send(
                    assetAddress,
                    proofData,
                    signatures,
                );
            break;
        }
        default:
    }

    return response;
};

class GSNService {

    constructor() {
        this.apiKey = null;
    }

    async init({
        apiKey,
        providerUrl,
    }) {
        this.apiKey = apiKey;

        const provider = new GSNProvider(providerUrl, {
            pollInterval: 15 * 1000,
            signKey: generate().privKey,
            approveFunction: approveFunction(apiKey),
            fixedGasPrice: 15000000000,
        });

        await web3Service.init({
            provider,
        });
    }

    getGSNConfig() {
        const proxyContractAddress = web3Service.getAddress(AZTECAccountRegistryGSNConfig.name);
        return {
            useGSN: !!this.apiKey,
            proxyContractAddress: proxyContractAddress,//|| '0x32167c8263cf521a19a4d2dbb9a87a1d79977a18',
        };
    };

    handleAction = async ({ data }) => {
        try {
            const response = await handleAction(data);
            return {
                ...data,
                response: {
                    ...response,
                    success: true,
                },
            };
        } catch (error) {
            return {
                ...data,
                response: {
                    success: false,
                    error,
                },
            };
        }
    }
}

export const Web3ServiceGSN = web3Service;
export default new GSNService();
