const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const {startExpress} = require('./prod');
const {startGitServer} = require('./nodeGitServer');
const { role } = require('../role.json');
const path = require('path')
const Store = require('electron-store');

const port = 51223;

if (require('electron-squirrel-startup')) app.quit();

if (process.platform === 'darwin') {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'Command+N',
          click: () => {
            createWindow();
          }
        },
        { role: 'close' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ]));
}
function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return {action: 'deny'};
  });
  // and load the index.html of the app.
  // win.loadFile("index.html");
  win.loadURL(`http://localhost:${port}/note/-1`);
}

// const gotTheLock = app.requestSingleInstanceLock()
// if (!gotTheLock) {
//   app.exit()
// } else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    startGitServer().then(() => {
      startExpress({port}).then(() => {
        createWindow();
      })
    });
  });
  if (role === 'mas') {
    app.commandLine.appendSwitch('js-flags', '--lite-mode')
  }
  app.on('ready', e => {
    ipcMain.handle('openInFinder', (e, path) => {
      shell.openPath(path)
    })
    ipcMain.handle('dialog:openDirectory', async (_) => {
      const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
      return result
    })
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
// }
