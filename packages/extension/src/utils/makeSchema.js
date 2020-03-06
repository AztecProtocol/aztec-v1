const isNotDefined = val => val === undefined || val === null;

const typeOf = (val) => {
    let type = typeof val;
    if (type === 'object' && Array.isArray(val)) {
        type = 'array';
    }
    return type;
};

const lengthOf = (val) => {
    switch (typeOf(val)) {
        case 'number':
            return `${val}`.length;
        default:
    }
    return val.length;
};

const sizeOf = (val) => {
    switch (typeOf(val)) {
        case 'number':
            return val;
        case 'string':
        case 'array':
            return val.length;
        default:
    }
    return val;
};

const typeValidators = {
    integer: val => typeOf(val) === 'number'
        && val === (val | 0), // eslint-disable-line no-bitwise
};

const validateType = (targetType, val, path, errorMsg) => {
    const typeConfig = Array.isArray(targetType) ? targetType : [targetType];
    const valType = typeOf(val);
    const isValid = typeConfig.some((type) => {
        if (typeof type === 'string') {
            const validator = typeValidators[type];
            if (validator) {
                return validator(val);
            }
            return valType === type;
        }
        let valid = false;
        if (typeof type === 'function') {
            try {
                valid = val instanceof type;
            } catch (e) {
                valid = false;
            }
            if (!valid) {
                try {
                    valid = type(val);
                } catch (e) {
                    valid = false;
                }
            }
        }
        return valid;
    });
    if (!isValid) {
        let expectedTypes = typeConfig
            .map(type => `${(typeOf(type) === 'function' && type.name) || `'${type}'`}`)
            .join(', ');
        if (typeConfig.length > 1) {
            expectedTypes = `one of [${expectedTypes}]`;
        }
        return (errorMsg && errorMsg('type', {
            val,
            valType,
            expectedTypes,
            path,
        })) || `Invalid value \`${val}\` of type '${valType}' supplied to '${path}', expected ${expectedTypes}.`;
    }
    return null;
};

const compMapping = {
    eq: {
        exec: (v1, v2) => v1 === v2,
        text: 'equal to',
    },
    gte: {
        exec: (v1, v2) => v1 >= v2,
        text: 'greater than or equal to',
    },
    gt: {
        exec: (v1, v2) => v1 > v2,
        text: 'greater than',
    },
    lte: {
        exec: (v1, v2) => v1 <= v2,
        text: 'less than or equal to',
    },
    lt: {
        exec: (v1, v2) => v1 < v2,
        text: 'less than',
    },
};

const validateValue = (name, size, val, valSize, path, errorMsg) => {
    let compVars = {};
    let customComp;
    if (typeOf(size) === 'number') {
        compVars.eq = size;
    } else if (size) {
        ({
            comp: customComp,
            ...compVars
        } = size);
    }

    let error;
    Object.keys(compVars)
        .some((operator) => {
            const targetValue = compVars[operator];
            const {
                exec,
                text,
            } = compMapping[operator] || {};
            let isValid;
            if (customComp) {
                isValid = exec(customComp(val, targetValue), 0);
            } else if (typeOf(targetValue) === 'function') {
                isValid = targetValue(val);
            } else if (exec) {
                isValid = exec(valSize, targetValue);
            }
            if (!isValid) {
                error = (errorMsg && errorMsg('value', {
                    val,
                    targetValue,
                    path,
                    name,
                    cmp: text,
                })) || `Invalid value \`${val}\` supplied to '${path}', expected ${name} to be ${text} ${targetValue}.`;
            }
            return error;
        });

    return error;
};

const validateRegExp = (pattern, val, path, errorMsg) => {
    if (!val.match(pattern)) {
        return (errorMsg && errorMsg('regexp', {
            val,
            path,
            pattern,
        })) || `Invalid value \`${val}\` supplied to '${path}', expected to match ${pattern}.`;
    }

    return null;
};

const validate = (config, val, path = '') => {
    let error = null;

    const {
        required,
        type,
        each,
        property,
        length,
        size,
        match,
        error: errorMsg,
    } = config;

    if (isNotDefined(val)) {
        if (required) {
            return `'${path}' is required.`;
        }
        return null;
    }

    if (!type || typeOf(type) === 'object') {
        error = validateType('object', val, path, errorMsg);
        if (!error) {
            const objVal = val || {};
            Object.keys(config).some((name) => {
                error = validate(config[name], objVal[name], path ? `${path}.${name}` : name);
                return error;
            });
        }
        return error;
    }

    error = validateType(type, val, path, errorMsg);
    if (error) {
        return error;
    }

    error = (!isNotDefined(length) && validateValue('length', length, val, lengthOf(val), path, errorMsg))
        || (!isNotDefined(size) && validateValue('size', size, val, sizeOf(val), path, errorMsg))
        || (!isNotDefined(match) && validateRegExp(match, val, path, errorMsg))
        || null;
    if (error) {
        return error;
    }

    if (type === 'object' && property) {
        error = validate(property, val, path);
    } else if (type === 'array' && each) {
        val.some((arrayVal, i) => {
            error = validate(each, arrayVal, `${path}.${i}`);
            return error;
        });
    }

    return error;
};

export default function makeSchema(config) {
    return {
        validate: args => validate(config, args),
    };
}
