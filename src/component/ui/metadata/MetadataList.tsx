import { Fragment, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import {
  Divider,
  List,
  Paragraph,
  Switch,
  Text,
  Title,
} from 'react-native-paper';
import filter from 'lodash/filter';

import {
  canUseField,
  canUseMetadata,
  getTitle,
  hasValue,
} from '../../../util/metadata/display';
import { FieldType, MetadataInteraction } from '../../../type/metadata';
import type {
  DisplayableFieldDescription,
  EnumFieldDescription,
  Metadata,
  MetadataFormStructure,
} from '../../../type/metadata';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  listHeader: {
    paddingVertical: '5%',
  },
  listItemAddon: {
    flexDirection: 'column',
    alignSelf: 'center',
  },
  paragraph: {
    alignSelf: 'center',
  },
});

/**
 * The type of data expected by each item component rendered in the list,
 * excluding the field value.
 */
interface ListItemData extends DisplayableFieldDescription {
  /**
   * Whether to render the label of the item
   */
  includeLabel: boolean;
}

/**
 * Text to display when a value is missing
 */
const emptyText = '(empty)';

/**
 * A component that renders a string value
 * @param item Data and rendering options
 */
function StringItem(
  item: ListItemData & {
    /**
     * The data to render
     */
    value?: string;
  }
) {
  let paragraphText = emptyText;
  if (hasValue(item.value)) {
    paragraphText = item.value as string;
  }
  let label = null;
  if (item.includeLabel) {
    label = <List.Item title={item.label} />;
  }
  return (
    <>
      {label}
      <Paragraph style={styles.paragraph}>{paragraphText}</Paragraph>
    </>
  );
}

/**
 * A component that renders a numeric value
 * @param item Data and rendering options
 */
function NumberItem(
  item: ListItemData & {
    /**
     * The data to render
     */
    value?: number;
  }
) {
  let numberText = emptyText;
  if (hasValue(item.value)) {
    numberText = (item.value as number).toString();
  }
  if (item.includeLabel) {
    return (
      <List.Item
        title={item.label}
        right={(props: {
          color: string;
          style?: { marginRight: number; marginVertical?: number };
        }) => {
          const { style: propsStyle, ...propsRest } = props;
          return (
            <Text {...propsRest} style={[propsStyle, styles.listItemAddon]}>
              {numberText}
            </Text>
          );
        }}
      />
    );
  } else {
    return <StringItem {...item} value={numberText} />;
  }
}

/**
 * A component that renders an enum value
 * @param item Data and rendering options
 */
function EnumItem(
  item: ListItemData &
    EnumFieldDescription & {
      /**
       * The data to render
       * This component does not check if `value` is a member of the enum.
       */
      value?: string;
    }
) {
  return <StringItem {...item} />;
}

/**
 * A component that renders a boolean value
 * @param item Data and rendering options
 */
function BooleanItem(
  item: ListItemData & {
    /**
     * The data to render
     */
    value?: boolean;
  }
) {
  const nonEmpty = hasValue(item.value);
  if (item.includeLabel) {
    return (
      <List.Item
        title={item.label}
        right={(props: {
          color: string;
          style?: { marginRight: number; marginVertical?: number };
        }) => {
          if (nonEmpty) {
            return <Switch {...props} disabled={true} value={item.value} />;
          } else {
            return <Text {...props}>{emptyText}</Text>;
          }
        }}
      />
    );
  } else {
    if (nonEmpty) {
      return (
        <Switch style={styles.paragraph} disabled={true} value={item.value} />
      );
    } else {
      return <Text style={styles.paragraph}>{emptyText}</Text>;
    }
  }
}

/**
 * A component that renders an individual metadata field's value
 * @param props Field description and value
 */
function ListItem({
  item,
}: {
  /**
   * The field data description and value
   */
  item: ListItemData & {
    value?: unknown;
  };
}) {
  let field = null;
  const value = item.value;
  switch (item.type) {
    case FieldType.Boolean:
      field = <BooleanItem {...item} value={value as boolean | undefined} />;
      break;
    case FieldType.Enum:
      field = (
        <EnumItem
          {...(item as ListItemData & EnumFieldDescription)}
          value={value as string | undefined}
        />
      );
      break;
    case FieldType.Number:
      field = <NumberItem {...item} value={value as number | undefined} />;
      break;
    case FieldType.String:
      field = <StringItem {...item} value={value as string | undefined} />;
      break;
  }
  return field;
}

