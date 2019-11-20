# Changelog

## v0.12.0

_November 7, 2019_

-   Add update note metaData functionality
-   Add note viewing key permissioning system
-   Make note registries upgradeable
-   Add ability to mint on initialisation of ZkAssetMintable
-   BREAKING_CHANGE: `zkAsset.confidentialTransfer()` now called through a different API when interacting via Truffle.
    Use `await zkAsset.methods['confidentialTransfer(bytes,bytes)'](data, signatures)`
-   Make ZkAsset support JoinSplit upgrade

## v0.11.0-beta.0

_September 6, 2019_

-   Add `PublicRange` proof validator and ABI encoder
