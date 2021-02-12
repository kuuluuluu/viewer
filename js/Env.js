const isProd = [80, 443].includes(parseInt(location.port));
export let env = {
  channelsApi: "https://api.kuuluu.org/v1/channels"
};
const useDevSettings = localStorage.useDev ? JSON.parse(localStorage.useDev) : {};
window.useDev = {
  set channelsApi(value) {
    useDevSettings["channelsApi"] = value;
    localStorage.useDev = JSON.stringify(useDevSettings);
  }
};
if (!isProd) {
  if (useDevSettings.channelsApi) {
    env.channelsApi = useDevSettings.channelsApi === true ? "http://0.0.0.0:8081" : useDevSettings.channelsApi;
  }
}
