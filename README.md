<!-- omit in toc -->
# react-native-mapbox-geometry-editor

Interactive shape editing on top of the Mapbox Maps SDK for React Native

<!-- omit in toc -->
## Table of Contents

  - [Example](#example)
  - [Features](#features)
    - [Limitations](#limitations)
  - [Installation](#installation)
    - [Import options](#import-options)
  - [Usage](#usage)
    - [Geometry format and metadata](#geometry-format-and-metadata)
      - [Advanced usage](#advanced-usage)
  - [Custom user interface](#custom-user-interface)
  - [API Documentation](#api-documentation)
  - [Utility scripts](#utility-scripts)
  - [Known issues and future work](#known-issues-and-future-work)
    - [Packaging and publishing](#packaging-and-publishing)
    - [Minor general issues](#minor-general-issues)
    - [Android-specific issues](#android-specific-issues)
    - [iOS-specific issues](#ios-specific-issues)
  - [Contributing](#contributing)
  - [License](#license)

## Example

The example app demonstrates almost all of the features of the library, in particular geometry drawing, and creating custom forms for editing metadata associated with geometry.

<p float="left">
  <img src="./docs/img/demo_shape_drawing_320x640.gif" width="320" alt="Demonstration of shape drawing features in the example app" />
  <img src="./docs/img/demo_select_export_320x640.gif" width="320" alt="Demonstration of shape selection and import and export features in the example app"/>
</p>

To run the example app, refer to the instructions in [CONTRIBUTING.md](CONTRIBUTING.md).

## Features

- Create, edit, and delete different types of [GeoJSON](https://tools.ietf.org/html/rfc7946) geometry: `Point`, `LineString`, and `Polygon`
- Select single or multiple shapes for deletion
- Select single shapes and preview, view, or edit their metadata. Metadata is stored in GeoJSON `"properties"`.
- Create custom forms for editing metadata
- Customize the content that appears in metadata previews
- Undo and redo shape editing and deletion changes
- Import GeoJSON into the library for display or editing
- Export GeoJSON from the library for use in the rest of your application

### Limitations

During geometry import operations (see [`src/util/geometry/io.tsx`](./src/util/geometry/io.tsx)):

- Multi-geometry [GeoJSON](https://tools.ietf.org/html/rfc7946) types will be split up.
  For example, `MultiLineString` features will be divided into `LineString` features.
- Holes will be removed from polygons.

## Installation

Presently this library is not published to a package repository. You can install it using a Git URL, along with its mandatory peer dependencies, as follows:

```sh
yarn add git+https://github.com/newfarms/react-native-mapbox-geometry-editor#development @rnmapbox/maps react-native-get-random-values
```

If you wish to use the default editing controls user interface (`<GeometryEditorUI/>`) from this library, then you must also install the peer dependency `react-native-vector-icons`.
Run `yarn add react-native-vector-icons`, and then follow the additional instructions listed [here](https://github.com/oblador/react-native-vector-icons#installation).
Note that there is no need to set up FontAwesome 5 support with `react-native-vector-icons`.

The unofficial Mapbox Maps SDK for React Native, `@rnmapbox/maps` is a peer dependency.
To use it, you must have a [Mapbox API access token](https://docs.mapbox.com/help/how-mapbox-works/access-tokens/), unless you plan to use a different map provider.
The example app is set up to use Mapbox as both a map provider, and as the native Android and iOS SDK underneath the Mapbox Maps SDK for React Native.
Mapbox setup for the example app is described in [CONTRIBUTING.md](CONTRIBUTING.md#mapbox).
Refer to the [Mapbox Maps SDK for React Native's documentation](https://github.com/rnmapbox/maps) for more information about alternative map providers and native map libraries (although the project appears to be phasing out these alternatives).

### Import options

The library provides build targets to suit different transpilation mechanisms:

- Commonjs module system: `lib/commonjs`
- ES6 module system (useful for tree-shaking): `lib/module`
- TypeScript: `lib/typescript`

If you import the library as usual, your build system should use the appropriate target:

```js
import { GeometryEditorUI } from 'react-native-mapbox-geometry-editor';
```

For more information about the build targets, see https://github.com/callstack/react-native-builder-bob#targets

## Usage

Presently, the example app ([`example/src/App.tsx`](./example/src/App.tsx)) showcases almost all of the features of the library, and is the best, and most concise, source of documentation.
The library also has [Typedoc documentation](#api-documentation).

You can run the example by following the instructions in [CONTRIBUTING.md](CONTRIBUTING.md).

### Geometry format and metadata

The library uses the [GeoJSON Feature](https://tools.ietf.org/html/rfc7946) format to communicate geometry with client applications.
GeoJSON Feature objects can be associated with arbitrary metadata, stored under a `"properties"` key.

The `<GeometryEditorUI/>` graphical interface for the library accepts schema descriptions.
The library uses schema descriptions build forms so that the user can edit geometry metadata in a type-safe manner.
The schema descriptions are generated by the functions passed in the `metadataSchemaGeneratorMap` prop of `<GeometryEditorUI/>`.

Note that schema descriptions are requested immediately before an interface is opened for viewing or editing metadata, so different schema descriptions can be returned at different times, and can be customized for different GeoJSON Feature objects.
If a schema description returned by a function is not `null`, it must be an object of the form parsed by [`@demvsystems/yup-ast`](https://github.com/demvsystems/yup-ast), subject to restrictions described below.

The schema description must contain a top-level object:

```TypeScript
[
  ['yup.object'],
  ['yup.required'],
  [
    'yup.shape',
    {
      // FIELDS
      fieldKey: [...] // FIELD SCHEMA
    },
  ],
]
```

The `FIELDS` portion contains the actual fields of the GeoJSON metadata.
The datatype of a field must be one of the following:

- `fieldKey: [['yup.mixed'], ['yup.oneOf', ["ARRAY", "OF", "STRINGS" ]],]`: A string-typed enumeration, where the array of possible values must have at least one element
- `fieldKey: [['yup.string']]`: A string
- `fieldKey: [['yup.number']]`: A number
- `fieldKey: [['yup.boolean']]`: A boolean

Fields with datatypes not in the above list will not appear in metadata forms, but can still be present in the metadata of objects imported by the library.
The library will only display and allow editing of fields of the supported types, and will leave other fields hidden and untouched.
The library will also ignore all properties of metadata objects that are not described in the schema.

The schema description can (and should) contain human-readable text to assist the user:

- Fields can be given human-readable names using the `'yup.label'` attribute.
  For example, `fieldKey: [['yup.boolean'], ['yup.label', 'Field name'],]` gives the field a name of `'Field name'`.
  If a label is not provided, the field name will default to the field's key.
- Constraints on fields beyond basic datatype constraints can be associated with custom error messages.
  For example, if a field's schema is `fieldKey: [['yup.string'], ['yup.required', 'This field is required'],]`, then if the user does not give the field a value, they will be shown the error message `'This field is required'`.

Refer to [the example app](./example/src/App.tsx) for an example of a complex metadata schema description.

The library provides the `validateMetadata()` utility function for validating the syntax of schema descriptions.
`validateMetadata()` can also test whether a given JavaScript object conforms to the input schema description.

#### Advanced usage

Metadata schema descriptions can be given meta information at both the object and field level:

```TypeScript
[
  ['yup.object'],
  ['yup.required'],
  ['yup.meta', {...}], // Object-level meta information
  [
    'yup.shape',
    {
      fieldKey: [..., ['yup.meta', {...}], ...] // Field schema with field-level meta information
    },
  ],
]
```

Meta information controls the circumstances under which metadata objects and metadata object fields can be viewed and edited, for instance.

Object-level meta information is described by the `MetadataAttributes` interface in `src/type/metadata.ts`, whereas field-level meta information is described by the `FieldAttributes` interface in `src/type/metadata.ts`.
Please read the code documentation comments of these interfaces for descriptions of the available options.
Default values for meta information are provided by the `metadataAttributesImpl` and `fieldAttributesImpl` validators in `src/util/metadata/schema.ts`, so the client application only needs to provide any meta information properties whose values must differ from the defaults.

## Custom user interface

The `<GeometryEditorUI/>` component renders a graphical user interface for editing geometry on top of a map.
(It also renders the map.)
The user interface is not customizable aside from some coarse style settings.

The library also exposes a `<GeometryEditor/>` component that renders a map, but no geometry editing controls.
You can you can set the flag `isCustomUI` to true and use the exposed functions to create your own custom user interface while using this component. Most of the necessary functions are available as part of `ref`. There are also some variables that you may wish to access in order to know when certain buttons should be active or displayed, in order to access these you must pass a setter function as a prop so that the `<GeometryEditor/>` can set the value for you to use.

If you are using a custom user interface you cannot currently add metadata to the shapes and will have to handle that externally.

There is an example app that shows basic use of a custom user interface in `CustomUIApp.tsx`. In order to use this app follow the instructions for running the default [example](#example) app but rename `CustomUIApp.tsx` to `App.tsx`.

In the future, either `<GeometryEditorUI/>` should accept more user interface customization options, or `<GeometryEditor/>` may expose a more full programmatic interface for editing geometry.
Otherwise, it will continue to be difficult to adapt geometry editing controls to the look and feel of the surrounding app.

## API Documentation

HTML API documentation for the library can be generated using Typedoc as follows:

1. Run `yarn bootstrap` in the root directory of the repository
2. Run `yarn docs`
3. Open `docs/src/index.html` in a web browser

## Utility scripts

- [`fix_winding.js`](./tool/fix_winding.js): A script that corrects the winding order of GeoJSON polygons in GeoJSON data. This script is helpful when preparing data to be imported into the geometry editing library.

## Known issues and future work

### Packaging and publishing

In the future, this library should be published to a package repository, such as NPM, for easier use with package managers.

### Minor general issues

- There are some temporary changes to [`tsconfig.json`](tsconfig.json) to work around TypeScript errors in `@rnmapbox/maps`
  (see https://github.com/rnmapbox/maps/issues/2333).
- In some client applications, while running in development mode, the library will emit the following warning:
  `"[mobx] Derivation observer_StoreProvider is created/updated without reading any observable value"`
  Refer to the comments in `src/state/StoreProvider.tsx` for details.
- There are inconsistent performance issues with React Native Paper-based dialogs.
  Presently these issues seem to be observed only on iOS, and only with dialogs
  that need to manage some local state.
  A possibly related issue may be https://github.com/callstack/react-native-paper/issues/2157
- Enumeration and boolean-typed geometry metadata fields are always given values during metadata creation or editing operations, even if the client application marks the fields as `'yup.optional'` (optional) fields, or marks the fields as non-creatable or non-editable.
  This is not necessarily a problem, since these fields will therefore always be given valid values.
  The library is still able to handle enumeration and boolean-typed fields that have missing or invalid values, however, such as when rendering metadata created outside the library.

### Android-specific issues

- Geometry rendering on an Android emulator may exhibit visual problems such as rendering points in grey instead of in their desired colours.
  Zooming in and out on the map may make colours randomly appear and disappear.

### iOS-specific issues

- To drag an editable point, it may be necessary to first tap on the point (press and release) before pressing and holding to drag the point.
- Editable points may snap back to their original positions while or after being dragged (https://github.com/rnmapbox/maps/issues/1117).
- To draw a new point, it may be necessary to first tap on the map, to switch focus to the map, after having tapped on a geometry object or on a user interface element.
  In other words, two taps on the map may be required to draw a new point.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to run the example app, and how to contribute to the repository.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
