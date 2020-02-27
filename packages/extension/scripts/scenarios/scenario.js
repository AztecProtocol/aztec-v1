export default class Scenario {
    steps = [];

    shells = [];

    name = '';

    constructor(name, steps) {
        this.name = name;
        this.steps = steps;
    }

    async cleanup() {
        this.shells.forEach(s => s.kill());
    }

    async run() {
        await this.steps.reduce((p, fn) => p
            .then(fn)
            .then((shell) => {
                this.shells.push(shell);
            }), Promise.resolve());

        await this.cleanup();
    }
}
