# 文章标题：图片识别加速，从10秒变为1秒，是怎么做到的呢？ | 小程序云开发

本文讲解的是我的快快戴口罩小程序中核心逻辑，如何获取图片中人脸五官，也就是使用腾讯云的人脸识别中的五官分析来实现的。这篇文章侧重于分析，我的图片识别加速的五个版本的差异，对于小程序开发的新人或想了解小程序云开发的小伙伴会有一定的帮助的。

**首先扫码预览小程序**

微信搜一搜：快快戴口罩

![](https://n1image.hjfile.cn/res7/2020/02/02/e40fff62cb635dd9be797226f7c266ed.png)

说一下基本步骤

1. 用户选择图片
2. 图片裁切，借助canvvas来实现
3. canvas图片转换为图片
4. 图片转换为base64数据
5. 上传base64到腾讯云后进行五官识别

## 先来2个小问题

问题1：第一个要处理的问题，是从小程序侧直接上传还是传给个人服务器或云端后再转发呢？

小程序侧直接上传
* 我们就需要在微信公众平台上配置多个腾讯云的域名，比如 `https://iai.tencentcloudapi.com`、 `https://tiia.tencentcloudapi.com` 等
* 如果一个功能上有多个网络请求，比如人脸识别、五官分析、智能美颜，多个网络请求同时进行，还是挺容易失败的，会让小程序的体验大大折扣。
* 依赖用户那边的网络速度，多个请求同时发送，直接就消耗了大量流量啦。

传给个人服务器或云端后再转发

* 无需在微信公众平台上配置多个腾讯云的域名
* 可以合并多个网络请求，依托个人服务器或云端稳定的网络环境做到更快速的请求响应。

问题2：在个人服务器和小程序云开发上，我是如何选择的？
最近比较火的概念就是 `Serverless`，简单来说就是，不借助运维手段就可以直接调用服务器上的数据库、文件以及其他资源。
而我在这次小程序开发中的所购买的腾讯云服务器当中做了如下设置

1. 购买了一个域名并备案，设置了二级域名，为二级域名设置了HTTP SSL证书
2. 购买了一个腾讯云的云服务器，在上面安装了nginx、nodejs等基础软件
3. 在启动了基于nodejs的express.js写的简单的Rest API服务后，借助于nginx将来自二级域名的请求转发到node站点上

先说花销上，域名每年需要几十元、服务器也需要几十元或几百元不等，网站备案也需要各种限制，比如在上海的话就需要户口或居住证，在江苏的话就需要江苏的手机号码。
再说运维上，我不仅要设置上述的基础功能，还要考虑设置出测试环境、正式环境，还要考虑服务的稳定性。

这就是我为何选择小程序云开发的原因了。因为，免费、高效、稳定。

云开发提供了几大基础能力支持：

* 云函数——在云端运行的代码，微信私有协议天然鉴权，开发者只需编写自身业务逻辑代码
数据库——一个既可在小程序前端操作，也能在云函数中读写的 JSON 数据库
* 存储——在小程序前端直接上传/下载云端文件，在云开发控制台可视化管理
* 云调用——原生微信服务集成	基于云函数免鉴权使用小程序开放接口的能力，包括服务端调用、获取开放数据等能力

在小程序侧免费开通云开发，配额如下：
![](https://n1image.hjfile.cn/res7/2020/02/18/48b2eab7679a2974113a02453d4836e3.png)

对于新手或实验性项目来说，这个配合足够用。如果想升级，小程序还提供了非常完整的升级方案。具体可以在下面这个链接上进行查看。
https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference/quota.html

那么最为吸引我使用小程序云开发的理由是啥呢？以nodejs为载体的云开发环境可以高度自定义。
* `wx-server-sdk`来调用小程序开放接口
* `tcb-admin-node`让你可以在服务端（如腾讯云云函数或CVM等）使用Node.js服务访问TCB的的服务。
* `tencentcloud-sdk-nodejs`，调用腾讯云的诸多服务，如人脸识别、五官分析等等
* 甚至说，上面这些都可以自己改代码，自定义功能实现，比如我最开始使用五官分析时，需要更换腾讯云的签名方法，而`tencentcloud-sdk-nodejs`的npm版尚未支持，我就下载代码下载，自己改好再用。

## 正文开始

### 第一版 VS 第四版
第一版：个人服务器版本，图片大约为1.2~2M
第四版：云开发版本，以云存储fileID为载体

![](https://n1image.hjfile.cn/res7/2020/02/18/11c419b8dc4b33d70da46febc7fc75f5.jpg)
![](https://n1image.hjfile.cn/res7/2020/02/18/9bc039d43e25dfa13ed783ed175c53f7.jpg)

使用canvas的`canvasToTempFilePath` 进行图片压缩，格式为jpg，质量为0.8，在安卓手机上图片会从1.2-2MB降为150KB以下，该图也是本地显示的原图。

使用小程序的`compressImage`（质量0.1）来压缩图片，在iPhone上效果良好，在安卓系统上效果不大，但这里我们也可以使用。即使质量很低，足够图片审核、五官分析所用的。
使用临时上传图片为载体、以`fileID`为云函数调用的标志时，云函数调用的体积较小，云存储的上传下载都非常稳定。
图片安全 和五官分析可以同时请求，但使用 `Promise.allSettled()` 同时来请求。

这里解决了三个问题：

* 云函数调用有时长限制，需要修改app.json的timeout，否则云函数调用会直接报错，即使后续云开发环境有数据返回。
* 图片审核大小限制500KB
* 五官分析在base64数据大于1MB时需要更换签名方法为`TC3-HMAC-SHA256`。


**那么效果如何呢？ 总使用时间大约为5秒，其中请求时间约为3秒。**

>备注：  
>用时为云开发的本地开发模式测得，云端调用速度更快
>总使用时间：从图片压缩开始，经过调用云函数，云函数识别出五官信息，返回后小程序处理五官信息，渲染口罩效果的用时。  
>请求时间：从小程序调用云函，云函数识别出五官信息、返回到小程序侧的用时。

### 第四版 VS 第五版

第四版：云开发版本，以云存储fileID为中间载体
第五版：云开发版本，以base64数据直接请求

![](https://n1image.hjfile.cn/res7/2020/02/18/9bc039d43e25dfa13ed783ed175c53f7.jpg)

![](https://n1image.hjfile.cn/res7/2020/02/18/71aee60f54119b0f6055b150be12be1e.jpg)


不使用云存储作为传递载体，而是使用图片压缩后的不大于150KB大小的base64数据直接请求，减少了小程序侧图片上传、云开发环境中的图片下载两个异步操作的步骤。

小程序侧也有 `ArrayBuffer` 数据，但在本地开发过程中发现，只要其大小超过50KB（猜的），云函数调用就会直接报错。

>PS：我这个小程序的图片识别只是暂时的请求数据，并未需要将图片上传到云存储，让用户下次还能看到这个图片。

**那么效果如何呢？ 总使用时间大约为3秒以内，其中请求时间约为0.8-1.2秒。**


### 小结

* 本地识别，需要原图
* 五官识别轮廓就行，图片审核用低质量图片即可
* 图片压缩，想办法压缩到能用的最低
* 异步请求的数量要减少，可以直接传递最终数据，但数据要小

## 小程序五个版本的细节

* 第一版：个人服务器版本
  * 小程序
    * canvas转换为图片，再转换为base64编码，大小通常为1.2-2M
    * 向个人服务器发送API请求，数据为base64数据
  * 个人服务器
    * 在个人服务上用nginx转发，再用nodejs接收
    * nginx默认限制大小，所以得改大小
    * 调用腾讯云服务，1M以上需要改签名方法
  * 效果
    * 总使用时间大约为13秒，请求花了10秒
    * 需要本地开发后，git上传代码，服务器上安装nodejs依赖，pm2启动，很麻烦，
    * 未区分测试环境和正式环境，要是实际使用，必须得再配置，每次使用也很麻烦。
* 第二版，云开发，直接上传base64
  * 小程序
    * canvas转换为图片，再转换为base64编码，大小通常为1.2-2M
    * 调用云函数，数据为base64数据
  * 云开发云函数
    * 五官分析，使用base64数据。由于此时大于1M，需要更换签名方法
  * 效果
    * 总使用时间大约为11秒
    * 请求时间长，本地开发很容易失败，因为timeout得调整大于10秒，我改为20秒
    * 开发体验比个人服务器好了很多，基本上在微信开发者工具与Visual Code上切换即可
* 第三版，云开发基础上，改用云存储转发
  * 小程序
    * canvas转化为图片，
    * 云调用uploadFile上传云存储，返回fileID
    * 调用云函数，数据为fileID
  * 云开发云函数
    * 利用fileID下载图片内容，转换为base格式
    * 五官分析，使用base64数据。由于此时大于1M，需要更换签名方法
  * 小程序
    * 接收五官信息
    * 利用fileID删除云存储上的图片
  * 效果
    * 总使用时间大约为8秒
    * 使用fileID存储，以及向云函数发送fileID，安全性更高，因为云开发的存储需要腾讯云权限
* 第四版：大幅度压缩图片，云存储fileID为中间载体，
  * 小程序
    * canvas转换为图片，注意要图片压缩，设置格式为jpg，质量为0.8
    * 小程序，图片压缩，安卓上效果不大？但此时图片大小约在150k以下
    * 上传文件到云开发环境，获得fileID
    * 调用云函数，数据为fileID
  * 云开发云函数
    * 使用fileID从云开发的存储里下载文件
    * Promise.allSettled异步全返回
      * 图片审核-使用Buffer
      * 五官分析-使用base64格式
  * 小程序
    * 设置五官信息，若图片审核失败，就报错
    * 利用fileID删除云存储上的图片
  * 效果
    * 总使用时间大约为6秒，其中请求时间约为4秒
    * 加入canvas图片压缩，效果非常明显
    * 微信图片压缩，安卓上效果不明显
* 第五版本
  * 小程序
    * canvas转换为图片，注意要图片压缩，设置格式为jpg，质量为0.8
    * 小程序，图片压缩质量为0.1，安卓上效果不大
    * 图片转换为base64格式，大小小于150k
    * 调用云函数，数据为base64格式
  * 云开发云函数
    * Promise.allSettled异步全返回
      * 图片审核-使用Buffer
      * 五官分析-使用base64格式
  * 小程序
    * 设置五官信息，若图片审核失败，就报错
  * 效果
    * 总使用时间约为2-3秒，请求时间在1.2秒以内，通常为0.8秒
    * 比第四版相比，省去图片上传下载的过程，节约了请求时间，但相应的，安全性不那么高
    * 优化方案为，base64数据可以加密。


### 文章相关内容：

> 珍爱生命，从我做起，快点戴上口罩，给大家介绍我开源的 Taro + 腾讯云开发 小程序「快快戴口罩」它可以智能识别人脸，给集体照戴上口罩。(*￣︶￣)

采用 `Taro` 跨端框架，采用腾讯云开发模式，采用基于腾讯云的五官分析的人脸识别，实现了自动为头像戴上口罩的功能。

源码地址：

[https://github.com/shenghanqin/goddess-hat](https://github.com/shenghanqin/goddess-hat "https://github.com/shenghanqin/goddess-hat")

我是 **盛瀚钦**，沪江 CCtalk 前端开发工程师，Taro 框架的 issue 维护志愿者，主要侧重于前端 UI 编写和团队文档建设。

**主要功能**

- 智能识别人脸，进行五官定位
- 支持多人识别
- 支持添加加油图片

**扫码预览**

微信搜一搜：快快戴口罩

![](https://n1image.hjfile.cn/res7/2020/02/02/e40fff62cb635dd9be797226f7c266ed.png)

## 小程序截图
![](https://n1other.hjfile.cn/res7/2020/02/10/1b0add271a294e2bf1140d124eaf595b.JPG)