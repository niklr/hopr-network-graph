# HoprGraphs

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.2.11.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Configuration

### \src\assets\config.json

{
  "eth": {
    "rpcProviderUrl": "https://eth-mainnet.alchemyapi.io/v2/...",
    "tokenContract": "0xf5581dfefd8fb0e4aec526be659cfab1f8c781da"
  },
  "xdai": {
    "rpcProviderUrl": "https://rpc.xdaichain.com/",
    "tokenContract": "0xD057604A14982FE8D88c5fC25Aac3267eA142a08"
  }
}

- create github project
- extract chain data with cli
- filter based on event type
- stop simulation button for d3
- documentation