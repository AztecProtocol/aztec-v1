const chai = require('chai');
const sinon = require('sinon');
const BN = require('bn.js');
const path = require('path');
const fs = require('fs');

const utils = require('./utils');
const parser = require('./parser');
const inputMap = require('./inputMap/inputMap');
const { opcodes } = require('./opcodes/opcodes');

const { expect } = chai;

const pathToTestData = path.posix.resolve(__dirname, '../testData');

describe('parser tests', () => {
    describe('templates', () => {
        let getId;
        beforeEach(() => {
            getId = sinon.stub(parser, 'getId').callsFake(() => {
                return 'stub';
            });
        });
        afterEach(() => {
            getId.restore();
        });

        it('processMacroLiteral converts literals to BN form', () => {
            let source = '0x2234';
            expect(parser.processMacroLiteral(source, {}).toString(16)).to.equal(new BN('2234', 16).toString(16));
            source = '356';
            expect(parser.processMacroLiteral(source, {}).toString(16)).to.equal(new BN(356, 10).toString(16));

            const macros = {
                FOO: {
                    ops: [{ type: 'PUSH', value: '62', args: ['01e2a2'] }],
                },
            };
            source = 'FOO';
            expect(parser.processMacroLiteral(source, macros).toString(16)).to.equal(new BN('1e2a2', 16).toString(16));
        });

        it('processTemplateLiteral converts template literals to BN form', () => {
            const source = 'FOO+0x1234-222*BAR';
            const macros = {
                FOO: {
                    ops: [{ type: 'PUSH', value: '62', args: ['01e2a2'] }],
                },
                BAR: {
                    ops: [{ type: 'PUSH', value: '62', args: ['12345'] }],
                },
            };
            const result = utils
                .normalize(new BN('1e2a2', 16).add(new BN('1234', 16).sub(new BN(222, 10).mul(new BN('12345', 16)))));
            expect(parser.processTemplateLiteral(source, macros).toString(16)).to.equal(result.toString(16));
        });

        it('parseTemplate converts template call into macro ops', () => {
            let result = parser.parseTemplate('dup4', {});
            const keys = Object.keys(result.macros);
            expect(keys.length).to.equal(1);
            expect(result.macros[keys[0]]).to.deep.equal({
                name: 'dup4',
                ops: [{
                    type: 'OPCODE',
                    value: '83',
                    args: [],
                    index: 0,
                }],
                templateParams: [],
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
            const numericResult = utils
                .normalize(new BN('1e2a2', 16).add(new BN('1234', 16).sub(new BN(222, 10).mul(new BN('12345', 16)))));
            result = parser.parseTemplate(source, macros, 0);
            expect(result.macros['inline-FOO+0x1234-222*BAR-stub']).to.deep.equal({
                name: 'inline-FOO+0x1234-222*BAR-stub',
                ops: [{
                    type: 'PUSH',
                    value: '7f',
                    args: [numericResult.toString(16)],
                    index: 0,
                }],
                templateParams: [],
            });
        });
    });

    describe('process macro', () => {
        it('can process a macro', () => {
            const foo = `
        start:
         dup4 mulmod
         0x1234 swap2 start jumpi`;
            const ops = parser.parseMacro(foo, {}, 0);
            const macros = {
                FOO: {
                    name: 'FOO',
                    ops,
                    templateParams: [],
                },
            };
            const files = [
                { filename: 'FOO', data: foo },
            ];
            const map = inputMap.createInputMap(files);
            const output = parser.processMacro('FOO', 0, [], macros, map);
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
            expect(output.data.bytecode).to.equal(expected);
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
            const fullOps = parser.parseMacro(source, { FOO: 'FOO', BAR: 'BAR' }, 0);
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
            parseMacro = sinon.stub(parser, 'parseMacro').callsFake((x) => {
                return x;
            });
        });
        afterEach(() => {
            parseMacro.restore();
        });
        it('parser correctly identifies templates and macros', () => {
            const source = `

            #define macro FIRST = takes(0) returns(1) {
                0x20 dup1 swap1 add
            }

            template <p1, p2>
            #define macro SECOND = takes(0) returns(1) {
                <p1> <p2> add
            }
        `;

            const map = inputMap.createInputMap([{
                filename: 'test', data: source,
            }]);
            const { macros } = parser.parseTopLevel(source, 0, map);
            const keys = Object.keys(macros);
            expect(keys.length).to.equal(2);
            expect(keys[0]).to.equal('FIRST');
            expect(keys[1]).to.equal('SECOND');
        });

        it('removeComments strips comments', () => {
            const source = `
                  foo bar // this is a comment.
                dup4 mulmod /* and here is another comment
                */ bah bah`;
            const result = parser.removeComments(source);

            expect(result.length).to.equal(source.length);
            expect(result.indexOf('dup4')).to.equal(source.indexOf('dup4'));
            expect(result.indexOf('bah')).to.equal(source.indexOf('bah'));
        });

        it('can read input files', () => {
            const result = parser.getFileContents('./test.huff', pathToTestData).raw;
            const foo = fs.readFileSync(path.posix.resolve(pathToTestData, 'foo.huff'), 'utf8');
            const test = fs.readFileSync(path.posix.resolve(pathToTestData, 'test.huff'), 'utf8');
            let expected = `${foo}${test}`;
            expected = expected.replace('#include "foo.huff"', '                   ');
            expect(result).to.equal(expected);
        });
    });

    describe('compile macros', () => {
        it('can compile macro', () => {
            const result = parser.compileMacro('FIRST', './test.huff', pathToTestData);
            expect(result.sourcemap.length).to.equal(result.bytecode.length / 2);
        });

        it('correctly compiles the frozen version of the MAIN_TWO_ENDO_MOD macro', () => {
            const result = parser.compileMacro('MAIN_TWO_ENDO_MOD', './main_loop.huff', pathToTestData);
            const expected = fs.readFileSync(path.posix.resolve(pathToTestData, 'compiled.txt'), 'utf8');
            expect(result.bytecode).to.equal(expected);
        });


        it('can process codesize macro', () => {
            const source = `
            template <p, q>
            #define macro FOO = takes(0) returns (4) {
                dup4 0x1234aae <p> <q> swap5
            }
            
            #define macro BAR = takes(0) returns (1) {
                __codesize(FOO<1,2>)
            }`;

            const { bytecode } = parser.compileMacro('BAR', source, '');
            expect(bytecode).to.equal('600b');
        });
    });
});
