
module.exports = (event) => {
    return event.body ? JSON.parse(event.body) : {};
};
