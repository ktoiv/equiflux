import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default [
	{
		files: ["src/**/*.{ts,tsx}"],
		ignores: ["node_modules/**", "dist/**", "build/**"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: "module",
				ecmaFeatures: { jsx: true },
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
			react: reactPlugin,
			"react-hooks": reactHooksPlugin,
		},
		rules: {
			...tseslint.configs.recommended.rules,
			"@typescript-eslint/no-explicit-any": "error",
			"no-restricted-syntax": [
				"error",
				{
					selector: "ClassDeclaration",
					message: "Classes are not allowed. Use functions instead.",
				},
				{
					selector: "ClassExpression",
					message: "Classes are not allowed. Use functions instead.",
				},
			],
			"react/react-in-jsx-scope": "off",
			"react/jsx-uses-react": "off",
			"react/jsx-uses-vars": "warn",
		},
		settings: {
			react: { version: "detect" },
		},
	},
	prettier,
];
