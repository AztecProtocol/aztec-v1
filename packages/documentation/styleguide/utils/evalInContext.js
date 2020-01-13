export default async function evalInContext(code) {
  // eslint-disable-next-line no-new-func
  const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
  const func = new AsyncFunction(code);

  try {
    await func();
  } catch (err) {
    console.log({ err });
  }
}
