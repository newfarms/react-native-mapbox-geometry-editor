import { observer } from 'mobx-react-lite';
import React, { useCallback, useContext } from 'react';
import { StyleSheet } from 'react-native';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { Button, Caption, Card } from 'react-native-paper';
import along from '@turf/along';
import centroid from '@turf/centroid';
import length from '@turf/length';
import type { Position } from 'geojson';

import { StoreContext } from '../../state/StoreContext';
import { minDimensionPercentageToDP } from '../../util/dimensions';
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
}: {
  /**
   * A touch callback for the close button of the preview
   */
  onDismiss: () => void;
}) {
  return (
    <Card elevation={5} style={styles.card}>
      <Card.Title title="Feature title" />
      <Card.Content>
        <Caption>Preview content</Caption>
      </Card.Content>
      <Card.Actions>
        <Button compact onPress={() => console.log('TODO: Details pressed')}>
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
  const { features } = useContext(StoreContext).store;
  const featureData = features.focusedFeature;
  let featureID: RnmgeID = ''; // ID used to blur the feature when closing the tooltip
  let coordinates: Position = [0, 0]; // Tooltip anchor on map

  /**
   * Collect rendering props for the tooltip
   */
  if (featureData) {
    featureID = featureData.id;
    // Put the tooltip at the "centre" of the feature
    const featureGeoJSON = featureData.geojson;
    switch (featureGeoJSON.geometry.type) {
      case 'Point':
        coordinates = featureGeoJSON.geometry.coordinates;
        break;
      case 'LineString':
        // Midpoint in terms of path length along a polyline
        coordinates = along(featureGeoJSON.geometry, length(featureGeoJSON) / 2)
          .geometry.coordinates;
        break;
      case 'Polygon':
        /**
         * Note: TurfJS has three different types of "centers" for geometry.
         * See https://stackoverflow.com/questions/55982479/difference-between-centroid-and-centerofmass-in-turf
         */
        coordinates = centroid(featureGeoJSON.geometry).geometry.coordinates;
        break;
    }
  }
  // Tooltip close button press handler deselects the feature
  const onDismiss = useCallback(() => {
    features.toggleSingleSelectFeature(featureID);
  }, [features, featureID]);

  /**
   * Render a preview display for any currently focused feature.
   * The `anchor` prop sets the tooltip content's anchor point
   * (the point that corresponds to its map coordinates, `coordinate`)
   * near its bottom left corner.
   */
  if (featureData) {
    return (
      <MapboxGL.MarkerView
        coordinate={coordinates}
        anchor={{ x: 0.025, y: 0.975 }}
        id="metadata_preview"
      >
        <MetadataAnnotationContent onDismiss={onDismiss} />
      </MapboxGL.MarkerView>
    );
  }
  return null;
}

/**
 * Renderable MobX wrapper for [[_MetadataPreview]]
 */
export const MetadataPreview = observer(_MetadataPreview);
