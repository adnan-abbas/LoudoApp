const ws = new WebSocket(`ws://localhost:8080`)

const Ludo = () => {
    const moveSprite = (colour,x,y) =>{

        const clientMessage = {
            type: `coordinates`,
            x_coord: x,
            y_coord: y,
            color: colour
        }
        if (colour === color)
        {
            ws.send(JSON.stringify(clientMessage))
        }
        

    }
    const MakeBoard = () => {
        return(
            initialBoard.map( (col,id1) =>{
                return(
                    <div key = {id1} >
                        {
                            col.map( (msg2,id2) =>
                            {
                                return (
                                    <div key = {`cell`.concat(String(id1),String(id2))} className = {`cell${id1}${id2}` }>
                                        {
                                            msg2.map( (element,id3) =>
                                            {
                                                return (
                                                    <div key = {`cell`.concat(String(id1),String(id2),String(id3))} className = {element}
                                                    onClick = { ()=>moveSprite(element, id1, id2)}>
                                                    </div>
                                                )

                                            }
                                            )
                                        }
                                    </div>
                                )
                            }
                            )
                        }
                    </div>
                )
            }
            )
        )
    
    }
    const [initialBoard, setinitialBoard] = React.useState([])
    const [dice,setDice] = React.useState(``)
    const [color,setColor] = React.useState(``)
    const[text,setText] = React.useState(``)
    const[allConnected,setallConnected] = React.useState(false)

    ws.onmessage = (event) => {
        const clientMessage = JSON.parse(event.data)
        if (clientMessage.type === `newboard`) {
            setinitialBoard ( clientMessage.board )
            setallConnected(true)
        }

        else if (clientMessage.type === `dice`){
            setDice(clientMessage.value)
        }

        else if (clientMessage.type === `color`){
            setColor(clientMessage.color)
        }

        else if (clientMessage.type === `turn`){
            setText(clientMessage.turn)
        }
        else if (clientMessage.type === `error`){
            setText(clientMessage.message)
        }
    }


    return (
        <div>
        {
            
            allConnected ? (

                <div>
                    < MakeBoard/> 
                    <div className="dice">
                        {dice}
                    </div> 
                    <div className = {`color ${color}` }>
                    </div>
                    <div className ="text_box" >
                        { text }
                    </div>
                </div>

            ) : (
                <div>
                    <div className = {`color ${color}` }>
                    </div>
                    <h3>
                        { `Waiting for all players to join`}
                    </h3>
                </div>
            )
            
        }
        </div>
        
        
        
    )
}

ReactDOM.render(<Ludo />, document.querySelector(`#root`))

