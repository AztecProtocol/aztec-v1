const { expect } = require('chai');
const abi = require('ethereumjs-abi');
const ethUtil = require('ethereumjs-util');
const { TypedDataUtils } = require('eth-sig-util');
const { padLeft, padRight, randomHex, sha3 } = require('web3-utils');

const signer = require('../src');

describe('Signer', () => {
    let alphabetical;
    let arrayData;
    let complex;
    let dynamicData;
    let simple;

    before(() => {
        alphabetical = {
            types: {
                ZZZ: [{ name: 'foo', type: 'uint' }],
                AAA: [{ name: 'bar', type: 'bytes32' }],
                Top: [{ name: 'zfoo', type: 'ZZZ' }, { name: 'aBar', type: 'AAA' }],
            },
            primaryType: 'Top',
            message: {
                zFoo: {
                    foo: 'Balthazar Lewis IV Von Dudley',
                },
                aBar: {
                    bar: '0x12345678',
                },
            },
        };

        arrayData = {
            types: {
                Foo: [{ name: 'bytes32Array', type: 'bytes32[]' }, { name: 'boolArray', type: 'bool[]' }],
            },
            primaryType: 'Foo',
            message: {
                bytes32Array: [padRight('0xe43', 64), padRight('0xa3d2', 64)],
                boolArray: [true, true],
            },
        };

        complex = {
            types: {
                Inner: [{ name: 'quibbleRating', type: 'bytes32' }, { name: 'flimflamHierarchy', type: 'uint[4]' }],
                Outer: [
                    { name: 'marbleCredentials', type: 'Inner' },
                    { name: 'eloRating', type: 'uint256' },
                    { name: 'name', type: 'string' },
                ],
            },
            primaryType: 'Outer',
            message: {
                name: 'Reginald Fitzgerald De Vienne III',
                eloRating: '1007',
                marbleCredentials: {
                    quibbleRating: padLeft('0x2329', 64),
                    flimflamHierarchy: [
                        100,
                        813,
                        '21888242871839275222246405745257275088696311157297823662689037894645226208583',
                        7,
                    ],
                },
            },
        };

        dynamicData = {
            types: {
                Bar: [{ name: 'dynamicBytes', type: 'bytes' }, { name: 'dynamicString', type: 'string' }],
            },
            primaryType: 'Bar',
            message: {
                dynamicBytes: randomHex(20),
                dynamicString: 'testing',
            },
        };

        simple = {
            types: {
                Foo: [
                    { name: 'first', type: 'bytes32' },
                    { name: 'second', type: 'uint256' },
                    { name: 'third', type: 'address' },
                ],
            },
            primaryType: 'Foo',
            message: {
                first: padLeft('0x13', 64),
                second: 104344,
                third: '0x1234567890abcdef10121234567890abcdef1012',
            },
        };
    });

    it('should encode a basic struct', () => {
        /* eslint-disable max-len */
        const encoded = signer.encodeMessageData(simple.types, simple.primaryType, simple.message);
        expect(encoded).to.equal(
            '3aa81b362119d90fa0c62bc9627b5aa3913f2821cd4dbbb7fed0b834f269320f000000000000000000000000000000000000000000000000000000000000001300000000000000000000000000000000000000000000000000000000000197980000000000000000000000001234567890abcdef10121234567890abcdef1012',
        );
    });

    it('should match MetaMask encoding of a basic struct', () => {
        const encoded = signer.encodeMessageData(simple.types, simple.primaryType, simple.message);
        const metaMaskEncoded = TypedDataUtils.encodeData(simple.primaryType, simple.message, simple.types);
        expect(encoded).to.equal(metaMaskEncoded.toString('hex'));
    });

    it('should encode a nested struct', () => {
        /* eslint-disable max-len */
        const encoded = signer.encodeMessageData(complex.types, complex.primaryType, complex.message);
        const expected =
            '99fba8a7eab6e8407a7acee7f898be72d4589e0fd271036ed30e6ae36286ae9c3b79092acab3d97cb4866d99f6920e64033b2c7165e46855ec2bd998daaf25bc00000000000000000000000000000000000000000000000000000000000003ef78ed341ebf9be7a0a46427169757b760f4620b5b3030af1efb8e210a8a22e78b';
        expect(encoded).to.equal(expected);
    });

    it('should match MetaMask encoding of a nested struct', () => {
        const encoded = signer.encodeMessageData(complex.types, complex.primaryType, complex.message);
        const metaMaskEncoded = TypedDataUtils.encodeData(complex.primaryType, complex.message, complex.types);
        expect(encoded).to.equal(metaMaskEncoded.toString('hex'));
    });

    it('should match MetaMask encoding of a struct containing bytes32 arrays', () => {
        const encoded = signer.encodeMessageData(arrayData.types, arrayData.primaryType, arrayData.message);
        const metaMaskEncoded = TypedDataUtils.encodeData(arrayData.primaryType, arrayData.message, arrayData.types);
        expect(encoded).to.equal(metaMaskEncoded.toString('hex'));
    });

    it('should match MetaMask encoding of a struct containing bool arrays', () => {
        const encoded = signer.encodeMessageData(arrayData.types, arrayData.primaryType, arrayData.message);
        const metaMaskEncoded = TypedDataUtils.encodeData(arrayData.primaryType, arrayData.message, arrayData.types);
        expect(encoded).to.equal(metaMaskEncoded.toString('hex'));
    });

    it('should encode a struct', () => {
        const encoded = signer.encodeStruct(simple.primaryType, simple.types);
        expect(encoded).to.equal('Foo(bytes32 first,uint256 second,address third)');
    });

    it('should order struct strings alphabetically', () => {
        const encodedAlphabetical = signer.encodeStruct(alphabetical.primaryType, alphabetical.types);
        expect(encodedAlphabetical).to.equal('Top(ZZZ zfoo,AAA aBar)AAA(bytes32 bar)ZZZ(uint foo)');
    });

    it('should match MetaMask encoding of dynamic data', () => {
        const encoded = signer.encodeMessageData(dynamicData.types, dynamicData.primaryType, dynamicData.message);
        const metaMaskEncoded = TypedDataUtils.encodeData(dynamicData.primaryType, dynamicData.message, dynamicData.types);
        expect(encoded).to.equal(metaMaskEncoded.toString('hex'));
    });

    it('should calculate the keccak256 hash of a struct', () => {
        /* eslint-disable max-len */
        const hashed = sha3(`0x${signer.encodeMessageData(simple.types, simple.primaryType, simple.message)}`);
        const typeData = 'Foo(bytes32 first,uint256 second,address third)';
        const typedHash = sha3(typeData);
        const encodedData =
            '0x000000000000000000000000000000000000000000000000000000000000001300000000000000000000000000000000000000000000000000000000000197980000000000000000000000001234567890abcdef10121234567890abcdef1012';
        const expected = sha3(`${typedHash}${encodedData.slice(2)}`);
        expect(hashed).to.equal(expected);
    });
});

