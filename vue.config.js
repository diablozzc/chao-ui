module.exports = {
  pages: {
    index: {
      entry: 'examples/main.js',
      template: 'public/index.html',
      filename: 'index.html'
    }
  },
  chainWebpack: config => {
    config.module
      .rule('js')
      .include
      .add('/packages')
      .end()
      .use('babel')
      .loader('babel-loader')

    config.module
      .rule('eslint')
      .use('eslint-loader')
      .options({
        fix: true
      })

    // config.module
    //   .rule('less')
    //   .use('less-loader')
    //   .loader('less-loader')
    //   .options({
    //     lessOptions: {
    //       strictMath: true,
    //       noIeCompat: true
    //     }
    //   })
  }
}
