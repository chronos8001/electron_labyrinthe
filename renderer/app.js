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
    if (result.success) {
      // À implémenter : afficher le labyrinthe en détail
      console.log('Labyrinth:', result.data);
      alert('Détail du labyrinthe (à implémenter)');
    }
  } catch (error) {
    console.error(error);
  }
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
      // Créer un canvas pour afficher le labyrinthe
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      
      const ctx = canvas.getContext('2d');
      drawLabyrinth(ctx, result.data, canvas);
      
      preview.innerHTML = '';
      preview.appendChild(canvas);
    }
  } catch (error) {
    console.error(error);
  }
}

function drawLabyrinth(ctx, maze, canvas) {
  // À implémenter : dessiner le labyrinthe sur le canvas
  const cellSize = canvas.width / (maze.width || 10);
  
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;

  // Dessiner les cellules
  for (let y = 0; y < (maze.height || 10); y++) {
    for (let x = 0; x < (maze.width || 10); x++) {
      const cell = maze.grid?.[y]?.[x];
      if (cell && cell.wall) {
        ctx.fillStyle = '#333';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
}

/* ─────────────────────────────────────────────────────────── */
/* Admin Panel */
/* ─────────────────────────────────────────────────────────── */

async function loadAdminPanel() {
  try {
    const result = await window.api.admin.getStatistics();
    
    if (result.success) {
      document.getElementById('admin-user-count').textContent = result.data.userCount || 0;
      document.getElementById('admin-labyrinth-count').textContent = result.data.labyrinthCount || 0;
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
            <p>${user.email} • Rôle: ${user.role}</p>
          </div>
          <div class="user-actions">
            <button class="btn-delete" onclick="deleteUserAdmin('${user.id}')">Supprimer</button>
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
