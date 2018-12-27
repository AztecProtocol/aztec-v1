const chai = require('chai');

const regex = require('./regex');

const { expect } = chai;

describe('regex tests', () => {
    it('sliceCommans returns comma-delineated array', () => {
        const source = ' a,ba, c ,d';
        const result = regex.sliceCommas(source);
        expect(result).to.deep.equal(['a', 'ba', 'c', 'd']);
    });

    it('endOfData will return true if file has no data', () => {
        const source = `
        
            
          
             
        `;
        const result = regex.endOfData(source);
        expect(result).to.equal(true);
    });
    it('endOfData will return false if file has data', () => {
        const source = `
        
            
          a
             
        `;
        const result = regex.endOfData(source);
        expect(result).to.equal(false);
    });
    it('getToken will get a space separated token', () => {
        const source = `  dup4 
        dup5`;
        const result = regex.getToken(source);
        expect(result.token).to.equal('dup4');
    });
});
