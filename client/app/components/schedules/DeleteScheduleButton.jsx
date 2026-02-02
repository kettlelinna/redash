import { isString } from "lodash";
import React from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import Tooltip from "@/components/Tooltip";
import notification from "@/services/notification";
import Schedule from "@/services/schedule";

function deleteSchedule(event, schedule, onScheduleDeleted) {
  Modal.confirm({
    title: "Delete Schedule",
    content: "Are you sure you want to delete this schedule?",
    okText: "Yes",
    okType: "danger",
    cancelText: "No",
    onOk: () => {
      Schedule.delete(schedule).then(() => {
        notification.success("Schedule deleted successfully.");
        onScheduleDeleted();
      });
    },
  });
}

export default function DeleteScheduleButton({ schedule, title, onClick, children, ...props }) {
  if (!schedule) {
    return null;
  }
  const button = (
    <Button {...props} type="danger" onClick={event => deleteSchedule(event, schedule, onClick)}>
      {children}
    </Button>
  );

  if (isString(title) && title !== "") {
    return (
      <Tooltip placement="top" title={title} mouseLeaveDelay={0}>
        {button}
      </Tooltip>
    );
  }

  return button;
}

DeleteScheduleButton.propTypes = {
  schedule: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  title: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
};

DeleteScheduleButton.defaultProps = {
  schedule: null,
  title: null,
  onClick: () => {},
  children: null,
};
