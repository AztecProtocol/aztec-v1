const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');

const config = require('../../config');

function init() {
    mkdirp.sync(config.modules_directory);
    mkdirp.sync(config.projects_directory);
    mkdirp.sync(config.test_directory);
    const configPath = path.join(config.cwd, 'huff-config.json');
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, '{}', 'utf8');
    }
    console.log('created empty project. Have fun!');
}

module.exports = init;
