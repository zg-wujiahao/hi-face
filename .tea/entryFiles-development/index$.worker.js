if(!self.__appxInited) {
self.__appxInited = 1;


require('./config$');


  var AFAppX = self.AFAppX.getAppContext
    ? self.AFAppX.getAppContext().AFAppX
    : self.AFAppX;
  self.getCurrentPages = AFAppX.getCurrentPages;
  self.getApp = AFAppX.getApp;
  self.Page = AFAppX.Page;
  self.App = AFAppX.App;
  self.my = AFAppX.bridge || AFAppX.abridge;
  self.abridge = self.my;
  self.Component = AFAppX.WorkerComponent || function(){};
  self.$global = AFAppX.$global;
  self.requirePlugin = AFAppX.requirePlugin;
          

if(AFAppX.registerApp) {
  AFAppX.registerApp({
    appJSON: appXAppJson,
  });
}



function success() {
require('../../taro/dist/app');
require('../../taro/dist/components/taro-cropper/index?hash=05d2a9730dd6009bf9446182f9c985f40f8c0f43');
require('../../taro/dist/components/page-status/index?hash=05d2a9730dd6009bf9446182f9c985f40f8c0f43');
require('../../taro/dist/components/to-top/index?hash=05d2a9730dd6009bf9446182f9c985f40f8c0f43');
require('../../taro/dist/components/back-home/index?hash=05d2a9730dd6009bf9446182f9c985f40f8c0f43');
require('../../taro/dist/components/page-wrapper/index?hash=136659d40e9a18c0f06395befef7ae2821cad549');
require('../../taro/dist/pages/spread-game/components/fly-modal/index?hash=05d2a9730dd6009bf9446182f9c985f40f8c0f43');
require('../../taro/dist/pages/spread-game/components/list-model/index?hash=be5a426da07a0a78f7b3d5f7af3958ddef46b2f0');
require('../../taro/dist/pages/wear-a-mask/wear-a-mask?hash=aa0c4bbf342db60fde545d27fccd5b5f909d1d8c');
require('../../taro/dist/pages/test/test?hash=32d7d2807ed4e666ef03b4b3fe8c38ecf2e34e68');
require('../../taro/dist/pages/thanks/thanks?hash=c84ac220465de862230e636c720696e7ec5581ee');
require('../../taro/dist/pages/spread-game/spread-game?hash=c5256ee32d908e6c32d420ba15225bdba2a7b914');
}
self.bootstrapApp ? self.bootstrapApp({ success }) : success();
}