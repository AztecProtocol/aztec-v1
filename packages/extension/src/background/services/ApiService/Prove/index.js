import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~/utils/filterStream';
import responseDataKeys from './responseDataKeys';
import JoinSplit from './JoinSplit';

const proofWithInputNotes = [
    'WITHDRAW_PROOF',
    'TRANSFER_PROOF',
];

const proofWithOutputNotes = [
    'DEPOSIT_PROOF',
    'TRANSFER_PROOF',
];

const triggerProofUi = async (query, connection) => {
    const {
        data: {
            args: {
                proofType,
            },
        },
    } = query;

    connection.UiActionSubject.next({
        ...query,
        type: `ui.asset.prove.${proofType.toLowerCase()}`,
    });

    const {
        data,
    } = await filterStream(
        uiReturnEvent,
        query.requestId,
        connection.MessageSubject.asObservable(),
    ) || {};

    if (data.error) {
        return data;
    }

    const returnData = {
        success: data.success || false,
    };
    const dataKeys = responseDataKeys[proofType];
    if (dataKeys) {
        dataKeys.forEach((key) => {
            switch (typeof key) {
                case 'string':
                    returnData[key] = data[key];
                    break;
                case 'function': {
                    const res = key(data);
                    if (res) {
                        Object.keys(res).forEach((resKey) => {
                            returnData[resKey] = res[resKey];
                        });
                    }
                    break;
                }
                default:
            }
        });
    }

    return returnData;
};

export default async function prove(query, connection) {
    const {
        data: {
            args,
        },
    } = query;
    const {
        proofType,
        returnProof,
    } = args;

    let returnData = {};
    if (!returnProof) {
        returnData = await triggerProofUi(query, connection);
    } else {
        switch (proofType) {
            case 'DEPOSIT_PROOF':
            case 'WITHDRAW_PROOF':
            case 'TRANSFER_PROOF': {
                const {
                    transactions,
                    amount,
                    to,
                } = args;
                let inputTransactions;
                let outputTransactions;
                if (proofWithInputNotes.indexOf(proofType) >= 0) {
                    inputTransactions = transactions
                        || [ // WITHDRAW_PROOF does not have transactions
                            {
                                amount,
                                to,
                            },
                        ];
                }
                if (proofWithOutputNotes.indexOf(proofType) >= 0) {
                    outputTransactions = transactions;
                }
                const proofData = await JoinSplit({
                    ...args,
                    inputTransactions,
                    outputTransactions,
                });
                returnData = {
                    success: !!proofData,
                    proofData,
                };
                break;
            }
            default:
        }
    }

    return returnData;
}
