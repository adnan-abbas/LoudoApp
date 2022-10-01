const fs = require(`fs`)
const http = require(`http`);
const WebSocket = require(`ws`)  // npm i ws

var Dice;
var numClients=0;
var turnCount = 0;

var redCount = 4;
var greenCount = 4;
var yellowCount = 4;
var blueCount = 4;


function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

const readFile = (fileName) =>
  new Promise((resolve, reject) => {
    fs.readFile(fileName, `utf-8`, (readErr, fileContents) => {
      if (readErr) {
        reject(readErr)
      } else {
        resolve(fileContents)
      }
    })
  })

const readfileImage = (fileName) =>
new Promise((resolve, reject) => {
fs.readFile(fileName, (readErr, fileContents) => {
    if (readErr) {
    reject(readErr)
    } else {
    resolve(fileContents)
    }
})
})

const itsSef = (x,y) =>{

  console.log(`itsSef called`)
  const safeSpots = [`6,1`, `8,2`, `6,12`, `8,13`, `2,6`, `1,8`, `12,8`, `13,6`]
  strX = String(x)
  var coords = strX.concat(`,`,String(y))
  console.log(coords)
  var inc = safeSpots.includes(coords)
  console.log(inc)
  return inc
}

const server = http.createServer(async (req, resp) => {
    console.log(`browser asked for ${req.url}`)
    if (req.url == `/myjs`) {
        const clientJs = await readFile(`client.js`)
        resp.end(clientJs)
    }
    else if (req.url == '/mydoc'){
        const clientHtml = await readFile(`client.html`)

        resp.end(clientHtml)
    }
    else if (req.url == '/ludo.css'){
        const ludoCss = await readFile(`ludo.css`)
        resp.end(ludoCss)
    }
    else if (req.url == '/center.png'){
        const centerPng = await readfileImage('center.png')
        resp.end(centerPng)
    }
    else {
        resp.end(`Not found`)
    }
})

server.listen(8000)

var gameBoard = new Array(15);
for (i=0;i<gameBoard.length;i++)
{
    gameBoard[i] = new Array(15);
}
for (i=0;i<gameBoard.length;i++)
{
    for (j=0;j<gameBoard.length;j++)
    {
        gameBoard[i][j] = [];
    }
}

gameBoard[0][0] = ['blue','blue','blue','blue']
gameBoard[0][14] = ['red','red','red','red']
gameBoard[14][0] = ['yellow','yellow','yellow','yellow']
gameBoard[14][14] = ['green','green','green','green']



// gameBoard[0][7] = ['red','red','red','red']

// gameBoard[7][0] = ['blue','blue','blue','blue']
// gameBoard[7][14] = ['green','green','green','green']

// gameBoard[14][7] = ['yellow','yellow','yellow','yellow']

let allColours = ['blue','red','yellow','green']

const wss = new WebSocket.Server({ port: 8080 })

wss.on(`connection`, (ws) => {
  console.log(`A user connected`)

  ws.send(
      JSON.stringify({
          type: `color`,
          color: allColours[numClients]
      })
  )
  const sendToAll = () => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) 
      {

        client.send(
        JSON.stringify({
            type: `newboard`,
            board: gameBoard
        }))

        client.send(
            JSON.stringify({
              type: `dice`,
              value: Dice
            }))

        client.send(
          JSON.stringify({
            type: `turn`,
            turn: `It is ${allColours[turnCount]}'s turn` 
          })
        )
      }
  })
}

