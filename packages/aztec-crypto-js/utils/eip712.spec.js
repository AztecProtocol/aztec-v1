const chai = require('chai');
const web3Utils = require('web3-utils');
const web3EthAbi = require('web3-eth-abi');

const { expect } = chai;

const eip712 = require('./eip712');


const { AZTEC_MAINNET_DOMAIN_PARAMS } = require('../params.js');

describe('eip712.js tests', () => {
    let simple;
    let complex;
    let exampleStruct;
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

        exampleStruct = {
            types: {
                Foo: [
                    { name: 'first', type: 'bytes32' },
                    { name: 'second', type: 'uint256' },
                    { name: 'third', type: 'address' },
                ],
                EIP712Domain: [
                    { name: 'name', type: 'string' },
                    { name: 'version', type: 'string' },
                    { name: 'chainId', type: 'uint256' },
                    { name: 'verifyingContract', type: 'address' },
                    { name: 'salt', type: 'bytes32' },
                ],
            },
            primaryType: 'Foo',
            message: {
                first: '0x13',
                second: 104344,
                third: '0x1234567890abcdef10121234567890abcdef1012',
            },
            domain: AZTEC_MAINNET_DOMAIN_PARAMS,
        };
    });

    it('encodeData will correctly encode a basic struct', () => {
        const encoded = eip712.encodeMessageData(simple.message, simple.types, simple.types[simple.primaryType]);
        // eslint-disable-next-line max-len
        expect(encoded).to.equal('0x130000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000197980000000000000000000000001234567890abcdef10121234567890abcdef1012');
    });

    it('encodeData will correctly encode a nested struct', () => {
        const encoded = eip712.encodeMessageData(complex.message, complex.types, complex.types[complex.primaryType]);
        // eslint-disable-next-line max-len
        const expected = '0xdcc66a3502c48266f81ee15b636a8ddc6406382ae4f6a1bcc51b23d271f110d200000000000000000000000000000000000000000000000000000000000003ef2329000000000000000000000000000000000000000000000000000000000000d716955403d21f5ddb28253df82b9345ef5dbefeb8e8fb349abf4c95e35cf1e9';
        expect(encoded).to.equal(expected);
    });

    it('encodeStruct will correctly encode a struct', () => {
        const encoded = eip712.encodeStruct(simple.primaryType, simple.types);
        expect(encoded).to.equal('Foo(first bytes32,second uint256,third address)');
    });

    it('encodeStruct will correctly order struct strings alphabetically', () => {
        const encodedAlphabetical = eip712.encodeStruct(alphabetical.primaryType, alphabetical.types);
        expect(encodedAlphabetical).to.equal('Top(zfoo ZZZ,aBar AAA)AAA(bar bytes32)ZZZ(foo uint)');
    });

    it('hashStruct correctly calculates the keccak256 hash of a struct', () => {
        const hashed = eip712.hashStruct(simple.primaryType, simple.types, simple.message);
        const typeData = 'Foo(first bytes32,second uint256,third address)';
        const typeHash = web3Utils.sha3(web3EthAbi.encodeParameters(['string'], [typeData.slice(2)]), 'hex');
        // eslint-disable-next-line max-len
        const encodedData = '0x130000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000197980000000000000000000000001234567890abcdef10121234567890abcdef1012';
        const expected = web3Utils.sha3(`${typeHash}${encodedData.slice(2)}`);
        expect(hashed).to.equal(expected);
    });

    it('encodeTypedData correctly calculates the encoding for a Struct', () => {
        const encoded = eip712.encodeTypedData(exampleStruct);
        expect(encoded.length === 64);
    });
});
