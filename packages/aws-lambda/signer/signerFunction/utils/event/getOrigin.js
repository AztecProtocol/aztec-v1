module.exports = (event) => {
    const { headers } = event;
    const h = headers || {};

    return h.Origin || h.origin;
};
