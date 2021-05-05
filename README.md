# hopr-network-graphs

Table of Content
1. [Configure](#configure)
2. [Install](#install)
3. [Extract data](#extract)
4. [Build](#build)

## Configure <a name="configure"></a>

Location: \src\assets\config.json

```js
{
  "eth": {
    "rpcProviderUrl": "https://eth-mainnet.alchemyapi.io/v2/..."
  },
  "xdai": {
    "rpcProviderUrl": "https://rpc.xdaichain.com/"
  }
}
```

## Install <a name="install"></a>

In order to run HORP network graph, ensure that you have [Git](https://git-scm.com/downloads) (v2.28.0+) and [Node.js](https://nodejs.org/) (v14.16.1+) installed.

Clone the repo:

```bash
git clone https://github.com/niklr/hopr-network-graph.git
```

Change to the hopr-network-graph directory:

```bash
cd hopr-network-graph
```

Install dependencies:

```bash
npm install
```

## Extract data <a name="extract"></a>

npx ts-node -P tsconfig.commonjs.json .\extract.ts

## Build <a name="build"></a>

Use one of the following commands to build:

```
npm run build            # Builds the project and stores artifacts in the `dist/` directory. 
                         # Use the `--prod` flag for a production build.
npm run start            # Starts a development server. Navigate to `http://localhost:4200/`. 
                         # The app will automatically reload if you change any of the source files.
npm run test             # Executes the unit tests via [Karma](https://karma-runner.github.io).
npm run e2e              # Executes the end-to-end tests via [Protractor](http://www.protractortest.org/).
```

## Further help

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.2.11.
To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

- extract chain data with cli
- filter based on event type
- stop simulation button for d3
- documentation