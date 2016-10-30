// game data obj
var Game = {
  stats: {
    generation: 0,
    get livingCells() {
      return Grid.getLivingCellCount()
    }
  },
  rules: {},
  events: {
    currentInteractedCells: [],
    dragging: false,
    passedCellX: 0,
    passedCellY: 0,
    lastEventX: null,
    lastEventY: null
  },
  board: {
    cols: 80,
    rows: 50,
    cellW: 10,
    cellH: 10
  }
};

// DOM cache
// game canvas
var $canvas = $('#game'),
// buttons
    $start = $('#start'),
    $stop = $('#stop'),
    $onestep = $('#onestep'),
    $clear = $('#clear'),
    $genCounter = $('#gencounter'),
    $cellCounter = $('#cellcounter'),
// shapes
    $tumbler = $('#tumbler'),
    $glider = $('#glider'),
    $glidergun = $('#glidergun'),
    $ten = $('#ten');

// canvas dommerino
var canvas = document.getElementById('game');
canvas.width = Game.board.cols * Game.board.cellW;
canvas.height = Game.board.rows * Game.board.cellH;
var $ctx = $canvas[0].getContext('2d');

// controls click handlers
$start.on('click', function() {
  buttonHandler.startGenerationProgress();
});
$stop.on('click', function() {
  buttonHandler.stopGenerationProgress();
});

$onestep.on('click', function() {
  Grid.step(Grid.render);
});

$clear.on('click', function() {
  buttonHandler.stopGenerationProgress();
  clearBoard(Grid.render);
});

var buttonHandler = (function() {
  var autoStep;
  function startGenerationProgress() {
    autoStep = setInterval(intCB, 150);
    $start.attr('disabled', 'disabled');
    $start.addClass('selected');
    $stop.removeAttr('disabled', 'disabled');
    $stop.removeClass('selected');
  }
  function stopGenerationProgress() {
    clearInterval(autoStep);
    $stop.attr('disabled', 'disabled');
    $stop.addClass('selected');
    $start.removeAttr('disabled', 'disabled');
    $start.removeClass('selected');
  }
  function intCB() {
    Grid.step(Grid.render);
    
  }
  return {
    startGenerationProgress: startGenerationProgress,
    stopGenerationProgress: stopGenerationProgress
  };
})();

