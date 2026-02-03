import { isEmpty, reject } from "lodash";
import React from "react";
import PropTypes from "prop-types";

import Button from "antd/lib/button";
import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import navigateTo from "@/components/ApplicationArea/navigateTo";
import CardsList from "@/components/cards-list/CardsList";
import LoadingState from "@/components/items-list/components/LoadingState";
import CreateSourceDialog from "@/components/CreateSourceDialog";
import DynamicComponent, { registerComponent } from "@/components/DynamicComponent";
import helper from "@/components/dynamic-form/dynamicFormHelper";
import wrapSettingsTab from "@/components/SettingsWrapper";
import PlainButton from "@/components/PlainButton";

import DataSource, { IMG_ROOT } from "@/services/data-source";
import { policy } from "@/services/policy";
import recordEvent from "@/services/recordEvent";
import routes from "@/services/routes";
import {ControllerType} from "@/components/items-list/ItemsList";
import {Columns} from "@/components/items-list/components/ItemsTable";

class SchedulesList3 extends React.Component {
  static propTypes = {
    controller: ControllerType.isRequired,
  };

  listColumns = [
    Columns.custom(
      (text, schedule) => (
        <div>
          {schedule.name}
        </div>
      ),
      {
        field: "name",
        width: null,
      }
    ),
  ];

  render() {
    const { controller } = this.props;

    return (
      <div>
        Hello World
      </div>
    );
  }
}

const SchedulesListPage = wrapSettingsTab(
  "Schedules3.List",
  {
    permission: "admin",
    title: "Schedules3",
    path: "schedules3",
    order: 9,
  },
  SchedulesList3
);

routes.register(
  "Schedules3.List",
  routeWithUserSession({
    path: "/schedules3",
    title: "Schedules3",
    render: pageProps => <SchedulesListPage {...pageProps} currentPage="schedules3" />,
  })
);
