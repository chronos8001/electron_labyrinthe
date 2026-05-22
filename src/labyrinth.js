/**
 * Maze/Labyrinth Generator & Solver
 * Supports different sizes and difficulties
 */

class Labyrinth {
  /**
   * Size configurations
   */
  static SIZES = {
    small: { width: 11, height: 11 },
    medium: { width: 21, height: 21 },
    large: { width: 31, height: 31 }
  };

  /**
   * Generate a maze using Recursive Backtracking algorithm
   * @param {string} size - 'small', 'medium', or 'large'
   * @param {number} difficulty - 1-10 (affects maze complexity)
   * @returns {object} Maze object with grid, start, and end
   */
  static generate(size = 'medium', difficulty = 5) {
    // Validate inputs
    if (!this.SIZES[size]) {
      throw new Error(`Invalid size: ${size}. Use 'small', 'medium', or 'large'`);
    }
    if (difficulty < 1 || difficulty > 10) {
      throw new Error('Difficulty must be between 1 and 10');
    }

    const { width, height } = this.SIZES[size];

    // Initialize grid with all walls
    const grid = Array(height)
      .fill(null)
      .map(() => Array(width).fill(1)); // 1 = wall, 0 = path

    // Start from top-left corner (1, 1)
    const startX = 1;
    const startY = 1;

    // Generate maze using recursive backtracking
    this._carvePath(grid, startX, startY);

    // Set start and end positions
    grid[startY][startX] = 0; // Start
    grid[height - 2][width - 2] = 2; // End (different marker)

    return {
      grid,
      width,
      height,
      startX,
      startY,
      endX: width - 2,
      endY: height - 2,
      size,
      difficulty,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Recursive Backtracking algorithm to carve paths
   * @private
   */
  static _carvePath(grid, x, y) {
    grid[y][x] = 0; // Mark as path

    // Directions: up, right, down, left
    const directions = [
      [0, -2], // up
      [2, 0],  // right
      [0, 2],  // down
      [-2, 0]  // left
    ];

    // Shuffle directions for randomness
    const shuffled = directions.sort(() => Math.random() - 0.5);

    for (const [dx, dy] of shuffled) {
      const nx = x + dx;
      const ny = y + dy;

      // Check bounds
      if (nx > 0 && nx < grid[0].length - 1 && ny > 0 && ny < grid.length - 1) {
        // If neighbor is a wall
        if (grid[ny][nx] === 1) {
          // Carve path between current and neighbor
          grid[y + dy / 2][x + dx / 2] = 0;
          // Recursively carve from neighbor
          this._carvePath(grid, nx, ny);
        }
      }
    }
  }

  /**
   * Solve maze using BFS (Breadth-First Search)
   * @param {object} maze - Maze object with grid, start, and end positions
   * @returns {object} Solution with path and steps taken
   */
  static solve(maze) {
    const { grid, startX, startY, endX, endY } = maze;
    const width = grid[0].length;
    const height = grid.length;

    // BFS queue: [x, y, path]
    const queue = [[startX, startY, [[startX, startY]]]];
    const visited = new Set([`${startX},${startY}`]);

    // Directions: up, right, down, left
    const directions = [
      [0, -1], // up
      [1, 0],  // right
      [0, 1],  // down
      [-1, 0]  // left
    ];

    let stepsCount = 0;

    while (queue.length > 0) {
      const [x, y, path] = queue.shift();
      stepsCount++;

      // Check if reached end
      if (x === endX && y === endY) {
        return {
          success: true,
          path,
          stepsCount,
          solvable: true
        };
      }

      // Explore neighbors
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;

        // Check bounds and if not visited
        if (
          nx >= 0 &&
          nx < width &&
          ny >= 0 &&
          ny < height &&
          !visited.has(key) &&
          grid[ny][nx] !== 1 // Not a wall
        ) {
          visited.add(key);
          queue.push([nx, ny, [...path, [nx, ny]]]);
        }
      }
    }

    // No solution found
    return {
      success: false,
      path: [],
      stepsCount,
      solvable: false
    };
  }

  /**
   * Verify if a maze is solvable
   * @param {object} maze - Maze object
   * @returns {boolean}
   */
  static isSolvable(maze) {
    const solution = this.solve(maze);
    return solution.solvable;
  }

  /**
   * Get maze statistics
   * @param {object} maze - Maze object
   * @returns {object} Statistics
   */
  static getStatistics(maze) {
    const { grid } = maze;
    let pathCount = 0;
    let wallCount = 0;

    for (const row of grid) {
      for (const cell of row) {
        if (cell === 1) wallCount++;
        else pathCount++;
      }
    }

    return {
      totalCells: pathCount + wallCount,
      pathCells: pathCount,
      wallCells: wallCount,
      pathPercentage: ((pathCount / (pathCount + wallCount)) * 100).toFixed(2)
    };
  }

  /**
   * Export maze as ASCII (for debugging)
   * @param {object} maze - Maze object
   * @param {object} solution - Optional solution with path
   * @returns {string} ASCII representation
   */
  static toASCII(maze, solution = null) {
    const { grid, startX, startY, endX, endY } = maze;
    let ascii = '';

    const solutionSet = new Set(
      solution?.path?.map(([x, y]) => `${x},${y}`)
    );

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (x === startX && y === startY) {
          ascii += 'S';
        } else if (x === endX && y === endY) {
          ascii += 'E';
        } else if (solutionSet?.has(`${x},${y}`)) {
          ascii += '·';
        } else if (grid[y][x] === 1) {
          ascii += '█';
        } else {
          ascii += ' ';
        }
      }
      ascii += '\n';
    }

    return ascii;
  }

  /**
   * Create a visual representation for canvas rendering
   * @param {object} maze - Maze object
   * @param {object} solution - Optional solution with path
   * @param {number} cellSize - Size of each cell in pixels
   * @returns {object} Visual data for rendering
   */
  static toVisual(maze, solution = null, cellSize = 10) {
    const { grid, width, height, startX, startY, endX, endY } = maze;

    const visual = {
      width: width * cellSize,
      height: height * cellSize,
      cells: [],
      startX: startX * cellSize,
      startY: startY * cellSize,
      endX: endX * cellSize,
      endY: endY * cellSize,
      path: []
    };

    // Cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        visual.cells.push({
          x: x * cellSize,
          y: y * cellSize,
          size: cellSize,
          type: grid[y][x] === 1 ? 'wall' : 'path'
        });
      }
    }

    // Solution path
    if (solution?.path) {
      visual.path = solution.path.map(([x, y]) => ({
        x: x * cellSize + cellSize / 2,
        y: y * cellSize + cellSize / 2
      }));
    }

    return visual;
  }
}

module.exports = Labyrinth;
