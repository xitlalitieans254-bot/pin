# Codex 修改记录

记录日期：2026-06-14  
项目路径：`/Users/ylkj/Documents/Codex/Projects/zhipin/ttZhipinApp`

## 背景

这个 React Native 项目最初是通过压缩包解压到本机后运行的。项目能被识别为 React Native 移动端项目，但在当前 Mac/Xcode/iOS Simulator 环境中并不能直接稳定运行：存在依赖版本不兼容、iOS 构建环境缺失、登录流程异常、图标字体缺失、页面空数据崩溃等问题。

本次修改目标是：

- 让项目能在 iOS Simulator 上构建和运行。
- 让手机号验证码登录流程可以正常进入 App。
- 完善“完成个人资料”的前端填写流程。
- 修复 iOS 图标显示为问号的问题。
- 修复“我的 > 在线简历”页面在无数据时崩溃的问题。
- 尽量只做运行必要修复，不重构业务结构。

## 环境与构建处理

### 1. 创建并使用项目目录

创建了工作目录：

```text
/Users/ylkj/Documents/Codex/Projects/zhipin
```

并将用户拖入的压缩包解压为：

```text
/Users/ylkj/Documents/Codex/Projects/zhipin/ttZhipinApp
```

### 2. 检查 Xcode

本机已安装：

```text
Xcode 14.3.1
Build version 14E300c
```

注意：这个 Xcode 版本偏旧。如果真机 iPhone 系统版本较新，可能需要更新 Xcode 或 macOS，否则无法真机调试。

### 3. 安装/配置 iOS 构建依赖

项目 iOS 依赖通过 Bundler + CocoaPods 处理：

```bash
bundle install
```

并使用项目内的 CocoaPods 执行 pod 安装。

因为当前 macOS / Xcode 版本较旧，全局安装新版 CocoaPods 依赖时会遇到 Homebrew 依赖要求更高 Xcode 的问题，所以使用项目 Bundler 方式更稳。

### 4. 指定 Xcode 使用的 Node 路径

新增/修改文件：

```text
ios/.xcode.env.local
```

内容：

```bash
export NODE_BINARY=/usr/local/bin/node
```

原因：Xcode 构建 React Native 项目时需要找到 Node。若不指定，Xcode build phase 可能找不到正确的 Node 路径。

## 依赖版本修复

项目原本依赖使用了较宽的版本范围，`npm install` 后会拉到与 React Native 0.72 不兼容的新版本。因此固定了以下依赖版本：

```json
{
  "react-native-maps": "1.7.1",
  "react-native-gesture-handler": "2.12.1",
  "react-native-gifted-chat": "2.4.0"
}
```

涉及文件：

```text
package.json
package-lock.json
```

修复原因：

- `react-native-maps` 新版本 podspec 与当前 RN 0.72 / CocoaPods 环境不兼容。
- `react-native-gesture-handler` 新版本在 iOS 编译时出现接口不匹配。
- `react-native-gifted-chat` 新版本引入额外依赖，和当前项目依赖结构不匹配。

## CocoaPods / Boost 下载修复

修改过本地依赖文件：

```text
node_modules/react-native/third-party-podspecs/boost.podspec
```

将 Boost 下载地址从旧的 JFrog 地址调整为 Boost 官方归档地址：

```text
https://archives.boost.io/release/1.76.0/source/boost_1_76_0.tar.bz2
```

原因：旧地址不可用或下载失败，导致 `pod install` 无法完成。

说明：这是 `node_modules` 内的本地依赖修复。如果删除 `node_modules` 后重新安装，可能需要再次确认该修复是否还在。

## 登录流程修复

### 1. 去掉默认手机号

修改文件：

```text
src/pages/login/LoginPage.tsx
src/pages/login/CheckSmsCaptchaPage.tsx
```

原问题：登录页/验证码页存在默认手机号，用户打开 App 后不是干净的输入状态。

修改后：

