const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'icon.png') // 占位符，可以后续添加图标
  });

  // 加载应用的 index.html
  win.loadFile('index.html');

  // 开发模式下打开 DevTools
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

// 当 Electron 完成初始化时触发
app.whenReady().then(() => {
  createWindow();

  // macOS 特性：如果没有窗口打开，当点击 dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口关闭时退出应用 (Windows/Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
