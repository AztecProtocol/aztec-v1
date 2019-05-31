### Install

```
yarn install
```

<br/>

### Test

```
yarn test
```

Options:

* `--port=PORT_NUMBER`: Port number for Ganache. Default values are defined in `./config/ganache.js`.

* `--stayOpen`: Keep Ganache and Docker alive. By enabling this, you can run subtasks in another terminal window without having to start Ganache and Docker again. See available subtasks in the next section.

* `--useExistingGanache`: Use existing Ganache instance. If no Ganache instance is running on desired port, a new instance will be created.

<br/>

### Subtasks

##### Deploy contracts

Deploy smart contracts to Ganache:

```
yarn deploy:contracts
```

Make sure there's already a Ganache instance running. If you change the contracts in this monorepo and the tests fail, try deleting *build/* in *protocol* package and deploy again.

<br/>

##### Copy

Copy compiled files and required settings to this package:

```
yarn copy
```

This command will copy the following:

- Compiled contracts
- Abis required by the Graph
- Contract addresses required in subgraph.yaml

<br/>

##### Setup the Graph

Run codegen, create, and deploy with graph-cli:

```
yarn graph
```

Make sure you've already run `yarn copy` before running this command.

You can also run a specific task:

```
yarn graph codegen
```

Available tasks:

- codegen
- create
- deploy

<br/>

##### Rebuild

Run `yarn deploy:contracts`, `yarn copy` and `yarn graph`:

```
yarn rebuild
```

<br/>

##### Test

Run tests on existing Ganache and Docker instances:

```
yarn test:run
```
