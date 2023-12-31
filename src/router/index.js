import { createRouter, createWebHistory } from "vue-router";
import LoaderComponent from "../components/Loader.vue";
const routes = [
  {
    path: "/",
    name: "Loader",
    component: LoaderComponent,
  },

  {
    path: "/employer",
    name: "employer",
    component: () => import("../views/EmployerSelect.vue"),
    children: [],
  },
  {
    path: "/tableselection",
    name: "tableselection",
    component: () => import("../views/TableSelection.vue"),
    children: [],
  },
  {
    path: "/categoryselection",
    name: "categoryselection",
    component: () => import("../views/CategorySelection.vue"),
    children: [],
  },
  {
    path: "/productselection",
    name: "productselection",
    component: () => import("../views/ProductSelection.vue"),
    children: [],
  },
  {
    path: "/ticketview",
    name: "ticketview",
    component: () => import("../views/TicketView.vue"),
    children: [],
  },
  {
    path: "/clientsInTableSelection",
    name: "clientsInTableSelection",
    component: () => import("../views/clientsInTableSelection.vue"),
    children: [],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