- 手机号输入初始值为空字符串。
- 验证码页关闭按钮增加兜底逻辑，避免没有历史页面时返回异常。

### 2. 分离短信临时 token 和正式登录 token

修改文件：

```text
src/common/CommonConstant.ts
```

原问题：

```ts
TOKEN: 'token',
LOGIN_TOKEN: 'token',
```

短信验证码临时凭证和正式登录 token 使用了同一个存储 key，导致互相覆盖。登录后请求用户信息时，可能拿到的是短信 uuid，而不是正式 token。

修改后：

```ts
TOKEN: 'token',
LOGIN_TOKEN: 'login_token',
```

### 3. 正确提取并保存正式登录 token

修改文件：

```text
src/stores/MemberStore.ts
```

新增了 `extractToken` 逻辑，兼容后端可能返回的几种 token 格式：

- 直接返回字符串。
- 返回 `{ token }`。
- 返回 `{ accessToken }`。
- 返回 `{ access_token }`。
- 返回 `{ loginToken }`。
- 返回嵌套 `{ data: { token } }`。

同时在发送短信验证码前清理旧的正式 token 和旧的短信临时 token，避免旧状态影响后续登录。

### 4. 修复登录后用户信息接口拿到 HTML 缓存的问题

修改文件：

```text
src/apis/ApiService.ts
```

修改内容：

- 为 axios 默认请求头增加：

```ts
Accept: 'application/json'
'Content-Type': 'application/json'
```

- 对用户信息接口 `/member/api/member/info` 的 GET 请求增加 no-cache 处理：

```ts
const shouldSkipCache = url.includes('/member/api/member/info');
const finalParams = shouldSkipCache ? {...params, _t: Date.now()} : params;
const headers = shouldSkipCache ? {'Cache-Control': 'no-cache', Pragma: 'no-cache'} : undefined;
```

原问题：登录成功后，App 请求用户信息接口时曾收到 `text/html` 内容，导致前端按 JSON 解析失败，并跳回登录页。

验证结果：增加 no-cache 和 JSON 请求头后，接口返回 `application/json`，登录后能进入 App。

## iOS 图标问号修复

### 问题

App 里很多图标显示为带问号的方块。

原因：项目使用了 `react-native-vector-icons`，例如：

- Ionicons
- FontAwesome
- AntDesign
- Feather
- Octicons

这些图标本质上是字体图标。iOS 工程没有正确注册字体时，系统会把它们显示成问号方块。

### 修改

新增文件：

```text
react-native.config.js
```

内容：

```js
module.exports = {
  assets: ['./node_modules/react-native-vector-icons/Fonts'],
};
```

并通过 asset 链接将字体注册到 iOS：

```bash
npx react-native-asset
```

涉及文件：

```text
react-native.config.js
ios/ttZhipinApp/Info.plist
ios/ttZhipinApp.xcodeproj/project.pbxproj
android/app/src/main/assets/fonts/*
```

### 处理重复拷贝问题

运行 asset 链接后，Xcode 编译时报过：

```text
Multiple commands produce ... Ionicons.ttf
```

原因：CocoaPods 已经通过 `[CP] Copy Pods Resources` 拷贝了部分字体，同时 Xcode project 里又手动加了一份 `ttf in Resources`，造成重复输出。

处理方式：

- 保留 `Info.plist` 中的 `UIAppFonts` 字体注册。
- 移除 Xcode target `Resources` build phase 中重复的 `.ttf` 拷贝项。

修复后重新构建成功，图标显示正常。

## 在线简历页面修复

### 问题

用户点击：

```text
我的 > 在线简历
```

页面报错：

```text
TypeError: Cannot read property 'fullName' of undefined
```

日志显示接口返回：

```json
{
  "code": 1,
  "data": "",
  "message": "用户信息不存在",
  "ok": false
}
```

### 原因

接口明确返回“用户信息不存在”，但页面只判断“接口有返回”就当作简历数据已加载，然后直接访问：

