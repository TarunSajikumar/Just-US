const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function run() {
  const localAppData = process.env.LOCALAPPDATA;
  let adbPath = 'adb'; // Default fallback if in PATH
  
  if (process.platform === 'win32' && localAppData) {
    const sdkAdbPath = path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
    if (fs.existsSync(sdkAdbPath)) {
      adbPath = `"${sdkAdbPath}"`;
    }
  }

  try {
    console.log(`Running: ${adbPath} reverse tcp:8081 tcp:8081`);
    execSync(`${adbPath} reverse tcp:8081 tcp:8081`, { stdio: 'inherit' });
    console.log('Successfully reversed port 8081.');

    console.log(`Running: ${adbPath} reverse tcp:5000 tcp:5000`);
    execSync(`${adbPath} reverse tcp:5000 tcp:5000`, { stdio: 'inherit' });
    console.log('Successfully reversed port 5000 (backend API).');
  } catch (error) {
    console.warn('Could not run adb reverse automatically. Ensure your emulator or physical device is connected.');
  }
}

run();
