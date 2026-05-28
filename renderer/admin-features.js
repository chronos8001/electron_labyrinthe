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

async function viewLabyrinthAdmin(id) {
  try {
    const result = await window.api.labyrinth.get(id);
    if (result.success && result.data) {
      const labyrinth = result.data;
      
      
      const modal = document.createElement('div');
      modal.className = 'labyrinth-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${labyrinth.name || 'Sans nom'} - Difficulté: ${labyrinth.difficulty || '?'}/10</h3>
            <h4>Taille: ${labyrinth.size || '?'}</h4>
            <button class="modal-close" onclick="this.closest('.labyrinth-modal').remove()">✕</button>
          </div>
          <div class="modal-body">
            <div id="admin-labyrinth-canvas" class="labyrinth-canvas-container"></div>
            <div class="labyrinth-controls">
              <button class="btn btn-primary" onclick="solveLabyrinthAdmin(${id})">Résoudre</button>
              <button class="btn btn-secondary" onclick="this.closest('.labyrinth-modal').remove()">Fermer</button>
            </div>
            <div id="admin-solution-info"></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      const container = modal.querySelector('#admin-labyrinth-canvas');
      if (labyrinth.maze_data && labyrinth.maze_data.grid) {
        renderMaze(labyrinth.maze_data, container, 10);
      } else {
        container.innerHTML = '<p class="error">Données de labyrinthe invalides</p>';
      }
    }
  } catch (error) {
    console.error(error);
    alert('Erreur au chargement du labyrinthe');
  }
}

async function solveLabyrinthAdmin(id) {
  try {
    const result = await window.api.labyrinth.get(id);
    if (result.success && result.data) {
      const labyrinth = result.data;
      const solveResult = await window.api.maze.solve(id, labyrinth.maze_data);
      
      if (solveResult.success && solveResult.data.solvable) {
        const solution = solveResult.data;
        const container = document.querySelector('#admin-labyrinth-canvas');
        await solveLabyrinthAnimated(labyrinth.maze_data, solution, container, 10);
        
        const infoDiv = document.querySelector('#admin-solution-info');
        infoDiv.innerHTML = `
          <div class="solution-info">
            <h4>✓ Labyrinthe résolu !</h4>
            <p>Longueur du chemin: <strong>${solution.path.length}</strong> pas</p>
            <p>Étapes explorees: <strong>${solution.stepsCount}</strong></p>
          </div>
        `;
        
        
        setTimeout(() => loadAdminLabyrinths(), 500);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function deleteLabyrinthAdmin(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce labyrinthe ?')) {
    return;
  }

  try {
    const result = await window.api.admin.deleteLabyrinth(id);
    if (result.success) {
      loadAdminLabyrinths();
      alert('Labyrinthe supprimé');
    } else {
      alert('Erreur: ' + result.message);
    }
  } catch (error) {
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
      alert('Utilisateur supprimé');
    } else {
      alert('Erreur: ' + result.message);
    }
  } catch (error) {
    console.error(error);
  }
}
async function solveLabyrinthAnimated(maze, solution, container, cellSize = 10) {
  const { grid, startX, startY, endX, endY, width, height } = maze;
  const { path } = solution;

  
  const canvas = document.createElement('canvas');
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;
  canvas.style.border = '1px solid #ddd';
  canvas.style.borderRadius = '4px';
  canvas.className = 'maze-solving-animation';

  const ctx = canvas.getContext('2d');

  
  const colors = {
    wall: '#333',
    path: '#fff',
    exploring: '#B3E5FC',
    solution: '#FFD700',
    start: '#4CAF50',
    end: '#f44336'
  };

  
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

  
  for (let i = 0; i < path.length; i++) {
    const [x, y] = path[i];
    const xPos = x * cellSize;
    const yPos = y * cellSize;

    
    if (x === startX && y === startY) {
      ctx.fillStyle = colors.start;
    } else if (x === endX && y === endY) {
      ctx.fillStyle = colors.end;
    } else {
      ctx.fillStyle = colors.solution;
    }

    ctx.fillRect(xPos, yPos, cellSize, cellSize);

    
    await new Promise(resolve => setTimeout(resolve, 5));
  }

  
  ctx.fillStyle = colors.start;
  ctx.fillRect(startX * cellSize, startY * cellSize, cellSize, cellSize);

  ctx.fillStyle = colors.end;
  ctx.fillRect(endX * cellSize, endY * cellSize, cellSize, cellSize);
}
async function exportLabyrinth(id) {
  try {
    const result = await window.api.export.labyrinth(id);
    if (result.success) {
      
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `labyrinthe_${id}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      alert('Labyrinthe exporté avec succès !');
    } else {
      alert('Erreur: ' + result.message);
    }
  } catch (error) {
    console.error(error);
    alert('Erreur lors de l\'export');
  }
}

function importLabyrinth() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const data = event.target.result;
        const result = await window.api.import.labyrinth(currentUser.id, data);
        
        if (result.success) {
          alert('Labyrinthe importé avec succès !');
          loadLabyrinthList();
        } else {
          alert('Erreur: ' + result.message);
        }
      } catch (error) {
        console.error(error);
        alert('Erreur lors de l\'import');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}