```ts
store.onlineResumeInfo.memberInfoResponse.fullName
```

当 `memberInfoResponse` 不存在时，页面崩溃。

### 修改

修改文件：

```text
src/stores/OnlineResumeStore.ts
src/pages/worker/onlineResume/OnlineResumePage.tsx
```

处理方式：

- `OnlineResumeStore` 只有在 `data.code === 0 && data.data` 时才保存简历数据。
- 接口失败时保存空对象。
- 页面增加 `loading`、`dataLoaded`、`errorMessage` 状态。
- 当没有在线简历时显示空状态，不再崩溃。
- 对以下字段增加空值保护：
  - `memberInfoResponse`
  - `workExpectDtoList`
  - `workExperienceDtoList`
  - `projectExperienceDtoList`
  - `eduExperienceDtoList`
  - `industryArr`
  - `avatar`
  - `birthday`
  - `workStatus`
  - `highestQualification`
  - `highestQualificationType`

空状态文案：

```text
暂无在线简历 / 用户信息不存在
完善个人资料后再查看在线简历
```

## 我的页面菜单报错修复

修改文件：

```text
src/components/MenuBar.tsx
```

原问题：

`MenuBar` 内部直接调用：

```ts
onMenuPress(index)
```

但部分页面使用 `<MenuBar menus={menus} />` 时没有传 `onMenuPress`，导致点击时出现：

```text
TypeError: onMenuPress is not a function
```

修改后：

```ts
const MenuBar = ({ menus, activeMenu, onMenuPress = () => {} }: any) => {
```

这样未传回调时不会崩溃。

## 完成个人资料流程完善

### 问题

“完成个人资料”页面原本能调用后端保存资料，但前端防护不足：

- 姓名可以为空提交。
- 性别、身份、求职状态、学历等选项存在默认值或二次点击变成无效值的问题。
- “职场人”身份下可能默认提交学生求职状态。
- 出生日期没有年满 16 周岁的前端校验。
- 保存失败时，部分接口没有回调失败状态，页面容易表现为“点了没反应”。
- 头像为空也可以触发提交逻辑。
- 头像上传失败或取消选择时没有明确反馈。
- 登录页和闪屏页判断资料是否完整时，只判断空字符串，遇到 `null`、`undefined`、`0` 等情况不稳。

### 修改

新增工具文件：

```text
src/utils/MemberInfoUtil.ts
```

用于统一判断会员资料是否完整，并返回应该进入哪个补全步骤。

修改：

```text
src/pages/worker/init/InitMemberInfoPage.tsx
```

主要处理：

- 从后端返回的 `memberInfo` 预填已有字段。
- 姓名提交前校验空值和最少 2 个字。
- 性别必须选择。
- 出生年月必须满足年满 16 周岁。
- 身份和求职状态必须匹配，例如职场人只能选职场人对应的状态。
- 学历和学历类型必须选择。
- 按钮提交时显示“保存中...”，并禁用重复点击。
- 后端保存失败时弹出失败原因。
- 头像步骤增加上传中/保存中状态。
- 头像选择改为只选择图片，不再允许混合媒体。
- 未选择头像时不能进入 App。
- 修复“学生”按钮选中颜色使用了性别状态的错误。

修改：

```text
src/stores/MemberStore.ts
```

资料初始化相关方法现在在后端返回非成功状态或网络异常时，都会回调失败并带上错误信息，避免页面无反馈。

修改：

```text
src/pages/login/CheckSmsCaptchaPage.tsx
src/pages/splash/SplashPage.tsx
```

登录后和启动页都改为使用统一的 `isMemberInfoComplete` 判断资料是否完整。

修改：

```text
src/utils/StrUtil.ts
```

`dateFormat` 从 UTC 时间改成本地时间，避免中国时区选择生日时被格式化成前一天。

修改：

```text
tsconfig.json
```

