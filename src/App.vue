<template>
  <div class="">
    <router-view />
  </div>
</template>

<script>
// import HelloWorld from "./components/HelloWorld.vue";
import { useI18n } from "vue-i18n";
export default {
  name: "App",
  components: {
    // HelloWorld,
  },
  setup() {
    const { t } = useI18n();
    return { t };
  },
};
</script>

<style>
#app {
  font-family: Roboto, Helvetica, Arial, sans-serif;
}
body {
  background-color: #f8f9fa;
}
</style>
