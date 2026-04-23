import axios from "axios";
import { config } from "../../config";
import logger from "../../utils/logger";

const fayrouzaClient = axios.create({
  baseURL: config.fayrouzaApiUrl,
  timeout: 10_000,
  headers: {
    Authorization: `Bearer ${config.fayrouzaServiceToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

fayrouzaClient.interceptors.request.use(
  (request) => {
    logger.debug("Fayrouza API request", {
      method: request.method?.toUpperCase(),
      url: request.url,
      baseURL: request.baseURL,
    });
    return request;
  },
  (error) => {
    logger.error("Fayrouza API request error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return Promise.reject(error);
  }
);

fayrouzaClient.interceptors.response.use(
  (response) => {
    logger.debug("Fayrouza API response", {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      logger.error("Fayrouza API call failed", {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      logger.error("Fayrouza API unknown error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return Promise.reject(error);
  }
);

export default fayrouzaClient;
