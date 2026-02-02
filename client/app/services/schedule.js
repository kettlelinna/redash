import { axios } from "@/services/axios";

const Schedule = {
  query: () => axios.get("api/schedules"),
  get: ({ id }) => axios.get(`api/schedules/${id}`),
  create: data => axios.post(`api/schedules`, data),
  save: data => axios.post(`api/schedules/${data.id}`, data),
  delete: data => axios.delete(`api/schedules/${data.id}`),
};

export default Schedule;
