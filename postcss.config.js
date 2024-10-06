import postcssGlobalData from '@csstools/postcss-global-data'

import postcssPresetEnv from 'postcss-preset-env'

const yourConfig = {
  plugins: [
    /* other plugins */
    postcssGlobalData({
      files: ['./src/assets/root.css']
    }),
    /* remove autoprefixer if you had it here, it's part of postcss-preset-env */
    postcssPresetEnv({
      /* pluginOptions */
      features: {
        'light-dark-function': true,
        'relative-color-syntax': { preserve: true },
        'custom-media-queries': { preserve: false }
      }
    })
  ]
}

export default yourConfig