开启 `experimentalDecorators`，匹配项目中 MobX `@observable` 的现有写法，保证 TypeScript 检查能正常通过。

## 头头身份页面红屏修复

### 问题

点击“切换为头头身份”后，招聘端候选人列表出现 React Native 红屏：

```text
Render Error
Invalid date format. Please use the format: 2002-08-26 10:03:12
```

原因是招聘端列表调用 `DateUtil.calculateAge(item.birthday)` 计算年龄，而 `DateUtil.calculateAge` 原本只接受严格的 `YYYY-MM-DD HH:mm:ss` 格式；只要后端返回的生日格式稍有变化，工具函数就会 `throw new Error`，导致整个页面崩溃。

### 修改

修改：

```text
src/utils/DateUtil.ts
```

- 日期解析兼容 `YYYY-MM-DD HH:mm:ss`、`YYYY-MM-DDTHH:mm:ss`、`YYYY-MM-DD` 等常见格式。
- 解析失败时返回 `undefined`，不再抛异常。
- `formatWorkDate` 也增加了无效日期兜底。

修改：

```text
src/pages/toutou/toutou_worker/ToutouWorkerPage.tsx
```

- 年龄有值时才显示“xx岁”。
- 候选人信息改成数组拼接，避免生日为空时出现残缺文案。

修改：

```text
src/pages/worker/mine/BecomeBossPage.tsx
```

- `is_toutou` 参数统一转成数字判断，避免后端/缓存返回字符串时身份文案显示反了。
- 页面左上角补充返回按钮，可返回上一页；没有历史页面时回到求职端首页。
- 返回按钮位置改为使用安全区动态定位：`left: 16`，`top: insets.top + 8`，避免不同机型上跑偏。

### 追加修复

修复日期红屏后，再次切换头头身份时出现：

```text
Invalid education level
```

原因是 `src/common/NormalEnum.ts` 里的学历、求职状态、学历类型转换函数遇到未知枚举值会直接抛异常。后端候选人数据只要有一个字段超出前端枚举表，整个列表就会红屏。

修改：

```text
src/common/NormalEnum.ts
```

- `getChineseEducation`
- `getJobStatus`
- `getEducationType`

以上函数现在遇到未知值会返回空字符串，不再抛异常。

## 在线简历创建/编辑前端模块

### 背景

当前后端接口里只看到在线简历读取接口：

```text
/member/api/online/resume/info
```

还没有在线简历新增、编辑、删除接口。因此本次先实现前端可演示版本，内容保存到本机 `AsyncStorage` 草稿中。

### 修改

新增：

```text
src/utils/OnlineResumeDraftUtil.ts
```

用于读写本机在线简历草稿，并把后端读取结果和本地草稿合并展示。

新增：

```text
src/pages/worker/onlineResume/OnlineResumeEditPage.tsx
```

这是通用编辑页，支持：

- 编辑个人优势。
- 新增/编辑/删除求职期望。
- 新增/编辑/删除工作经历。
- 新增/编辑/删除项目经历。
- 新增/编辑/删除教育经历。

修改：

```text
src/pages/worker/onlineResume/OnlineResumePage.tsx
```

主要处理：

- 页面打开时读取后端在线简历和本机草稿。
- 后端无在线简历时，也可以用本机缓存的会员信息展示基础资料。
- 个人优势编辑图标接入编辑页。
- 求职期望、工作经历、项目经历、教育经历的新增按钮接入编辑页。
- 已有条目点击后进入编辑页。
- 后端没有在线简历时，空状态提供“创建在线简历”按钮。

修改：

```text
App.tsx
```

注册 `OnlineResumeEditPage` 路由。

### 当前限制

- 当前保存只保存在本机，不会同步到服务器。
- 删除也是删除本机草稿中的条目。
- 后端保存接口完成后，需要把 `OnlineResumeDraftUtil` 的保存逻辑替换为真实接口调用。

## 在线简历 UI 优化

### 调整目标

