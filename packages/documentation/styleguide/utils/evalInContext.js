export default async (code) => {
  // eslint-disable-next-line no-new-func
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  const func = new AsyncFunction(code);
  try {
    return func();
  } catch (err) {
    console.log({ err });
  }
};
