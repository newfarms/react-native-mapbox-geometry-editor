import { useContext } from 'react';
import { toJS } from 'mobx';

import { StoreContext } from '../state/StoreContext';
import { MetadataContext } from '../component/ui/MetadataContext';
import { makeMetadataFormStarter } from '../util/metadata/schema';
import { canUseMetadata } from '../util/metadata/display';
import { MetadataInteraction } from '../type/metadata';
import type {
  Metadata,
  MetadataSchema,
  MetadataFormStarter,
} from '../type/metadata';
import type { EditableFeature } from 'src/type/geometry';

/**
 * A React hook that integrates geometry metadata information from state stores
 * with geometry metadata schema information from render props and outputs
 * data needed to render geometry metadata.
 *
 * Note: This hook must be called from a React component that is a MobX observer.
 *
 * @param use The purpose for which the caller needs to render geometry metadata
 */
export function useMetadata(
  use: MetadataInteraction
): {
  /**
   * Whether the use of geometry metadata is permitted in this context.
   * Caution: This value may be `true` in cases where there is no available metadata.
   * Callers must also check `featureExists`.
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
   * Whether there is a shape that has metadata suitable for the purpose
   * described by `use`. If this value is `false`, callers should disregard
   * the other attributes of this object. In that case, the other attributes
   * are output just to allow for memoization based on their values.
   */
  featureExists: boolean;
} {
  // Input data sources
  const { features } = useContext(StoreContext).store;
  const { metadataSchemaGenerator } = useContext(MetadataContext);

  /**
   * Obtain any feature providing metadata for rendering
   */
  let feature: EditableFeature | undefined;
  switch (use) {
    case MetadataInteraction.Create:
    case MetadataInteraction.Edit:
      feature = toJS(features.draftMetadataGeoJSON);
      break;
    case MetadataInteraction.ViewDetails:
    case MetadataInteraction.ViewPreview:
      feature = toJS(features.focusedFeature?.geojson);
      break;
  }
  // Metadata associated with the feature
  const data = feature?.properties as Metadata | null | undefined;

  /**
   * Process the metadata according to the metadata schema
   */
  let schemaSource: MetadataSchema | null = null;
  if (feature) {
    schemaSource = metadataSchemaGenerator(feature);
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
  if (feature && !schemaSource) {
    canUse = false;
  }

  return {
    canUse,
    data,
    dataExists: exists,
    formStarter,
    featureExists: !!feature,
  };
}
