// TODO remove this prototyping code file
import React, { useContext, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { action } from 'mobx';

import { ActionButton } from '../component/util/ActionButton';
import { StoreContext } from '../state/StoreContext';
import { FeatureLifecycleStage } from '../type/geometry';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});

const POLYGON_VERTICES = [
  [3.3840905176919724, 6.466102702644933],
  [3.3845313359718596, 6.466310759291281],
  [3.3850713383644995, 6.465949397692796],
  [3.384828888310628, 6.465379978892039],
  [3.384112558606028, 6.465445681094026],
];

/**
 * A component that renders a control for incrementally constructing static geometry
 */
function _DrawPolygonButton() {
  const { features } = useContext(StoreContext);
  const [index, setIndex] = useState(0);

  // Button press callback
  const onPress = useMemo(
    () =>
      action('draw_polygon_button_press', () => {
        if (index === 0) {
          features.addNewPoint(POLYGON_VERTICES[index], 'Polygon');
          setIndex(1);
        } else if (features.features.length === 0) {
          setIndex(0);
        } else if (
          features.features[features.features.length - 1].stage ===
            FeatureLifecycleStage.NewShape &&
          index < POLYGON_VERTICES.length
        ) {
          features.addVertex(POLYGON_VERTICES[index]);
          setIndex((i) => i + 1);
        }
      }),
    [features, index, setIndex]
  );

  // Button long press callback
  const onLongPress = useMemo(
    () =>
      action('draw_polygon_button_longpress', () => {
        if (features.features.length) {
          if (
            features.features[features.features.length - 1].stage ===
            FeatureLifecycleStage.NewShape
          ) {
            features.features[features.features.length - 1].stage =
              FeatureLifecycleStage.View;
          } else {
            features.features[features.features.length - 1].stage =
              FeatureLifecycleStage.NewShape;
          }
        }
      }),
    [features]
  );

  return (
    <ActionButton
      icon="star-face"
      disabled={false}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.button}
    />
  );
}

/**
 * Renderable MobX wrapper for [[_DrawPolygonButton]]
 */
export const DrawPolygonButton = observer(_DrawPolygonButton);