// gridderino
var Grid = {
  cells: [],
  // switch out array to new states
  newGeneration: function() {
    var oldBoys = Grid.cells;
    var newGenCells = [];
    Grid.cells.forEach( function (cell) {
      // will the cell live or die next generation
      var nextState;
      // check the cell's neighbours and define nextState below
      var n = Grid.neighboursAlive(cell.x, cell.y);
      // starved/lonely :(
      if ((cell.status === 1) && (n < 2)) {
        nextState = 0;
      // overpop
    } else if ((cell.status === 1) && (n > 3)) {
        nextState = 0;
      // reproduction
    } else if ((cell.status === 0) && (n === 3)) {
        nextState = 1;
      // nothing / stasis
      } else {
        nextState = cell.status;
        // age++?
      }
      newGenCells.push(Cell.create(cell.x,cell.y,nextState));
    });
    return newGenCells;
  },
  // step one generation further
  step: function(cb) {
    // increment counter
    Game.stats.generation++;
    // send the new generation of cells to the grid
    Grid.cells = Grid.newGeneration();
    if (cb && typeof(cb) === 'function') {
      cb();
    }
  },
  // retrieve cell at coords from Grid.cells array
  findCell: function(x, y) {
    // simulate toroidal array wrapping
    x = (Game.board.cols + x) % Game.board.cols;
    y = (Game.board.rows + y) % Game.board.rows;
    var theCell = Grid.cells[Game.board.cols * y + x];
    if (theCell !== undefined) {
      return theCell;
    }
  },
  // get number of alive neighbours. could use a redo
  neighboursAlive: function (x, y) {
    var nbz = [
    Grid.findCell(x-1, y-1),
    Grid.findCell(x, y-1),
    Grid.findCell(x+1, y-1),
    Grid.findCell(x+1, y),
    Grid.findCell(x+1, y+1),
    Grid.findCell(x, y+1),
    Grid.findCell(x-1, y+1),
    Grid.findCell(x-1, y)
    ];
    var nbzAlive = 0;
    for (i = 0; i < nbz.length; i++) {
      if ((nbz[i] !== undefined) && (nbz[i].status === 1)) {
        nbzAlive++;
      }
    }
    return nbzAlive;
  },
  // cell stats methods
  getLivingCellCount: function() {
    var count = 0;
    Grid.cells.forEach( function(cell) {
      if (cell.status === 1) count++;
    });
    return count;
  },
  updateStats: function() {
    $genCounter.html(Game.stats.generation);
    $cellCounter.html(Game.stats.livingCells);
  },
  // re-render cells
  // every cell in the grid if no params
  // if passed an array, just render those specified cells
  render: function(specifiedCells) {
    var iterableCells = (specifiedCells ? specifiedCells : Grid.cells);
    var renderCount = 0;
    if (Array.isArray(iterableCells)) {
      iterableCells.forEach( function (cell) {
        renderCount++;
        if (cell.status) {
          $ctx.fillStyle = Cell.styles.alive;
        } else {
          $ctx.fillStyle = Cell.styles.dead;
        }
         var cellX = (((Math.floor(cell.x)) / 10) * 100);
         var cellY = (((Math.floor(cell.y)) / 10) * 100);
         $ctx.strokeStyle = '#EEEEEE';
         //$ctx.lineWidth = 0;
         $ctx.fillRect(cellX, cellY, Game.board.cellW, Game.board.cellH);
         $ctx.strokeRect(cellX, cellY, Game.board.cellW, Game.board.cellH);
      });
    }
    console.log(renderCount + ' cells rendered by Grid.render()');
    Grid.updateStats();
  },
};

// cellerino
var Cell = {
  styles: {
    dead: '#F5F5F5',
    alive: '#263238'
  },
  create: function(x, y, state) {
    var newCell = Object.create(this);
    newCell.x = x;
    newCell.y = y;
    newCell.status = state;
    newCell.nextState = undefined;
    // newCell.neighbours = 0;
    return newCell;
  },
  // change state of cell dead->alive or alive->dead
  change: function(x, y, action) {
    var c = Grid.findCell(x, y);
    if (action === 0) {
      c.status = 0;
    }
    if (action === 1) {
      c.status = 1;
    }
  },
  // coords
  x: 0,
  y: 0,
  // change this yo. 0 => 'DEAD', 1 => 'ALIVE'?
  status: 0,
  //neighbours: 0,
  possibleNeighbours: [
    [this.x-1, this.y-1],
    [this.x, this.y-1],
    [this.x+1, this.y-1],
    [this.x+1, this.y],
    [this.x+1, this.y+1],
    [this.x, this.y+1],
    [this.x-1, this.y+1],
    [this.x-1, this.y]
    ],
};

// kill all cells
function clearBoard(cb) {
  console.log('clearing board');
  Grid.cells = [];
  Game.stats.generation = 0;
  for (y = 0; y < Game.board.rows; y++) {
    for (x = 0; x < Game.board.cols; x++) {
      Grid.cells.push(Cell.create(x,y,0));
    }
  }
  if (cb && typeof(cb) === 'function') {
    cb();
  }
}

// cell events
// merge this later
function invertCellState(c) {
  console.log('invertCellState', c);
  if (c.status === 1) {
    Cell.change(Game.events.targX, Game.events.targY, 0);
    Grid.render(Game.events.currentInteractedCells);
  } else {
    Cell.change(Game.events.targX, Game.events.targY, 1);
    Grid.render(Game.events.currentInteractedCells);
  }
}