用户反馈前一版在线简历创建/编辑页不够接近 BOSS 直聘的产品形态。  
本次按招聘 App 常见的“在线简历总览 + 分模块编辑”方式重新整理 UI。

### 修改文件

```text
src/pages/worker/onlineResume/OnlineResumePage.tsx
src/pages/worker/onlineResume/OnlineResumeEditPage.tsx
```

### 在线简历总览页

将原页面改为更接近 BOSS 风格的结构：

- 顶部标题为“我的在线简历”。
- 保留返回按钮。
- 右侧“预览”不再是无反馈入口，点击会提示当前后端预览接口尚未接入。
- 增加简历评分卡片：
  - 显示“简历专业评分”。
  - 根据个人信息、个人优势、求职期望、工作经历、项目经历、教育经历计算完成度。
  - 显示待优化项数量。
  - “去完善”按钮会跳到第一个未完成模块。
- 增加个人信息卡片：
  - 展示姓名、年龄、学历、求职状态、手机号/微信、头像。
  - 点击可进入个人资料完善页。
- 下方按模块展示：
  - 个人优势
  - 求职期望
  - 工作经历
  - 项目经历
  - 教育经历
- 每个模块都显示“已完成 / 待完善”状态。
- 有数据时展示摘要，无数据时展示添加入口。
- 求职期望、工作经历、项目经历、教育经历均支持点击条目进入编辑页。

### 在线简历编辑页

将单个模块编辑页也统一为同一套视觉风格：

- 白色顶部导航栏。
- 页面背景改为浅灰。
- 顶部增加模块说明卡片。
- 表单区域改为白色卡片。
- 输入区域去掉传统方框边框，改为更接近招聘 App 的白底列表和细分割线样式。
- 底部增加固定“保存草稿”按钮。
- 删除按钮保留，只删除本机草稿中的当前条目。

### 说明

本次是前端 UI 和交互入口优化，没有新增后端接口。  
在线简历内容仍然保存到本机 `AsyncStorage` 草稿中。

## 2026-06-15 追加修改

### 1. 建立 git 存档

当前目录已经初始化为 git 仓库，并保存了关键阶段提交：

```text
34d6573 chore: save current runnable app state
774191b fix: improve sms login flow
81ae565 chore: update app icon and display name
```

如果要回看本机修改历史，可以使用：

```bash
git log --oneline
git show 774191b
git show 81ae565
```

### 2. 真机调试与安装

在 iPhone X / iOS 16.7.14 上完成过真机构建和安装。

为尽量不影响同事电脑里的 Xcode 项目设置，真机调试使用命令行临时签名参数，没有把个人签名团队写死到 Xcode 工程文件里。

临时真机调试 bundle id：

```text
com.limei.ttzhipinapp
```

说明：

- 该 bundle id 是为了当前设备调试临时使用。
- 若合并回大项目或准备 TestFlight/上架，应由大项目统一确定正式 bundle id、签名 Team、证书和描述文件。
- iOS 删除 App 后重新安装时，可能需要在手机 `设置 > 通用 > VPN与设备管理/设备管理` 中重新信任开发者。

### 3. 短信登录 uuid 修复

真机测试时出现：

```text
uuid输入错误
```

原因判断：短信登录分两步，发送验证码时后端返回临时 `uuid`，校验验证码时必须带同一个 `uuid`。前端此前只识别少数字段，若后端返回对象或字段名不一致，可能把错误值传给后端，导致校验失败。

修改文件：

```text
src/stores/MemberStore.ts
src/pages/login/LoginPage.tsx
src/pages/login/CheckSmsCaptchaPage.tsx
```

主要修改：

