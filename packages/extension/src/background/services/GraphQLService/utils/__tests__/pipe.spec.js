import {
    unknownError,
} from '~/utils/error';
import errorResponse from '../errorResponse';
import pipe from '../pipe';

describe('pipe', () => {
    let parent = {};
    let args = {};
    let ctx = {};
    let info = {};

    const triggerPipe = fns => pipe(fns)(
        parent,
        args,
        ctx,
        info,
    );

    beforeEach(() => {
        parent = {};
        args = {};
        ctx = {};
        info = {};
    });

    it("take graphQL's arguments and concat each functions' result in ctx", async () => {
        const getType = jest.fn(() => ({
            type: 'electric',
        }));
        const getName = jest.fn(() => ({
            name: 'pikachu',
        }));
        const getContext = jest.fn(($0, $1, $2) => $2);

        const originalCtx = ctx;
        const pokemon = await triggerPipe([
            getType,
            getName,
            getContext,
        ]);
        expect(pokemon).toEqual({
            type: 'electric',
            name: 'pikachu',
        });

        expect(getType).toHaveBeenCalledTimes(1);
        expect(getType.mock.calls[0][0]).toBe(parent);
        expect(getType.mock.calls[0][1]).toBe(args);
        expect(getType.mock.calls[0][2]).toBe(ctx);
        expect(getType.mock.calls[0][3]).toBe(info);

        expect(getName).toHaveBeenCalledTimes(1);
        expect(getName.mock.calls[0][0]).toBe(parent);
        expect(getName.mock.calls[0][1]).toBe(args);
        expect(getName.mock.calls[0][2]).toEqual({
            type: 'electric',
        });
        expect(getName.mock.calls[0][3]).toBe(info);

        expect(getContext).toHaveBeenCalledTimes(1);
        expect(getContext.mock.calls[0][0]).toBe(parent);
        expect(getContext.mock.calls[0][1]).toBe(args);
        expect(getContext.mock.calls[0][2]).toEqual({
            type: 'electric',
            name: 'pikachu',
        });
        expect(getContext.mock.calls[0][3]).toBe(info);

        expect(ctx).toBe(originalCtx);
    });

    it('can pipe async functions', async () => {
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        const getType = jest.fn().mockImplementation(async () => {
            await sleep(100);
            return {
                type: 'electric',
            };
        });
        const getName = jest.fn(() => ({
            name: 'pikachu',
        }));
        const getContext = jest.fn(($0, $1, $2) => $2);

        const pokemon = await triggerPipe([
            getType,
            getName,
            getContext,
        ]);
        expect(pokemon).toEqual({
            type: 'electric',
            name: 'pikachu',
        });
    });

    it('overwrite previous context data with same key', async () => {
        const getType = jest.fn(() => ({
            type: 'electric',
        }));
        const getName = jest.fn(() => ({
            type: 'electric+',
            name: 'pikachu',
        }));
        const getContext = jest.fn(($0, $1, $2) => $2);

        const pokemon = await triggerPipe([
            getType,
            getName,
            getContext,
        ]);
        expect(pokemon).toEqual({
            type: 'electric+',
            name: 'pikachu',
        });
    });

    it('stop piping and return an errorResponse when catching an error', async () => {
        const getType = jest.fn().mockImplementation(() => {
            throw new Error('wrong input');
        });
        const getName = jest.fn(() => ({
            name: 'pikachu',
        }));
        const response = await triggerPipe([
            getType,
            getName,
        ]);

        const expectedError = unknownError('wrong input', new Error('wrong input'));
        expect(response).toEqual(errorResponse(expectedError));

        expect(getType).toHaveBeenCalledTimes(1);
        expect(getName).not.toHaveBeenCalled();
    });

    it('stop piping if receive a result that has error in it', async () => {
        const getType = jest.fn(() => ({
            error: {
                message: 'you shall not pass',
            },
        }));
        const getName = jest.fn(() => ({
            name: 'pikachu',
        }));

        const response = await triggerPipe([
            getType,
            getName,
        ]);
        expect(response).toEqual(errorResponse({
            error: {
                message: 'you shall not pass',
            },
        }));

        expect(getType).toHaveBeenCalledTimes(1);
        expect(getName).not.toHaveBeenCalled();
    });
});
