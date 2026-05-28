class Labyrinth {
  static SIZES = {
    small: { width: 11, height: 11 },
    medium: { width: 21, height: 21 },
    large: { width: 31, height: 31 }
  };

  
  static generate(size = 'medium', difficulty = 5) {
    
    if (!this.SIZES[size]) {
      throw new Error(`Invalid size: ${size}. Use 'small', 'medium', or 'large'`);
    }
    if (difficulty < 1 || difficulty > 10) {
      throw new Error('Difficulty must be between 1 and 10');
    }

    const { width, height } = this.SIZES[size];

    
    const grid = Array(height)
      .fill(null)
      .map(() => Array(width).fill(1)); 

    
    const startX = 1;
    const startY = 1;

    
    this._carvePath(grid, startX, startY);

    
    grid[startY][startX] = 0; 
    grid[height - 2][width - 2] = 2; 

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

  
  static _carvePath(grid, x, y) {
    grid[y][x] = 0; 

    
    const directions = [
      [0, -2], 
      [2, 0],  
      [0, 2],  
      [-2, 0]  
    ];

    
    const shuffled = directions.sort(() => Math.random() - 0.5);

    for (const [dx, dy] of shuffled) {
      const nx = x + dx;
      const ny = y + dy;

      
      if (nx > 0 && nx < grid[0].length - 1 && ny > 0 && ny < grid.length - 1) {
        
        if (grid[ny][nx] === 1) {
          
          grid[y + dy / 2][x + dx / 2] = 0;
          
          this._carvePath(grid, nx, ny);
        }
      }
    }
  }

  
  static solve(maze) {
    const { grid, startX, startY, endX, endY } = maze;
    const width = grid[0].length;
    const height = grid.length;

    
    const queue = [[startX, startY, [[startX, startY]]]];
    const visited = new Set([`${startX},${startY}`]);

    
    const directions = [
      [0, -1], 
      [1, 0],  
      [0, 1],  
      [-1, 0]  
    ];

    let stepsCount = 0;

    while (queue.length > 0) {
      const [x, y, path] = queue.shift();
      stepsCount++;

      
      if (x === endX && y === endY) {
        return {
          success: true,
          path,
          stepsCount,
          solvable: true
        };
      }

      
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;

        
        if (
          nx >= 0 &&
          nx < width &&
          ny >= 0 &&
          ny < height &&
          !visited.has(key) &&
          grid[ny][nx] !== 1 
        ) {
          visited.add(key);
          queue.push([nx, ny, [...path, [nx, ny]]]);
        }
      }
    }

    
    return {
      success: false,
      path: [],
      stepsCount,
      solvable: false
    };
  }

  
  static isSolvable(maze) {
    const solution = this.solve(maze);
    return solution.solvable;
  }

  
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
