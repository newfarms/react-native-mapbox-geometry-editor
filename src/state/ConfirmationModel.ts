import { model, Model, prop } from 'mobx-keystone';

export const DEFAULT_CONFIRMATION_TITLE = 'Confirmation';

/**
 * Possible reasons for issuing a confirmation message
 */
export enum ConfirmationReason {
  /**
   * The default reason, used in situations in which no additional
   * state is needed to know what to do when the user confirms
   * or cancels the confirmation message, beyond the binary state
   * of whether or not a confirmation message is open.
   */
  Basic = 'BASIC',
  /**
   * The user is being asked whether or not they wish to save changes
   */
  Commit = 'COMMIT',
  /**
   * The user is being asked whether or not they wish to discard changes
   */
  Discard = 'DISCARD',
}

/**
 * State describing a cancel or confirmation dialog
 */
@model('reactNativeMapboxGeometryEditor/ConfirmationModel')
export class ConfirmationModel extends Model({
  /**
   * The confirmation/cancel message
   */
  message: prop<string>(),
  /**
   * The title of the dialog
   */
  title: prop<string>(DEFAULT_CONFIRMATION_TITLE),
  /**
   * The reason the confirmation dialog is present
   */
  reason: prop<ConfirmationReason>(ConfirmationReason.Basic),
}) {}
