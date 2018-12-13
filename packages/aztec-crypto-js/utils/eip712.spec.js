const chai = require('chai');
const web3Utils = require('web3-utils');
const abi = require('ethereumjs-abi');
const ethUtil = require('ethereumjs-util');

const { expect } = chai;

const eip712 = require('./eip712');

describe('eip712.js tests', () => {
    let simple;
    let complex;
    let alphabetical;
    before(() => {
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
                first: '0x13',
                second: 104344,
                third: '0x1234567890abcdef10121234567890abcdef1012',
            },
        };

        alphabetical = {
            types: {
                ZZZ: [{ name: 'foo', type: 'uint' }],
                AAA: [{ name: 'bar', type: 'bytes32' }],
                Top: [
                    { name: 'zfoo', type: 'ZZZ' },
                    { name: 'aBar', type: 'AAA' },
                ],
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

        complex = {
            types: {
                Inner: [
                    { name: 'quibbleRating', type: 'bytes32' },
                    { name: 'flimflamHeirarchy', type: 'uint[4]' },
                ],
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
                    quibbleRating: '0x2329',
                    flimflamHeirarchy: [
                        100,
                        813,
                        '21888242871839275222246405745257275088696311157297823662689037894645226208583',
                        7,
                    ],
                },
            },
        };
    });

    it('encodeData will correctly encode a basic struct', () => {
        const encoded = eip712.encodeMessageData(simple.types, simple.primaryType, simple.message);
        // eslint-disable-next-line max-len
        expect(encoded).to.equal('3aa81b362119d90fa0c62bc9627b5aa3913f2821cd4dbbb7fed0b834f269320f130000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000197980000000000000000000000001234567890abcdef10121234567890abcdef1012');
    });

    it('encodeData will correctly encode a nested struct', () => {
        const encoded = eip712.encodeMessageData(complex.types, complex.primaryType, complex.message);
        // eslint-disable-next-line max-len
        const expected = 'f505260b29d1bf974a79d4f92bebd39e552fc31c4df25dc2b3e98a25d49ed602679512f8772affce32ccd374be5d0c367b7b304b6dbd787d40ca15c00903403300000000000000000000000000000000000000000000000000000000000003ef78ed341ebf9be7a0a46427169757b760f4620b5b3030af1efb8e210a8a22e78b';
        expect(encoded).to.equal(expected);
    });

    it('encodeStruct will correctly encode a struct', () => {
        const encoded = eip712.encodeStruct(simple.primaryType, simple.types);
        expect(encoded).to.equal('Foo(bytes32 first,uint256 second,address third)');
    });

    it('encodeStruct will correctly order struct strings alphabetically', () => {
        const encodedAlphabetical = eip712.encodeStruct(alphabetical.primaryType, alphabetical.types);
        expect(encodedAlphabetical).to.equal('Top(ZZZ zfoo,AAA aBar)AAA(bytes32 bar)ZZZ(uint foo)');
    });

    it('hashStruct correctly calculates the keccak256 hash of a struct', () => {
        const hashed = web3Utils.sha3(`0x${eip712.encodeMessageData(simple.types, simple.primaryType, simple.message)}`);
        const typeData = 'Foo(bytes32 first,uint256 second,address third)';
        const typedHash = web3Utils.sha3(typeData);
        // eslint-disable-next-line max-len
        const encodedData = '0x130000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000197980000000000000000000000001234567890abcdef10121234567890abcdef1012';
        const expected = web3Utils.sha3(`${typedHash}${encodedData.slice(2)}`);
        expect(hashed).to.equal(expected);
    });
});

