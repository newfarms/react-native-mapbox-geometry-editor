import React from 'react';

import { defaultMetadataSchemaGenerator } from '../../../util/metadata/schema';

/**
 * A React context used to give children components access to metadata schema
 * generators
 */
export const MetadataContext = React.createContext({
  /**
   * Default metadata generator
   */
  metadataSchemaGenerator: defaultMetadataSchemaGenerator,
});
