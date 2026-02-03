import React from "react";

import Button from "antd/lib/button";
import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import Link from "@/components/Link";
import navigateTo from "@/components/ApplicationArea/navigateTo";
import Paginator from "@/components/Paginator";

import { wrap as itemsList, ControllerType } from "@/components/items-list/ItemsList";
import { ResourceItemsSource } from "@/components/items-list/classes/ItemsSource";
import { StateStorage } from "@/components/items-list/classes/StateStorage";

import LoadingState from "@/components/items-list/components/LoadingState";
import EmptyState from "@/components/items-list/components/EmptyState";
import ItemsTable, { Columns } from "@/components/items-list/components/ItemsTable";

import CreateScheduleDialog from "@/components/schedules/CreateScheduleDialog";
import DeleteScheduleButton from "@/components/schedules/DeleteScheduleButton";

import Schedule from "@/services/schedule";
import { currentUser } from "@/services/auth";
import routes from "@/services/routes";
import wrapSettingsTab from "@/components/SettingsWrapper";


class SchedulesList extends React.Component {
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
    /*Columns.custom(
      (text, schedule) => (
        <Button.Group>
          <Link.Button href={`schedules/${schedule.id}`}>Edit</Link.Button>
        </Button.Group>
      ),
      {
        width: "1%",
        className: "text-nowrap",
      }
    ),
    Columns.custom(
      (text, schedule) => {
        return (
          <DeleteScheduleButton
            className="w-100"
            disabled=false
            schedule={schedule}
            title=null
            onClick={() => this.onScheduleDeleted()}>
            Delete
          </DeleteScheduleButton>
        );
      },
      {
        width: "1%",
        className: "text-nowrap p-l-0",
        isAvailable: () => currentUser.isAdmin,
      }
    ),*/
  ];

  /*createSchedule = () => {
    CreateScheduleDialog.showModal().onClose(schedule =>
      Schedule.create(schedule).then(newSchedule => navigateTo(`schedules/${newSchedule.id}`))
    );
  };

  onScheduleDeleted = () => {
    this.props.controller.updatePagination({ page: 1 });
    this.props.controller.update();
  };*/

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
  "Schedules1.List",
  {
    permission: "admin",
    title: "Schedules1",
    path: "schedules1",
    order: 9,
  },
  SchedulesList
);

routes.register(
  "Schedules1.List",
  routeWithUserSession({
    path: "/schedules1",
    title: "Schedules1",
    render: pageProps => <SchedulesListPage {...pageProps} currentPage="schedules1" />,
  })
);
