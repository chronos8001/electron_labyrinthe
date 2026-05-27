/* ═══════════════════════════════════════════════════════════ */
/* Application Renderer - Logique cliente */
/* ═══════════════════════════════════════════════════════════ */

let currentUser = null;

/* ─────────────────────────────────────────────────────────── */
/* Initialisation */
/* ─────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadMazePreview();
});

function initializeEventListeners() {
  // Authentification
  document.getElementById('login-tab').addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('register-tab').addEventListener('click', () => switchAuthTab('register'));

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);

  // Navigation principale
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const screen = e.target.dataset.screen;
      if (screen) switchScreen(screen);
    });
  });

  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Création de labyrinthe
  document.getElementById('create-form').addEventListener('submit', handleCreateLabyrinth);
  document.getElementById('maze-difficulty').addEventListener('input', (e) => {
    document.getElementById('difficulty-value').textContent = e.target.value;
  });

  // Admin tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', (e) => switchAdminTab(e.target.dataset.adminTab));
  });
}

/* ─────────────────────────────────────────────────────────── */
/* Authentification */
/* ─────────────────────────────────────────────────────────── */

function switchAuthTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

  if (tab === 'login') {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('login-form').classList.add('active');
  } else {
    document.getElementById('register-tab').classList.add('active');
    document.getElementById('register-form').classList.add('active');
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');

  try {
    errorDiv.classList.remove('show');
    
    const result = await window.api.auth.login(username, password);

    if (result.success) {
      currentUser = result.user;
      // Sauvegarder le token et l'utilisateur
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      switchToMainScreen();
      loadDashboard();
    } else {
      errorDiv.textContent = result.message;
      errorDiv.classList.add('show');
    }
  } catch (error) {
    errorDiv.textContent = 'Erreur: ' + error.message;
    errorDiv.classList.add('show');
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const passwordConfirm = document.getElementById('register-password-confirm').value;
  const errorDiv = document.getElementById('register-error');

  if (password !== passwordConfirm) {
    errorDiv.textContent = 'Les mots de passe ne correspondent pas';
    errorDiv.classList.add('show');
    return;
  }

  try {
    errorDiv.classList.remove('show');

    const result = await window.api.auth.register(username, password, email);

    if (result.success) {
      currentUser = result.user;
      // Sauvegarder le token et l'utilisateur
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      switchToMainScreen();
      loadDashboard();
    } else {
      errorDiv.textContent = result.message;
      errorDiv.classList.add('show');
    }
  } catch (error) {
    errorDiv.textContent = 'Erreur: ' + error.message;
    errorDiv.classList.add('show');
  }
}

function handleLogout() {
  if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.getElementById('auth-screen').classList.add('active');
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
  }
}

function switchToMainScreen() {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('main-screen').classList.add('active');

  // Afficher le panel admin si l'utilisateur est admin
  const adminBtn = document.querySelector('[data-screen="admin"]');
  if (currentUser && currentUser.role === 'admin') {
    adminBtn.classList.remove('hidden');
  } else {
    adminBtn.classList.add('hidden');
  }
}

/* ─────────────────────────────────────────────────────────── */
/* Navigation */
/* ─────────────────────────────────────────────────────────── */

function switchScreen(screenId) {
  // Mise à jour des onglets nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.screen === screenId);
  });

  // Affichage de l'écran
  document.querySelectorAll('.content-screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');

  // Actions spécifiques selon l'écran
  if (screenId === 'dashboard') {
    loadDashboard();
  } else if (screenId === 'labyrinth-list') {
    loadLabyrinthList();
  } else if (screenId === 'admin') {
    loadAdminPanel();
  }
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.adminTab === tabName);
  });

  document.querySelectorAll('.admin-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabName + '-tab').classList.add('active');

  if (tabName === 'users') {
    loadAdminUsers();
  } else if (tabName === 'labyrinths') {
    loadAdminLabyrinths();
  }
}

/* ─────────────────────────────────────────────────────────── */
/* Dashboard */
/* ─────────────────────────────────────────────────────────── */

async function loadDashboard() {
  try {
    const result = await window.api.labyrinth.list(currentUser.id);
    
    if (result.success) {
      const labyrinths = result.data || [];
      const solved = labyrinths.filter(l => l.solved).length;
      
      document.getElementById('stat-labyrinths').textContent = labyrinths.length;
      document.getElementById('stat-solved').textContent = solved;
    }
  } catch (error) {
    console.error('Erreur au chargement du dashboard:', error);
  }
}

