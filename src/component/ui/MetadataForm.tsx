import React, { useCallback, useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput as NativeTextInput,
  View,
} from 'react-native';
import type { TextInputProps as NativeTextInputProps } from 'react-native';
import {
  Divider,
  HelperText,
  Paragraph,
  Switch,
  TextInput,
  TouchableRipple,
} from 'react-native-paper';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
/**
 * React Native Paper does not have a dropdown select component
 * https://github.com/callstack/react-native-paper/issues/603
 */
import DropDown from 'react-native-paper-dropdown';
import { useFormikContext } from 'formik';

import { FieldType } from '../../type/metadata';
import type {
  FieldDescription,
  EnumFieldDescription,
  MetadataFormStructure,
  MetadataFormValues,
} from '../../type/metadata';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

/**
 * A component that renders a Formik form field for editing a string value
 * @param props Form field data and rendering options
 */
function StringField({
  item,
  customTextInput,
}: {
  /**
   * The field data (other than Formik-provided data)
   */
  item: FieldDescription;
  /**
   * An alternative component to render for the text input field
   */
  customTextInput?:
    | ((props: NativeTextInputProps) => React.ReactNode)
    | undefined;
}) {
  const formik = useFormikContext<MetadataFormValues>(); // Retrieve Formik data
  const showError = !!(formik.touched[item.key] && formik.errors[item.key]);
  return (
    <>
      <TextInput
        value={formik.values[item.key] as string}
        mode="outlined"
        label={item.label}
        error={showError}
        onChangeText={formik.handleChange(item.key)}
        onBlur={formik.handleBlur(item.key)}
        render={customTextInput}
      />
      <HelperText type="error" padding="none" visible={showError}>
        {formik.errors[item.key]}
      </HelperText>
    </>
  );
}

/**
 * A `TextInput` component for the user to enter numeric data
 * @param props React Native `TextInput` props
 */
function NumericTextInput(props: NativeTextInputProps) {
  return <NativeTextInput {...props} keyboardType="numeric" />;
}

/**
 * A component that renders a Formik form field for editing a numeric value
 * @param props Form field data
 */
function NumberField({
  item,
}: {
  /**
   * The field data (other than Formik-provided data)
   */
  item: FieldDescription;
}) {
  return <StringField item={item} customTextInput={NumericTextInput} />;
}

/**
 * A component that renders a Formik form field for selecting from a list of values
 * @param props Form field data
 */
function EnumField({
  item,
}: {
  /**
   * The field data (other than Formik-provided data)
   */
  item: EnumFieldDescription;
}) {
  const formik = useFormikContext<MetadataFormValues>(); // Retrieve Formik data
  const showError = !!(formik.touched[item.key] && formik.errors[item.key]);
  // Dropdown select open/closed state
  const [showDropDown, setShowDropDown] = useState(false);
  // Dropdown select options data
  const optionList = item.options.map((val) => {
    return {
      label: val.toLowerCase(),
      value: val,
    };
  });

  return (
    <>
      <DropDown
        label={item.label}
        mode={'outlined'}
        value={formik.values[item.key] as string}
        setValue={
          formik.handleChange(item.key) as (_e: React.ReactText) => void
        }
        list={optionList}
        visible={showDropDown}
        showDropDown={() => setShowDropDown(true)}
        onDismiss={() => setShowDropDown(false)}
        inputProps={{
          right: <TextInput.Icon name={'menu-down'} />,
          error: showError,
          onBlur: formik.handleBlur(item.key),
        }}
      />
      <HelperText type="error" padding="none" visible={showError}>
        {formik.errors[item.key]}
      </HelperText>
    </>
  );
}

/**
 * A component that renders a Formik form field for choosing a boolean value
 * @param props Form field data
 */
function BooleanField({
  item,
}: {
  /**
   * The field data (other than Formik-provided data)
   */
  item: FieldDescription;
}) {
  const formik = useFormikContext<MetadataFormValues>(); // Retrieve Formik data
  const showError = !!formik.errors[item.key];
  const booleanValue = !!formik.values[item.key];
  /**
   * Invert the field value whenever the switch flips
   */
  const changeValue = useCallback(
    () => formik.setFieldValue(item.key, !booleanValue),
    [formik, item, booleanValue]
  );

  /**
   * Platform-specific ways of rendering switches
   * See https://github.com/callstack/react-native-paper/blob/master/example/src/Examples/SwitchExample.tsx
   */
  let switchComponent = null;
  if (Platform.OS === 'android') {
    /**
     * Render an Android ripple effect
     */
    switchComponent = (
      <TouchableRipple onPress={changeValue}>
        <View style={styles.switchRow}>
          <Paragraph>{item.label}</Paragraph>
          <View pointerEvents="none">
            <Switch value={booleanValue} />
          </View>
        </View>
      </TouchableRipple>
    );
  } else {
    switchComponent = (
      <View style={styles.switchRow}>
        <Paragraph>{item.label}</Paragraph>
        <Switch value={booleanValue} onValueChange={changeValue} />
      </View>
    );
  }
  /**
   * Also render any error message
   */
  return (
    <>
      {switchComponent}
      <HelperText type="error" padding="none" visible={showError}>
        {formik.errors[item.key]}
      </HelperText>
    </>
  );
}

/**
 * A component that renders a Formik form field of the appropriate type,
 * depending on the description of the field
 * @param props Form field description
 */
function ListItem({
  item,
}: {
  /**
   * The field data description (other than Formik-provided data)
   */
  item: FieldDescription;
}) {
  let field = null;
  switch (item.type) {
    case FieldType.Boolean:
      field = <BooleanField item={item} />;
      break;
    case FieldType.Enum:
      field = <EnumField item={item as EnumFieldDescription} />;
      break;
    case FieldType.Number:
      field = <NumberField item={item} />;
      break;
    case FieldType.String:
      field = <StringField item={item} />;
      break;
  }
  return field;
}

/**
 * React Native `FlatList` `keyExtractor` function for
 * the list of Formik form fields
 * @param item List data element
 */
function KeyExtractor(item: FieldDescription) {
  return item.key;
}

/**
 * A component to render when there are no fields in the Formik form
 * description
 */
function EmptyForm() {
  return <Paragraph>No details can be edited</Paragraph>;
}

/**
 * Render a list of Formik fields for metadata editing
 * @param props Rendering props
 */
export function MetadataFieldList({
  formFieldList,
}: {
  /**
   * A list of form field descriptions (excluding Formik field data)
   */
  formFieldList: MetadataFormStructure;
}) {
  return (
    <KeyboardAwareFlatList
      data={formFieldList}
      renderItem={ListItem}
      keyExtractor={KeyExtractor}
      ItemSeparatorComponent={Divider}
      ListEmptyComponent={EmptyForm}
      enableOnAndroid={true}
    />
  );
}
