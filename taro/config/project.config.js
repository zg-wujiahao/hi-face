const APPID_ENV = process.env.APPID_ENV

module.exports = {
  miniprogramRoot: APPID_ENV ? './dist_test' : './dist',
  projectname: APPID_ENV ? 'quickly-mask-test' : 'quickly-mask',
  description: 'taro-daka',
  appid: APPID_ENV ? 'jd8c65e5670f030681' : 'wxd5e8989ce23206af',
  setting: {
    urlCheck: false,
    es6: false,
    postcss: false,
    minified: false
  },
  compileType: 'miniprogram',
  condition: {
    search: {
      current: -1,
      list: []
    },
    conversation: {
      current: -1,
      list: []
    },
    plugin: {
      current: -1,
      list: []
    },
    game: {
      list: []
    },
  }
}
