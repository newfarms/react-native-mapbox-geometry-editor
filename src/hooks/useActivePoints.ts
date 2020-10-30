import { useCallback, useState } from 'react';
import type { Position } from 'geojson';
import concat from 'lodash/concat';
import slice from 'lodash/slice';

import type {
  EventHandler,
  PointDragCallback,
  PointAnnotationPayload,
} from '../type/events';

/**
 * Rendering data and state update callbacks for interactive editing of points
 */
interface ActivePointsHookResults {
  /**
   * Points to be rendered
   */
  activePoints: Array<Position>;
  /**
   * A touch handler for the map
   */
  activePointsOnPress: EventHandler;
  /**
   * A callback for point drag events
   */
  activePointsOnDragEnd: PointDragCallback;
}

/**
 * A function that encapsulates state management of points being
 * edited interactively.
 *
 * @param initialCoordinates Existing points
 */
function useActivePoints(
  initialCoordinates: Array<Position>
): ActivePointsHookResults {
  const [points, setPoints] = useState(initialCoordinates);
  const onPress = useCallback(
    (feature) => {
      setPoints((oldPoints) =>
        concat(oldPoints, [feature.geometry.coordinates])
      );
      return true;
    },
    [setPoints]
  );
  const onDragEnd = useCallback(
    (e: PointAnnotationPayload, index: number) => {
      setPoints((oldPoints) => {
        let newPoints = slice(oldPoints);
        newPoints[index] = e.geometry.coordinates;
        return newPoints;
      });
    },
    [setPoints]
  );

  return {
    activePoints: points,
    activePointsOnPress: onPress,
    activePointsOnDragEnd: onDragEnd,
  };
}

export default useActivePoints;
