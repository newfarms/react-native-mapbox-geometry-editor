import { model, Model, modelAction, prop } from 'mobx-keystone';

import { featureListContext } from './ModelContexts';
import { FeatureListModel } from './FeatureListModel';
import { ControlsModel } from './ControlsModel';
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
   * Set up contexts by which child stores can find each other.
   */
  onInit() {
    featureListContext.setComputed(this, () => this.features);
  }

  /**
   * Executes the appropriate action in response to a map touch event
   *
   * @param e Event payload
   */
  @modelAction
  handleMapPress(e: MapPressPayload) {
    return this.controls.handleMapPress(e);
  }
}
