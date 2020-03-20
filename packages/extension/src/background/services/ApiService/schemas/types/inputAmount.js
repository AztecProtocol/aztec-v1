import {
    MAX_NOTE_VALUE,
    MAX_NOTES_PER_TRANSACTION,
} from '~/config/settings';

export const maxAmount = MAX_NOTE_VALUE * MAX_NOTES_PER_TRANSACTION;

const defaultSize = {
    gte: 0,
    lte: maxAmount,
};

const inputAmountType = {
    type: 'number',
    size: defaultSize,
    error: (_, { val, path }) => {
        if (val < maxAmount
            && (val | 0) !== val // eslint-disable-line no-bitwise
        ) {
            return `Invalid value \`${val}\` of type 'float' supplied to '${path}', expected 'integer'.`;
        }
        return '';
    },
};

inputAmountType.isRequired = {
    ...inputAmountType,
    required: true,
};

inputAmountType.withSize = size => ({
    ...inputAmountType,
    size: {
        ...defaultSize,
        ...size,
    },
    isRequired: {
        ...inputAmountType,
        size: {
            ...defaultSize,
            ...size,
        },
        required: true,
    },
});

export default inputAmountType;
