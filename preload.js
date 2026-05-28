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
    getStatistics: (userId) => 
      ipcRenderer.invoke('admin:getStatistics', { userId }),
    getUsers: (userId) => 
      ipcRenderer.invoke('admin:getUsers', { userId }),
    getAllLabyrinths: (userId) => 
      ipcRenderer.invoke('admin:getAllLabyrinths', { userId }),
    deleteUser: (userId, targetUserId) => 
      ipcRenderer.invoke('admin:deleteUser', { userId, targetUserId }),
    deleteLabyrinth: (userId, labyrinthId) => 
      ipcRenderer.invoke('admin:deleteLabyrinth', { userId, labyrinthId }),
    createUser: (userId, userData) => 
      ipcRenderer.invoke('admin:createUser', { userId, ...userData }),
    updateUserRole: (userId, targetUserId, isAdmin) => 
      ipcRenderer.invoke('admin:updateUserRole', { userId, targetUserId, isAdmin })
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
