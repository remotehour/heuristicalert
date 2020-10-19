import typescript from 'rollup-plugin-typescript2'

export default {
  input: './src/index.ts',
  plugins: [
    typescript({
      tslib: require('tslib'),
      declaration: true,
    }),
  ],
  external: (id) => false,
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
  ],
}
