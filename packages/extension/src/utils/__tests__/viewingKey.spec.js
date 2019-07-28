import { stub } from 'sinon';
import {
    VIEWING_KEY_LENGTH,
} from '~config/constants';
import viewingKey, {
    toString,
} from '../viewingKey';

describe('viewingKey', () => {
    let consoleStub;
    let warnings = [];

    beforeEach(() => {
        warnings = [];
        consoleStub = stub(console, 'warn');
        consoleStub.callsFake(message => warnings.push(message));
    });

    afterEach(() => {
        consoleStub.restore();
    });

    const vk = {
        ciphertext: '0xd2677343b63157ecbee589e87597480b4978bbf23ff38fccf53a66b7a5a7fe33c5fa434e1d35641589ff7834165d2e734ab9ae75a0165cf690675e709dfe09a99e93a7481243c6c3a5474ad7bbcd39e11701df8e0d917c674f3d70bad38168912b1b8ad5e1d2636195206f351c66d038b5ba878fce788033b6030924b771760c298feb29e7def6bd29269aa97e3224ab8968d1fa9a7509f2f1ecb806',
        ephemPublicKey: '0x0e3626dc3a5716079f3bb9d04f2bbcb5e20b8c5bcb06210a0209a5e884d3e061',
        nonce: '0x81ad7a0990dbd6ec70a8d93ce2920c29de2f1241d743acff',
    };

    it('convert a viewing key object to string and back to object', () => {
        const str = toString(vk);
        expect(str).toMatch(/^0x[0-9a-z]+$/i);
        expect(str.length).toBe(VIEWING_KEY_LENGTH + 2);

        const recovered = viewingKey(str);
        expect(recovered).toEqual(vk);
        expect(warnings.length).toBe(0);
    });

    it('return null if input string has wrong size', () => {
        const str = ''.padEnd('012', VIEWING_KEY_LENGTH - 10);
        const obj = viewingKey(str);
        expect(obj).toBe(null);
        expect(warnings.length).toBe(1);
    });

    it('return empty string if input object has wrong size', () => {
        const str = toString({
            ...vk,
            ephemPublicKey: `${vk.ephemPublicKey}0`,
        });
        expect(str).toBe('');
        expect(warnings.length).toBe(1);
    });
});
