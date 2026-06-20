# Save original working directory
$originalDir = Get-Location

# Navigate to the mobile-app folder
cd "c:\Users\USER\Downloads\JUSTUS\mobile-app"

Write-Host "📦 Bundling React Native assets and building Release APK..." -ForegroundColor Cyan

# Run gradlew assembleRelease inside the android folder
cd android
.\gradlew assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Gradle build failed!" -ForegroundColor Red
    cd $originalDir
    exit $LASTEXITCODE
}

# The generated APK path
$apkPath = "c:\Users\USER\Downloads\JUSTUS\mobile-app\android\app\build\outputs\apk\release\JustUs.apk"
$fallbackPath = "c:\Users\USER\Downloads\JUSTUS\mobile-app\android\app\build\outputs\apk\release\app-release.apk"
$destPath = "c:\Users\USER\Downloads\JUSTUS\web-landing\justus.apk"

if (Test-Path $apkPath) {
    Copy-Item -Path $apkPath -Destination $destPath -Force
    Write-Host "✅ Release APK ($apkPath) successfully copied to: $destPath" -ForegroundColor Green
} elseif (Test-Path $fallbackPath) {
    Copy-Item -Path $fallbackPath -Destination $destPath -Force
    Write-Host "✅ Release APK ($fallbackPath) successfully copied and renamed to: $destPath" -ForegroundColor Green
} else {
    Write-Host "❌ Could not find the built APK at $apkPath or $fallbackPath" -ForegroundColor Red
}

cd $originalDir
