# Contributing

Thank you for your interest in contributing! Please feel free to put up a PR for any issue or feature request. :)

We want this community to be friendly and respectful to each other. Please follow these guidelines in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

### Prerequisites

#### React Native

We assume you have set up your [React Native](https://reactnative.dev/) development tools. To run the example app in this repository, you will need [React Native CLI](https://reactnative.dev/docs/environment-setup) tools. (The example is not managed by [Expo](https://expo.io/) tools.)

#### Mapbox

To build the example app, your build system needs to download the Mapbox Android and/or iOS SDKs. Instructions for configuring your build system(s) to authenticate with Mapbox can be found at the following links:
- [Android](https://docs.mapbox.com/android/maps/guides/install/#configure-credentials)
- [iOS](https://docs.mapbox.com/ios/maps/guides/install/#configure-credentials)

To run the example app, you also need a [Mapbox API access token](https://docs.mapbox.com/help/how-mapbox-works/access-tokens/), and must copy it into `example/mapbox_token.json` (see [example/mapbox_token.json.example](./example/mapbox_token.json.example)).
If you do not need to run the example app, you can use an arbitrary string instead of a token, which will at least allow the example app to build.

### Development

Run `yarn bootstrap` in the root directory to install the required dependencies for each package:

```sh
yarn
```

While developing, you can run the [example app](/example/) to test your changes.

To start the packager for the example app:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example android
```

- To run an Android release build, add `--variant=release` to the above command.
- To run the app on a specific device, get the device ID from the output of `adb devices`, then add `--deviceId=$DEVICE_ID` to the above command.

To run the example app on iOS:

```sh
yarn example ios
```

Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
yarn typescript
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```

Remember to add tests for your change if possible. Run the unit tests by:

```sh
yarn test
```

### Commit message convention

We use the following [commit message types](https://www.conventionalcommits.org/en):

- `Chore`: small changes with minor importance
- `Documentation`: changes in documentation, e.g. add usage example for the module..
- `Feature`: new features, e.g. add new method to the module.
- `Fix`: small bug fixes
- `Refactor`: code refactor, e.g. migrate from class components to hooks.
- `Style`: code or output formatting changes
- `Test`: adding or updating tests
- `Cleanup`: removing dead code or comments, reorganizing code (smaller than `Refactor`)

Our pre-commit hooks verify that your commit message matches this format when committing.

### Linting and tests

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and formatting the code, and [Jest](https://jestjs.io/) for testing.

Our pre-commit hooks verify that most of these checks pass when committing.

### Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn bootstrap`: setup project by installing all dependencies and pods.
- `yarn typescript`: type-check files with TypeScript.
- `yarn lint`: lint files with ESLint.
- `yarn test`: run unit tests with Jest.
- `yarn docs`: render documentation using [Typedoc](https://typedoc.org/).
- `yarn example start`: start the Metro server for the example app.
- `yarn example android`: run the example app on Android.
- `yarn example ios`: run the example app on iOS.

### Sending a pull request

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.

### Reporting issues

If you notice any bugs, see some code that could be improved, or have features you would like to see added, please create a bug report or feature request. Please select the issue template that suits your needs, and fill out the form that will be auto-created, to submit your request.

### Working on issues

Please feel free to work on fixing any issue that is currently open. It is greatly appreciated if you create an issue before you start working on any problems you notice in the code, so that the solution can be discussed beforehand.
