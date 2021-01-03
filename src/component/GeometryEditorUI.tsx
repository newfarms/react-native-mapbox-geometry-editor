/**
 * Geometry editor map canvas with editing controls user interface
 * @packageDocumentation
 */
import React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';

import { _GeometryEditor } from './GeometryEditor';
import type { GeometryEditorProps } from './GeometryEditor';
import { StoreProvider } from '../state/StoreProvider';
import { ModeToolbox } from './ui/ModeToolbox';
import { ConfirmationDialog } from './ui/ConfirmationDialog';
import { MetadataContext } from './ui/MetadataContext';
import { MetadataPreview } from './geometry/MetadataPreview';
import { defaultMetadataSchemaGenerator } from '../util/metadata/schema';
import { PageController } from './ui/page/PageController';
import type { MetadataSchemaGenerator } from '../type/metadata';

/**
 * Render properties for [[GeometryEditorUI]]
 */
export interface GeometryEditorUIProps extends GeometryEditorProps {
  /**
   * Style attributes for the React Native `View` containing
   * the map and user interface
   */
  readonly style?: ViewStyle;
  /**
   * A function that will generate schemas for geometry metadata editing forms.
   * It will be passed the geometry to be edited (having any existing metadata)
   */
  readonly metadataSchemaGenerator?: MetadataSchemaGenerator;
}

/**
 * A component that renders an editing user interface
 * in addition to the underlying core geometry editing library.
 *
 * @param props Render properties
 * @return Renderable React node
 */
export function GeometryEditorUI(props: GeometryEditorUIProps) {
  const {
    style: containerStyle = {},
    metadataSchemaGenerator = defaultMetadataSchemaGenerator,
    ...restProps
  } = props;

  return (
    <View style={containerStyle}>
      <PaperProvider>
        <StoreProvider>
          <MetadataContext.Provider value={{ metadataSchemaGenerator }}>
            <_GeometryEditor {...restProps}>
              <MetadataPreview />
              {props.children}
            </_GeometryEditor>
            <ModeToolbox />
            <PageController />
            <ConfirmationDialog visibleIfPageOpen={false} />
          </MetadataContext.Provider>
        </StoreProvider>
      </PaperProvider>
    </View>
  );
}
