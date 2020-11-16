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

/**
 * Render properties for [[GeometryEditorUI]]
 */
export interface GeometryEditorUIProps extends GeometryEditorProps {
  /**
   * Style attributes for the React Native `View` containing
   * the map and user interface
   */
  readonly style?: ViewStyle;
}

/**
 * A component that renders an editing user interface
 * in addition to the underlying core geometry editing library.
 *
 * @param props Render properties
 * @return Renderable React node
 */
export function GeometryEditorUI(props: GeometryEditorUIProps) {
  const { style: containerStyle = {}, ...restProps } = props;

  return (
    <View style={containerStyle}>
      <PaperProvider>
        <StoreProvider>
          <_GeometryEditor {...restProps}>{props.children}</_GeometryEditor>
          <ModeToolbox />
          <ConfirmationDialog />
        </StoreProvider>
      </PaperProvider>
    </View>
  );
}
