/* eslint-disable no-restricted-syntax */
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const glob = promisify(require('glob'));
const mkdirp = promisify(require('mkdirp'));

const writeFile = promisify(fs.writeFile);

const compiler = require('../../compiler');

async function compile(config) {
    const projects = await glob('*', { cwd: config.projects_directory, follow: true });
    if (projects.length === 0) {
        throw new Error('Could not find any projects to compile! Is huff_projects set in "huff-config.json"?');
    }
    await mkdirp(config.build_directory);
    const files = projects.map((projectLocation) => {
        console.log('Compiling Huff Project', projectLocation);
        const { filename, filedata } = compiler(
            path.join(config.projects_directory, projectLocation),
            config.modules_directory
        );
        return writeFile(path.join(config.build_directory, filename), JSON.stringify(filedata));
    });
    await Promise.all(files);
}

module.exports = compile;
