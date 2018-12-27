const chai = require('chai');
const sinon = require('sinon');

const parseTopLevel = require('./parseTopLevel');
const inputMap = require('./inputMap');

const { expect } = chai;

describe('parser tests', () => {
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
            const { ops, jumpdests } = parseTopLevel.parseMacro(source, { FOO: 'FOO', BAR: 'BAR' });
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
            expect(jumpdests).to.deep.equal({
                start: true,
            });
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
    });
});