/**
 * React Native `FlatList` `keyExtractor` function for
 * the list of fields
 * @param item List data element
 */
function KeyExtractor(item: DisplayableFieldDescription) {
  return item.key;
}

/**
 * A component to render when there are no items to render
 */
function EmptyForm() {
  return <Paragraph>No details can be displayed</Paragraph>;
}

/**
 * Render geometry metadata for display
 * @param props Rendering props
 */
export function MetadataFieldList({
  formStructure,
  use,
  data,
  includeTitle = true,
  includeLabels = true,
}: {
  /**
   * A description of the metadata
   */
  formStructure: MetadataFormStructure;
  /**
   * The purpose for which the data is being rendered
   */
  use: MetadataInteraction.ViewDetails | MetadataInteraction.ViewPreview;
  /**
   * The current metadata object
   */
  data?: Metadata | null;
  /**
   * Whether to add the title of the metadata as the list's header
   */
  includeTitle?: boolean;
  /**
   * Whether to render field labels
   */
  includeLabels?: boolean;
}) {
  /**
   * Cull fields that cannot be displayed
   */
  const filteredFieldList = useMemo(() => {
    /**
     * Cull all fields if the entire metadata object cannot be used
     */
    const { canUse, exists } = canUseMetadata(
      formStructure.attributes,
      data,
      use
    );
    if (canUse && exists) {
      /**
       * Cull individual fields if they cannot be used,
       * or if the data object has values of the wrong types
       */
      return filter(formStructure.fields, (field) => {
        let value = data?.[field.key];
        const { canUse: fieldPermission, exists: fieldExists } = canUseField(
          field.attributes,
          value,
          use
        );
        let typeError = false;
        /**
         * Fields with no value can be displayed, but not fields with the wrong
         * type of value
         */
        if (fieldExists) {
          switch (field.type) {
            case FieldType.Boolean:
              if (typeof value !== 'boolean') {
                console.warn(
                  `Non-boolean value encountered under field ${field.key}`
                );
                typeError = true;
              }
              break;
            case FieldType.Enum:
              if (typeof value !== 'string') {
                console.warn(
                  `Non-string value encountered under enum field ${field.key}`
                );
                typeError = true;
              }
              break;
            case FieldType.Number:
              if (typeof value !== 'number') {
                console.warn(
                  `Non-number value encountered under number field ${field.key}`
                );
                typeError = true;
              }
              break;
            case FieldType.String:
              if (typeof value !== 'string') {
                console.warn(
                  `Non-string value encountered under string field ${field.key}`
                );
                typeError = true;
              }
              break;
          }
        }
        return fieldPermission && !typeError;
      }).map((item) => {
        /**
         * Package field descriptions with data values for {@link ListItem}
         */
        return {
          value: data?.[item.key],
          includeLabel: includeLabels,
          ...item,
        };
      });
    } else {
      return [];
    }
  }, [formStructure, use, data, includeLabels]);

  /**
   * Optional list header component
   */
  const ListHeader = useCallback(
    (props) => {
      if (includeTitle) {
        return (
          <Title {...props}>{getTitle(formStructure.attributes, data)}</Title>
        );
      } else {
        return null;
      }
    },
    [formStructure, data, includeTitle]
  );

  /**
   * When rendering a preview, render a non-scrolling list.
   * When rendering a full details view, render a scrolling list.
   */
  switch (use) {
    case MetadataInteraction.ViewDetails:
      return (
        <FlatList
          data={filteredFieldList}
          renderItem={ListItem}
          keyExtractor={KeyExtractor}
          ItemSeparatorComponent={Divider}
          ListEmptyComponent={EmptyForm}
          ListHeaderComponent={ListHeader}
          ListHeaderComponentStyle={styles.listHeader}
        />
      );
    case MetadataInteraction.ViewPreview:
      let listBody = null;
      if (filteredFieldList.length > 0) {
        listBody = (
          <>
            {filteredFieldList.map((item) => {
              return (
                <Fragment key={item.key}>
                  <ListItem item={item} />
                  <Divider />
                </Fragment>
              );
            })}
          </>
        );
      } else {
        listBody = <EmptyForm />;
      }
      return (
        <>
          <ListHeader style={styles.listHeader} />
          {listBody}
        </>
      );
  }
}
