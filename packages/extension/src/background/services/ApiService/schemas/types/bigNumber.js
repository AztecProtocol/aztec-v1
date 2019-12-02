import BN from 'bn.js';

const zero = new BN(0);

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
    let customSize = {};
    if (typeof size !== 'object') {
        customSize.eq = `${size}`;
    } else {
        customSize = {
            ...size,
        };
    }
    customSize.comp = (val, target) => {
        const diff = new BN(val).sub(new BN(target));
        if (diff.eq(zero)) {
            return 0;
        }
        return diff.gt(zero) ? 1 : -1;
    };

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
