export default function replaceVarInCode(code, variableName, value) {
  const pattern = new RegExp(`${variableName} = '(0x)?[^']{0,}'`, 'ig');
  return code.replace(pattern, `${variableName} = '${value}'`);
}
