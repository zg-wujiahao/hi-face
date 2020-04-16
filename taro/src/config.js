const env = process.env.SERVER_ENV || 'prod'
const appId = '1110180763' // qq的临时用用

module.exports = {
  env,
  wxName: 'quickly-mask',
  version: '1.5.0',
  appId,
  userDomain: 'cc',
  apiHost: '',
  apiWeb: '',
  apiFace: 'https://face.xuexitrip.com',
  apiImageUpload: '',
  tokenKey: '',
  webViewDomain: '',
  cloudEnv: env === 'prod' ? 'production-topjt' : 'development-v9y2f',
}
