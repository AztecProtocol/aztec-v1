const chai = require('chai');
const sinon = require('sinon');
const BN = require('bn.js');
const path = require('path');
const fs = require('fs');

const parseTopLevel = require('./parseTopLevel');
const inputMap = require('./inputMap');
const { opcodes } = require('./opcodes');

const { expect } = chai;

const pathToTestData = path.posix.resolve(__dirname, './testData');

describe('parser tests', () => {
    describe('templates', () => {
        let getId;
        beforeEach(() => {
            getId = sinon.stub(parseTopLevel, 'getId').callsFake(() => {
                return 'stub';
            });
        });
        afterEach(() => {
            getId.restore();
        });
        // it('splitTemplateCalls will isolate recursive templates', () => {
        //     const source = 'foo<A+0x10,bar<baz>, bip>';
        //     expect(parseTopLevel.splitTemplateCalls(source)).to.deep.equal(
        //         {
        //             name: 'foo',
        //             params: [
        //                 { name: 'A+0x10', params: [] },
        //                 { name: 'bar', params: [{ name: 'baz', params: [] }] },
        //                 { name: 'bip', params: [{}] },
        //             ],
        //         }
        //     );
        // });

        it('processMacroLiteral will convert literals to BN form', () => {
            let source = '0x2234';
            expect(parseTopLevel.processMacroLiteral(source, {}).toString(16)).to.equal(new BN('2234', 16).toString(16));
            source = '356';
            expect(parseTopLevel.processMacroLiteral(source, {}).toString(16)).to.equal(new BN(356, 10).toString(16));

            const macros = {
                FOO: {
                    ops: [{ type: 'PUSH', value: '62', args: ['01e2a2'] }],
                },
            };
            source = 'FOO';
            expect(parseTopLevel.processMacroLiteral(source, macros).toString(16)).to.equal(new BN('1e2a2', 16).toString(16));
        });

        it('processTemplateLiteral will convert template literals to BN form', () => {
            const source = 'FOO+0x1234-222*BAR';
            const macros = {
                FOO: {
                    ops: [{ type: 'PUSH', value: '62', args: ['01e2a2'] }],
                },
                BAR: {
                    ops: [{ type: 'PUSH', value: '62', args: ['12345'] }],
                },
            };
            const result = parseTopLevel
                .normalize(new BN('1e2a2', 16).add(new BN('1234', 16).sub(new BN(222, 10).mul(new BN('12345', 16)))));
            expect(parseTopLevel.processTemplateLiteral(source, macros).toString(16)).to.equal(result.toString(16));
        });

        it('parseTemplate will convert template call into macro ops', () => {
            expect(parseTopLevel.parseTemplate('A', {})).to.equal(null);

            let result = parseTopLevel.parseTemplate('dup4', {});
            const keys = Object.keys(result);
            expect(keys.length).to.equal(1);
            expect(result[keys[0]]).to.deep.equal({
                name: 'dup4',
                ops: [{
                    type: 'OPCODE',
                    value: '83',
                    args: [],
                    index: 0,
                }],
            });
            const source = 'FOO+0x1234-222*BAR';
            const macros = {
                FOO: {
                    ops: [{ type: 'PUSH', value: '62', args: ['01e2a2'] }],
                },
                BAR: {
                    ops: [{ type: 'PUSH', value: '62', args: ['12345'] }],
                },
            };
            const numericResult = parseTopLevel
                .normalize(new BN('1e2a2', 16).add(new BN('1234', 16).sub(new BN(222, 10).mul(new BN('12345', 16)))));
            result = parseTopLevel.parseTemplate(source, macros, 0);
            expect(result['inline-FOO+0x1234-222*BAR-stub']).to.deep.equal({
                name: 'FOO+0x1234-222*BAR',
                ops: [{
                    type: 'PUSH',
                    value: '7f',
                    args: [numericResult.toString(16)],
                    index: 0,
                }],
            });
        });
    });

    describe('process macro', () => {
        it('can process a macro', () => {
            const foo = `
        start:
         dup4 mulmod
         0x1234 swap2 start jumpi`;
            /* const bar = 'dup2 mulmod';
            const source = `
                blah: dup2 mulmod FOO() 0x1234 add BAR()`; */
            const { ops: fooOps } = parseTopLevel.parseMacro(foo, {}, 0);
            const macros = {
                FOO: {
                    name: 'FOO',
                    ops: fooOps,
                    templateParams: [],
                },
            };
            const files = [
                { filename: 'FOO', data: foo },
            ];
            const map = inputMap.createInputMap(files);
            const output = parseTopLevel.processMacro('FOO', 0, [], macros, map);
            const expected = [
                opcodes.jumpdest,
                opcodes.dup4,
                opcodes.mulmod,
                opcodes.push2,
                '1234',
                opcodes.swap2,
                opcodes.push2,
                '0000',
                opcodes.jumpi,
            ].join('');
            expect(output.bytecode).to.equal(expected);
        });
    });

    describe('parse macro', () => {
        it('can parse basic macro', () => {
            const source = `
                start:
            dup4 mulmod
            FOO()
            <x> <abcd >
            BAR<0x20, 33>()
            <y+20>
        start
        __codesize(FOO) 0x1234aae 123554
            `;
            const { ops: fullOps } = parseTopLevel.parseMacro(source, { FOO: 'FOO', BAR: 'BAR' }, 0);
            const ops = fullOps.map((o) => {
                expect(typeof (o.index)).to.equal('number');
                return { args: o.args, type: o.type, value: o.value };
            });
            expect(ops.length).to.equal(12);
            expect(ops).to.deep.equal([
                {
                    type: 'JUMPDEST',
                    value: 'start',
                    args: [],
                },
                {
                    type: 'OPCODE',
                    value: '83',
                    args: [],
                },
                {
                    type: 'OPCODE',
                    value: '09',
                    args: [],
                },
                {
                    type: 'MACRO',
                    value: 'FOO',
                    args: [],
                },
                {
                    type: 'TEMPLATE',
                    value: 'x',
                    args: [],
                },
                {
                    type: 'TEMPLATE',
                    value: 'abcd',
                    args: [],
                },
                {
                    type: 'MACRO',
                    value: 'BAR',
                    args: ['0x20, 33'],
                },
                {
                    type: 'TEMPLATE',
                    value: 'y+20',
                    args: [],
                },
                {
                    type: 'PUSH_JUMP_LABEL',
                    value: 'start',
                    args: [],
                },
                {
                    type: 'CODESIZE',
                    value: 'FOO',
                    args: [],
                },
                {
                    type: 'PUSH',
                    value: '63',
                    args: ['01234aae'],
                },
                {
                    type: 'PUSH',
                    value: '62',
                    args: ['01e2a2'],
                },
            ]);
        });
    });

    describe('parse top level', () => {
        let parseMacro;
        beforeEach(() => {
            parseMacro = sinon.stub(parseTopLevel, 'parseMacro').callsFake((x) => {
                return x;
            });
        });
        afterEach(() => {
            parseMacro.restore();
        });
        it('parseTopLevel will currectly identify templates and macros', () => {
            const source = `

            #define FIRST = takes(0) returns(1) {
                0x20 dup1 swap1 add
            }

            template <p1, p2>
            #define SECOND = takes(0) returns(1) {
                <p1> <p2> add
            }
        `;

            const map = inputMap.createInputMap([{
                filename: 'test', data: source,
            }]);
            const macros = parseTopLevel.parseTopLevel(source, 0, map);
            expect(macros.length).to.equal(2);
            expect(macros[0].name).to.equal('FIRST');
            expect(macros[1].name).to.equal('SECOND');
        });

        it('removeComments will strip comments', () => {
            const source = `
                  foo bar // this is a comment.
                dup4 mulmod /* and here is another comment
                */ bah bah`;
            const result = parseTopLevel.removeComments(source);

            expect(result.length).to.equal(source.length);
            expect(result.indexOf('dup4')).to.equal(source.indexOf('dup4'));
            expect(result.indexOf('bah')).to.equal(source.indexOf('bah'));
        });

        it('can read input files', () => {
            const result = parseTopLevel.getFileContents('./test.huff', pathToTestData).raw;
            const foo = fs.readFileSync('./parser/testData/foo.huff', 'utf8');
            const test = fs.readFileSync('./parser/testData/test.huff', 'utf8');
            let expected = `${foo}${test}`;
            expected = expected.replace('#include "foo.huff"', '                   ');
            expect(result).to.equal(expected);
        });
    });

    describe('compile macros', () => {
        it.only('can compile macro', () => {
            const result = parseTopLevel.compileMacro('FIRST', './test.huff', pathToTestData);
            console.log(result.bytecode);
            console.log(result.sourcemap);
            expect(result.sourcemap.length).to.equal(result.bytecode.length / 2);
        });
    });
});
