import { Router } from "express";
import serverConfig from "../config";
import appConfig from "../../common/constants/appConfig.json";
import { version, name } from "../../../package.json";
// import axios from "axios";
import { setServerError, setSuccess } from "../../common/util/responseHelper";

const router = new Router();

router.route("/").get(async (req, res) => {
  const stageFirstLetter = serverConfig.stage.charAt(0);
  // const ip = await axios.get('https://api.ipify.org/').then(e => e.data);

  setSuccess(res, {
    stage: serverConfig.stage,
    version: `${stageFirstLetter}.${version}`,
    host: name,
  });
});

router.route("/config").get(async (req, res) => {
  const stageFirstLetter = serverConfig.stage.charAt(0);
  // const ip = await axios.get('https://api.ipify.org/').then(e => e.data);
  setSuccess(res, {
    stage: serverConfig.stage,
    ios_version: appConfig.ios_version,
    android_version: appConfig.android_version,
    featured_enabled: appConfig.featured_enabled,
    featured_disabled: appConfig.featured_disabled,
  });
});

export default router;
