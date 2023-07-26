import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Button, Card } from 'react-native-paper';
import type { Position } from 'geojson';

import { useMetadata } from '../../hooks/useMetadata';
import { StoreContext } from '../../state/StoreContext';
import { minDimensionPercentageToDP } from '../../util/dimensions';
import { findCenterForAnnotation } from '../../util/geometry/display';
import { getTitle } from '../../util/metadata/display';
import { MetadataFieldList } from '../ui/metadata/MetadataList';
import { MetadataInteraction } from '../../type/metadata';
import type { Metadata, MetadataFormStructure } from '../../type/metadata';
import type { RnmgeID } from '../../type/geometry';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  card: {
    width: minDimensionPercentageToDP('50'),
  },
});

/**
 * A component that renders a preview of a feature's metadata,
 * to be rendered inside of a map annotation.
 *
 * @param props Render properties
 */
function MetadataAnnotationContent({
  onDismiss,
  onMore,
  data,
  formStructure,
  use,
}: {
  /**
   * A touch callback for the close button of the preview
   */
  onDismiss: () => void;
  /**
   * A touch callback for the "open details" button of the preview
   */
  onMore: () => void;
  /**
   * The current metadata object
   */
  data?: Metadata | null;
  /**
   * A description of the metadata
   */
  formStructure: MetadataFormStructure;
  /**
   * The purpose for which the data is being rendered
   */
  use: MetadataInteraction.ViewDetails | MetadataInteraction.ViewPreview;
}) {
  return (
    <Card elevation={5} style={styles.card}>
      <Card.Title title={getTitle(formStructure.attributes, data)} />
      <Card.Content>
        <MetadataFieldList
          formStructure={formStructure}
          use={use}
          data={data}
          includeTitle={false}
          includeLabels={false}
        />
      </Card.Content>
      <Card.Actions>
        <Button compact onPress={onMore}>
          More
        </Button>
        <Button compact onPress={onDismiss}>
          Close
        </Button>
      </Card.Actions>
    </Card>
  );
}

/**
 * Renders the equivalent of a tooltip on the map for geometry
 * that the user has currently focused.
 *
 * @return Renderable React node
 */
function _MetadataPreview() {
  const { controls, features } = useContext(StoreContext);
  const use = MetadataInteraction.ViewPreview;
  const { canUse, data, formStarter, contextExists } = useMetadata(use);

  const featureData = features.focusedFeature;
  let featureID: RnmgeID = ''; // ID used to blur the feature when closing the tooltip
  let coordinates: Position = [0, 0]; // Tooltip anchor on map

  /**
   * Collect rendering props for the tooltip
   */
  if (featureData) {
    featureID = featureData.id;
    // Put the tooltip at the "centre" of the feature
    coordinates = findCenterForAnnotation(featureData.geojson);
  }
  // Tooltip close button press handler deselects the feature
  const onDismiss = useMemo(
    () =>
      action('metadata_preview_dismiss', () => {
        features.toggleSingleSelectFeature(featureID);
      }),
    [features, featureID]
  );
  // Tooltip more button press handler opens a details page
  const onMore = useMemo(
    () =>
      action('metadata_preview_details', () => {
        controls.openPage();
      }),
    [controls]
  );

  /**
   * Render a preview display for any currently focused feature.
   * The `anchor` prop sets the tooltip content's anchor point
   * (the point that corresponds to its map coordinates, `coordinate`)
   * near its bottom left corner.
   */
  if (contextExists && canUse) {
    return (
      <MapboxGL.MarkerView
        coordinate={coordinates}
        anchor={{ x: 0.025, y: 0.975 }}
      >
        <MetadataAnnotationContent
          onDismiss={onDismiss}
          onMore={onMore}
          use={use}
          formStructure={formStarter.formStructure}
          data={data}
        />
      </MapboxGL.MarkerView>
    );
  }
  return null;
}

/**
 * Renderable MobX wrapper for {@link _MetadataPreview}
 */
export const MetadataPreview = observer(_MetadataPreview);
