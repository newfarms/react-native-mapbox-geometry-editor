import { observer } from 'mobx-react-lite';
import { useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { BBox, Position } from 'geojson';

import { StoreContext } from '../../state/StoreContext';
import {
  findBoundingBox,
  findCenterForAnnotation,
} from '../../util/geometry/display';
import type { RnmgeID } from '../../type/geometry';

/**
 * Functions for giving hints to the Mapbox `Camera`
 */
export interface CameraControls {
  /**
   * A function that adjusts the view to the given bounding region
   */
  readonly fitBounds?: (
    /**
     * The most northeasterly point of the region
     */
    northEastCoordinates: Position,
    /**
     * The most southwesterly point of the region
     */
    southWestCoordinates: Position,
    /**
     * Screen-space padding around the region:
     * `[left and right padding in pixels, top and bottom padding in pixels]`
     */
    padding: [number, number]
  ) => void;
  /**
   * A function that centres the view on the given position
   * without changing the zoom level of the view
   */
  readonly moveTo?: (
    /**
     * The new centre of the view
     */
    coordinates: Position
  ) => void;
}

/**
 * The padding to require around features displayed on the map
 */
const padding = 20; // Pixels

/**
 * A component that emits hints for the client application
 * concerning where the map camera should be looking to help the user
 * interact with geometry on the map.
 *
 * @param props Render properties
 */
function _CameraController({
  fitBounds,
  moveTo,
  children,
}: CameraControls & { readonly children?: ReactNode }) {
  const { features } = useContext(StoreContext);

  /**
   * Construct camera parameters for viewing any currently focused feature
   */
  const featureData = features.focusedFeature;
  let featureID: RnmgeID | null = null;
  let coordinates: Position | null = null;
  let bbox: BBox | null = null;
  if (featureData) {
    featureID = featureData.id;
    coordinates = findCenterForAnnotation(featureData.geojson);
    bbox = findBoundingBox(featureData.geojson);
  }

  /**
   * Pass hints to the camera control functions
   */
  useEffect(() => {
    if (featureID) {
      if (bbox) {
        /**
         * Mapbox's parameter ordering for bounding box points seems to be the opposite
         * of the GeoJSON standard's definition of a bounding box
         */
        fitBounds?.([bbox[2], bbox[3]], [bbox[0], bbox[1]], [padding, padding]);
      } else if (coordinates) {
        // Center the map on a point feature, but do not change the zoom level
        moveTo?.(coordinates);
      }
    }
  }, [bbox, coordinates, featureID, fitBounds, moveTo]);

  /**
   * This component has nothing meaningful to render, and is just used to integrate
   * some imperative code with React.
   */
  return <>{children}</>;
}

/**
 * Renderable MobX wrapper for {@link _CameraController}
 */
export const CameraController = observer(_CameraController);
