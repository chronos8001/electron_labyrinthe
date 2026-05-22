const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Importation des modules d'authentification et base de données
const Database = require('./src/database');
const Auth = require('./src/auth');
const Labyrinth = require('./src/labyrinth');

let mainWindow;
let db;
let auth;

// ─── Créer la fenêtre principale ─────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('renderer/index.html');

  // Menu
  createMenu();

  // DevTools en développement
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// ─── Créer le menu ──────────────────────────────────────
function createMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Quitter',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ─── IPC : Authentification ────────────────────────────
ipcMain.handle('auth:login', async (event, credentials) => {
  try {
    const result = await auth.login(credentials.username, credentials.password);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('auth:register', async (event, userData) => {
  try {
    const result = await auth.register(userData.username, userData.email, userData.password);
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// ─── IPC : Labyrinthes (CRUD) ──────────────────────────
ipcMain.handle('labyrinth:create', async (event, data) => {
  try {
    const result = await db.createLabyrinth(
      data.userId,
      data.name,
      data.size,
      data.difficulty,
      data.data || {}
    );
    return { success: true, labyrinthId: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('labyrinth:list', async (event, userId) => {
  try {
    const labyrinths = await db.getUserLabyrinths(userId);
    return { success: true, data: labyrinths };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('labyrinth:get', async (event, id) => {
  try {
    const labyrinth = await db.getLabyrinthById(id);
    return { success: true, data: labyrinth };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('labyrinth:update', async (event, id, data) => {
  try {
    const success = await db.updateLabyrinth(id, data);
    return { success, message: success ? 'Mis à jour' : 'Erreur' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('labyrinth:delete', async (event, id) => {
  try {
    const success = await db.deleteLabyrinth(id);
    return { success, message: success ? 'Supprimé' : 'Erreur' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// ─── IPC : Génération & Résolution ──────────────────────
ipcMain.handle('labyrinth:generate', async (event, options) => {
  try {
    console.log('Generate labyrinth:', options);
    return { success: false, data: null };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('labyrinth:solve', async (event, labyrinth) => {
  try {
    console.log('Solve labyrinth');
    return { success: false, data: null };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// ─── IPC : Admin ────────────────────────────────────────
ipcMain.handle('admin:getStatistics', async (event) => {
  try {
    const stats = await db.getDetailedStatistics();
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('admin:getUsers', async (event) => {
  try {
    const users = await db.getAllUsers();
    return { success: true, data: users };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('admin:deleteUser', async (event, userId) => {
  try {
    const success = await db.deleteUser(userId);
    return { success, message: success ? 'Utilisateur supprimé' : 'Erreur' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// ─── Cycle de vie de l'app ──────────────────────────────
app.on('ready', async () => {
  // Initialiser la base de données
  try {
    db = new Database();
    await db.initialize();
    auth = new Auth(db);
    console.log('✓ Base de données et authentification initialisées');
  } catch (error) {
    console.error('Erreur d\'initialisation:', error);
    dialog.showErrorBox('Erreur', 'Impossible d\'initialiser la base de données');
    app.quit();
    return;
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('Erreur non gérée:', error);
});
