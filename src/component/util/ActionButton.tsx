import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  button: {
    margin: 5,
  },
});

/**
 * For some reason, React Native Paper does not export these types,
 * so re-copy them here in order for TypeScript to understand
 * what {@link IconSource} is.
 */
type IconSourceBase = string | ImageSourcePropType;
type IconProps = {
  size: number;
  allowFontScaling?: boolean;
};
type IconSource =
  | IconSourceBase
  | Readonly<{
      source: IconSourceBase;
      direction: 'rtl' | 'ltr' | 'auto';
    }>
  | ((
      props: IconProps & {
        color: string;
      }
    ) => ReactNode);

/**
 * Extra rendering properties used by React Native Paper's FAB
 * that are not directly used by {@link ActionButton}
 */
export interface RestProps {
  icon: IconSource;
  [name: string]: unknown;
}

/**
 * A wrapper for React Native Paper's Floating Action Button (FAB)
 * that uses custom styling.
 * @param props  Rendering props
 */
export function ActionButton({
  disabled,
  style,
  ...restProps
}: {
  /**
   * Whether the button is disabled
   */
  disabled: boolean;
  /**
   * Any custom style options (that will override the styling internal to this component)
   */
  style?: StyleProp<ViewStyle>;
} & RestProps) {
  /**
   * Use a colour scheme that is more consistent with the rest of the user interface
   */
  const { colors } = useTheme();
  let backgroundColor = colors.onSurface;
  if (disabled) {
    backgroundColor = colors.disabled;
  }

  return (
    <FAB
      small
      disabled={disabled}
      style={[styles.button, { backgroundColor }, style]}
      {...restProps}
    />
  );
}
