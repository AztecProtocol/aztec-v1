import path from 'path';
import chalk from 'chalk';
import {
    ensureDirectory,
    copyFolder,
    copyFile,
    isFile,
} from '../utils/fs';
import {
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


const targetPackages = [
    'protocol',
    'extension',
];

const graphProtocolModule = '@graphprotocol';

const destBuildFolder = 'build';
const destContractsFolder = 'contracts';

const extensionContractsFolder = 'build/contracts';
const extensionBackgroundContractsFolder = 'src/background/contracts';

const srcContractsFolder = 'build/contracts';


const retrieveAbis = dataSources =>
    dataSources.reduce((arr, cur) => [
        ...arr,
        ...((cur.mapping && cur.mapping.abis) || []),
        ...((cur.templates && retrieveAbis(cur.templates)) || []),
    ], []);


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

    ensureDirectory(path.join(projectRoot, destBuildFolder));

    const srcContractsPaths = packagePaths
        .map(p => path.join(p, srcContractsFolder));


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
