import { useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useFormik } from 'formik';
import type { FormikHelpers } from 'formik';

import { StoreContext } from '../../../state/StoreContext';
import { useMetadata } from '../../../hooks/useMetadata';
import { MetadataInteraction } from '../../../type/metadata';
import type {
  Metadata,
  MetadataFormInitialValues,
  MetadataFormStarter,
} from '../../../type/metadata';
import { MetadataEditorContext } from './MetadataEditorContext';

/**
 * An inner component that {@link MetadataEditorProvider} delegates
 * rendering a metadata editing context to, when the user interface
 * has the appropriate {@link MetadataInteraction}.
 *
 * @param props Render properties
 * @return React children
 */
function _InnerMetadataEditorProvider({
  use,
  canUse,
  isEditOperation,
  data,
  formStarter,
  children,
}: {
  /**
   * The reason for which the metadata editing context is needed
   */
  use: MetadataInteraction.Create | MetadataInteraction.Edit;
  /**
   * Whether metadata editing is possible
   * See {@link useMetadata}
   */
  canUse: boolean;
  /**
   * Whether the context is needed for editing pre-existing metadata.
   * This value is derived from `use`.
   */
  isEditOperation: boolean;
  /**
   * Any geometry metadata currently available
   */
  data: Metadata | null | undefined;
  /**
   * Information for building metadata forms
   */
  formStarter: MetadataFormStarter;
  readonly children?: ReactNode;
}) {
  const { controls } = useContext(StoreContext);

  // Commit on confirmation
  const onConfirm = useMemo(
    () =>
      action(
        'metadata_editor_save',
        (
          values: MetadataFormInitialValues,
          formikBag: FormikHelpers<MetadataFormInitialValues>
        ) => {
          // Ensure that form values are typecast to the schema
          let castValues: object | null | undefined = null;
          try {
            castValues = formStarter.schema.cast(values);
          } catch (err) {
            console.warn(
              `Failed to cast metadata form values before setting geometry metadata. Values are: ${values}, error is ${err}.`
            );
            castValues = null;
          }
          if (!castValues) {
            console.warn(
              'Failed to cast metadata form values before setting geometry metadata. Values are: ',
              values
            );
            castValues = null;
          }
          controls.setPendingMetadata(castValues);
          controls.confirm();
          formikBag.setSubmitting(false);
        }
      ),
    [controls, formStarter]
  );

  /**
   * Package data and callbacks for a context consumer that will render
   * a metadata editing form
   */
  const context = {
    formik: useFormik({
      initialValues: formStarter.formValues,
      onSubmit: onConfirm,
      validationSchema: formStarter.schema,
    }),
    extraData: { formStarter, data, use, canUse, isEditOperation },
  };

  return (
    <MetadataEditorContext.Provider value={context}>
      {children}
    </MetadataEditorContext.Provider>
  );
}

/**
 * Renderable MobX wrapper for {@link _InnerMetadataEditorProvider}
 */
const InnerMetadataEditorProvider = observer(_InnerMetadataEditorProvider);

/**
 * A component that provides a React Context for editing geometry metadata.
 * This component allows a geometry metadata editing form
 * (a consumer of {@link MetadataEditorContext}) to be unmounted
 * and then re-mounted without losing editing state.
 *
 * Caution: This component only renders a metadata editing context provider
 * when the user interface has an appropriate {@link MetadataInteraction}.
 *
 * @param props Render properties
 * @return React children
 */
function _MetadataEditorProvider({
  children,
}: {
  readonly children?: ReactNode;
}) {
  const { controls } = useContext(StoreContext);
  /**
   * Metadata permissions and pre-processing
   */
  const use = controls.metadataInteraction;
  const { canUse, data, formStarter, contextExists } = useMetadata(use);

  /**
   * Render the metadata editor context when appropriate
   */
  if (contextExists) {
    let isEditOperation = false;
    switch (use) {
      case MetadataInteraction.Create:
        break;
      case MetadataInteraction.Edit:
        isEditOperation = true;
        break;
      default:
        // Metadata editing forms should not be rendered
        return <>{children}</>;
    }

    return (
      <InnerMetadataEditorProvider
        use={use}
        canUse={canUse}
        isEditOperation={isEditOperation}
        data={data}
        formStarter={formStarter}
      >
        {children}
      </InnerMetadataEditorProvider>
    );
  } else {
    return <>{children}</>;
  }
}

/**
 * Renderable MobX wrapper for {@link _MetadataEditorProvider}
 */
export const MetadataEditorProvider = observer(_MetadataEditorProvider);
