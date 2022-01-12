import { useContext } from 'react';
import { toJS } from 'mobx';

import { StoreContext } from '../state/StoreContext';
import { InteractionMode } from '../state/ControlsModel';
import { MetadataContext } from '../component/ui/metadata/MetadataContext';
import { makeMetadataFormStarter } from '../util/metadata/schema';
import { canUseMetadata } from '../util/metadata/display';
import { MetadataInteraction } from '../type/metadata';
import type {
  Metadata,
  MetadataSchema,
  MetadataFormStarter,
} from '../type/metadata';
import type { EditableFeature, SemanticGeometryType } from 'src/type/geometry';

/**
 * A React hook that integrates geometry metadata information from state stores
 * with geometry metadata schema information from render props and outputs
 * data needed to render geometry metadata.
 *
 * Note: This hook must be called from a React component that is a MobX observer.
 *
 * @param use The purpose for which the caller needs to render geometry metadata
 */
export function useMetadata(use: MetadataInteraction): {
  /**
   * Whether the use of geometry metadata is permitted in this context.
   * Caution: This value may be `true` in cases where there is no available metadata.
   * Callers must also check `contextExists`.
   */
  canUse: boolean;
  /**
   * Any geometry metadata currently available
   */
  data: Metadata | null | undefined;
  /**
   * Whether `data` is defined and non-empty
   */
  dataExists: boolean;
  /**
   * Information for building metadata forms
   */
  formStarter: MetadataFormStarter;
  /**
   * Whether there is state (feature or editing context) that has metadata
   * suitable for the purpose described by `use`. If this value is `false`,
   * callers should disregard the other attributes of this object.
   * In that case, the other attributes are output just to allow for memoization
   * based on their values.
   */
  contextExists: boolean;
} {
  // Input data sources
  const { controls, features } = useContext(StoreContext);
  const { newGeometry, existingGeometry } = useContext(MetadataContext);

  // Any existing metadata
  let data: Metadata | null | undefined = null;
  // Whether or not there is a feature or context with which to use metadata
  let contextExists = false;

  /**
   * Generate the appropriate metadata schema
   */
  let schemaSource: MetadataSchema | null = null;
  if (use === MetadataInteraction.Create) {
    let type: SemanticGeometryType = 'Point';
    switch (controls.mode) {
      case InteractionMode.DrawPoint:
        type = 'Point';
        break;
      case InteractionMode.DrawPolygon:
        type = 'Polygon';
        break;
      case InteractionMode.DrawPolyline:
        type = 'LineString';
        break;
      default:
        throw new Error(
          `The current editing mode is ${controls.mode}, but the current metadata interaction is ${use}.`
        );
    }
    schemaSource = newGeometry(type);
    /**
     * The following is needed to reset the metadata creation form between
     * uses (i.e. after each new geometry feature is created).
     * The code ensures that `contextExists` always changes from `true` to
     * `false` and back again between features.
     */
    switch (type) {
      case 'Point':
        contextExists = features.hasCompleteNewFeature;
        break;
      case 'Polygon':
      case 'LineString':
        contextExists = features.canUndoOrRedo;
        break;
    }
  } else {
    /**
     * Obtain any feature providing metadata for rendering
     */
    let feature: EditableFeature | undefined;
    switch (use) {
      case MetadataInteraction.Edit:
        feature = toJS(features.draftMetadataGeoJSON);
        break;
      case MetadataInteraction.ViewDetails:
      case MetadataInteraction.ViewPreview:
        feature = toJS(features.focusedFeature?.geojson);
        break;
    }

    if (feature) {
      // TODO: Update the semantic type in the future if it no longer matches the geometry type
      schemaSource = existingGeometry(feature.geometry.type, feature);
      // Metadata associated with the feature
      data = feature.properties;
      contextExists = true;
    }
  }

  const formStarter = makeMetadataFormStarter(schemaSource, data);
  if (formStarter.schemaErrors) {
    console.warn(
      'Metadata schema description parsing errors: ',
      formStarter.schemaErrors
    );
  }

  // Check access permissions
  let { canUse, exists } = canUseMetadata(
    formStarter.formStructure.attributes,
    data,
    use
  );
  // If no metadata schema was provided, disallow all uses of metadata
  if (!schemaSource) {
    canUse = false;
  }

  return {
    canUse,
    data,
    dataExists: exists,
    formStarter,
    contextExists,
  };
}
