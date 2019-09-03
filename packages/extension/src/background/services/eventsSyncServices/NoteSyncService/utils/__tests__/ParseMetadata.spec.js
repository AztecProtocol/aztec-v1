import parseNoteAccessFromMetadata from '../addNote/utils/parseNoteAccessFromMetadata';
import parseAddressesFromMetadata from '../addNote/utils/parseAddressesFromMetadata';

describe('NoteAccess', () => {

    const metadata = '0x028c4205e9f77ef6671a365e0d7370c0003941d6061430aa8ddb3e19666f65111eb9b85d289ea6ba661f8e314086cf7ad65a6fc76ceae26a729f37d9cf615236cfbc44da5a07c3d7a88a9875494235658bcdb07d34661a994666862908c8a59e0100000000000000000000000000000028000000000000000000000000000001a400000000000000000000000000000000c10f5a756aa05931279a7a0756f2eaf46a5a4dfc704d8caadda5f30766fa5d044262e0cffa56316547c232fb090a4a2b06cf9f151795f78b9f6322dfa7d9814d86af6f60498d5b70a306b281c9b5ebda607e2965782006c81475c4d01eb123118b6a96b3f74c329ca2b05b546b7224bc6c732633a44ffec694a589006bf97f189225f571e2c325548caef2aacaddb10827a3bc9a8c0edb6dc83ad4cdcc2894a6755cc43c709e041e059c12dbcc3696d4407d26ac40e50ec5247db21a2b2a948547eba5ad874c28be53026f59ed413b24090a03e70012748cbe98856efab9b6acbd3b5d63d267'

    it('should parse Addresses from event metadata', () => {
        // given 

        // action
        const result = parseAddressesFromMetadata(metadata);

        // expected
        console.log(`RES: ${JSON.stringify(result)}`);
    });

});