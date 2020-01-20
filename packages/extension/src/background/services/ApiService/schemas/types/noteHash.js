const noteHashType = {
    type: 'string',
    match: /^0x[0-9a-f]{64}$/i,
};

noteHashType.isRequired = {
    ...noteHashType,
    required: true,
};

export default noteHashType;
