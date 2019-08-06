const parseValue = (value) => {
    if (typeof value === 'string') {
        const int = parseInt(value, 10);
        if (`${int}` === value) {
            return int;
        }

        return value;
    }

    if (typeof value !== 'object') {
        return value;
    }

    if (typeof value.toNumber === 'function') {
        let num;
        try {
            num = value.toNumber();
        } catch (error) {
            num = value;
        }
        return num;
    }

    const values = Object.values(value).map(parseValue);

    if (Array.isArray(value)) {
        return values;
    }

    const valueMap = {};
    Object.keys(value).forEach((key, i) => {
        valueMap[key] = values[i];
    });

    return valueMap;
};

const parseEvents = events => events.map(({
    event: name,
    returnValues,
    ...rest
}) => {
    const argsList = [];
    const argsMapping = {};
    const len = Object.keys(returnValues).length / 2;
    Object.keys(returnValues).forEach((key, i) => {
        const value = parseValue(returnValues[key]);
        if (i < len) {
            argsList.push(value);
        } else {
            argsMapping[key] = value;
        }
    });

    return {
        ...rest,
        name,
        argsMapping,
        args: argsList,
    };
});

const isBytes = str => typeof str === 'string' && str.startsWith('0x');

const deepEqual = (data, expected, noExtraFields = false) => {
    const dataType = typeof data;
    const expectedType = typeof expected;
    if (!data
        || !expected
        || dataType !== 'object'
        || dataType !== expectedType
    ) {
        if (isBytes(data) && isBytes(expected)) {
            return data.toLowerCase() === expected.toLowerCase();
        }
        return data === expected;
    }

    if (noExtraFields
        && Object.keys(expected).length !== Object.keys(data).length
    ) {
        return false;
    }

    return Object.keys(expected)
        .every(key => deepEqual(data[key], expected[key]));
};

class Web3Event {
    constructor(events) {
        this.events = events;
        this.lastEvent = events[events.length - 1];
        const {
            args,
            argsMapping,
        } = this.lastEvent || {};
        this.args = args || [];
        this.argsMapping = argsMapping || {};
    }

    toHaveBeenCalled() {
        expect(this.events.length > 0).toBe(true);
        return this;
    }

    toHaveBeenCalledTimes(times) {
        expect(this.events.length).toBe(times);
        return this;
    }

    toHaveBeenCalledWith(expected) {
        if (!this.lastEvent) {
            expect(() => 'toHaveBeenCalledWith()').toThrow();
        } else if (!Array.isArray(expected)) {
            if (!deepEqual(this.argsMapping, expected)) {
                expect(this.argsMapping).toEqual(expected);
            }
        } else {
            const invalid = this.events.findIndex((event, i) => {
                const {
                    argsMapping,
                } = event || {};
                return !deepEqual(argsMapping, expected[i]);
            });

            if (invalid >= 0) {
                const {
                    argsMapping,
                } = this.events[invalid];
                expect(argsMapping).toEqual(expected[invalid]);
            }
        }

        return this;
    }

    hasBeenCalledExactlyWith(expected) {
        if (!this.lastEvent) {
            expect(() => 'hasBeenCalledExactlyWith()').toThrow();
        } else if (!deepEqual(this.argsMapping, expected, true)) {
            expect(expected).toEqual(this.argsMapping);
        }

        return this;
    }
}

class Web3Events {
    constructor(events) {
        this.observedEvents = parseEvents(events);
    }

    contain(eventName) {
        return this.observedEvents.some(e => e.name === eventName);
    }

    event(eventName) {
        const allMatches = this.observedEvents.filter(e => e.name === eventName);
        return new Web3Event(allMatches);
    }

    count() {
        return this.observedEvents.length;
    }
}

const web3Events = events => new Web3Events(events);

export default web3Events;
