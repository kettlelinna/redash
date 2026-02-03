import React, { useCallback } from "react";
import { isNil, get } from "lodash";

import Modal from "antd/lib/modal";
import Button from "antd/lib/button";
import PropTypes from "prop-types";
import { wrap as wrapDialog, DialogPropType } from "@/components/DialogWrapper";
import {useUniqueId} from "@/lib/hooks/useUniqueId";
import DynamicForm from "@/components/dynamic-form/DynamicForm";


function ScheduleDialog({ schedule, dialog, readOnly }) {
  const handleSubmit = useCallback(
    (values, successCallback, errorCallback) => {
      const scheduleId = get(schedule, "id");

      if (isNil(values.description)) {
        values.description = "";
      }

      dialog
        .close(scheduleId ? { id: scheduleId, ...values } : values)
        .then(() => successCallback("Saved."))
        .catch(() => errorCallback("Failed saving schedule."));
    },
    [dialog, schedule]
  );

  const isEditing = !!get(schedule, "id");

  const formFields = [
    { name: "name", title: "Trigger", type: "text", required: true, autoFocus: !isEditing },
    { name: "description", title: "Description", type: "text" },
    { name: "payload", title: "Payload", type: "ace", required: true },
  ].map(field => ({ ...field, readOnly, initialValue: get(schedule, field.name, "") }));

  const scheduleFormId = useUniqueId("scheduleForm");

  return (
    <Modal
      {...dialog.props}
      title={isEditing ? schedule.name : "Create Schedule"}
      footer={[
        <Button key="cancel" {...dialog.props.cancelButtonProps} onClick={dialog.dismiss}>
          {readOnly ? "Close" : "Cancel"}
        </Button>,
        !readOnly && (
          <Button
            key="submit"
            {...dialog.props.okButtonProps}
            disabled={readOnly || dialog.props.okButtonProps.disabled}
            htmlType="submit"
            type="primary"
            form={scheduleFormId}
            data-test="SaveScheduleButton">
            {isEditing ? "Save" : "Create"}
          </Button>
        ),
      ]}
      wrapProps={{
        "data-test": "ScheduleDialog",
      }}>
      <DynamicForm
        id={scheduleFormId}
        fields={formFields}
        onSubmit={handleSubmit}
        hideSubmitButton
        feedbackIcons
      />
    </Modal>
  );
}

ScheduleDialog.propTypes = {
  dialog: DialogPropType.isRequired,
  schedule: PropTypes.object,
  readOnly: PropTypes.bool,
};

ScheduleDialog.defaultProps = {
  schedule: null,
  readOnly: false,
};

export default wrapDialog(ScheduleDialog);
