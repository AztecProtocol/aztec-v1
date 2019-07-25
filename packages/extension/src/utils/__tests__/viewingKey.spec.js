import viewingKey, {
    toString,
} from '../viewingKey';

describe('viewingKey', () => {
    it('convert a viewing key object to string and back to object', () => {
        const vk = {
            ciphertext: '0xd2677343b63157ecbee589e87597480b4978bbf23ff38fccf53a66b7a5a7fe33c5fa434e1d35641589ff7834165d2e734ab9ae75a0165cf690675e709dfe09a99e93a7481243c6c3a5474ad7bbcd39e11701df8e0d917c674f3d70bad38168912b1b8ad5e1d2636195206f351c66d038b5ba878fce788033b6030924b771760c298feb29e7def6bd29269aa97e3224ab8968d1fa9a7509f2f1ecb806',
            ephemPublicKey: '0x0e3626dc3a5716079f3bb9d04f2bbcb5e20b8c5bcb06210a0209a5e884d3e061',
            nonce: '0x81ad7a0990dbd6ec70a8d93ce2920c29de2f1241d743acff',
        };

        const str = toString(vk);
        expect(typeof str).toBe('string');
        expect(str.length).toBe(426);

        const recovered = viewingKey(str);
        expect(recovered).toEqual(vk);
    });
});
