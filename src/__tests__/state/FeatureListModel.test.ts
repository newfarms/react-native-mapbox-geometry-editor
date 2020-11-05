import range from 'lodash/range';
import { point } from '@turf/helpers';

import { FeatureListModel } from '../../state/FeatureListModel';
import { FeatureModel } from '../../state/FeatureModel';

test.each([[1], [2], [3]])(
  'moveActiveCoordinate() for each of %i points',
  (nPoints) => {
    const originalCoordinates = range(nPoints).map((val) => [val, val + 1]);
    const featureData = originalCoordinates.map((val) => point(val));
    const featureModelData = featureData.map((val) => {
      return new FeatureModel({
        isActive: true,
        geojson: val,
      });
    });
    const features = new FeatureListModel({ features: featureModelData });
    range(nPoints).forEach((index) => {
      const newPosition = [index + 0.5, index + 1.5];
      features.moveActiveCoordinate(newPosition, index);
      expect(features.activePositions[index]).toStrictEqual(newPosition);
    });
  }
);
