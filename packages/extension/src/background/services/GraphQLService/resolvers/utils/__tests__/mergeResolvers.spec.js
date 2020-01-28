import mergeResolvers from '../mergeResolvers';

describe('mergeResolvers', () => {
    const queryA1 = 'QA1';
    const queryA2 = 'QA2';
    const queryA3 = 'QA3';
    const mutateA1 = 'MA1';
    const queryB1 = 'QB1';
    const queryB2 = 'QB2';
    const mutateB1 = 'MB1';

    it('take two resolvers and return a merged object', () => {
        const resolverA = {
            note: {
                value: queryA3,
            },
            Query: {
                query1: queryA1,
                query2: queryA2,
            },
            Mutation: {
                mutate1: mutateA1,
            },
        };

        const resolverB = {
            foo: {
                value: queryB2,
            },
            Query: {
                query3: queryB1,
            },
            Mutation: {
                mutate2: mutateB1,
            },
        };

        expect(mergeResolvers(resolverA, resolverB)).toEqual({
            note: {
                value: queryA3,
            },
            foo: {
                value: queryB2,
            },
            Query: {
                query1: queryA1,
                query2: queryA2,
                query3: queryB1,
            },
            Mutation: {
                mutate1: mutateA1,
                mutate2: mutateB1,
            },
        });
    });

    it('allow empty Query or Mutation', () => {
        const resolverA = {
            Query: {
                query1: queryA1,
            },
        };

        const resolverB = {
            Mutation: {
                mutate1: mutateB1,
            },
        };

        expect(mergeResolvers(resolverA, resolverB)).toEqual({
            Query: {
                query1: queryA1,
            },
            Mutation: {
                mutate1: mutateB1,
            },
        });
    });

    it('override previous value with same key', () => {
        const resolverA = {
            foo: {
                two: queryA2,
                bar: queryA3,
            },
            Query: {
                query1: queryA1,
                query2: queryA2,
            },
        };

        const resolverB = {
            foo: {
                one: queryB1,
                bar: queryB2,
            },
            Query: {
                query2: queryB1,
            },
            Mutation: {
                mutate1: mutateB1,
            },
        };

        expect(mergeResolvers(resolverA, resolverB)).toEqual({
            foo: {
                two: queryA2,
                bar: queryB2,
                one: queryB1,
            },
            Query: {
                query1: queryA1,
                query2: queryB1,
            },
            Mutation: {
                mutate1: mutateB1,
            },
        });
    });
});
