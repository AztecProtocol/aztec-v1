import parseNoteAccessFromMetadata from '../addNote/utils/parseNoteAccessFromMetadata';
import parseAddressesFromMetadata from '../addNote/utils/parseAddressesFromMetadata';

describe('NoteAccess', () => {

    const metadata = '0xcfad040c84ba5f3b9c32a04a51c14199cf4f5e1f694e101d283ad2b43d731a6c0100000000000000000000000000000028000000000000000000000000000001a4000000000000000000000000000000003339c3c842732f4daacf12aed335661cf4eab66b8edd8f89c78fd5b6639752167954c525213934e1eefc852a71620a7aaa97df3f54d6a0e663c35cab48dd31219fd272eeac0acff05104b9c42ccd1cc230c5783a0c26dcafb61f2e72ca46be705461fc659dd2c2e8b9d0c1d4f286e39da03b4f0876fff2c2c379d026423ba648b50116218224650afd903daac7b223e57fbfa67faa572039c7e4f7bfe411e512f68431833c4b93162dd71d781e7694c6d94edfba13061032648bf35ef481a038b441b4084f630e60447f0a0a186484f5a7f002032758d3c18b5ae64738f24ff9ec0b65dbd983'

    it('should parse Addresses from event metadata', () => {
        // given 

        // action
        const result = parseAddressesFromMetadata(metadata);

        // expected
        console.log(`RES: ${JSON.stringify(result)}`);
    });

});