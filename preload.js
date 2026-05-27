const { contextBridge, ipcRenderer } = require('electron');

// Expose une API sécurisée au renderer process
contextBridge.exposeInMainWorld('api', {
  // ─── Authentification ─────────────────────
  auth: {
    login: (username, password) => 
      ipcRenderer.invoke('auth:login', { username, password }),
    register: (username, password, email) => 
      ipcRenderer.invoke('auth:register', { username, password, email })
  },

  // ─── Labyrinthes (CRUD) ──────────────────
  labyrinth: {
    create: (data) => 
      ipcRenderer.invoke('labyrinth:create', data),
    list: (userId) => 
      ipcRenderer.invoke('labyrinth:list', userId),
    get: (id) => 
      ipcRenderer.invoke('labyrinth:get', id),
    update: (id, data) => 
      ipcRenderer.invoke('labyrinth:update', id, data),
    delete: (id) => 
      ipcRenderer.invoke('labyrinth:delete', id)
  },

  // ─── Génération & Résolution ──────────────
  maze: {
    generate: (size, difficulty) => 
      ipcRenderer.invoke('labyrinth:generate', { size, difficulty }),
    solve: (labyrinth) => 
      ipcRenderer.invoke('labyrinth:solve', labyrinth)
  },

  // ─── Admin ────────────────────────────────
  admin: {
    getStatistics: () => 
      ipcRenderer.invoke('admin:getStatistics'),
    getUsers: () => 
      ipcRenderer.invoke('admin:getUsers'),
    getAllLabyrinths: () => 
      ipcRenderer.invoke('admin:getAllLabyrinths'),
    deleteUser: (userId) => 
      ipcRenderer.invoke('admin:deleteUser', userId),
    deleteLabyrinth: (labyrinthId) => 
      ipcRenderer.invoke('admin:deleteLabyrinth', labyrinthId)
  },

  // ─── Export/Import ────────────────────────
  export: {
    labyrinth: (labyrinthId) => 
      ipcRenderer.invoke('labyrinth:export', labyrinthId)
  },
  import: {
    labyrinth: (userId, data) => 
      ipcRenderer.invoke('labyrinth:import', userId, data)
  }

  // ─── Événements du renderer ───────────────
  onNotification: (callback) => 
    ipcRenderer.on('notification', (event, data) => callback(data)),
  onLabyrinthCreated: (callback) => 
    ipcRenderer.on('labyrinth:created', (event, data) => callback(data))
});
