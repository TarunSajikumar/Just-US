@echo off
echo 📦 Bundling assets and building Release APK...
cd /d "c:\Users\USER\Downloads\JUSTUS\mobile-app\android"
call gradlew.bat assembleRelease
if %ERRORLEVEL% neq 0 (
    echo ❌ Gradle build failed!
    exit /b %ERRORLEVEL%
)
copy /y "c:\Users\USER\Downloads\JUSTUS\mobile-app\android\app\build\outputs\apk\release\app-release.apk" "c:\Users\USER\Downloads\JUSTUS\web-landing\justus.apk"
echo ✅ Release APK successfully copied to: c:\Users\USER\Downloads\JUSTUS\web-landing\justus.apk
