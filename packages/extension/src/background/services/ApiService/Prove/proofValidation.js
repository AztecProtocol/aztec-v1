import { Validator } from 'jsonschema';
import sendProofSchema from './sendProofSchema';
import depositProofSchema from './depositProofSchema';
import withdrawProofSchema from './withdrawProofSchema';
import {
    schema as fetchNotesFromBalanceSchema,
} from './fetchNotesFromBalance';

const v = new Validator();

const proofSchemaMap = {
    DEPOSIT_PROOF: depositProofSchema,
    WITHDRAW_PROOF: withdrawProofSchema,
    TRANSFER_PROOF: sendProofSchema,
    MINT_PROOF: sendProofSchema,
    FETCH_NOTES_FROM_BALANCE: fetchNotesFromBalanceSchema,
};

export default (proofType, data) => {
    if (!proofType || !proofSchemaMap[proofType]) {
        return new Error('Proof Type is not defined');
    }
    const result = v.validate(data, proofSchemaMap[proofType]);

    if (!result.valid) {
        return new Error(result.errors);
    }

    return data;
};
