import { model, Model, prop } from 'mobx-keystone';

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
  title: prop<string>('Confirmation'),
}) {}
