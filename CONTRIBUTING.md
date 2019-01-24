# AZTEC Contribution Guide

We appreciate your desire to contribute to the AZTEC protocol and welcome anyone on the internet to do it. This document will help get you setup to start contributing back to AZTEC.

## Getting Started

- Fork AztecProtocol/aztec-monorepo
- Clone your fork
- Follow the [installation & build steps](https://github.com/AztecProtocol/aztec-monorepo#contributing) in the repo's top-level README.
- Open a PR against the `develop` branch and describe the change you are intending to undertake in the PR description using the provided template.

## Code Quality

- When adding functionality, please also add tests and make sure they pass
- When adding a new function, make sure to add comments that adhere to the format seen throughout the project
- When fixing conflicts please use `rebase`
- When updating your working branch with upstream master changes, please `rebase`
- Make sure there are no linter warnings or errors
- Make sure you have a [global gitignore](https://help.github.com/articles/ignoring-files/) to avoid committing unnecessary files like `.DS_Store`
