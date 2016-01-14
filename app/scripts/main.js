// game data obj

var Game = {
  stats: {
    generation: 0
  },
  rules: {},
  events: {
    dragging: false,
    passedCellX: 0,
    passedCellY: 0
  },
  board: {
    cols: 80,
    rows: 50,
    cellW: 10,
    cellH: 10
  }
};

// DOM cache
var $canvas = $('#game'),
// buttons
    $start = $('#start'),
    $stop = $('#stop'),
    $onestep = $('#onestep'),
    $gencounter = $("#gencounter"),
// shapes
    $tumbler = $("#tumbler"),
    $glider = $("#glider"),
    $glidergun = $("#glidergun"),
    $ten = $("#ten");

// canvas dommerino
var canvas = document.getElementById('game');
canvas.width = Game.board.cols * Game.board.cellW;
canvas.height = Game.board.rows * Game.board.cellH;
var ctx = canvas.getContext('2d');

// controls click handlers
$start.on('click', function() {
  buttonHandler.Start();
});
$stop.on('click', function() {
  buttonHandler.Stop();
});

$onestep.on('click', function() {
  Grid.step(Grid.render);
});

var buttonHandler = (function() {
  var autoStep;
  function Start() {
    autoStep = setInterval(intCB, 150);
    $start.attr("disabled", "disabled");
    $start.addClass("selected");
    $stop.removeAttr("disabled", "disabled");
    $stop.removeClass("selected");
  }
  function Stop() {
    clearInterval(autoStep);
    $stop.attr("disabled", "disabled");
    $stop.addClass("selected");
    $start.removeAttr("disabled", "disabled");
    $start.removeClass("selected");
  }
  function intCB() {
    Grid.step(Grid.render);
  }
  return {
    Start: Start,
    Stop: Stop
  };
})();

// gridderino
var Grid = {
  cells: [],
  // switch out array to new states
  newGeneration: function() {
    var oldBoys = Grid.cells;
    var newBoys = [];
    Grid.cells.forEach( function ( cell ) {
      var nextState = cell.alive;
      var n = Grid.neighboursAlive(cell.x, cell.y);
      // starved/lonely :(
      if ((cell.alive === 1) && (n < 2)) {
        nextState = 0;
      // overpop
      } else if ((cell.alive === 1) && (n > 3)) {
        nextState = 0;
      // reproduction
      } else if ((cell.alive === 0) && (n === 3)) {
        nextState = 1;
      // nothing / stasis
      } else {
        nextState = cell.alive;
        // age++?
      }
      newBoys.push(Cell.create(cell.x,cell.y,nextState));
    });
    return newBoys;
  },
  // step one generation further
  step: function(cb) {
    Game.stats.generation++;
    $gencounter.html(Game.stats.generation);
    var newGen = Grid.newGeneration();
    Grid.cells = newGen;
    if (cb && typeof(cb) === "function") {
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
      if ((nbz[i] !== undefined) && (nbz[i].alive === 1)) {
        nbzAlive++;
      }
    }
    return nbzAlive;
  },
  // re-render each cell in the grid based on state
  render: function() {
    var cellsRendered = 0;
    function randomColor() {
      function c() {
        return Math.floor(Math.random()*256).toString(16);
      }
      return "#"+c()+c()+c();
    }
    Grid.cells.forEach( function ( cell ) {
      cellsRendered++;
      if (cell.alive) {
        ctx.fillStyle = Cell.styles.alive;
      } else {
        ctx.fillStyle = Cell.styles.dead;
      }
       var cellX = (((Math.floor(cell.x)) / 10) * 100);
       var cellY = (((Math.floor(cell.y)) / 10) * 100);
       ctx.strokeStyle = '#EEEEEE';
       //ctx.lineWidth = 0;
       ctx.fillRect(cellX, cellY, Game.board.cellW, Game.board.cellH);
       ctx.strokeRect(cellX, cellY, Game.board.cellW, Game.board.cellH);
    });
    console.log(cellsRendered + " cells rendered by Grid.render()");
  },
  renderTheseCells: function() {
    var theseCellsRendered = 0;
/*    function randomColor() {
      function c() {
        return Math.floor(Math.random()*256).toString(16);
      }
      return "#"+c()+c()+c();
    }*/
    // render an array of cells only eg during drag
    passedCellArray.forEach( function ( cell ) {
      theseCellsRendered++;
      if (cell.alive) {
        ctx.fillStyle = Cell.styles.alive;
      } else {
        ctx.fillStyle = Cell.styles.dead;
      }
       var cellX = (((Math.floor(cell.x)) / 10) * 100);
       var cellY = (((Math.floor(cell.y)) / 10) * 100);
       ctx.strokeStyle = '#EEEEEE';
       //ctx.lineWidth = 0;
       ctx.fillRect(cellX, cellY, Game.board.cellW, Game.board.cellH);
       ctx.strokeRect(cellX, cellY, Game.board.cellW, Game.board.cellH);
    });
    console.log(theseCellsRendered + " cells rendered by Grid.renderTheseCells()");
  }

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
    //newCell.age = 0;
    newCell.alive = state;
    newCell.nextState = undefined;
    newCell.neighbours = 0;
    return newCell;
  },
  // change state of cell 0->1 or 1->0
  change: function(x, y, action) {
    var c = Grid.findCell(x, y);
    if (action === 0) {
      c.alive = 0;
    }
    if (action === 1) {
      c.alive = 1;
    }
  },
  x: 0,
  y: 0,
  // change to states['alive','dead'] prob
  alive: 0,
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
  //age: 0,
};

