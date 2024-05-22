import { createApp } from "vue"
import MainApp from "./apps/MainApp.vue"
import HostApp from "./apps/HostApp.vue"
import UserApp from "./apps/UserApp.vue"

let params = new URLSearchParams(window.location.search)
if (params.has("invite")) {
	createApp(UserApp).provide("inviteCode", params.get("invite")).mount("#vue-app")
} else if (params.has("host")) {
	createApp(HostApp).mount("#vue-app")
} else {
	createApp(MainApp).mount("#vue-app")
}