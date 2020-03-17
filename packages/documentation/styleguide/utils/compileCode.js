// @flow
import { transform } from 'buble';
import transpileImports from './transpileImports';

const compile = (code, config) => transform(code, config).code;

const startsWithJsx = (code) => !!code.trim().match(/^</);

const wrapCodeInFragment = (code) => `<React.Fragment>${code}</React.Fragment>;`;

/*
 * 1. Wrap code in React Fragment if it starts with JSX element
 * 2. Transform import statements into require() calls
 * 3. Compile code using Buble
 */
export default function compileCode(code, compilerConfig, onError) {
    try {
        const wrappedCode = startsWithJsx(code) ? wrapCodeInFragment(code) : code;
        const compiledCode = compile(wrappedCode, { ...compilerConfig, transforms: { asyncAwait: false } });
        return transpileImports(compiledCode);
    } catch (err) {
        if (onError) {
            onError(err);
        }
    }
    return '';
}
