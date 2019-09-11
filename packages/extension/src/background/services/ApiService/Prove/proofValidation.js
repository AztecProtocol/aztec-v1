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
        throw new Error('Proof Type is not defined');
    }
    console.log(data);
    const result = v.validate(data, proofSchemaMap[proofType]);
    console.log(result);

    if (!result.valid) {
        return result.errors;
    }

    return data;
};
