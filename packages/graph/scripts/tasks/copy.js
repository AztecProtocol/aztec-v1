import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import graphNodeConfig from '../../config/graphNode';
import {
    safeReadFileSync,
    ensureDirectory,
    copyFolder,
} from '../utils/fs';
import {
    manifestPath,
    projectRoot,
    locateModule,
} from '../utils/path';
import {
    logEntries,
    successLog,
    errorLog,
} from '../utils/log';

const {
    manifest: manifestFilename,
} = graphNodeConfig;

const protocolModule = '@aztec/protocol';
const graphProtocolModule = '@graphprotocol';

const destBuildFolder = 'build';
const destAbisFolder = 'abis';
const destContractsFolder = 'contracts';

const srcContractsFolder = 'build/contracts';

const getManifestYaml = () => {
    let config = null;
    try {
        config = yaml.safeLoad(safeReadFileSync(manifestPath));
    } catch (error) {
        errorLog(error);
    }

    return config;
};

const retrieveAbis = dataSources =>
    dataSources.reduce((arr, cur) => [
        ...arr,
        ...((cur.mapping && cur.mapping.abis) || []),
        ...((cur.templates && retrieveAbis(cur.templates)) || []),
    ], []);

const retrieveAddresses = (dataSources) => {
    const addresses = [];
    dataSources.forEach((dataSource) => {
        const {
            name,
            source: {
                address,
            } = {},
        } = dataSource;
        if (!name) {
            errorLog('Source name is not defined.');
            return;
        }
        if (!address) {
            errorLog('Contract address is not defined');
            return;
        }
        addresses.push({
            name,
            address,
        });
    });

    return addresses;
};

const copyAbi = (contractName, srcFolderPath, destFilePath) =>
    new Promise((resolve, reject) => {
        let abi;
        const requirePath = `${srcFolderPath}/${contractName}.json`;
        try {
            const contract = require(requirePath); // eslint-disable-line
            ({ abi } = contract || {});
        } catch (error) {
            errorLog('Cannot require contract', `path: ${requirePath}`);
            reject();
        }
        if (!abi) {
            errorLog(`Abi is not defined in contract '${contractName}'`);
            reject();
            return;
        }

        fs.writeFile(destFilePath, JSON.stringify(abi), (error) => {
            if (error) {
                errorLog('Failed to create abi file', `${destFilePath}`, error);
            }
            resolve({
                src: requirePath,
                dest: destFilePath,
                error,
            });
        });
    });

const copyContractAddresses = (prevAddresses, srcFolderPath) =>
    new Promise((resolve) => {
        const originalConfig = safeReadFileSync(manifestPath);
        let newConfig = originalConfig;
        prevAddresses.forEach(({
            name,
            address,
        }) => {
            const contract = require(path.relative( // eslint-disable-line global-require
                __dirname,
                path.join(
                    srcFolderPath,
                    `${name}.json`,
                ),
            ));
            const {
                networks,
            } = contract || {};
            if (!networks) {
                errorLog(`No networks defined for contract ${name}`);
                return;
            }
            const networkConfigs = Object.values(networks);
            const {
                address: newAddress,
            } = networkConfigs[networkConfigs.length - 1] || {};
            if (!newAddress) {
                errorLog(`No address defined for contract ${name}`);
                return;
            }
            const pattern = new RegExp(`(address:)(\\s)+'(${address})'`);
            newConfig = newConfig.replace(pattern, `$1 '${newAddress}'`);
        });

        fs.writeFile(manifestPath, newConfig, (error) => {
            if (error) {
                errorLog(`Cannot white to file ${manifestFilename}`);
            }
            resolve({
                src: `Contract address${prevAddresses.length === 1 ? '' : 'es'}`,
                dest: manifestFilename,
                error,
            });
        });
    });

export default async function copy({
    onError,
    onClose,
} = {}) {
    const protocolPath = locateModule(protocolModule);

    if (!protocolPath) {
        errorLog(
            'Protocols folder not found',
            'Please run `yarn install` to get required node_modules.',
        );
        if (onError) {
            onError();
        }
        return;
    }

    const promises = [];

    const manifestYaml = getManifestYaml();
    const {
        dataSources,
    } = manifestYaml || {};
    if (!dataSources) {
        if (!manifestYaml) {
            errorLog(`Cannot find '${manifestFilename}'`);
        } else {
            errorLog(`There is no dataSources defined in ${manifestFilename}`);
        }
        if (onError) {
            onError();
        }
        return;
    }

    const srcContractsPath = path.join(protocolPath, srcContractsFolder);
    ensureDirectory(path.join(projectRoot, destBuildFolder));

    const addresses = retrieveAddresses(dataSources);
    if (addresses.length) {
        promises.push(copyContractAddresses(
            addresses,
            srcContractsPath,
        ));
    }

    const abis = retrieveAbis(dataSources);
    if (abis.length) {
        ensureDirectory(path.join(projectRoot, destBuildFolder, destAbisFolder));

        abis.forEach(({
            name,
            file,
        }) => {
            promises.push(copyAbi(
                name,
                srcContractsPath,
                file,
            ));
        });
    }

    promises.push(copyFolder(
        srcContractsPath,
        path.join(projectRoot, destBuildFolder, destContractsFolder),
    ));

    /*
     * graph-cli (v) doesn't work with yarn workspaces
     * So we need to manually copy the packages to current project's node_modules folder.
     */
    const graphProtocolPath = locateModule(graphProtocolModule);
    const targetGraphProtocolPath = path.join(projectRoot, 'node_modules', graphProtocolModule);
    if (graphProtocolPath
        && (graphProtocolPath !== targetGraphProtocolPath)
    ) {
        promises.push(copyFolder(
            graphProtocolPath,
            targetGraphProtocolPath,
        ));
    }

    const result = await Promise.all(promises);
    const copiedMessages = [];
    let successCopies = 0;
    result.forEach(({
        error,
        src,
        dest,
    }) => {
        if (error) {
            copiedMessages.push(`${chalk.red('✖')} ${src} ➔  ${dest}`);
        } else {
            successCopies += 1;
            copiedMessages.push(`  ${src} ➔  ${dest}`);
        }
    });

    logEntries(copiedMessages);
    successLog(`${successCopies} files/folders copied.`);

    if (onClose) {
        onClose();
    }
}
