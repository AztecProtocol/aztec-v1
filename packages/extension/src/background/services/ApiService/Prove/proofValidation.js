import { Validator, validate } from 'jsonschema';
import sendProofSchema from './sendProofSchema';
import depositProofSchema from './depositProofSchema';


const v = new Validator();


const proofSchemaMap = {
    DEPOSIT_PROOF: depositProofSchema,
    SEND_PROOF: sendProofSchema,
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
