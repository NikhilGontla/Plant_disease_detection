import { API } from "aws-amplify";
const apiName = "plantdiseaseapi";

export const uploadEndpoint = (payload) => API.post(apiName, "/upload", { body: payload });
export const validateEndpoint = (payload) => API.post(apiName, "/validate-image", { body: payload });
export const predictEndpoint = (payload) => API.post(apiName, "/predict", { body: payload });
export const saveAnnotationEndpoint = (payload) => API.post(apiName, "/save-annotation", { body: payload });
