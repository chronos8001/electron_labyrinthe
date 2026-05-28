const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', { 
  auth: {
    login: (username, password) => 
      ipcRenderer.invoke('auth:login', { username, password }),
    register: (username, password, email) => 
      ipcRenderer.invoke('auth:register', { username, password, email })
  },

  
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

  
  maze: {
    generate: (size, difficulty) => 
      ipcRenderer.invoke('labyrinth:generate', { size, difficulty }),
    solve: (labyrinthId, maze) => 
      ipcRenderer.invoke('labyrinth:solve', labyrinthId, maze)
  },

  
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

  
  export: {
    labyrinth: (labyrinthId) => 
      ipcRenderer.invoke('labyrinth:export', labyrinthId)
  },
  import: {
    labyrinth: (userId, data) => 
      ipcRenderer.invoke('labyrinth:import', userId, data)
  },

  
  onNotification: (callback) => 
    ipcRenderer.on('notification', (event, data) => callback(data)),
  onLabyrinthCreated: (callback) => 
    ipcRenderer.on('labyrinth:created', (event, data) => callback(data))
});
