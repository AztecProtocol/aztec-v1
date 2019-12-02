import BN from 'bn.js';

const bigNumberType = {
    type: (val) => {
        let bn;
        try {
            bn = new BN(val);
        } catch (e) {
            return false;
        }
        return !!bn;
    },
};

bigNumberType.isRequired = {
    ...bigNumberType,
    required: true,
};

bigNumberType.withSize = (size) => {
    const customSize = {};
    if (typeof size === 'number') {
        customSize.eq = val => new BN(val).eq(new BN(size));
    } else {
        Object.keys(size).forEach((operator) => {
            customSize[operator] = val => new BN(val)[operator](new BN(size[operator]));
        });
    }

    return {
        ...bigNumberType,
        size: customSize,
        isRequired: {
            ...bigNumberType,
            size: customSize,
            required: true,
        },
    };
};

export default bigNumberType;
