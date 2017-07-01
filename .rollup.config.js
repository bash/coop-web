import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'

const isRelease = process.env['BUILD_MODE'] === 'release'
const plugins = [
  babel({
    babelrc: false,
    comments: false,
    presets: [
      [
        'env',
        {
          'modules': false,
          'targets': {
            'browsers': [
              'last 1 chrome version',
              'last 1 firefox version',
              'last 1 safari version',
              'last 1 ios_saf version'
            ]
          }
        }
      ]
    ],
    plugins: [
      'external-helpers',
      'transform-class-properties',
      'transform-node-env-inline',
      'transform-object-rest-spread',
      'transform-preact-import',
      [
        'transform-react-jsx', { 'pragma': 'h' }
      ]
    ]
  }),
  resolve({
    jsnext: true,
    modulesOnly: true
  })
]

export default {
  plugins: plugins,
  sourceMap: !isRelease,
  format: 'iife'
}
