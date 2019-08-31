export function stripLeadingZeros(str) {
  let newStr = str.startsWith('0x')
    ? str.slice(2)
    : str;
  let start = 0;
  
  for (; start < newStr.length; start += 1) {
    if (newStr.charAt(start) != '0') break;
  }

  return newStr.slice(start);
}
