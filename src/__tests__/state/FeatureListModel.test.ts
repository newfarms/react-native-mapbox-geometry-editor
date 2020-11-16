import range from 'lodash/range';
import { point } from '@turf/helpers';

import { FeatureListModel } from '../../state/FeatureListModel';
import { FeatureModel } from '../../state/FeatureModel';

/**
 * Test that moving a given active point by index updates the appropriate
 * active point's coordinates.
 *
 * The test repeats for different numbers of points in the collection
 * of active points.
 */
test.each([[1], [2], [3]])(
  'moveActiveCoordinate() for each of %i points',
  (nPoints) => {
    /**
     * Setup: Create a collection of active points
     */
    // Coordinates of the points
    const originalCoordinates = range(nPoints).map((val) => [val, val + 1]);
    // Active point features
    const featureData = originalCoordinates.map((val) => point(val));
    const featureModelData = featureData.map((val) => {
      return new FeatureModel({
        isActive: true,
        geojson: val,
      });
    });
    // Collection of active point features
    const features = new FeatureListModel({ features: featureModelData });

    /**
     * Test: Move each point and check that it is changed accordingly
     */
    range(nPoints).forEach((index) => {
      const newPosition = [index + 0.5, index + 1.5];
      features.moveActiveCoordinate(newPosition, index);
      expect(features.activePositions[index].coordinates).toStrictEqual(
        newPosition
      );
    });
  }
);