// @see https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js
describe('Reference Implementation', () => {
    const typedData = {
        types: {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'verifyingContract', type: 'address' },
            ],
            Person: [{ name: 'name', type: 'string' }, { name: 'wallet', type: 'address' }],
            Mail: [{ name: 'from', type: 'Person' }, { name: 'to', type: 'Person' }, { name: 'contents', type: 'string' }],
        },
        primaryType: 'Mail',
        domain: {
            name: 'Ether Mail',
            version: '1',
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        message: {
            from: {
                name: 'Cow',
                wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            },
            to: {
                name: 'Bob',
                wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
            },
            contents: 'Hello, Bob!',
        },
    };

    const recursiveTypedData = {
        types: {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'verifyingContract', type: 'address' },
            ],
            Mail: [{ name: 'from', type: 'Person' }, { name: 'to', type: 'Person' }, { name: 'contents', type: 'string' }],
            Squirrel: [
                { name: 'name', type: 'string' },
                { name: 'topSpeed', type: 'uint256' },
                { name: 'literacyRating', type: 'uint256' },
            ],
            Person: [
                { name: 'name', type: 'string' },
                { name: 'wallet', type: 'address' },
                { name: 'familiar', type: 'Squirrel' },
            ],
        },
        primaryType: 'Mail',
        domain: {
            name: 'Ether Mail',
            version: '1',
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        message: {
            from: {
                name: 'Cow',
                wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
                familiar: {
                    name: 'Cindy',
                    topSpeed: 8999,
                    literacyRating: 94,
                },
            },
            to: {
                name: 'Bob',
                wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                familiar: {
                    name: 'Harold',
                    topSpeed: 9045,
                    literacyRating: 0,
                },
            },
            contents: 'Hello, Bob!',
        },
    };

    // Recursively finds all the dependencies of a type
    function dependencies(types, primaryType, _found = []) {
        const found = [..._found];
        if (found.includes(primaryType)) {
            return found;
        }
        if (types[primaryType] === undefined) {
            return found;
        }
        found.push(primaryType);
        // eslint-disable-next-line no-restricted-syntax
        for (const field of types[primaryType]) {
            // eslint-disable-next-line no-restricted-syntax
            for (const dep of dependencies(types, field.type, found)) {
                if (!found.includes(dep)) {
                    found.push(dep);
                }
            }
        }
        return found;
    }

    function encodeType(types, primaryType) {
        // Get dependencies primary first, then alphabetical
        let deps = dependencies(types, primaryType);
        deps = deps.filter((t) => t !== primaryType);
        deps = [primaryType].concat(deps.sort());

        // Format as a string with fields
        let result = '';
        // eslint-disable-next-line no-restricted-syntax
        for (const depType of deps) {
            result += `${depType}(${types[depType].map(({ name, type }) => `${type} ${name}`).join(',')})`;
        }
        return result;
    }

    function typeHash(types, primaryType) {
        return ethUtil.keccak256(encodeType(types, primaryType));
    }

    function encodeData(types, primaryType, data) {
        const encTypes = [];
        const encValues = [];

        // Add typehash
        encTypes.push('bytes32');
        encValues.push(typeHash(types, primaryType));

        // Add field contents
        // eslint-disable-next-line no-restricted-syntax
        for (const field of types[primaryType]) {
            let value = data[field.name];
            if (field.type === 'string' || field.type === 'bytes') {
                encTypes.push('bytes32');
                value = ethUtil.keccak256(value);
                encValues.push(value);
            } else if (types[field.type] !== undefined) {
                encTypes.push('bytes32');
                value = ethUtil.keccak256(encodeData(types, field.type, value));
                encValues.push(value);
            } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
                throw new Error('TODO: Arrays currently unimplemented in encodeData');
            } else {
                encTypes.push(field.type);
                encValues.push(value);
            }
        }
        return abi.rawEncode(encTypes, encValues);
    }

    function structHash(types, primaryType, data) {
        return ethUtil.keccak256(encodeData(types, primaryType, data));
    }

    function signHash(data) {
        return ethUtil.keccak256(
            Buffer.concat([
                Buffer.from('1901', 'hex'),
                structHash(data.types, 'EIP712Domain', data.domain),
                structHash(data.types, data.primaryType, data.message),
            ]),
        );
    }

    const privateKey = ethUtil.keccak256('cow');
    const address = ethUtil.privateToAddress(privateKey);
    const sig = ethUtil.ecsign(signHash(typedData), privateKey);
    it('should pass basic tests', () => {
        expect(encodeType(typedData.types, 'Mail')).to.equal(
            'Mail(Person from,Person to,string contents)Person(string name,address wallet)',
        );
        expect(ethUtil.bufferToHex(typeHash(typedData.types, 'Mail'))).to.equal(
            '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2',
        );
        expect(ethUtil.bufferToHex(encodeData(typedData.types, typedData.primaryType, typedData.message))).to.equal(
            // eslint-disable-next-line max-len
            '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2fc71e5fa27ff56c350aa531bc129ebdf613b772b6604664f5d8dbe21b85eb0c8cd54f074a4af31b4411ff6a60c9719dbd559c221c8ac3492d9d872b041d703d1b5aadf3154a261abdd9086fc627b61efca26ae5702701d05cd2305f7c52a2fc8',
        );
        expect(ethUtil.bufferToHex(structHash(typedData.types, typedData.primaryType, typedData.message))).to.equal(
            '0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e',
        );
        expect(ethUtil.bufferToHex(structHash(typedData.types, 'EIP712Domain', typedData.domain))).to.equal(
            '0x90ff64e3f1b37929070019d005a22cc7fff531b757333b8792f107ced731a142',
        );
        expect(ethUtil.bufferToHex(signHash(typedData))).to.equal(
            '0x9a2eab5155649cdf23c22c5472515affd1e0f5412d48998a2b3beb461fcfac11',
        );
        expect(ethUtil.bufferToHex(address)).to.equal('0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826');
        expect(sig.v).to.equal(27);
        expect(ethUtil.bufferToHex(sig.r)).to.equal('0x5a7f92e9266e41696943dd7b9b0c5fe001241a9c519ac7a8050c9c5487c8e6ce');
        expect(ethUtil.bufferToHex(sig.s)).to.equal('0x4a1f3928d31059a69b0682f0c8c3942139117bdabe72876ebfeae844632ccdec');
    });

    it('should fail if given arrays', () => {
        const types = {
            Test: [{ name: 'from', type: 'uint256[4]' }],
        };

        try {
            encodeData(types, 'Test', { from: [1, 2, 3, 4] });
        } catch (e) {
            expect(e.message).to.equal('TODO: Arrays currently unimplemented in encodeData');
        }
    });

    describe('Reference Implementation and EIP712', async () => {
        it('should resolve to the same struct encoding', () => {
            const result = signer.encodeStruct(typedData.primaryType, typedData.types);
            const expected = encodeType(typedData.types, 'Mail');

            expect(result).to.equal(expected.toString('hex'));
        });

        it('should resolve to same encoded message data', () => {
            const result = signer.encodeMessageData(typedData.types, typedData.primaryType, typedData.message);
            const expected = ethUtil.bufferToHex(encodeData(typedData.types, typedData.primaryType, typedData.message));
            expect(`0x${result}`).to.equal(expected);
        });

        it('should resolve to same encoded domain data', () => {
            const result = signer.encodeMessageData(typedData.types, 'EIP712Domain', typedData.domain);
            const expected = ethUtil.bufferToHex(encodeData(typedData.types, 'EIP712Domain', typedData.domain));
            expect(`0x${result}`).to.equal(expected);
        });

        it('should resolve to same final message', () => {
            const result = signer.encodeTypedData(typedData);
            const expected = ethUtil.bufferToHex(signHash(typedData));
            expect(result).to.equal(expected);
        });

        it('should resolve to same final message for second set of typed data', () => {
            const result = signer.encodeTypedData(recursiveTypedData);
            const expected = ethUtil.bufferToHex(signHash(recursiveTypedData));
            expect(result).to.equal(expected);
        });
    });
});
