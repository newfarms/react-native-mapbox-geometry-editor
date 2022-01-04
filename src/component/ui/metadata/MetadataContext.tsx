import { createContext } from 'react';

import { defaultMetadataSchemaGeneratorMap } from '../../../util/metadata/schema';

/**
 * A React context used to give children components access to metadata schema
 * generators
 */
export const MetadataContext = createContext(defaultMetadataSchemaGeneratorMap);
