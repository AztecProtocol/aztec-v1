import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~/utils/filterStream';
import settings from '~/background/utils/settings';
import responseDataKeys from './responseDataKeys';
import JoinSplit from './JoinSplit';

const proofWithInputNotes = ['TRANSFER_PROOF'];

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
            case 'TRANSFER_PROOF': {
                const {
                    transactions,
                    numberOfOutputNotes: customNumberOfOutputNotes,
                } = args;
                const numberOfOutputNotes = customNumberOfOutputNotes !== undefined
                    ? customNumberOfOutputNotes
                    : await settings('NUMBER_OF_OUTPUT_NOTES');
                const inputAmount = proofWithInputNotes.indexOf(proofType) < 0
                    ? 0
                    : transactions.reduce((sum, { amount }) => sum + amount, 0);
                const proof = await JoinSplit({
                    ...args,
                    inputAmount,
                    numberOfOutputNotes,
                });
                returnData = {
                    success: !!proof,
                    amount: inputAmount,
                    proof,
                };
                break;
            }
            default:
        }
    }

    return {
        returnData,
    };
}
