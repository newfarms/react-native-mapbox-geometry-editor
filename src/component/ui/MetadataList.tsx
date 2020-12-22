import React, { useCallback, useMemo } from 'react';
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
} from '../../util/metadata/display';
import { FieldType, MetadataInteraction } from '../../type/metadata';
import type {
  DisplayableFieldDescription,
  EnumFieldDescription,
  Metadata,
  MetadataFormStructure,
} from '../../type/metadata';

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
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
});

/**
 * Text to display when a value is missing
 */
const emptyText = '(empty)';

/**
 * A component that renders a string value
 * @param props Data and rendering options
 */
function StringItem({
  item,
  value,
}: {
  /**
   * The field description
   */
  item: DisplayableFieldDescription;
  /**
   * The data to render
   */
  value?: string;
}) {
  let paragraphText = emptyText;
  if (hasValue(value)) {
    paragraphText = value as string;
  }
  return (
    <>
      <List.Item title={item.label} />
      <Paragraph style={styles.paragraph}>{paragraphText}</Paragraph>
    </>
  );
}

/**
 * A component that renders a numeric value
 * @param props Data and rendering options
 */
function NumberItem({
  item,
  value,
}: {
  /**
   * The field description
   */
  item: DisplayableFieldDescription;
  /**
   * The data to render
   */
  value?: number;
}) {
  let numberText = emptyText;
  if (hasValue(value)) {
    numberText = (value as number).toString();
  }
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
}

/**
 * A component that renders an enum value
 * @param props Data and rendering options
 */
function EnumItem({
  item,
  value,
}: {
  /**
   * The field description
   */
  item: EnumFieldDescription;
  /**
   * The data to render
   * This component does not check if `value` is a member of the enum.
   */
  value?: string;
}) {
  return <StringItem item={item} value={value} />;
}

/**
 * A component that renders a boolean value
 * @param props Data and rendering options
 */
function BooleanItem({
  item,
  value,
}: {
  /**
   * The field description
   */
  item: DisplayableFieldDescription;
  /**
   * The data to render
   * This component does not check if `value` is a member of the enum.
   */
  value?: boolean;
}) {
  return (
    <List.Item
      title={item.label}
      right={(props: {
        color: string;
        style?: { marginRight: number; marginVertical?: number };
      }) => {
        if (hasValue(value)) {
          return <Switch {...props} disabled={true} value={value} />;
        } else {
          return <Text {...props}>{emptyText}</Text>;
        }
      }}
    />
  );
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
  item: DisplayableFieldDescription & {
    value?: unknown;
  };
}) {
  let field = null;
  const value = item.value;
  switch (item.type) {
    case FieldType.Boolean:
      field = <BooleanItem item={item} value={value as boolean} />;
      break;
    case FieldType.Enum:
      field = (
        <EnumItem
          item={(item as unknown) as EnumFieldDescription}
          value={value as string}
        />
      );
      break;
    case FieldType.Number:
      field = <NumberItem item={item} value={value as number} />;
      break;
    case FieldType.String:
      field = <StringItem item={item} value={value as string} />;
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
  includeTitle,
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
         * Package field descriptions with data values for [[ListItem]]
         */
        return {
          value: data?.[item.key],
          ...item,
        };
      });
    } else {
      return [];
    }
  }, [formStructure, use, data]);

  /**
   * Optional list header component
   */
  const ListHeader = useCallback(
    (props) => {
      if (typeof includeTitle !== 'boolean' || includeTitle) {
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
              return <ListItem item={item} key={item.key} />;
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
