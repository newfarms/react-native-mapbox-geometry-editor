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

### Import options

#### Importing library builds (recommended)

The library provides builds to suit different transpilation mechanisms:

```js
// commonjs module system
import { GeometryEditorUI } from 'react-native-mapbox-geometry-editor/lib/commonjs';

// ES6 module system
// Useful for tree-shaking
import { GeometryEditorUI } from 'react-native-mapbox-geometry-editor/lib/module';

// TypeScript
import { GeometryEditorUI } from 'react-native-mapbox-geometry-editor/lib/typescript';
```

For more information about the build targets, see https://github.com/callstack/react-native-builder-bob#targets

#### Import library source (not recommended)

```js
import { GeometryEditorUI } from 'react-native-mapbox-geometry-editor';
```

The plain import will import the source code of the library, meaning that your code will need to be transpiled under Babel or TypeScript configurations that are compatible with those used to develop the library.

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
- Editable points may snap back to their original positions while or after being dragged (https://github.com/react-native-mapbox-gl/maps/issues/1117).
- To draw a new point, it may be necessary to first tap on the map, to switch focus to the map, after having tapped on a geometry object or on a user interface element.
  In other words, two taps on the map may be required to draw a new point.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to run the example app, and how to contribute to the repository.

## License

MIT