const sendWinToAll = (color) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) 
    {

      client.send(
      JSON.stringify({
          type: `error`,
          message: `The winner is ${color}`
      }))
    }
})
}

  updateDice()
  updateTurn()
  //sendBoard()
  numClients =  numClients+1
  

  if (numClients === 4)
  {
    sendToAll()
  }

  ws.on(`message`, (message) => {
    var msg = JSON.parse(message)
    if (msg.type === `coordinates`)
    {
      if (msg.color !== allColours[turnCount])
      {
        ws.send(
          JSON.stringify({
            type: `error`,
            message: `It is not your turn!`
          })
        )
        sleep(1500);
        ws.send(
          JSON.stringify({
            type: `turn`,
            turn: `It is ${allColours[turnCount]}'s turn`
          })
        )

      }
      else
      {
        if (iskilled(msg.x_coord,msg.y_coord) && Dice!== 6 )
        {
          //nothing happens, send the same map
          console.log(`cant go out of home`)
          updateTurn()
          updateDice()
          sendToAll()
        }
        else if (iskilled(msg.x_coord,msg.y_coord) && Dice === 6)
        {
          console.log(`move 1 out of home`)
          var newCoords = step( msg.color, msg.x_coord, msg.y_coord, 1)
          //removing from current map
          var id = gameBoard[msg.x_coord][msg.y_coord].indexOf(msg.color)
          gameBoard[msg.x_coord][msg.y_coord].splice(id,1)
          gameBoard[newCoords[0]][newCoords[1]].push(msg.color)
          updateTurn()
          updateDice()
          sendToAll()
          
        }
        else
        {

          if (msg.color === `red` && msg.y_coord === 7 && ( msg.x_coord <= 6 ) )
          {
            
            if ( (msg.x_coord + Dice) > 6)
            {
              ws.send(
                JSON.stringify({
                  type: `error`,
                  message: `not allowed to take this step`
                })
              )
              sleep(2000);
            }
            else
            {
              var coords = step( msg.color, msg.x_coord, msg.y_coord, Dice)
              if ( coords[0] === 6 )
              {
                var id = gameBoard[msg.x_coord][msg.y_coord].indexOf(msg.color)
                gameBoard[msg.x_coord][msg.y_coord].splice(id,1)
                redCount = redCount -1

              }
              else
              {
                gameBoard[msg.x_coord][msg.y_coord].splice(id,1)
                gameBoard[coords[0]][coords[1]].push(msg.color)
              }

            }
          }
          else if (msg.color === `blue` && msg.x_coord === 7 && ( msg.y_coord <= 6 ))
          {
            if ( (msg.y_coord + Dice) > 6)
            {
              ws.send(
                JSON.stringify({
                  type: `error`,
                  message: `not allowed to take this step`
                })
              )
              sleep(2000);
            }
            else
            {
              var coords = step( msg.color, msg.x_coord, msg.y_coord, Dice)
              if ( coords[1] === 6 )
              {
                var id = gameBoard[msg.x_coord][msg.y_coord].indexOf(msg.color)
                gameBoard[msg.x_coord][msg.y_coord].splice(id,1)
                blueCount = blueCount -1

              }
              else
              {
                gameBoard[msg.x_coord][msg.y_coord].splice(id,1)
                gameBoard[coords[0]][coords[1]].push(msg.color)
              }

            }

          }



          else if (msg.color === `green` && msg.x_coord === 7 && ( msg.y_coord >= 7 ))
          {
            if ( (msg.y_coord - Dice) <= 7 )
            {
              ws.send(
                JSON.stringify({
                  type: `error`,
                  message: `not allowed to take this step`
                })
              )
              sleep(2000);
            }
            else
            {
              var coords = step( msg.color, msg.x_coord, msg.y_coord, Dice)
              if ( coords[1] === 8 )
              {
                var id = gameBoard[msg.x_coord][msg.y_coord].indexOf(msg.color)
                gameBoard[msg.x_coord][msg.y_coord].splice(id,1)
                greenCount = greenCount - 1
              }
              else
              {
                gameBoard[msg.x_coord][msg.y_coord].splice(id,1)
                gameBoard[coords[0]][coords[1]].push(msg.color)
              }

            }

          }


          else if (msg.color === `yellow` && msg.y_coord === 7 && ( msg.x_coord >= 7 ))
          {
            if ( (msg.x_coord - Dice) <= 7 )
            {
              ws.send(
                JSON.stringify({
                  type: `error`,
                  message: `not allowed to take this step`
                })
              )
              sleep(2000);
            }
            else
            {
              var coords = step( msg.color, msg.x_coord, msg.y_coord, Dice)
              if ( coords[0] === 8 )
              {
                var id = gameBoard[msg.x_coord][msg.y_coord].indexOf(msg.color)
                gameBoard[msg.x_coord][msg.y_coord].splice(id,1)
                yellowCount = yellowCount - 1
              }
              else
              {
                gameBoard[msg.x_coord][msg.y_coord].splice(id,1)
                gameBoard[coords[0]][coords[1]].push(msg.color)
              }

            }

          }


          else
          {
            console.log(`move dice ki chaal`)
            var newCoords = step( msg.color, msg.x_coord, msg.y_coord, Dice)
            //removing from current mirror
            var id = gameBoard[msg.x_coord][msg.y_coord].indexOf(msg.color)
            gameBoard[msg.x_coord][msg.y_coord].splice(id,1)
            gameBoard[newCoords[0]][newCoords[1]].push(msg.color)

            if (itsSef(newCoords[0],newCoords[1]))
            {
              console.log(`sending map normally`)
            }
            else
            {
              var sprites = gameBoard[newCoords[0]][newCoords[1]]
              for (i=0;i<sprites.length;i++)
              {
                if (sprites[i] !== msg.color)
                {
                  if (sprites[i] === `blue`)
                  {
                    gameBoard[newCoords[0]][newCoords[1]].splice(i,1)
                    gameBoard[0][0].push(`blue`)
                    turnCount = turnCount -1
                  }
                  else if (sprites[i] === `green`)
                  {
                    gameBoard[newCoords[0]][newCoords[1]].splice(i,1)
                    gameBoard[14][14].push(`green`)
                    turnCount = turnCount -1
                  }
                  else if (sprites[i] === `red`)
                  {
                    gameBoard[newCoords[0]][newCoords[1]].splice(i,1)
                    gameBoard[0][14].push(`red`)
                    turnCount = turnCount -1 
                  }
                  else if (sprites[i] === `yellow`)
                  {
                    gameBoard[newCoords[0]][newCoords[1]].splice(i,1)
                    gameBoard[14][0].push(`yellow`)
                    turnCount = turnCount -1
                  }
                }
              }
            }
          }
          if (redCount == 0)
          {
            sendWinToAll(`red`)
            sleep(2000)
          }
          else if (blueCount == 0)
          {
            sendWinToAll(`blue`)
            sleep(2000)
          }
          else if (greenCount == 0)
          {
            sendWinToAll(`green`)
            sleep(2000)
          }
          else if (yellowCount == 0)
          {
            sendWinToAll(`yellow`)
            sleep(2000)
          }

          
          updateTurn()
          updateDice()
          sendToAll()
        }

      }

      

    }
  
  })  

})

