import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
	plugins: [vue()],
	publicDir: "static",
	build: {
		assetsDir: "bundle",
	},
	define: {
		__BUILD_TIMESTAMP__: Date.now().toString()
	}
})