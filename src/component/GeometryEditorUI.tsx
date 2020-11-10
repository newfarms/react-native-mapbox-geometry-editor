/**
 * Geometry editor map canvas with editing controls user interface
 * @packageDocumentation
 */
import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';

import { _GeometryEditor } from './GeometryEditor';
import type { GeometryEditorProps } from './GeometryEditor';
import { StoreProvider } from '../state/StoreProvider';

/**
 * A component that renders an editing user interface
 * in addition to the underlying core geometry editing library.
 *
 * @param props Render properties
 * @return Renderable React node
 */
export function GeometryEditorUI(props: GeometryEditorProps) {
  const { mapProps } = props;

  return (
    <PaperProvider>
      <StoreProvider>
        <_GeometryEditor mapProps={mapProps}>{props.children}</_GeometryEditor>
      </StoreProvider>
    </PaperProvider>
  );
}