const iskilled = (ox, oy) => (ox-7)*(ox-7)+(oy-7)*(oy-7) == 98

const updateTurn = () =>{
  turnCount = (turnCount + 1) % 4
}
const updateDice = () =>{
  Dice = Math.floor( (Math.random()*6) + 1)
}
const step = (color, ox, oy, steps) => {
  const transform = ([ox,oy]) => ({'blue': [+ox,+oy], 'green': [-ox,-oy], 'red': [-oy,+ox], 'yellow': [+oy,-ox]}[color])
  const path = ['-7,-7', '-1,-6', '-1,-5', '-1,-4', '-1,-3', '-1,-2', '-2,-1', '-3,-1', '-4,-1', '-5,-1', '-6,-1', '-7,-1', '-7,0', '-7,1', '-6,1', '-5,1', '-4,1', '-3,1', '-2,1', '-1,2', '-1,3', '-1,4', 
 '-1,5', '-1,6', '-1,7', '0,7', '1,7', '1,6', '1,5', '1,4', '1,3', 
 '1,2', '2,1', '3,1', '4,1', '5,1', '6,1', '7,1', '7,0', '7,-1', '6,-1', '5,-1', '4,-1', '3,-1', '2,-1', '1,-2', '1,-3', '1,-4', '1,-5', 
 '1,-6', '1,-7', '0,-7', '0,-6', '0,-5', '0,-4', '0,-3', '0,-2', '0,-1']
  const [x,y] = 
  transform(transform(transform(path[path.indexOf(transform([ox-7, oy-7]).join(','))+steps].split(','))))
  return [x+7,y+7]
 }

