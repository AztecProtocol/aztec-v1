const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');

git.plugins.set('fs', fs);

const CONTRACT_ADDRESSES_PREFIX = '@aztec/contract-addresses@';
const CONTRACT_ARTIFACTS_PREFIX = '@aztec/contract-artifacts@';

const contractAddressesPrefix = '@aztec/contract-addresses@';
const repoRoot = path.join(__dirname, '..', '..', '..');

/**
 * 
 * Figures out whether the package has been modified since the last tagged commit.
 * 
 * @param {string} aztecPackage
 * @returns boolean
 */
const hasPackageChanged = async (aztecPackage) => {
    console.log({ aztecPackage });

    const tags = await git.listTags({ dir: repoRoot });
    const lastTag = tags.filter((tag) => tag.startsWith(contractAddressesPrefix)).slice(-1)[0];

    process.exit(0);

    const addressesTags = tags.filter((tag) => tag.startsWith(CONTRACT_ADDRESSES_PREFIX));
    const artifactsTags = tags.filter((tag) => tag.startsWith(CONTRACT_ARTIFACTS_PREFIX));
    console.log({ addressesTags, artifactsTags });

    const commits = await git.log({ dir: repoRoot, depth: 5, ref: 'develop' });
    console.log({ commits });
};

module.exports = {
    hasPackageChanged,
};
