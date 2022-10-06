/* eslint-disable react/jsx-filename-extension */
import { ApiConfig } from "../../constants";
import ApiService from "../../services/api.service";

export const correlateSlack = async (id) => {
  const { data } = await ApiService.get({
    url: `${ApiConfig.correlateSlack}/${id}`,
  });
  return data;
};