- 新增 `extractLoginUuid`，兼容后端可能返回的 `uuid`、`loginToken`、`login_token`、`token`、`smsUuid`、`captchaUuid`、`captchaKey`、`key` 等字段，以及这些字段的 `data.*` 嵌套形式。
- 登录时如果页面参数中的 uuid 丢失，会尝试从 `AsyncStorage` 的 `LOGIN_TOKEN` 读取。
- uuid 缺失时不再继续请求后端，而是提示“验证码登录凭证已失效，请重新发送验证码”。
- 手机号登录页增加 11 位手机号校验、协议勾选校验、发送中状态和失败弹窗。
- 验证码页增加验证码完整性校验、登录中状态、失败弹窗、重新发送验证码功能和手机号脱敏展示。

验证结果：

```bash
npx tsc --noEmit --pretty false
```

通过。重新安装到真机后，用户确认短信登录可用。

### 4. App 图标和显示名称修改

用户提供了新的图标源文件：

```text
1.jpg
```

图片内容为蓝白色 `AI智聘` 图标。

修改目标：

```text
App 显示名称：AI智聘
```

修改文件：

```text
app.json
ios/ttZhipinApp/Info.plist
ios/ttZhipinApp/Images.xcassets/AppIcon.appiconset/Contents.json
ios/ttZhipinApp/Images.xcassets/AppIcon.appiconset/Icon-App-*.png
android/app/src/main/res/values/strings.xml
android/app/src/main/res/mipmap-*/ic_launcher.png
android/app/src/main/res/mipmap-*/ic_launcher_round.png
```

处理方式：

- 用 `1.jpg` 生成 iOS 所需的 AppIcon 多尺寸 PNG。
- 更新 iOS `Contents.json`，绑定各个图标文件名。
- 设置 iOS `CFBundleDisplayName` 为 `AI智聘`。
- 同步更新 Android `app_name` 和 launcher 图标。
- 同步更新 `app.json` 的 `displayName`。

真机说明：

- 覆盖安装时 iOS 桌面图标可能仍显示旧图标，这是 iOS 图标缓存。
- 删除旧 App 后重新安装，图标缓存会刷新。
- 删除旧 App 会清空本机登录状态和本地缓存。

### 5. 回传大项目的 zip 包

已生成用于回传大项目的干净前端源码包：

```text
/Users/ylkj/Documents/Codex/Projects/zhipin/ai-zhipin-frontend-2026-06-15.zip
```

该 zip 包包含当前 `ttZhipinApp` 前端源码，已排除：

```text
node_modules
ios/Pods
ios/build
android/app/build
.git
.bundle
ios/.xcode.env.local
本机缓存和构建产物
```

建议交给大项目环境中的 AI 处理合并，只合并前端目录，不要覆盖或修改后端目录。

## 已验证的结果

### iOS Simulator

已成功在 iPhone 14 Simulator 上：

- 构建 App。
- 启动 App。
- 手机号验证码登录。
- 进入登录后的页面。
- 修复图标问号显示。
- 修复在线简历无数据崩溃。
- 完成个人资料相关改动后，TypeScript 检查通过。
- 完成个人资料相关改动后，iOS Simulator 构建和启动成功。
- 修复切换头头身份后招聘端候选人列表的日期红屏问题。
- 修复切换头头身份后招聘端候选人列表的枚举红屏问题。
- 在线简历新增/编辑前端模块完成，TypeScript 检查通过。
- 在线简历 UI 优化完成，TypeScript 检查通过。
- 真机 iPhone X / iOS 16.7.14 上成功构建并安装。
- 真机短信登录 uuid 修复后，用户确认可以登录。
- 新图标和 `AI智聘` 显示名称已打入 iOS 构建产物。

运行命令示例：

```bash
npm start
npx tsc --noEmit --pretty false
npm run ios -- --simulator "iPhone 14"
```

## 仍需注意的问题

### 1. git 状态

最初解压目录不是 git 仓库，后来已经初始化 git 并提交当前可运行版本。
后续继续修改前，建议先确认：

```bash
git status --short
git log --oneline -5
```

### 2. 真机安装仍需 Apple 签名

要装到你的 iPhone，需要：

