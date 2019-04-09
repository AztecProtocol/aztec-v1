## AZTEC Contribution Guide

We appreciate your desire to contribute to the AZTEC protocol and welcome anyone on the internet to do it. This document will help get you setup to start contributing back to AZTEC.

### Getting Started

-   Fork AztecProtocol/AZTEC
-   Clone your fork
-   Follow the [installation & build steps](https://github.com/AztecProtocol/AZTEC/blob/master/.github/CONTRIBUTING.md) in the repo's top-level README.
-   Open a PR against the `develop` branch and describe the change you are intending to undertake in the PR description
    using the provided template.

Before removing the `[WIP]` tag and submitting the PR for review, make sure:

-   It passes our linter checks (`yarn lint`)
-   It is properly formatted with Prettier (`yarn prettier`)
-   It passes our continuous integration tests (See: [Enabling code coverage checks on your fork](#enabling-code-coverage-checks-on-your-fork) for instructions on getting the `submit-coverage` test to pass on forks)
-   You've created/updated the corresponding [CHANGELOG](#CHANGELOGs) entries.
-   Your changes have sufficient test coverage (e.g regression tests have been added for bug fixes)

### Branch structure

We have two main branches:

-   `master` represents the most recently released (published on npm) version of the codebase.
-   `develop` represents the current development state of the codebase.

ALL PRs should be opened against development.

Branch and commit must follow the [Angular Commit Message
Conventions](https://gist.github.com/stephenparish/9941e89d80e2bc58a153). Our repo is
[Commitizen](https://github.com/commitizen/cz-cli) friendly, so you can commit your changes by using one of the following:

-   `git cz` after you install commitizen globally `yarn add commitizen -g`
-   `yarn commit` at the root of the project

e.g fix/broken-wiki-link
If the PR only edits a single package, add it's name too
e.g fix/website/broken-wiki-link

### Code Quality

-   When adding functionality, please also add tests and make sure they pass
-   When adding a new function, make sure to add comments that adhere to the format seen throughout the project
-   When fixing conflicts please use `rebase`
-   When updating your working branch with upstream master changes, please `rebase`
-   Make sure there are no linter warnings or errors
-   Make sure you have a [global gitignore](https://help.github.com/articles/ignoring-files/) to avoid committing unnecessary files like `.DS_Store`

#### Linter

We use [ESLint](https://eslint.org/) with the [airbnb-base config](https://www.npmjs.com/package/eslint-config-airbnb-base) to keep our code-style consistent.

Use `yarn lint` to lint the entire monorepo, and `PKG={PACKAGE_NAME} yarn lint` to lint a specific package.

#### Auto-formatter

We use [Prettier](https://prettier.io/) to auto-format our code. Be sure to either add a [text editor integration](https://prettier.io/docs/en/editors.html) or a [pre-commit hook](https://prettier.io/docs/en/precommit.html) to properly format your code changes.

If using VSCode or the Atom text editor, we recommend you install the following packages:

-   VSCode: [prettier-vscode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
-   Atom: [prettier-atom](https://atom.io/packages/prettier-atom)

### Fix `submit-coverage` CI failure

If you simply fork the repo and then create a PR from it, your PR will fail the `submit-coverage` check on CI. This is because the AZTEC CircleCI configuration sets the `COVERALLS_REPO_TOKEN` environment variable to the token for `AztecProtocol/AZTEC`, but when running the check against your fork the token needs to match your repo's name `your-username/AZTEC`.

To facilitate this check, after creating your fork, but before creating the branch for your PR, do the following:

1.  Log in to [coveralls.io](https://coveralls.io/), go to `Add Repos`, and enable your fork. Then go to the settings for that repo, and copy the `Repo Token` identifier.
2.  Log in to [CircleCI](https://circleci.com/login), go to `Add Projects`, click the `Set Up Project` button corresponding to your fork, and then click `Start Building`. (Aside from step 3 below, no actual set up is needed, since it will use the `.circleci/config.yml` file in AZTEC, so you can ignore all of the instruction/explanation given on the page with the `Start Building` button.)
3.  In CircleCI, configure your project to add an environment variable, with name `COVERALLS_REPO_TOKEN`, and for the value paste in the `Repo Token` you copied in step 1.

Now, when you push to your branch, CircleCI will automatically run all of the checks in your own instance, and the coverage check will work since it has the proper `Repo Token`, and the PR will magically refer to your own checks rather than running them in the AZTEC CircleCI instance.
