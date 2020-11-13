# react-native-mapbox-geometry-editor

Interactive shape editing on top of the Mapbox Maps SDK for React Native

## Installation

```sh
yarn add react-native-mapbox-geometry-editor @react-native-mapbox-gl/maps react-native-get-random-values
```

If you wish to use the default editing controls user interface (`<GeometryEditorUI/>`) from this library, then you must also install the peer dependency `react-native-vector-icons`.
Run `yarn add react-native-vector-icons`, and then follow the additional instructions listed [here](https://github.com/oblador/react-native-vector-icons#installation).
Note that there is no need to set up FontAwesome 5 support with `react-native-vector-icons`.

The unofficial Mapbox Maps SDK for React Native, `@react-native-mapbox-gl/maps` is a peer dependency.
To use it, you must have a [Mapbox API access token](https://docs.mapbox.com/help/how-mapbox-works/access-tokens/).

## Usage

```js
/**
 * Polyfill for React Native needed by 'react-native-mapbox-geometry-editor'
 * See https://github.com/uuidjs/uuid#getrandomvalues-not-supported
 */
import 'react-native-get-random-values';

import MapboxGeometryEditor from "react-native-mapbox-geometry-editor";

// ...
// TODO: Document a real example
const result = await MapboxGeometryEditor.multiply(3, 7);
```

## Known issues

### iOS
- To drag an editable point, it may be necessary to first tap on the point (press and release) before pressing and holding to drag the point.
- To draw a new point, it may be necessary to first tap on the map, to switch focus to the map, after having tapped on a geometry object or on a user interface element.
  In other words, two taps on the map may be required to draw a new point.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to run the example app, and how to contribute to the repository.

## License

MIT
