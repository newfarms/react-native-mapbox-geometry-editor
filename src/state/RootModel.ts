import { computed } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';
import type { FeatureCollection } from 'geojson';

import { controlsContext, featureListContext } from './ModelContexts';
import { FeatureListModel } from './FeatureListModel';
import { ControlsModel } from './ControlsModel';
import type { EditableFeature, EditableGeometry } from '../type/geometry';
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
    controlsContext.setComputed(this, () => this.controls);
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

  /**
   * Sets the value stating whether or not the geometry editor is using a custom UI or not
   *
   * @param isCustomUI whether or not the geometry editor is using a custom UI
   */
  @modelAction
  setCustomUI(isCustomUI?: boolean) {
    if (isCustomUI) {
      this.controls.isCustomUI = isCustomUI;
    } else {
      this.controls.isCustomUI = false;
    }
  }

  /**
   * Import features into the state stores
   * @param features The new features to store
   * @param options Options controlling the import operation
   */
  @modelAction
  importFeatures(
    features: Array<EditableFeature>,
    options: {
      /**
       * Whether the features should be added to (`false`), or replace (`true`),
       * the features currently in the state store.
       */
      replace: boolean;
    }
  ) {
    this.controls.importFeatures(features, options);
  }

  /**
   * Returns a deep copy of all geometry in the store
   */
  @computed
  get geojson(): FeatureCollection<EditableGeometry> {
    return this.features.allGeoJSON;
  }
}
