const chai = require('chai');

const { expect } = chai;

describe.only('regex tests', () => {
    it('wnaf dynamic word replace', () => {
        const source = 'a+0x20,d';
        const target = 'd';
        const replacement = 'e';
        const pattern = `\\b(${target})\\b`;
        const regex = new RegExp(pattern);
        const result = source.replace(regex, replacement);
        expect(result).to.equal('a+0x20,e');
    });

    it('template word replace', () => {
        const labels = ['dog', 'cat', 'chicken'];
        const values = ['alice', 'bob', 'charles'];
        const source = 'dog+chicken,cat,dog';
        const result = labels.reduce((acc, label, i) => {
            const pattern = new RegExp(`\\b(${label})\\b`, 'g');
            return acc.replace(pattern, values[i]);
        }, source);
        expect(result).to.equal('alice+charles,bob,alice');
    });
});
