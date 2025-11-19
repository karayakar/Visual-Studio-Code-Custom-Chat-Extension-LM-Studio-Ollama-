import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parser: typescriptParser,
		},
		plugins: {
			'@typescript-eslint': typescriptEslint,
		},
		rules: {
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
		},
	},
];
