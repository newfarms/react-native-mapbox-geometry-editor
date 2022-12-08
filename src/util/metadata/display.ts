import isEmpty from 'lodash/isEmpty';

import { MetadataInteraction } from '../../type/metadata';
import type {
  FieldAttributes,
  Metadata,
  MetadataAttributes,
} from '../../type/metadata';

/**
 * Test if a value is considered non-empty for the purposes of
 * geometry metadata display and editing
 * @param value
 * @return `true` if the value is non-empty.
 */
export function hasValue(value: unknown): boolean {
  let exists = false;
  switch (typeof value) {
    case 'string':
      exists = !!value;
      break;
    case 'number': // Treat `NaN` and zero as non-empty
    case 'boolean':
      exists = true;
      break;
    default:
      exists = !!value;
  }
  return exists;
}

/**
 * A predicate that determines whether a metadata field can be subject
 * to the given usage based on the field's attributes and current value.
 *
 * See also {@link canUseMetadata}
 *
 * @param attributes Attributes of the field
 * @param value The current value of the field
 * @param use The requested use of the field
 * @return An object containing the permission test result and
 *         indicating whether the field's value is empty
 *         (as tested by {@link hasValue})
 */
export function canUseField(
  attributes: FieldAttributes,
  value: unknown,
  use: MetadataInteraction
): {
  /**
   * Whether the operation is permitted
   */
  canUse: boolean;
  /**
   * Whether `value` is non-empty according to {@link hasValue}
   */
  exists: boolean;
} {
  /**
   * Determine if the field has a value
   */
  const exists = hasValue(value);

  /**
   * Enforce permissions given in the field attributes
   */
  let canUse = false;
  if (attributes.permissions.view) {
    switch (use) {
      case MetadataInteraction.Create:
      case MetadataInteraction.Edit:
        if (exists && attributes.permissions.edit) {
          canUse = true;
        } else if (!exists && attributes.permissions.create) {
          canUse = true;
        }
        break;
      case MetadataInteraction.ViewDetails:
        if (!exists && attributes.showIfEmpty) {
          canUse = true;
        } else if (exists) {
          canUse = true;
        }
        break;
      case MetadataInteraction.ViewPreview:
        if (attributes.inPreview) {
          if (!exists && attributes.showIfEmpty) {
            canUse = true;
          } else if (exists) {
            canUse = true;
          }
        }
        break;
    }
  }

  return { exists, canUse };
}

/**
 * A predicate that determines whether a metadata object can be subject
 * to the given usage based on the object's attributes and current value.
 *
 * See also {@link canUseField}
 *
 * @param attributes Attributes of the object
 * @param value The metadata object
 * @param use The requested use of the object
 * @return An object containing the permission test result and
 *         indicating whether the object is empty
 */
export function canUseMetadata(
  attributes: MetadataAttributes,
  value: Metadata | null | undefined,
  use: MetadataInteraction
): {
  /**
   * Whether the operation is permitted
   */
  canUse: boolean;
  /**
   * Whether `value` is non-empty
   */
  exists: boolean;
} {
  const exists = !isEmpty(value);

  /**
   * Enforce permissions given in the attributes
   */
  let canUse = false;
  if (attributes.permissions.view) {
    switch (use) {
      case MetadataInteraction.Create:
      case MetadataInteraction.Edit:
        if (exists && attributes.permissions.edit) {
          canUse = true;
        } else if (!exists && attributes.permissions.create) {
          canUse = true;
        }
        break;
      case MetadataInteraction.ViewDetails:
      case MetadataInteraction.ViewPreview:
        if (!exists && attributes.showIfEmpty) {
          canUse = true;
        } else if (exists) {
          canUse = true;
        }
        break;
    }
  }

  return { exists, canUse };
}

/**
 * Extract a title for a metadata object
 * @param attributes Attributes describing where to find the title
 * @param data The object from which to extract a title
 * @return A title, possibly a default value
 */
export function getTitle(
  attributes: MetadataAttributes,
  data?: Metadata | null
): string {
  if (data) {
    if (attributes.titleFieldKey) {
      const titleFieldValue = data[attributes.titleFieldKey];
      if (titleFieldValue) {
        return titleFieldValue;
      }
    }
  }
  if (attributes.title) {
    return attributes.title;
  }
  return 'Untitled';
}