// random 0-1 function if needed for init / debug
// function randomInt(min, max) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// kill all cells, re-render
function clearBoard(cb) {
  Grid.cells = [];
  Game.stats.generation = 0;
  for (y = 0; y < Game.board.rows; y++) {
    for (x = 0; x < Game.board.cols; x++) {
      Grid.cells.push(Cell.create(x,y,0));
    }
  }
  if (cb && typeof(cb) === "function") {
    cb();
  }
}
var passedCellArray = [];
// cell events
$canvas.mousedown(function() {
  Game.events.dragging = true;
  var targX = Math.floor(((event.clientX + window.scrollX) - canvas.offsetLeft) / 10);
  var targY = Math.floor(((event.clientY + window.scrollY) - canvas.offsetTop) / 10);
  var c = Grid.findCell(targX, targY);
  Game.events.passedCellX = c.x;
  Game.events.passedCellY = c.y;
  if (c.alive) {
    Cell.change(targX, targY, 0);
  } else {
    Cell.change(targX, targY, 1);
  }
  Grid.render();
})
.mouseup(function() {
  Game.events.dragging = false;
})
.mousemove(function() {
  if (Game.events.dragging === false) return;
  var targX = Math.floor(((event.clientX + window.scrollX) - canvas.offsetLeft) / 10);
  var targY = Math.floor(((event.clientY + window.scrollY) - canvas.offsetTop) / 10);
  var c = Grid.findCell(targX, targY);
  if ((c.x !== Game.events.passedCellX || c.y !== Game.events.passedCellY)) {
    passedCellArray.push(c);
    if (c.alive) {
      Cell.change(targX, targY, 0);
      Grid.renderTheseCells();
    } else {
      Cell.change(targX, targY, 1);
      Grid.renderTheseCells();
    }
    Game.events.passedCellX = c.x;
    Game.events.passedCellY = c.y;
    console.log(passedCellArray);
  }
  // console.log("moving through " + Game.events.passedCellX + '-' + Game.events.passedCellY);
  // console.log( c.x + "-" + c.y);
});
// prevent weird behaviour when dragged outside window
$(window).mouseup(function() {
  Game.events.dragging = false;
  passedCellArray = [];
});

// debug info on rightclick
canvas.addEventListener("contextmenu", function(event){
  event.preventDefault();
  //console.log("nbz: " + Grid.neighboursAlive(targX, targY));
  //console.log(Grid.findCell(targX, targY));
});

// preset shapes
var Shapes = {
  glider : [
    [2,1],[3,2],[3,3],[2,3],[1,3]
  ],
  glidergun : [
    [24, 0], [22, 1], [24, 1], [12, 2], [13, 2],
    [20, 2], [21, 2], [34, 2], [35, 2], [11, 3],
    [15, 3], [20, 3], [21, 3], [34, 3], [35, 3],
    [0, 4], [1, 4], [10, 4], [16, 4], [20, 4],
    [21, 4], [0, 5], [1, 5], [10, 5], [14, 5],
    [16, 5], [17, 5], [22, 5], [24, 5], [10, 6],
    [16, 6], [24, 6], [11, 7], [15, 7], [12, 8],
    [13, 8]
  ],
  tumbler : [
    [0,3], [0,4], [0,5], [1,0], [1,1], [1,5], [2,0], [2,1], [2,2], [2,3], [2,4], [4,0], [4,1], [4,2], [4,3], [4,4], [5,0], [5,1], [5,5], [6,3], [6,4], [6,5]
  ],
  ten : [
    [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],
  ]
};

// shapes click handlers (req DRY de-shite-ening, add into button module etc)
$('.shapes button').on('click', function() {
  $(this).attr("disabled","disabled");
  $(this).siblings().removeAttr("disabled","disabled");
  $(this).addClass("selected");
  $(this).siblings().removeClass("selected");
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
  if (cb && typeof(cb) === "function") {
       cb();
   }
}

// call initial state
(function()  {
  clearBoard();
  addShape(Shapes.glidergun, Grid.render);
  $glidergun.attr("disabled","disabled");
  $glidergun.addClass("selected");
  buttonHandler.Stop();
})();
