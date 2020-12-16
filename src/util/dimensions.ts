/**
 * Utilities for working with screen dimensions-dependent values
 * @packageDocumentation
 */

import { Dimensions } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

/**
 * Returns the equivalent density-independent-pixels (DP) value
 * for the desired percentage of the minimum of the screen width and height.
 *
 * @param percentage - A percentage string specifying how large the return value
 *                     should be relative to the minimum screen dimension
 * @return The DP number corresponding to `percentage`
 */
export function minDimensionPercentageToDP(
  percentage: string | number
): number {
  const { width, height } = Dimensions.get('window');
  if (width < height) {
    return wp(percentage);
  } else {
    return hp(percentage);
  }
}
