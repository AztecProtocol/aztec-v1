const chai = require('chai');

const grammar = require('./grammar');

const { expect } = chai;

describe('grammar tests', () => {
    describe('top level tests', () => {
        it('can find template definition', () => {
            const templateParameters = 'first, second,third ';
            const template = `template <${templateParameters}>`;
            const source = `${template}
            #define macro TEST = takes(3) returns(2) {
                <first> <second>
                <third>
                mulmod
            }
            `;
            const result = source.match(grammar.topLevel.TEMPLATE);
            expect(result).to.deep.equal([template, templateParameters]);
        });

        it('can find macro definition', () => {
            const macroBody = `
                <first> <second>
                <third>
                mulmod
            `;
            const macroName = 'TEST';
            const takes = '3';
            const returns = '2';
            const macro = `#define macro ${macroName} = takes(${takes}) returns(${returns}) {${macroBody}}`;
            let source = `template <first, second,third >${macro}`;
            const template = source.match(grammar.topLevel.TEMPLATE);
            source = source.slice(template.index + template[0].length);
            const result = source.match(grammar.topLevel.MACRO);
            expect(result).to.deep.equal([
                macro,
                macro.slice(0, macro.indexOf('\n')),
                'macro',
                macroName,
                takes,
                returns,
                macroBody,
            ]);
        });

        it('can strip a line', () => {
            const firstLine = 'first second';
            const source = `${firstLine}
            third
            fourth`;
            const result = (source.match(RegExp('^.*')) || [])[0];
            expect(result).to.equal(firstLine);
        });

        it('can find include statement (double quotes)', () => {
            const filenameOfIncludedFile = 'includedFile.huff';
            const source = `# include "${filenameOfIncludedFile}"`;
            const result = source.match(grammar.topLevel.IMPORT)[2];
            expect(result).to.equal(filenameOfIncludedFile);
        });

        it('can find include statement (single quotes)', () => {
            const filenameOfIncludedFile = 'includedFile.huff';
            const source = `# include '${filenameOfIncludedFile}'`;
            const result = source.match(grammar.topLevel.IMPORT)[2];
            expect(result).to.equal(filenameOfIncludedFile);
        });
    });

    describe('macro grammar tests', () => {
        it('can find a hex string', () => {
            const hexValue = '14fe33ac';
            const source = `0x${hexValue} hello
            world`;
            const result = source.match(grammar.macro.LITERAL_HEX)[1];
            expect(result).to.equal(hexValue);
        });

        it('can find a decimal string', () => {
            const decValue = '123456789';
            const source = `${decValue} 0x3a hello
            world`;
            const result = source.match(grammar.macro.LITERAL_DECIMAL)[1];
            expect(result).to.equal(decValue);
        });

        it('can find a jump label', () => {
            const label = 'label_test';
            const source = `${label}: 0x1234 22
            foo`;
            const result = source.match(grammar.macro.JUMP_LABEL)[1];
            expect(result).to.equal(label);
        });

        it('can identify __codesize() pattern, calling a template', () => {
            const macroName = 'FOO_BAR';
            const templateParameters = '1,3,543';
            const source = `__codesize(${macroName}<${templateParameters}>) foo bar
              xx`;
            const result = source.match(grammar.macro.CODE_SIZE);
            const resultMacroName = result[1];
            const resultTemplateParameters = result[2];
            expect(resultMacroName).to.equal(macroName);
            expect(resultTemplateParameters).to.equal(templateParameters);
        });

        it('can identify __codesize() pattern, without template', () => {
            const macroName = 'FOO_BAR';
            const source = `__codesize(${macroName}) foo bar
              xx`;
            const result = source.match(grammar.macro.CODE_SIZE);
            const resultMacroName = result[1];
            expect(resultMacroName).to.equal(macroName);
            expect(result[2]).to.equal(undefined);
        });

        it('can identify template invocation', () => {
            const templateName = 'abcde132';
            const source = `< ${templateName} >
                xabcde`;
            const result = source.match(grammar.macro.TEMPLATE)[1];
            expect(result).to.equal(templateName);
        });

        it('can identify a macro call with no templates', () => {
            const macroName = 'FOO_CALL';
            const source = `${macroName}() awoer 23 
                ddds
            `;
            const result = source.match(grammar.macro.MACRO_CALL);
            const resultMacroName = result[1];
            expect(resultMacroName).to.equal(macroName);
            expect(result[2]).to.equal(undefined);
        });

        it('can identify a templated macro call', () => {
            const macroName = 'FOO_CALL';
            const templateParameters = 'a,b , defg';
            const source = `${macroName}<${templateParameters}>() awoer 23 
                ddds
            `;
            const result = source.match(grammar.macro.MACRO_CALL);
            const resultMacroName = result[1];
            const resultTemplateParameters = result[2];
            expect(resultMacroName).to.equal(macroName);
            expect(resultTemplateParameters).to.equal(templateParameters);
        });

        it('will not think token without parentheses is a macro call', () => {
            const source = `FOO_CALL awoer 23 
                ddds
            `;
            const result = source.match(grammar.macro.MACRO_CALL);
            expect(result).to.equal(null);
        });

        it('can identify a generic token', () => {
            const genericOpcode = 'mulmod';
            const source = `${genericOpcode} awoer 23 
                ddds
            `;
            const result = source.match(grammar.macro.TOKEN)[1];
            expect(result).to.equal(genericOpcode);
        });
    });
});
