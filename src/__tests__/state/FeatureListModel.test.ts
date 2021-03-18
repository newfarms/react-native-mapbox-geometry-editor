import range from 'lodash/range';
import { point } from '@turf/helpers';

import { FeatureListModel } from '../../state/FeatureListModel';
import { FeatureModel } from '../../state/FeatureModel';
import { FeatureLifecycleStage } from '../../type/geometry';

/**
 * Test that moving a given point by index updates the appropriate
 * draggable point's coordinates.
 *
 * The test repeats for different numbers of points in the collection
 * of draggable points.
 */
test.each([[1], [2], [3]])(
  'dragPosition() for each of %i points',
  (nPoints) => {
    /**
     * Setup: Create a collection of draggable points
     */
    // Coordinates of the points
    const originalCoordinates = range(nPoints).map((val) => [val, val + 1]);
    // Point features
    const featureData = originalCoordinates.map((val) => point(val));
    const featureModelData = featureData.map((val) => {
      return new FeatureModel({
        stage: FeatureLifecycleStage.EditShape,
        geojson: val,
        finalType: 'Point',
      });
    });
    // Collection of draggable point features
    const features = new FeatureListModel({ features: featureModelData });

    /**
     * Test: Move each point and check that it is changed accordingly
     */
    range(nPoints).forEach((index) => {
      const newPosition = [index + 0.5, index + 1.5];
      features.dragPosition(newPosition, features.features[index].$modelId, 0);
      expect(features.draggablePositions[index].coordinates).toStrictEqual(
        newPosition
      );
    });
  }
);