function cellInteract(event) {
  // if (event.type === 'mousedown' && event.button !== 0) return;
  console.log('cellInteract', event.type);
  var targX = Math.floor(((event.clientX + window.scrollX) - canvas.offsetLeft) / 10);
  var targY = Math.floor(((event.clientY + window.scrollY) - canvas.offsetTop) / 10);
  Game.events.targX = targX;
  Game.events.targY = targY;;
  var c = Grid.findCell(Game.events.targX, Game.events.targY);
  if (event.type === 'mousedown') {
    Game.events.currentInteractedCells.push(c);
    invertCellState(c);
  }
  if ((event.type === 'mousemove') && (c.x !== Game.events.passedCellX || c.y !== Game.events.passedCellY )) {
    Game.events.currentInteractedCells.push(c);
    invertCellState(c);  
  }
  Game.events.passedCellX = c.x;
  Game.events.passedCellY = c.y;
}

$canvas.mousedown(function() {
  if (event.button !== 0) return;
  cellInteract(event);
  Game.events.dragging = true;
})
.mouseup(function() {
  Game.events.dragging = false;
})
.mousemove(function() {
  if (Game.events.dragging === false) return;
  cellInteract(event);
});
// prevent weird behaviour when dragged outside window
$(window).mouseup(function() {
  Game.events.dragging = false;
  Game.events.currentInteractedCells = [];
});

// debug info on rightclick
canvas.addEventListener('contextmenu', function(event){
  event.preventDefault();
  var targX = Math.floor(((event.clientX + window.scrollX) - canvas.offsetLeft) / 10);
  var targY = Math.floor(((event.clientY + window.scrollY) - canvas.offsetTop) / 10);
  console.log('========== debug =========');
  console.log('nbz: ' + Grid.neighboursAlive(targX, targY));
  console.log(Grid.findCell(targX, targY));
});

// preset shapes
var Shapes = {
  glider: [
    [2,1],[3,2],[3,3],[2,3],[1,3]
  ],
  glidergun: [
    [24, 0], [22, 1], [24, 1], [12, 2], [13, 2],
    [20, 2], [21, 2], [34, 2], [35, 2], [11, 3],
    [15, 3], [20, 3], [21, 3], [34, 3], [35, 3],
    [0, 4], [1, 4], [10, 4], [16, 4], [20, 4],
    [21, 4], [0, 5], [1, 5], [10, 5], [14, 5],
    [16, 5], [17, 5], [22, 5], [24, 5], [10, 6],
    [16, 6], [24, 6], [11, 7], [15, 7], [12, 8],
    [13, 8]
  ],
  tumbler: [
    [0,3], [0,4], [0,5], [1,0], [1,1], [1,5], [2,0], [2,1], [2,2], [2,3], [2,4], [4,0], [4,1], [4,2], [4,3], [4,4], [5,0], [5,1], [5,5], [6,3], [6,4], [6,5]
  ],
  ten: [
    [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],
  ]
};

// shapes click handlers (req DRY de-shite-ening, add into button module etc)
$('.shapes button').on('click', function() {
  $(this).attr('disabled','disabled');
  $(this).siblings().removeAttr('disabled','disabled');
  $(this).addClass('selected');
  $(this).siblings().removeClass('selected');
  clearBoard();
});

$glider.on('click', function() {
  addShape(Shapes.glider, Grid.render);
});

$tumbler.on('click', function() {
  addShape(Shapes.tumbler, Grid.render);
});

$ten.on('click', function() {
  addShape(Shapes.ten, Grid.render);
});

$glidergun.on('click', function() {
  addShape(Shapes.glidergun, Grid.render);
});

function addShape(pattern, cb) {
  var initShape = pattern || [];
  var xOffset = Game.board.cols / 2;
  var yOffset = Game.board.rows / 2;
  for (var i = 0; i < initShape.length; i++) {
    Cell.change((initShape[i][0] + xOffset),(initShape[i][1] + yOffset), 1);
  }
  if (cb && typeof(cb) === 'function') {
    cb();
  }
}

// call initial state
(function()  {
  clearBoard();
  addShape(Shapes.glidergun, Grid.render);
  $glidergun.attr('disabled','disabled');
  $glidergun.addClass('selected');
  buttonHandler.stopGenerationProgress();
})();
