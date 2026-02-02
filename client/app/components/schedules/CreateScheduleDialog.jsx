import React from "react";
import Modal from "antd/lib/modal";
import Input from "antd/lib/input";
import { wrap as wrapDialog, DialogPropType } from "@/components/DialogWrapper";

class CreateScheduleDialog extends React.Component {
  static propTypes = {
    dialog: DialogPropType.isRequired,
  };

  state = {
    name: "",
    payload: "",
  };

  save = () => {
    this.props.dialog.close({
      name: this.state.name,
      payload: this.state.payload
    });
  };

  render() {
    const { dialog } = this.props;
    return (
      <Modal {...dialog.props} title="Create a New Schedule" okText="Create" onOk={() => this.save()}>
        <Input
          className="form-control"
          defaultValue={this.state.name}
          onChange={event => this.setState({ name: event.target.value })}
          onPressEnter={() => this.save()}
          placeholder="Schedule Name"
          aria-label="Schedule name"
          autoFocus
        />
        <Input
          className="payload-content"
          defaultValue={this.state.payload}
          onChange={event => this.setState({ payload: event.target.value })}
          onPressEnter={() => this.save()}
          placeholder="Schedule Name"
          aria-label="Schedule name"
          autoFocus
        />
      </Modal>
    );
  }
}

export default wrapDialog(CreateScheduleDialog);
