const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');

git.plugins.set('fs', fs);

const CONTRACT_ADDRESSES_PREFIX = '@aztec/contract-addresses@';
const CONTRACT_ARTIFACTS_PREFIX = '@aztec/contract-artifacts@';

const main = async () => {
    const repoRoot = path.join(__dirname, '..', '..', '..');

    const tags = await git.listTags({ dir: repoRoot });
    const addressesTags = tags.filter((tag) => tag.startsWith(CONTRACT_ADDRESSES_PREFIX));
    const artifactsTags = tags.filter((tag) => tag.startsWith(CONTRACT_ARTIFACTS_PREFIX));
    console.log({ addressesTags, artifactsTags });

    const commits = await git.log({ dir: repoRoot, depth: 5, ref: 'develop' })
    console.log({ commits });
};

main();
