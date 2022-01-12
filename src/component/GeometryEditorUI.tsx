/**
 * Geometry editor map canvas with editing controls user interface
 * @packageDocumentation
 */
import { forwardRef } from 'react';

import type { Ref } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';

import { _GeometryEditor } from './GeometryEditor';
import type { GeometryEditorProps } from './GeometryEditor';
import { StoreProvider } from '../state/StoreProvider';
import { ActionToolbox } from './ui/control/ActionToolbox';
import { ModeToolbox } from './ui/control/ModeToolbox';
import { ConfirmationDialog } from './ui/ConfirmationDialog';
import { MetadataContext } from './ui/metadata/MetadataContext';
import { MetadataPreview } from './geometry/MetadataPreview';
import { MetadataEditorProvider } from './ui/metadata/MetadataEditorProvider';
import { defaultMetadataSchemaGeneratorMap } from '../util/metadata/schema';
import { PageController } from './ui/page/PageController';
import { InteractionNotifier } from './event/InteractionNotifier';
import type { MetadataSchemaGeneratorMap } from '../type/metadata';
import type { PageProps } from '../type/ui';
import type { InteractionEventProps } from '../type/ui';
import type { GeometryIORef } from './geometry/GeometryIO';

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
   * Functions that will generate schemas for geometry metadata view/editing forms.
   */
  readonly metadataSchemaGeneratorMap?: MetadataSchemaGeneratorMap;
  /**
   * Callbacks that notify the client application when the library is displaying
   * full-page content, and that allow the client application to force
   * the page to close if necessary.
   */
  readonly pageProps?: PageProps;
  /**
   * Callbacks to notify the client application of shape or metadata editing events
   */
  readonly interactionEventProps?: InteractionEventProps;
}

/**
 * A component that renders an editing user interface
 * in addition to the underlying core geometry editing library.
 *
 * @param props Render properties
 * @param ref React ref to which library methods are attached
 * @return Renderable React node
 */
function _GeometryEditorUI(
  props: GeometryEditorUIProps,
  ref: Ref<GeometryIORef>
) {
  const {
    style: containerStyle = {},
    metadataSchemaGeneratorMap = defaultMetadataSchemaGeneratorMap,
    pageProps,
    interactionEventProps,
    ...restProps
  } = props;

  return (
    <View style={containerStyle}>
      <StoreProvider>
        <MetadataContext.Provider value={metadataSchemaGeneratorMap}>
          <PaperProvider>
            <_GeometryEditor ref={ref} {...restProps}>
              <MetadataPreview />
              {props.children}
            </_GeometryEditor>
            <ModeToolbox />
            <ActionToolbox />
            <MetadataEditorProvider>
              <PageController pageProps={pageProps} />
            </MetadataEditorProvider>
            <ConfirmationDialog visibleIfPageOpen={false} />
          </PaperProvider>
        </MetadataContext.Provider>
        <InteractionNotifier {...interactionEventProps} />
      </StoreProvider>
    </View>
  );
}

/**
 * React ref forwarding version of [[_GeometryEditorUI]]
 */
export const GeometryEditorUI = forwardRef(_GeometryEditorUI);
