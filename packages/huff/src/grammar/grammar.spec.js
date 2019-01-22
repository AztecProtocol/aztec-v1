const chai = require('chai');

const grammar = require('./grammar');

const { expect } = chai;

describe('grammar tests', () => {
    describe('top level tests', () => {
        it('can find template definition', () => {
            const template = `
            template <first, second,third >`;
            const source = `${template}
            #define macro TEST = takes(3) returns(2) {
                <first> <second>
                <third>
                mulmod
            }
            `;
            const result = source.match(grammar.topLevel.TEMPLATE);
            expect(result).to.deep.equal([`${template}`, 'first, second,third ']);
        });

        it('can find macro definition', () => {
            const macroBody = `
                <first> <second>
                <third>
                mulmod
            `;
            const macro = `
            #define macro TEST = takes(3) returns(2) {${macroBody}}`;
            let source = `
            template <first, second,third >${macro}
            `;
            const template = source.match(grammar.topLevel.TEMPLATE);
            source = source.slice(template.index + template[0].length);
            const result = source.match(grammar.topLevel.MACRO);
            expect(result).to.deep.equal([
                macro,
                'macro',
                'TEST',
                '3',
                '2',
                macroBody,
            ]);
        });

        it('can strip a line', () => {
            const source = `first second
            third
            fourth`;
            const result = source.match(RegExp('^.*')) || [];
            expect(result[0]).to.equal('first second');
        });

        it('can find include statement (double quotes)', () => {
            const source = ` 
            # include "foofahblah"`;
            const result = source.match(grammar.topLevel.IMPORT);
            expect(result[1]).to.equal('foofahblah');
        });

        it('can find include statement (single quotes)', () => {
            const source = ` 
            # include 'foofahblah'`;
            const result = source.match(grammar.topLevel.IMPORT);
            expect(result[1]).to.equal('foofahblah');
        });
    });

    describe('macro grammar tests', () => {
        it('can find a hex string', () => {
            const source = `
              0x14fe33ac hello
            world`;
            const result = source.match(grammar.macro.LITERAL_HEX);
            expect(result[1]).to.equal('14fe33ac');
        });

        it('can find a decimal string', () => {
            const source = `
              123456789 0x3a hello
            world`;
            const result = source.match(grammar.macro.LITERAL_DECIMAL);
            expect(result[1]).to.equal('123456789');
        });

        it('can find a jump label', () => {
            const source = `
                label_test: 0x1234 22
            foo`;
            const result = source.match(grammar.macro.JUMP_LABEL);
            expect(result[1]).to.equal('label_test');
        });

        it('can identify __codesize() pattern, calling a template', () => {
            const source = `
              __codesize(FOO_BAR<1,3,543>) foo bar
              xx`;
            const result = source.match(grammar.macro.CODE_SIZE);
            expect(result[1]).to.equal('FOO_BAR');
            expect(result[2]).to.equal('1,3,543');
        });

        it('can identify __codesize() pattern, without template', () => {
            const source = `
              __codesize(FOO_BAR) foo bar
              xx`;
            const result = source.match(grammar.macro.CODE_SIZE);
            expect(result[1]).to.equal('FOO_BAR');
            expect(result[2]).to.equal(undefined);
        });

        it('can identify template invocation', () => {
            const source = `
                    < abcde132 >
                xabcde`;
            const result = source.match(grammar.macro.TEMPLATE);
            expect(result[1]).to.equal('abcde132');
        });

        it('can identify a macro call with no templates', () => {
            const source = `
                FOO_CALL() awoer 23 
                ddds
            `;
            const result = source.match(grammar.macro.MACRO_CALL);
            expect(result[1]).to.equal('FOO_CALL');
            expect(result[2]).to.equal(undefined);
        });

        it('can identify a templated macro call', () => {
            const source = `
                FOO_CALL<a,b , defg>() awoer 23 
                ddds
            `;
            const result = source.match(grammar.macro.MACRO_CALL);
            expect(result[1]).to.equal('FOO_CALL');
            expect(result[2]).to.equal('a,b , defg');
        });

        it('will not think token without parentheses is a macro call', () => {
            const source = `
                FOO_CALL awoer 23 
                ddds
            `;
            const result = source.match(grammar.macro.MACRO_CALL);
            expect(result).to.equal(null);
        });

        it('can identify a generic token', () => {
            const source = `
                mulmod awoer 23 
                ddds
            `;
            const result = source.match(grammar.macro.TOKEN);
            expect(result[1]).to.equal('mulmod');
        });
    });
});