describe('comparison with reference implementation', () => {
    const typedData = {
        types: {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
            ],
            Person: [
                { name: 'name', type: 'string' },
                { name: 'wallet', type: 'address' },
            ],
            Mail: [
                { name: 'from', type: 'Person' },
                { name: 'to', type: 'Person' },
                { name: 'contents', type: 'string' },
            ],
        },
        primaryType: 'Mail',
        domain: {
            name: 'Ether Mail',
            version: '1',
            chainId: 1,
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
    const { types } = typedData;

    // Recursively finds all the dependencies of a type
    function dependencies(primaryType, found = []) {
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
            for (const dep of dependencies(field.type, found)) {
                if (!found.includes(dep)) {
                    found.push(dep);
                }
            }
        }
        return found;
    }

    function encodeType(primaryType) {
        // Get dependencies primary first, then alphabetical
        let deps = dependencies(primaryType);
        deps = deps.filter(t => t !== primaryType);
        deps = [primaryType].concat(deps.sort());

        // Format as a string with fields
        let result = '';
        // eslint-disable-next-line no-restricted-syntax
        for (const depType of deps) {
            result += `${depType}(${types[depType].map(({ name, type }) => `${type} ${name}`).join(',')})`;
        }
        return result;
    }

    function typeHash(primaryType) {
        return ethUtil.keccak256(encodeType(primaryType));
    }

    function encodeData(primaryType, data) {
        const encTypes = [];
        const encValues = [];

        // Add typehash
        encTypes.push('bytes32');
        encValues.push(typeHash(primaryType));
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
                value = ethUtil.keccak256(encodeData(field.type, value));
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

    function structHash(primaryType, data) {
        return ethUtil.keccak256(encodeData(primaryType, data));
    }

    function signHash() {
        return ethUtil.keccak256(
            Buffer.concat([
                Buffer.from('1901', 'hex'),
                structHash('EIP712Domain', typedData.domain),
                structHash(typedData.primaryType, typedData.message),
            ])
        );
    }

    const privateKey = ethUtil.keccak256('cow');
    const address = ethUtil.privateToAddress(privateKey);
    const sig = ethUtil.ecsign(signHash(), privateKey);
    it('basic tests', () => {
        expect(encodeType('Mail')).to.equal('Mail(Person from,Person to,string contents)Person(string name,address wallet)');
        expect(ethUtil.bufferToHex(typeHash('Mail'))).to.equal(
            '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2'
        );
        expect(ethUtil.bufferToHex(encodeData(typedData.primaryType, typedData.message))).to.equal(
            // eslint-disable-next-line max-len
            '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2fc71e5fa27ff56c350aa531bc129ebdf613b772b6604664f5d8dbe21b85eb0c8cd54f074a4af31b4411ff6a60c9719dbd559c221c8ac3492d9d872b041d703d1b5aadf3154a261abdd9086fc627b61efca26ae5702701d05cd2305f7c52a2fc8'
        );
        expect(ethUtil.bufferToHex(structHash(typedData.primaryType, typedData.message))).to.equal(
            '0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e'
        );
        expect(ethUtil.bufferToHex(structHash('EIP712Domain', typedData.domain))).to.equal(
            '0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f'
        );
        expect(ethUtil.bufferToHex(signHash())).to.equal('0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2');
        expect(ethUtil.bufferToHex(address)).to.equal('0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826');
        expect(sig.v).to.equal(28);
        expect(ethUtil.bufferToHex(sig.r)).to.equal('0x4355c47d63924e8a72e509b65029052eb6c299d53a04e167c5775fd466751c9d');
        expect(ethUtil.bufferToHex(sig.s)).to.equal('0x07299936d304c153f6443dfa05f40ff007d72911b6f72307f996231605b91562');
    });

    it('reference implementation and eip712 resolve to the same struct encoding', () => {
        const result = eip712.encodeStruct(typedData.primaryType, typedData.types);
        const expected = encodeType('Mail');

        expect(result).to.equal(expected.toString('hex'));
    });

    it('reference implementation and eip712 resolve to same encoded message data', () => {
        const result = eip712.encodeMessageData(typedData.types, typedData.primaryType, typedData.message);
        const expected = ethUtil.bufferToHex(encodeData(typedData.primaryType, typedData.message));
        expect(`0x${result}`).to.equal(expected);
    });

    it('reference implementation and eip712 resolve to same encoded domain data', () => {
        const result = eip712.encodeMessageData(typedData.types, 'EIP712Domain', typedData.domain);
        const expected = ethUtil.bufferToHex(encodeData('EIP712Domain', typedData.domain));
        expect(`0x${result}`).to.equal(expected);
    });

    it('reference implementation and eip712 resolve to same final message', () => {
        const result = eip712.encodeTypedData(typedData);
        const expected = ethUtil.bufferToHex(signHash());
        expect(result).to.equal(expected);
    });
});
