import React from "react";
import { get } from "lodash";

import Button from "antd/lib/button";
import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import navigateTo from "@/components/ApplicationArea/navigateTo";
import Paginator from "@/components/Paginator";
import Modal from "antd/lib/modal";

import {wrap as itemsList, ControllerType} from "@/components/items-list/ItemsList";
import {ResourceItemsSource} from "@/components/items-list/classes/ItemsSource";
import {StateStorage} from "@/components/items-list/classes/StateStorage";

import LoadingState from "@/components/items-list/components/LoadingState";
import ItemsTable, {Columns} from "@/components/items-list/components/ItemsTable";

import ScheduleDialog from "@/components/schedules/ScheduleDialog";

import Schedule from "@/services/schedule";
import {currentUser} from "@/services/auth";
import routes from "@/services/routes";
import wrapSettingsTab from "@/components/SettingsWrapper";
import notification from "@/services/notification";
import PlainButton from "@/components/PlainButton";

import {policy} from "@/services/policy";


const canEditSchedule = () => currentUser.isAdmin;

class SchedulesList extends React.Component {
  static propTypes = {
    controller: ControllerType.isRequired,
  };

  listColumns = [
    Columns.custom.sortable(
      (text, schedule) => (
        <PlainButton type="link" className="table-main-title" onClick={() => this.showScheduleDialog(schedule)}>
          {schedule.name}
        </PlainButton>
      ),
      {
        title: "Name",
        field: "name",
        className: "text-nowrap",
      }
    ),
    Columns.custom.sortable(text => text, {
      title: "Description",
      field: "description",
      className: "text-nowrap",
    }),
    Columns.custom.sortable(text => text, {
      title: "Interval",
      field: "interval",
      className: "text-nowrap",
    }),
    Columns.custom.sortable(text => text, {
      title: "Disable",
      field: "disable",
      className: "text-nowrap",
    }),
    Columns.date.sortable({
      title: "Created At",
      field: "created_at",
      className: "text-nowrap",
      width: "1%",
    }),
    Columns.custom(
      (text, schedule) =>
        canEditSchedule(schedule) && (
          <Button type="danger" className="w-100" onClick={e => this.onScheduleDeleted(e, schedule)}>
            Delete
          </Button>
        ),
      {
        width: "1%",
      }
    ),
  ];

  componentDidMount() {
    const {isNewOrEditPage, scheduleId} = this.props.controller.params;

    if (isNewOrEditPage) {
      if (scheduleId === "new") {
        if (policy.isCreateScheduleEnabled()) {
          this.showScheduleDialog();
        } else {
          navigateTo("schedules", true);
        }
      } else {
        Schedule.get({id: scheduleId})
          .then(this.showScheduleDialog)
          .catch(error => {
            this.props.controller.handleError(error);
          });
      }
    }
  }

  onScheduleDeleted = (event, schedule) => {
    Modal.confirm({
      title: "Delete Schedule",
      content: "Are you sure you want to delete this schedule?",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: () => {
        Schedule.delete(schedule)
          .then(() => {
            notification.success("Schedule deleted successfully.");
            this.props.controller.update();
          })
          .catch(() => {
            notification.error("Failed deleting schedule.");
          });
      },
    });
  };

  saveSchedule = schedule => {
    const saveSchedule = schedule.id ? Schedule.save : Schedule.create;
    return saveSchedule(schedule);
  };

  showScheduleDialog = (schedule = null) => {
    const canSave = !schedule || canEditSchedule();
    navigateTo("schedules/" + get(schedule, "id", "new"), true);
    const goToSchedulesList = () => navigateTo("schedules", true);
    ScheduleDialog.showModal({
      schedule,
      readOnly: !canSave,
    })
      .onClose(schedule =>
        this.saveSchedule(schedule).then(() => {
          this.props.controller.update();
          goToSchedulesList();
        })
      )
      .onDismiss(goToSchedulesList);
  };

  render() {
    const {controller} = this.props;

    return (
      <div data-test="ScheduleList">
        {currentUser.isAdmin && (
          <div className="m-b-15">
            <Button
              type="primary"
              onClick={() => this.showScheduleDialog()}
              disabled={!policy.isCreateScheduleEnabled()}>
              <i className="fa fa-plus m-r-5" aria-hidden="true"/>
              New Schedule
            </Button>
          </div>
        )}

        {!controller.isLoaded && <LoadingState className=""/>}
        {controller.isLoaded && controller.isEmpty && (
          <div className="text-center">
            There are no schedule yet.
            {policy.isCreateScheduleEnabled() && (
              <div className="m-t-5">
                <PlainButton type="link" onClick={() => this.showScheduleDialog()}>
                  Click here
                </PlainButton>{" "}
                to add one.
              </div>
            )}
          </div>
        )}
        {controller.isLoaded && !controller.isEmpty && (
          <div className="table-responsive">
            <ItemsTable
              items={controller.pageItems}
              columns={this.listColumns}
              showHeader={false}
              context={this.actions}
              orderByField={controller.orderByField}
              orderByReverse={controller.orderByReverse}
              toggleSorting={controller.toggleSorting}
            />
            <Paginator
              showPageSizeSelect
              totalCount={controller.totalItemsCount}
              pageSize={controller.itemsPerPage}
              onPageSizeChange={itemsPerPage => controller.updatePagination({itemsPerPage})}
              page={controller.page}
              onChange={page => controller.updatePagination({page})}
            />
          </div>
        )}
      </div>
    );
  }
}

const SchedulesListPage = wrapSettingsTab(
  "Schedules.List",
  {
    permission: "admin",
    title: "Schedules",
    path: "schedules",
    order: 4,
  },
  itemsList(
    SchedulesList,
    () =>
      new ResourceItemsSource({
        isPlainList: true,
        getRequest() {
          return {};
        },
        getResource() {
          return Schedule.query.bind(Schedule);
        },
      }),
    () => new StateStorage({orderByField: "created_at", orderByReverse: true, itemsPerPage: 10})
  )
);

routes.register(
  "Schedules.List",
  routeWithUserSession({
    path: "/schedules",
    title: "Schedules",
    render: pageProps => <SchedulesListPage {...pageProps} currentPage="schedules"/>,
  })
);

// can route to /schedules/1 and /schedules/new
routes.register(
  "Schedules.NewOrEdit",
  routeWithUserSession({
    path: "/schedules/:scheduleId",
    title: "Schedules",
    // here pageProps only include scheduleId which from path: /schedules/:scheduleId
    render: pageProps => <SchedulesListPage {...pageProps} currentPage="schedules" isNewOrEditPage/>,
  })
);