/* ─────────────────────────────────────────────────────────── */
/* Liste des labyrinthes */
/* ─────────────────────────────────────────────────────────── */

async function loadLabyrinthList() {
  const container = document.getElementById('labyrinths-container');
  
  try {
    const result = await window.api.labyrinth.list(currentUser.id);
    
    if (result.success && result.data && result.data.length > 0) {
      container.innerHTML = result.data.map(labyrinth => `
        <div class="labyrinth-card">
          <h4>${labyrinth.name}</h4>
          <p>Taille: ${labyrinth.size}</p>
          <p>Difficulté: ${labyrinth.difficulty}/10</p>
          <p>État: ${labyrinth.solved ? '✓ Résolu' : '✗ Non résolu'}</p>
          <div class="actions">
            <button class="btn btn-small" onclick="viewLabyrinth('${labyrinth.id}')">Voir</button>
            <button class="btn btn-small" onclick="deleteLabyrinth('${labyrinth.id}')">Supprimer</button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="empty">Aucun labyrinthe créé</p>';
    }
  } catch (error) {
    container.innerHTML = '<p class="empty">Erreur au chargement</p>';
    console.error(error);
  }
}

async function viewLabyrinth(id) {
  try {
    const result = await window.api.labyrinth.get(id);
    if (result.success && result.data) {
      const labyrinth = result.data;
      
      // Afficher dans un modal ou une nouvelle vue
      const modal = document.createElement('div');
      modal.className = 'labyrinth-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${labyrinth.name}</h3>
            <button class="modal-close" onclick="this.closest('.labyrinth-modal').remove()">✕</button>
          </div>
          <div class="modal-body">
            <div id="labyrinth-canvas-container" class="labyrinth-canvas-container"></div>
            <div class="labyrinth-controls">
              <button class="btn btn-primary" onclick="solveLabyrinth(${id})">Résoudre</button>
              <button class="btn btn-secondary" onclick="this.closest('.labyrinth-modal').remove()">Fermer</button>
            </div>
            <div id="solution-info"></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Afficher le labyrinthe
      const container = modal.querySelector('#labyrinth-canvas-container');
      renderMaze(labyrinth, container, 10);
    }
  } catch (error) {
    console.error(error);
    alert('Erreur au chargement du labyrinthe');
  }
}

async function solveLabyrinth(id) {
  try {
    const result = await window.api.labyrinth.get(id);
    if (result.success && result.data) {
      const labyrinth = result.data;
      const solveResult = await window.api.maze.solve(labyrinth);
      
      if (solveResult.success && solveResult.data.solvable) {
        const solution = solveResult.data;
        
        // Afficher la solution avec animation
        const container = document.querySelector('#labyrinth-canvas-container');
        await solveLabyrinthAnimated(labyrinth, solution, container, 10);
        
        // Afficher les infos
        const infoDiv = document.querySelector('#solution-info');
        infoDiv.innerHTML = `
          <div class="solution-info">
            <h4>✓ Labyrinthe résolu !</h4>
            <p>Longueur du chemin: <strong>${solution.path.length}</strong> pas</p>
            <p>Étapes explorees: <strong>${solution.stepsCount}</strong></p>
          </div>
        `;
      } else {
        const infoDiv = document.querySelector('#solution-info');
        infoDiv.innerHTML = '<p class="error">Ce labyrinthe n\'a pas de solution !</p>';
      }
    }
  } catch (error) {
    console.error(error);
    alert('Erreur lors de la résolution');
  }
}

// ─── Animations pas à pas ─────────────────────────────
async function solveLabyrinthAnimated(maze, solution, container, cellSize = 10) {
  const { grid, startX, startY, endX, endY, width, height } = maze;
  const { path } = solution;

  // Créer le canvas
  const canvas = document.createElement('canvas');
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;
  canvas.style.border = '1px solid #ddd';
  canvas.style.borderRadius = '4px';
  canvas.className = 'maze-solving-animation';

  const ctx = canvas.getContext('2d');

  // Couleurs
  const colors = {
    wall: '#333',
    path: '#fff',
    exploring: '#B3E5FC',
    solution: '#FFD700',
    start: '#4CAF50',
    end: '#f44336'
  };

  // Dessiner les murs et chemins d'abord
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      const xPos = x * cellSize;
      const yPos = y * cellSize;

      let color = colors.path;
      if (cell === 1) color = colors.wall;

      ctx.fillStyle = color;
      ctx.fillRect(xPos, yPos, cellSize, cellSize);
    }
  }

  container.innerHTML = '';
  container.appendChild(canvas);

  // Animation du chemin pas à pas
  for (let i = 0; i < path.length; i++) {
    const [x, y] = path[i];
    const xPos = x * cellSize;
    const yPos = y * cellSize;

    // Couleur selon la position
    if (x === startX && y === startY) {
      ctx.fillStyle = colors.start;
    } else if (x === endX && y === endY) {
      ctx.fillStyle = colors.end;
    } else {
      ctx.fillStyle = colors.solution;
    }

    ctx.fillRect(xPos, yPos, cellSize, cellSize);

    // Délai entre chaque pas
    await new Promise(resolve => setTimeout(resolve, 5));
  }

  // Marquer start et end clairement
  ctx.fillStyle = colors.start;
  ctx.fillRect(startX * cellSize, startY * cellSize, cellSize, cellSize);

  ctx.fillStyle = colors.end;
  ctx.fillRect(endX * cellSize, endY * cellSize, cellSize, cellSize);
}

function renderMazeWithSolution(maze, solution, container, cellSize = 10) {
  const { grid, startX, startY, endX, endY, width, height } = maze;
  const { path } = solution;

  // Créer le canvas
  const canvas = document.createElement('canvas');
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;
  canvas.style.border = '1px solid #ddd';
  canvas.style.borderRadius = '4px';

  const ctx = canvas.getContext('2d');

  // Couleurs
  const colors = {
    wall: '#333',
    path: '#fff',
    solution: '#FFD700',
    start: '#4CAF50',
    end: '#f44336'
  };

  // Dessiner les cellules
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      const xPos = x * cellSize;
      const yPos = y * cellSize;

      // Déterminer la couleur
      let color = colors.path;
      if (cell === 1) color = colors.wall;
      else if (path.some(p => p[0] === x && p[1] === y)) color = colors.solution;

      ctx.fillStyle = color;
      ctx.fillRect(xPos, yPos, cellSize, cellSize);
    }
  }

  // Marquer start et end
  ctx.fillStyle = colors.start;
  ctx.fillRect(startX * cellSize, startY * cellSize, cellSize, cellSize);

  ctx.fillStyle = colors.end;
  ctx.fillRect(endX * cellSize, endY * cellSize, cellSize, cellSize);

  container.innerHTML = '';
  container.appendChild(canvas);
}

async function deleteLabyrinth(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce labyrinthe ?')) {
    return;
  }

  try {
    const result = await window.api.labyrinth.delete(id);
    if (result.success) {
      loadLabyrinthList();
    } else {
      alert('Erreur: ' + result.message);
    }
  } catch (error) {
    console.error(error);
  }
}

/* ─────────────────────────────────────────────────────────── */
/* Création de labyrinthe */
/* ─────────────────────────────────────────────────────────── */

async function handleCreateLabyrinth(e) {
  e.preventDefault();

  const name = document.getElementById('maze-name').value;
  const size = document.getElementById('maze-size').value;
  const difficulty = parseInt(document.getElementById('maze-difficulty').value);

  try {
    const result = await window.api.labyrinth.create({
      name,
      size,
      difficulty,
      userId: currentUser.id,
      data: {}
    });

    if (result.success) {
      alert('Labyrinthe créé avec succès !');
      document.getElementById('create-form').reset();
      loadLabyrinthList();
      switchScreen('labyrinth-list');
    } else {
      alert('Erreur: ' + result.message);
    }
  } catch (error) {
    console.error(error);
    alert('Erreur lors de la création');
  }
}

function loadMazePreview() {
  document.getElementById('maze-difficulty').addEventListener('change', generatePreview);
}

async function generatePreview() {
  const size = document.getElementById('maze-size').value;
  const difficulty = parseInt(document.getElementById('maze-difficulty').value);
  const preview = document.getElementById('maze-preview');

  try {
    const result = await window.api.maze.generate(size, difficulty);
    
    if (result.success) {
      const maze = result.data;
      renderMaze(maze, preview, 8);
    } else {
      preview.innerHTML = '<p class="error">Erreur: ' + result.message + '</p>';
    }
  } catch (error) {
    console.error(error);
    preview.innerHTML = '<p class="error">Erreur lors de la génération</p>';
  }
}

function renderMaze(maze, container, cellSize = 10) {
  const { grid, startX, startY, endX, endY, width, height } = maze;

  // Créer le canvas
  const canvas = document.createElement('canvas');
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;
  canvas.style.border = '1px solid #ddd';
  canvas.style.borderRadius = '4px';

  const ctx = canvas.getContext('2d');

  // Couleurs
  const colors = {
    wall: '#333',
    path: '#fff',
    start: '#4CAF50',
    end: '#f44336'
  };

  // Dessiner les cellules
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      const xPos = x * cellSize;
      const yPos = y * cellSize;

      // Déterminer la couleur
      let color = colors.path;
      if (cell === 1) color = colors.wall;
      else if (x === startX && y === startY) color = colors.start;
      else if (x === endX && y === endY) color = colors.end;

      ctx.fillStyle = color;
      ctx.fillRect(xPos, yPos, cellSize, cellSize);

      // Bordure légère
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(xPos, yPos, cellSize, cellSize);
    }
  }

  // Marquer start et end
  ctx.fillStyle = colors.start;
  ctx.fillRect(startX * cellSize, startY * cellSize, cellSize, cellSize);
  ctx.fillText('S', startX * cellSize + 3, startY * cellSize + 10);

  ctx.fillStyle = colors.end;
  ctx.fillRect(endX * cellSize, endY * cellSize, cellSize, cellSize);
  ctx.fillText('E', endX * cellSize + 3, endY * cellSize + 10);

  container.innerHTML = '';
  container.appendChild(canvas);

  // Ajouter info
  const info = document.createElement('p');
  info.style.marginTop = '10px';
  info.style.fontSize = '12px';
  info.style.color = '#666';
  info.innerHTML = `Labyrinthe ${maze.size} - Difficulté: ${maze.difficulty}/10<br>Taille: ${width}x${height}`;
  container.appendChild(info);
}

/* ─────────────────────────────────────────────────────────── */
/* Admin Panel */
/* ─────────────────────────────────────────────────────────── */

async function loadAdminPanel() {
  try {
    const result = await window.api.admin.getStatistics();
    
    if (result.success) {
      document.getElementById('admin-user-count').textContent = result.data.totalUsers || 0;
      document.getElementById('admin-labyrinth-count').textContent = result.data.totalLabyrinths || 0;
      document.getElementById('admin-solved-count').textContent = result.data.solvedCount || 0;
    }
  } catch (error) {
    console.error(error);
  }
}

async function loadAdminUsers() {
  const container = document.getElementById('users-list');

  try {
    const result = await window.api.admin.getUsers();
    
    if (result.success && result.data && result.data.length > 0) {
      container.innerHTML = result.data.map(user => `
        <div class="user-item">
          <div class="user-info">
            <h4>${user.username}</h4>
            <p>ID: ${user.id} • Rôle: ${user.is_admin ? 'Admin' : 'Utilisateur'}</p>
          </div>
          <div class="user-actions">
            <button class="btn-delete" onclick="deleteUserAdmin(${user.id})">Supprimer</button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="empty">Aucun utilisateur</p>';
    }
  } catch (error) {
    container.innerHTML = '<p class="empty">Erreur au chargement</p>';
    console.error(error);
  }
}

async function loadAdminLabyrinths() {
  const container = document.getElementById('all-labyrinths-list');

  try {
    const result = await window.api.admin.getAllLabyrinths();
    
    if (result.success && result.data && result.data.length > 0) {
      container.innerHTML = result.data.map(lab => `
        <div class="admin-labyrinth-item">
          <div>
            <strong>${lab.name}</strong>
            <p class="user">par ${lab.username}</p>
          </div>
          <div>
            <strong>${lab.size}</strong>
            <p>Difficulté: ${lab.difficulty}/10</p>
          </div>
          <div>
            <small>${new Date(lab.created_at).toLocaleDateString('fr-FR')}</small>
          </div>
          <div class="admin-labyrinth-actions">
            <button class="btn-view-admin" onclick="viewLabyrinthAdmin(${lab.id})">Voir</button>
            <button class="btn-export" onclick="exportLabyrinth(${lab.id})">Export</button>
            <button class="btn-delete-admin" onclick="deleteLabyrinthAdmin(${lab.id})">Supprimer</button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="empty">Aucun labyrinthe</p>';
    }
  } catch (error) {
    container.innerHTML = '<p class="empty">Erreur au chargement</p>';
    console.error(error);
  }
}

async function deleteUserAdmin(userId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
    return;
  }

  try {
    const result = await window.api.admin.deleteUser(userId);
    if (result.success) {
      loadAdminUsers();
    } else {
      alert('Erreur: ' + result.message);
    }
  } catch (error) {
    console.error(error);
  }
}
