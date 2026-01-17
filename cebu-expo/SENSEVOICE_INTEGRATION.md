# SenseVoice ASR Integration Guide

本文档说明如何在 Cebu Expo 应用中集成 SenseVoice 离线语音识别功能。

## 概述

Cebu Expo 现在使用 **SenseVoice Small** 模型通过 **sherpa-onnx** 实现端侧离线中文语音识别。

### 技术栈
- **ASR 模型**: SenseVoice Small (阿里巴巴开源)
- **推理引擎**: sherpa-onnx (next-gen Kaldi)
- **原生桥接**: Expo Modules API
- **平台**: Android (API 21+), iOS (13.0+)

### 特性
- ✅ **完全离线**: 无需网络连接
- ✅ **低延迟**: 处理 10 秒音频仅需 70ms
- ✅ **多语言**: 支持中文、英语、日语、韩语、粤语
- ✅ **多功能**: ASR + 语言识别 + 情感识别 + 事件检测
- ✅ **自动下载**: 首次运行自动下载模型

## 项目结构

```
cebu-expo/
├── modules/
│   └── expo-sensevoice-asr/          # 原生模块
│       ├── android/                   # Android 实现 (Kotlin)
│       │   ├── build.gradle           # Gradle 配置
│       │   └── src/main/java/expo/modules/sensevoiceasr/
│       │       └── ExpoSenseVoiceASRModule.kt
│       ├── ios/                       # iOS 实现 (Swift)
│       │   ├── ExpoSenseVoiceASRModule.swift
│       │   └── ExpoSenseVoiceASR.podspec
│       ├── src/                       # TypeScript 接口
│       │   ├── index.ts
│       │   ├── ExpoSenseVoiceASRModule.ts
│       │   └── ExpoSenseVoiceASR.types.ts
│       ├── expo-module.config.json    # 模块配置
│       └── package.json
│
└── src/core/services/
    └── SenseVoiceService.ts           # 服务层封装
```

## 设置步骤

### 1. 退出 Expo Go，使用 Expo Dev Client

由于使用了自定义原生模块，无法在 Expo Go 中运行，必须使用 Expo Dev Client。

#### 安装 Expo Dev Client:

```bash
cd cebu-expo
npx expo install expo-dev-client
```

#### 配置 app.json:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 21,
            "compileSdkVersion": 34,
            "targetSdkVersion": 34
          },
          "ios": {
            "deploymentTarget": "13.0"
          }
        }
      ]
    ]
  }
}
```

### 2. Android 配置

#### 在 `android/settings.gradle` 中添加模块:

```gradle
include ':expo-sensevoice-asr'
project(':expo-sensevoice-asr').projectDir = new File(rootProject.projectDir, '../modules/expo-sensevoice-asr/android')
```

#### sherpa-onnx 依赖已自动包含在 `modules/expo-sensevoice-asr/android/build.gradle`:

```gradle
dependencies {
  implementation 'com.k2fsa.sherpa.onnx:sherpa-onnx:1.10.30'
}
```

### 3. iOS 配置

**注意:** sherpa-onnx 没有 CocoaPods pod，必须手动构建 xcframework。

#### 步骤 1: 安装构建工具

```bash
# 安装 cmake（如果未安装）
brew install cmake
```

#### 步骤 2: 构建 sherpa-onnx iOS 框架

```bash
# 克隆 sherpa-onnx 仓库
cd /tmp
git clone --depth 1 https://github.com/k2-fsa/sherpa-onnx.git

# 运行 iOS 构建脚本（大约需要 5-10 分钟）
cd sherpa-onnx
./build-ios.sh

# 构建完成后，框架位于:
# /tmp/sherpa-onnx/build-ios/sherpa-onnx.xcframework
# /tmp/sherpa-onnx/build-ios/ios-onnxruntime/1.17.1/onnxruntime.xcframework
```

#### 步骤 3: 复制框架到项目

```bash
# 创建 Frameworks 目录
mkdir -p /path/to/cebu-expo/ios/Frameworks

# 复制框架
cp -R /tmp/sherpa-onnx/build-ios/sherpa-onnx.xcframework /path/to/cebu-expo/ios/Frameworks/
cp -R /tmp/sherpa-onnx/build-ios/ios-onnxruntime/1.17.1/onnxruntime.xcframework /path/to/cebu-expo/ios/Frameworks/
```

#### 步骤 4: 配置 Podfile

Podfile 已配置为自动链接手动构建的框架（通过 `post_install` hook）。无需额外配置。

#### 步骤 5: 安装 pods

```bash
cd ios
pod install
cd ..
```

**注意:**
- iOS 框架已在项目中就绪，`pod install` 会自动配置链接
- 框架文件较大（~100MB），已在 `.gitignore` 中排除
- 其他开发者需要重复步骤 1-3 来构建框架

### 4. 预构建和运行

#### Android:

```bash
# 预构建
npx expo prebuild --platform android

# 运行
npx expo run:android
```

#### iOS:

```bash
# 预构建
npx expo prebuild --platform ios

