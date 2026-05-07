import "mdb-vue-ui-kit/css/mdb.min.css";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import axios from "axios";
import { createI18n } from "vue-i18n";
require("./services/sockets");
axios.defaults.baseURL = "http://" + window.location.hostname + ":3000";

// Report version to backend
axios.post("getInfo/actualizarVersionComandero", { version: process.env.VUE_APP_VERSION }).catch(() => {
  /* Silent error */
});

const i18n = createI18n({
  legacy: false,
  locale: "es",
  messages: "null",
});
createApp(App).use(store).use(router).use(i18n).mount("#app");
