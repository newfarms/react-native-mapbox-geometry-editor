import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import MapboxGL from '@react-native-mapbox-gl/maps';

import { StoreContext } from '../../state/StoreContext';
import { StyleContext } from '../StyleContext';

/**
 * Renders "hot" geometry on a Mapbox map.
 * Hot geometry is actively being edited, and is not subject to clustering
 * @return Renderable React node
 */
function _HotGeometry() {
  const { features } = useContext(StoreContext).store;
  const featuresJS = toJS(features.hotFeatures);

  const { styleGenerators } = useContext(StyleContext);

  /**
   * Render separate layers for each type of geometry
   */
  return (
    <MapboxGL.ShapeSource id="hot_geometry" shape={featuresJS}>
      <MapboxGL.CircleLayer
        id="hot_points"
        filter={['==', ['geometry-type'], 'Point']}
        style={styleGenerators.point()}
      />
    </MapboxGL.ShapeSource>
  );
}

/**
 * Renderable MobX wrapper for [[_HotGeometry]]
 */
export const HotGeometry = observer(_HotGeometry);