# 运行
npx expo run:ios
```

## 使用方式

### 初始化

应用启动时，`SenseVoiceService` 会自动：
1. 检查模型是否已缓存
2. 如果未缓存，从 GitHub 下载模型文件（约 250MB）
3. 初始化 sherpa-onnx 识别器

```typescript
import { SenseVoiceService } from './core/services/SenseVoiceService';

// 初始化（首次运行会下载模型）
await SenseVoiceService.initialize();
```

### 转录音频

```typescript
// 录音后得到 Float32Array samples (16kHz mono)
const result = await SenseVoiceService.decode(samples);

console.log('转录文字:', result.text);
console.log('置信度:', result.confidence);
```

### 检查状态

```typescript
const status = await SenseVoiceService.getStatus();
console.log('已初始化:', status.isInitialized);
console.log('模型路径:', status.modelPath);
```

## 模型信息

### 默认模型

- **名称**: sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17
- **大小**: ~250MB (量化后的 int8 模型)
- **语言**: 中文、英语、日语、韩语、粤语
- **下载源**: GitHub Releases (k2-fsa/sherpa-onnx)

### 模型文件

模型自动下载到：
```
{DocumentDirectory}/sensevoice-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17/
├── model.int8.onnx   # 量化模型（使用）
├── model.onnx        # 完整模型
└── tokens.txt        # 词表
```

### 更换模型

如需使用其他 SenseVoice 模型，修改 `SenseVoiceService.ts`:

```typescript
private static readonly MODEL_NAME = 'your-model-name';
private static readonly MODEL_FILES = [/* your model files */];
```

## 性能优化

### Android

- 使用 **int8 量化模型** 提升速度（已默认启用）
- 线程数: 2（可在初始化时调整）
- 支持 QNN (Qualcomm NPU) 加速

### iOS

- 使用 **int8 量化模型**
- 线程数: 2
- 支持 Core ML 加速（需额外配置）

### 模型切换

如果设备性能足够，可切换到完整 `model.onnx` 以获得更高准确率：

```typescript
// 在 SenseVoiceService.ts initialize() 中
modelPath: `${this.modelPath}/model.onnx`, // 完整模型
```

## 故障排除

### Android

#### 问题: sherpa-onnx AAR 下载失败

**解决方案**: 在 `android/build.gradle` 添加 Maven 仓库:

```gradle
allprojects {
  repositories {
    mavenCentral()
  }
}
```

#### 问题: 编译错误 "minSdkVersion 21 required"

**解决方案**: 确保 `android/build.gradle` 设置:

```gradle
android {
  defaultConfig {
    minSdkVersion 21
  }
}
```

### iOS

#### 问题: sherpa-onnx pod 找不到

**原因**: sherpa-onnx 没有官方 CocoaPods pod。

**解决方案**: 必须手动构建 xcframework（参见上方"iOS 配置"部分）:
1. 安装 cmake: `brew install cmake`
2. 克隆并构建 sherpa-onnx: `cd /tmp && git clone --depth 1 https://github.com/k2-fsa/sherpa-onnx.git && cd sherpa-onnx && ./build-ios.sh`
3. 复制框架到项目: `cp -R build-ios/sherpa-onnx.xcframework /path/to/project/ios/Frameworks/`
4. 复制 onnxruntime: `cp -R build-ios/ios-onnxruntime/1.17.1/onnxruntime.xcframework /path/to/project/ios/Frameworks/`
5. 运行 `pod install`

#### 问题: iOS 构建脚本失败 "cmake: command not found"

**解决方案**: 安装 cmake
```bash
brew install cmake
```

#### 问题: Swift 模块编译错误

**解决方案**: 确保 Xcode 版本 >= 14.0，Swift >= 5.4

#### 问题: 框架链接错误

**解决方案**: 确保:
1. 框架文件存在于 `ios/Frameworks/` 目录
2. Podfile 包含 `post_install` hook 自动配置框架链接
3. 重新运行 `pod install`

### 模型下载

#### 问题: 模型下载超时或失败

**解决方案**:
1. 检查网络连接
2. 使用 VPN 或镜像源
3. 手动下载模型文件放到 `{DocumentDirectory}/sensevoice-models/`

## 开发建议

### 测试 Mock vs 真实

在开发阶段，你可以在 Mock 和真实 ASR 之间切换：

```typescript
// recordingStore.ts

// 使用 Mock（快速测试）
import { MockASRService } from '../../../core/services/MockASRService';
const transcription = await MockASRService.decode(result.samples);

// 使用真实 SenseVoice（生产）
import { SenseVoiceService } from '../../../core/services/SenseVoiceService';
const transcription = await SenseVoiceService.decode(result.samples);
```

### 调试日志

启用 sherpa-onnx 调试日志：

```typescript
await ExpoSenseVoiceASRModule.initialize({
  modelPath: modelPath,
  debug: true, // 启用调试
});
```

## 参考资料

- [SenseVoice GitHub](https://github.com/FunAudioLLM/SenseVoice)
- [sherpa-onnx Documentation](https://k2-fsa.github.io/sherpa/onnx/index.html)
- [SenseVoice Models](https://k2-fsa.github.io/sherpa/onnx/sense-voice/pretrained.html)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

## 许可证

- SenseVoice: MIT License
- sherpa-onnx: Apache License 2.0
- Cebu Expo: MIT License
