const args = index => process.argv[index + 3];

const argv = (name) => {
    const params = process.argv.slice(3);
    if (name === undefined) {
        return params;
    }

    const pattern = new RegExp(`^(--)?${name}=?(.{0,})$`);
    const foundArgs = params.find(val => val.match(pattern));
    if (!foundArgs) {
        return null;
    }

    const [,, value] = foundArgs.match(pattern);
    return value || true;
};

export {
    args,
    argv,
};
