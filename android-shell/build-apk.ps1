# Reusable Foodiebator APK build (Windows PowerShell 5.1+). Run from android-shell folder.
# Prereqs (one-time, user-local, no admin):
#   JDK 21 at $env:LOCALAPPDATA\Android\jdk21\<ver> (Microsoft portable zip)
#   Android SDK at $env:LOCALAPPDATA\Android\Sdk (cmdline-tools + platform-tools + android-35 + build-tools 35)
$ErrorActionPreference = "Stop"
$shell = Split-Path -Parent $MyInvocation.MyCommand.Path
$jdk = Get-ChildItem -LiteralPath "$env:LOCALAPPDATA\Android\jdk21" -Directory | Select-Object -First 1 -ExpandProperty FullName
$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
Set-Location -LiteralPath $shell
npm install --no-audit --no-fund
npx cap sync android
Set-Location -LiteralPath (Join-Path $shell "android")
& "C:\Users\Tayo\AppData\Local\Android\gradle\gradle-8.11.1\bin\gradle.bat" assembleDebug --no-daemon
$apk = Join-Path $shell "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path -LiteralPath $apk) {
  $out = "C:\Users\Tayo\Desktop\Foodiebator-APK\foodiebator-debug-v1.apk"
  New-Item -ItemType Directory -Force -Path (Split-Path $out) | Out-Null
  Copy-Item -LiteralPath $apk -Destination $out -Force
  Get-FileHash -LiteralPath $out -Algorithm SHA256
  & "$env:ANDROID_HOME\build-tools\35.0.0\apksigner.bat" verify --print-certs $out
} else { throw "APK not produced" }