- Xcode 登录 Apple ID。
- iPhone 连接 Mac 并信任电脑。
- 开启 iPhone 开发者模式。
- Xcode 设置 Signing Team。
- 选择真机运行。

如果没有数据线，通常无法完成首次 Xcode 配对。无线调试一般也需要先有线配对一次。

### 3. Xcode 版本偏旧

当前 Xcode 是 14.3.1。如果 iPhone 系统版本较新，真机运行可能失败，需要升级 Xcode 或 macOS。

### 4. TypeScript 检查已可通过

此前 `npx tsc --noEmit --pretty false` 会提示 MobX decorator 配置问题。  
这次已在 `tsconfig.json` 中开启 `experimentalDecorators`，当前类型检查可以通过。

### 5. ESLint 有大量原有格式问题

运行 ESLint 时会出现大量 Prettier/换行格式问题，主要和项目原文件格式、CRLF 换行、未使用 import 等有关。本次没有做全项目格式化，避免大范围改动。

### 6. `react-native-sqlite-storage` 配置警告

运行 React Native 命令时会看到：

```text
Package react-native-sqlite-storage contains invalid configuration
```

目前它是警告，不阻塞 iOS 构建和运行。

### 7. Build iOS Apps 插件限制

Build iOS Apps 插件对模拟器启动、截图、日志有帮助。  
但当前 Mac 环境较旧，插件里的部分 UI 自动化能力依赖 macOS 14 构建的工具，在本机 macOS 上会失败。因此实际构建运行主要还是使用 React Native / Xcode 命令。

## 主要变更文件清单

```text
app.json
1.jpg
package.json
package-lock.json
Gemfile.lock
ios/.xcode.env.local
ios/ttZhipinApp/Info.plist
ios/ttZhipinApp/Images.xcassets/AppIcon.appiconset/Contents.json
ios/ttZhipinApp/Images.xcassets/AppIcon.appiconset/Icon-App-*.png
ios/ttZhipinApp.xcodeproj/project.pbxproj
react-native.config.js
android/app/src/main/res/values/strings.xml
android/app/src/main/res/mipmap-*/ic_launcher.png
android/app/src/main/res/mipmap-*/ic_launcher_round.png
src/apis/ApiService.ts
src/common/CommonConstant.ts
src/common/NormalEnum.ts
src/components/MenuBar.tsx
src/pages/login/LoginPage.tsx
src/pages/login/CheckSmsCaptchaPage.tsx
src/pages/splash/SplashPage.tsx
src/pages/toutou/toutou_worker/ToutouWorkerPage.tsx
src/pages/worker/onlineResume/OnlineResumeEditPage.tsx
src/pages/worker/mine/BecomeBossPage.tsx
src/pages/worker/init/InitMemberInfoPage.tsx
src/pages/worker/onlineResume/OnlineResumePage.tsx
src/stores/MemberStore.ts
src/stores/OnlineResumeStore.ts
src/utils/MemberInfoUtil.ts
src/utils/OnlineResumeDraftUtil.ts
src/utils/StrUtil.ts
tsconfig.json
node_modules/react-native/third-party-podspecs/boost.podspec
android/app/src/main/assets/fonts/*
```

## 建议后续动作

1. 把 `ai-zhipin-frontend-2026-06-15.zip` 交给大项目环境中的 AI，让它只合并前端目录，不要改后端。
2. 合并前让对方 AI 先备份原大项目前端，或在 git 分支中合并，避免覆盖别人后续改动。
3. 合并后重新安装依赖，重新执行 iOS Pods 安装，不要复用这台电脑的 `node_modules` 或 `ios/Pods`。
4. 如果要长期维护，建议统一 Node 版本、npm/pnpm 策略、iOS bundle id、签名 Team 和 TestFlight 发布流程。
5. 如果只是个人手机测试，用 Xcode 真机运行即可；如果要给多人测试，建议使用 Apple Developer Program + TestFlight。
