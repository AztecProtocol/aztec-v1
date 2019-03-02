const fs = require('fs');
const path = require('path');

const DEFAULTS = {
    BUILD: path.join('build', 'huff_contracts'),
    MODULES: 'huff_modules',
    PROJECTS: 'huff_projects',
    TEST: 'huff_test',
};

function getConfig() {
    const cwd = process.cwd();
    const configPath = path.join(process.cwd(), 'huff-config.json');
    const configExists = fs.existsSync(configPath);
    let configRemainder = {};
    const pathData = {};
    if (configExists) {
        const configContents = JSON.parse(fs.readFileSync(configPath));
        ({
            build_directory: pathData.buildDirectory,
            modules_directory: pathData.modulesDirectory,
            projects_directory: pathData.projectsDirectory,
            testDirectory: pathData.testDirectory,
            ...configRemainder
        } = configContents);
    }
    return {
        cwd,
        build_directory: path.join(cwd, pathData.buildDirectory || DEFAULTS.BUILD),
        modules_directory: path.join(cwd, pathData.modulesDirectory || DEFAULTS.MODULES),
        projects_directory: path.join(cwd, pathData.projectsDirectory || DEFAULTS.PROJECTS),
        test_directory: path.join(cwd, pathData.testDirectory || DEFAULTS.TEST),
        ...configRemainder,
    };
}

module.exports = getConfig();
