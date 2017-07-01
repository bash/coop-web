import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'

const isRelease = process.env['BUILD_MODE'] === 'release'

const plugins = [
  babel(),
  resolve({ jsnext: true })
]

export default {
  plugins: plugins,
  sourceMap: !isRelease,
  format: 'iife'
}
