const { CoverageSubprovider } = require('@0x/sol-coverage');
const { TruffleArtifactAdapter } = require('@0x/sol-coverage');
const path = require('path');
const ProviderEngine = require('web3-provider-engine');

const projectRoot = path.join(__dirname, '..');
const solcVersion = '0.5.4';
const artifactsAdapter = new TruffleArtifactAdapter(projectRoot, solcVersion);

const provider = new ProviderEngine();
// Some calls might not have `from` address specified. Nevertheless - transactions need to be submitted 
// from an address with at least some funds. defaultFromAddress is the address that will be used to submit 
// those calls as transactions from.
const defaultFromAddress = '0xe8816898D851d5b61b7F950627D04d794C07CA37';
const isVerbose = true;
const coverageSubprovider = new CoverageSubprovider(artifactsAdapter, defaultFromAddress, isVerbose);
provider.addProvider(coverageSubprovider);

module.exports = { provider, coverageSubprovider };
