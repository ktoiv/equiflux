import type { ElectrobunConfig } from 'electrobun';

const buildEnv = process.env.ELECTROBUN_ENV || 'dev';
const isRelease = buildEnv === 'canary' || buildEnv === 'production';

export default {
	app: {
		name: 'react-tailwind-vite',
		identifier: 'reacttailwindvite.electrobun.dev',
		version: '0.0.1',
	},
	build: {
		copy: {
			'dist/index.html': 'views/mainview/index.html',
			'dist/assets': 'views/mainview/assets',
		},
		watchIgnore: ['dist/**'],
		mac: {
			bundleCEF: isRelease,
		},
		linux: {
			bundleCEF: isRelease,
		},
		win: {
			bundleCEF: isRelease,
		},
	},
} satisfies ElectrobunConfig;
