import { model, Model, modelAction, prop } from 'mobx-keystone';

import { FeatureListModel } from './FeatureListModel';
import { ControlsModel } from './ControlsModel';
import { InteractionMode } from './ControlsModel';
import type { MapPressPayload } from '../type/events';

/**
 * A model for all library state
 */
@model('reactNativeMapboxGeometryEditor/RootModel')
export class RootModel extends Model({
  /**
   * Geometry editing controls state
   */
  controls: prop<ControlsModel>(() => new ControlsModel({})),
  /**
   * Geometry data
   */
  features: prop<FeatureListModel>(() => new FeatureListModel({})),
}) {
  /**
   * Executes the appropriate action in response to a map touch event
   *
   * @param e Event payload
   */
  @modelAction
  handleMapPress(e: MapPressPayload) {
    // In point drawing mode, create another point feature
    if (this.controls.mode === InteractionMode.DrawPoint) {
      this.features.addActivePoint(e.geometry.coordinates);
    }
  }
}
