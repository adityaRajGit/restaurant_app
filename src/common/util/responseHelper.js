import responseStatus from "../constants/responseStatus.json";
import responseData from "../constants/responseData.json";

export function setSuccess(res, data) {
  res.status(responseStatus.STATUS_SUCCESS_OK);
  res.json({ status: responseData.SUCCESS, data });
}

export function setServerError(res, data) {
  console.log("Error", data);
  res.status(responseStatus.INTERNAL_SERVER_ERROR);
  res.json({ status: responseData.ERROR, data });
}

export function createResponseSetter(moduleName) {
  return function setResponse(req, res, err, model) {
    if (err) {
      setServerError(res, `Error occured: ${err}`);
    } else {
      const module = model[moduleName];
      if (module) {
        setSuccess(res, { moduleName: module });
      } else {
        setNotFoundError(res, `${moduleName}: ${req.params.id} not found`);
      }
    }
  };
}
