# react-native-mapbox-geometry-editor

Interactive shape editing on top of the Mapbox Maps SDK for React Native

## Installation

```sh
yarn add react-native-mapbox-geometry-editor @react-native-mapbox-gl/maps
```

The unofficial Mapbox Maps SDK for React Native, `@react-native-mapbox-gl/maps` is a peer dependency.
To use it, you must have a [Mapbox API access token](https://docs.mapbox.com/help/how-mapbox-works/access-tokens/).

## Usage

```js
import MapboxGeometryEditor from "react-native-mapbox-geometry-editor";

// ...

const result = await MapboxGeometryEditor.multiply(3, 7);
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
