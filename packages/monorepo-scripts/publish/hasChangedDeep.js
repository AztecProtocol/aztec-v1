/**
 * Have a package's local deps changed? Checks recursively.
 *
 * @param {Package[]} packages The package with local deps to check.
 * @param {Package[]} ignore=[] Packages to ignore (to prevent infinite loops).
 * @returns {boolean} `true` if any deps have changed and `false` otherwise
 *
 * @internal
 */
function hasChangedDeep(packages, ignore = []) {
    // Has changed if...
    return packages
        .filter((p) => ignore.indexOf(p) === -1)
        .some((p) => {
            // 1. Any local dep package itself has changed
            if (p._nextType) return true;
            // 2. Any local dep package has local deps that have changed.
            else if (hasChangedDeep(p._localDeps, [...ignore, ...packages])) return true;
            // Nope.
            else return false;
        });
}

// Exports.
module.exports = hasChangedDeep;
