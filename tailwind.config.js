/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: [
		"./index.html",
		"./src/**/*.{js,jsx}"
	],
	theme: {
		extend: {
			colors: {
				brand: {
					DEFAULT: '#ef4444',
					fg: '#ffffff',
				}
			}
		},
	},
	plugins: [],
}
