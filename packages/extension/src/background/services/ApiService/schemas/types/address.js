const addressType = {
    type: 'string',
    match: /^0x[0-9a-f]{40}$/i,
};

addressType.isRequired = {
    ...addressType,
    required: true,
};

export default addressType;
