module.exports = (event) => {
    const {
        headers,
    } = event;
    return (headers || {}).Origin;
};
