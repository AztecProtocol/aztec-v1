import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import graphNodeConfig from '../../config/graphNode';
import {
    safeReadFileSync,
    ensureDirectory,
    copyFolder,
    copyFile,
    isFile,
} from '../utils/fs';
import {
    manifestPath,
    projectRoot,
    locateModule,
    locatePackage,
} from '../utils/path';
import {
    logEntries,
    successLog,
    errorLog,
    log,
} from '../utils/log';
import {
    AZTECAccountRegistryConfig,
    ACEConfig,
    IZkAssetConfig,
} from '../config/contracts';

const {
    manifest: manifestFilename,
} = graphNodeConfig;

const targetPackages = [
    'protocol',
    'extension',
];

const graphProtocolModule = '@graphprotocol';

const destBuildFolder = 'build';
const destAbisFolder = 'abis';
const destContractsFolder = 'contracts';

const extensionContractsFolder = 'build/protocol';
const extensionBackgroundContractsFolder = 'src/background/contracts';

const srcContractsFolder = 'build/contracts';

const getManifestYaml = () => {
    let config = null;
    try {
        config = yaml.safeLoad(safeReadFileSync(manifestPath));
    } catch (error) {
        errorLog(`Failed to load ${manifestFilename}.`, error.message);
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

const extractNetworks = (contractPath) => {
    const contract = require(path.relative( // eslint-disable-line
        __dirname,
        contractPath,
    ));
    const {
        networks,
    } = contract || {};

    return networks
}

const copyAbi = (contractName, srcContractsPaths, destFilePath) =>
    new Promise((resolve, reject) => {
        let abi;
        const requirePath = srcContractsPaths
            .map(p => path.join(p, `${contractName}.json`))
            .find(isFile);
        if (!requirePath) {
            errorLog(`Cannot find contract '${contractName}'.`);
            reject();
            return;
        }
        try {
            const contract = require(requirePath); // eslint-disable-line
            ({ abi } = contract || {});
        } catch (error) {
            errorLog('Cannot require contract', `path: ${requirePath}`);
            reject();
            return;
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

const copyContractAddresses = (prevAddresses, srcFolderPaths) =>
    new Promise((resolve) => {
        const originalConfig = safeReadFileSync(manifestPath);
        let newConfig = originalConfig;
        prevAddresses.forEach(({
            name,
            address,
        }) => {
            const srcFilePath = srcFolderPaths
                .map(p => path.join(p, `${name}.json`))
                .find(isFile);   
            const networks = extractNetworks(srcFilePath);
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
    const packagePathsMap = {};
    targetPackages.forEach((name) => {
        packagePathsMap[name] = locatePackage(name);
    });
    const packagePaths = Object.values(packagePathsMap);

    if (packagePaths.some(p => !p)) {
        packagePaths.forEach((p, i) => {
            if (!p) {
                errorLog(`Package '${targetPackages[i]}' not found'`);
            }
        });
        log('Please run `yarn install` to get required node_modules.');
        if (onError) {
            onError();
        }
        return;
    }

    const promises = [];

    const manifestYaml = getManifestYaml();
    if (!manifestYaml) {
        if (onError) {
            onError();
        }
        return;
    }
    const {
        dataSources,
    } = manifestYaml;
    if (!dataSources) {
        errorLog(`There is no dataSources defined in ${manifestFilename}`);
        if (onError) {
            onError();
        }
        return;
    }

    ensureDirectory(path.join(projectRoot, destBuildFolder));

    const srcContractsPaths = packagePaths
        .map(p => path.join(p, srcContractsFolder));

    const addresses = retrieveAddresses(dataSources);
    if (addresses.length) {
        promises.push(copyContractAddresses(
            addresses,
            srcContractsPaths,
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
                srcContractsPaths,
                file,
            ));
        });
    }

    srcContractsPaths.forEach((srcContractsPath) => {
        promises.push(copyFolder(
            srcContractsPath,
            path.join(projectRoot, destBuildFolder, destContractsFolder),
        ));
    });
    promises.push(copyFolder(
        path.join(packagePathsMap.protocol, srcContractsFolder),
        path.join(packagePathsMap.extension, extensionContractsFolder),
    ));

    /*
    * Copy Contracts into background folder for syncing events
    */
    ensureDirectory(path.join(packagePathsMap.extension, extensionBackgroundContractsFolder));
    [AZTECAccountRegistryConfig, ACEConfig, IZkAssetConfig]
            .map(c => c.name)
            .map(contractName => ({
                contractName,
                sourcPath: srcContractsPaths
                    .map(p => path.join(p, `${contractName}.json`))
                    .filter(isFile)
                    .find(p => !!extractNetworks(p))
            }))
            .forEach(({contractName, sourcPath}) => 
                promises.push(
                    copyFile(
                        sourcPath,
                        path.join(packagePathsMap.extension, extensionBackgroundContractsFolder, `${contractName}.json`),
                    )
                )
            )

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
