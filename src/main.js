import { createApp } from "vue"
import MainApp from "./apps/MainApp.vue"

const app = createApp(MainApp)

let params = new URLSearchParams(window.location.search)
if (params.has("invite")) {
	app.provide("inviteCode", params.get("invite"))
} else {
	app.provide("isInitialHost", true)
}

app.mount("#vue-app")