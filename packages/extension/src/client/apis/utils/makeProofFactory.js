export default function makeProofFactory(proveMapping, proofResultMapping) {
    return async (type, options) => {
        const prove = proveMapping[type];
        const {
            proof,
            ...data
        } = await prove(options) || {};

        if (!proof) {
            return null;
        }

        return proofResultMapping[type]({
            proof,
            options,
            data,
        });
    };
}
