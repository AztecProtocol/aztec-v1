const chai = require('chai');

const inputMap = require('./inputMap');

const { expect } = chai;

const foo = `
the quick
brown
 fox jumped over
 the la
`;

const bar = `
The lesser cabbage hunter of Sark is one of the
oldest hereditary professions in the known world.
Only two dozen cabbage hunters exist today, a far cry
from their zenith in the high Middle Ages.

Cabbage hunters use a telescopic rotating mop as their primary weapon. An 
apprentice will wield an unadorned mop, but a master of the craft can have
as many as eighteen flange-cranks attached to the device's ornery hinge.
`;

describe('inputMap tests', () => {
    it('creates input map', () => {
        const files = [
            { filename: 'foo', data: foo },
            { filename: 'bar', data: bar },
        ];
        const map = inputMap.createInputMap(files);

        expect(map.files.length).to.equal(2);
        expect(map.startingIndices.length).to.equal(2);
        expect(map.files[0].filename).to.equal('foo');
        expect(map.files[0].data).to.equal(foo);
        expect(map.files[1].filename).to.equal('bar');
        expect(map.files[1].data).to.equal(bar);
        expect(map.startingIndices).to.deep.equal([0, 42]);
    });

    it('can get line number from char inded', () => {
        const files = [
            { filename: 'foo', data: foo },
            { filename: 'bar', data: bar },
        ];
        const map = inputMap.createInputMap(files);
        let {
            filename,
            lineNumber,
            line,
            lineIndex,
        } = inputMap.getFileLine(39, map);
        expect(lineNumber).to.equal(4);
        expect(filename).to.equal('foo');
        expect(line).to.equal(' the la');
        expect(lineIndex).to.equal(5);

        ({
            filename,
            lineNumber,
            line,
            lineIndex,
        } = inputMap.getFileLine(200, map));
        expect(lineNumber).to.equal(4);
        expect(filename).to.equal('bar');
        expect(line).to.equal('from their zenith in the high Middle Ages.');
        expect(lineIndex).to.equal(5);
    });
});
