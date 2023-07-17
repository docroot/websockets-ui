import * as http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { Player } from './entities/Player';
import { Message } from './entities/Message';
import { PlayerState, Room } from './entities/Room';
import * as uuid from 'uuid';
import { Session, SessionState } from './entities/Session';
import { Ship } from './entities/Ship';


export const server = http.createServer();
const wss = new WebSocketServer({ server });

const players = new Map<string, Player>();
const sessions = new Set<Session>();
const rooms = new Set<Room>();
let roomIdx = 1;
const playersSessions = new Map<string, Session>();
const roomsById = new Map<number, Room>();

function getPlayer(login: string): Player | undefined {
    const player = players.get(login);
    if (player) {
        console.log(`player: login: [${player?.login}]`);
    }
    else {
        console.log(`Player [${login}] is not found`);
    }
    return player;
}

function addPlayer(player: Player) {
    players.set(player.login, player);
}

function checkPassword(login: string, password: string): boolean {
    const player = getPlayer(login);
    if (player && player.password === password) {
        return true;
    }

    return false;
}

function getPlayerSession(player: Player): Session | undefined {
    const session = playersSessions.get(player.login);
    if (session) {
        return session;
    }
    return undefined;
}


function registerPlayer(session: Session, request: Message): Message {
    let { name, password } = JSON.parse(request.data);
    // console.log(`${name}, ${password}`);
    let err: boolean = false;
    let erTxt: string = '';
    if (name && password) {
        let player = getPlayer(name);
        if (player) {
            if (!checkPassword(name, password)) {
                err = true;
                erTxt = 'Authentication failed.';
            }
            else {
                let playerSession = getPlayerSession(player);
                if (playerSession) {
                    if (session.id === playerSession.id) {
                        erTxt = 'Repeated registeration.';
                    }
                    else {
                        erTxt = 'Already registered in another session.'
                        err = true;
                    }
                }
                else {
                    session.player = player;
                    playersSessions.set(player.login, session);
                    console.log(`Player [${player.login}] was registered, session is [${session.id}]`);
                }
            }
        }
        else {
            player = new Player(name, password);
            addPlayer(player);
            session.player = player;
            playersSessions.set(player.login, session);
            console.log(`Player [${player.login}] was added, session is [${session.id}]`);
        }
    }
    else {
        err = true;
        erTxt = 'No login or password provided.';
    }
    return new Message(request.type, {
        name: name,
        index: 1,
        error: err,
        errorText: erTxt,
    });
}


function getAvaliableRooms(): Message {
    let data: any[] = [];
    console.log(rooms);

    rooms.forEach(room => {
        if (room.players.length === 1) {
            data.push(room.toJSON());
        }
    });

    return new Message('update_room', data);
}


function createRoom(session: Session, request: Message): Message {
    let err: boolean = true;
    let erTxt: string = 'Unable to create a room';
    const player = session.player;
    if (player) {
        console.log("Player is " + player.login);
        const id = roomIdx++;
        const newRoom = new Room(id);
        newRoom.addPlayer(player);
        rooms.add(newRoom);
        roomsById.set(id, newRoom);
        const resp = getAvaliableRooms();
        resp.rcpt = 'all';
        return resp;
    }

    return new Message(request.type, {
        error: err,
        errorText: erTxt,
    }, 'all');
}


function addPlayer2Room(session: Session, request: Message): Message[] {
    let err: boolean = true;
    let erTxt: string = 'Unable to add player to the room';
    const player = session.player;
    const data = JSON.parse(request.data);
    const roomId = data.indexRoom;
    console.log(`room id: [${roomId}]`);
    const resps = new Array<Message>;
    console.log(player);
    if (player && roomId) {
        console.log("Player is " + player.login);
        const room = roomsById.get(roomId);
        if (room) {
            if (room.players.length === 1 && room.players[0].player.login != player.login) {
                // Add the second Player
                room.addPlayer(player);
                resps.push(getAvaliableRooms());
                resps.push(new Message(
                    'create_game', { idGame: roomId, idPlayer: 1 }
                ));
                resps.push(new Message(
                    'create_game', { idGame: roomId, idPlayer: 0 }, room.players[0].player.login
                ));
            }
        }
    }

    // return new Message(request.type, {
    //     error: err,
    //     errorText: erTxt,
    // });
    return resps;
}


function addShips(session: Session, request: Message): Message[] {
    let err: boolean = true;
    let erTxt: string = 'Unable to add ships';
    let rcpt = '';
    const data = JSON.parse(request.data);
    const roomId = data.gameId;
    console.log(`ROOM ID: [${roomId}]`);
    const resps = new Array<Message>;
    const room = roomsById.get(roomId);
    if (room) {
        const playerIdx = data.indexPlayer;
        console.log(`PLAYER IDX: [${playerIdx}]`);
        // console.log(data.ships);
        if (room.addShips(playerIdx, data.ships)) {
            if (room.numPlayersInState(PlayerState.READY) === 2) {
                const activePlayer = Math.round(Math.random());
                resps.push(new Message('start_game', {
                    ships: room.players[0].gameField.getShipsAsJson(),
                    currentPlayerIndex: activePlayer
                }, room.players[0].player.login));
                resps.push(new Message('start_game', {
                    ships: room.players[1].gameField.getShipsAsJson(),
                    currentPlayerIndex: activePlayer
                }, room.players[1].player.login));
                room.activePlayerIdx = activePlayer;
                return resps;
            }
            else {
                err = false;
                erTxt = 'Ships added';
                rcpt = 'none';
            }
        }

    }

    resps.push(new Message(request.type, {
        error: err,
        errorText: erTxt,
    }, rcpt));

    return resps;
}


function attack(session: Session, request: Message): Message[] {
    let err: boolean = true;
    let erTxt: string = 'Unable to attack';
    let rcpt = '';
    const data = JSON.parse(request.data);
    const roomId = data.gameId;
    console.log(`ROOM ID: [${roomId}]`);
    const resps = new Array<Message>;
    const room = roomsById.get(roomId);
    if (room) {
        const playerIdx = data.indexPlayer;
        console.log(`PLAYER IDX: [${playerIdx}]`);
        if (room.activePlayerIdx === playerIdx) {
            const x = data.x;
            const y = data.y;
            const res = room.attack(playerIdx, x, y);
            console.log(res);
            let resStr: string;
            switch (res) {
                case 2:
                    resStr = 'shot';
                    break;
                case 3:
                    resStr = 'killed';
                    break;

                default:
                    resStr = 'miss';
                    break;
            }
            resps.push(new Message('attack', {
                position: { x: x, y: y },
                currentPlayer: playerIdx,
                status: resStr
            }, room.players[0].player.login));
            resps.push(new Message('attack', {
                position: { x: x, y: y },
                currentPlayer: playerIdx,
                status: resStr
            }, room.players[1].player.login));
            return resps;
        }
        else {
            erTxt = 'Not your turn';
        }

    }

    resps.push(new Message(request.type, {
        error: err,
        errorText: erTxt,
    }, rcpt));

    return resps;
}

function sendMessages(wss: WebSocketServer, ws: WebSocket, msgs: Message[]) {
    msgs.forEach(msg => {
        const str: string = msg.toString();

        switch (msg.rcpt) {
            case 'none':
                break;

            case 'all':
                console.log("Send message to ALL");
                console.log('<-\nResponse:', JSON.parse(str));
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(str);
                    }
                });
                break;

            case '':
                console.log("Send message to default recipient");
                console.log('<-\nResponse:', JSON.parse(str));
                ws.send(str);
                break;

            default:
                console.log("Send message to " + msg.rcpt);
                console.log('<-\nResponse:', JSON.parse(str));
                const session = playersSessions.get(msg.rcpt);
                if (session) {
                    if (session.ws.readyState === WebSocket.OPEN) {
                        session.ws.send(str);
                    }
                }
                break;
        }
    });
}


function processMessage(session: Session, request: Message): Message[] {
    let response = new Array<Message>;

    switch (request.type) {
        case "reg":
            response.push(registerPlayer(session, request));
            response.push(getAvaliableRooms());
            break;

        case "create_room":
            response.push(createRoom(session, request));
            break;

        case "add_user_to_room":
            // const { name, password } = request.data;
            addPlayer2Room(session, request).forEach(resp => {
                response.push(resp);
            });
            break;

        case "add_ships":
            addShips(session, request).forEach(resp => {
                response.push(resp);
            });
            break;

        case 'attack':
            attack(session, request).forEach(resp => {
                response.push(resp);
            });
            break;

        default:
            response.push(new Message("error", { 'error': true, 'errorText': "Unknow message type" }));
            break;
    }

    return response;
}

wss.on('connection', (ws: WebSocket) => {
    const session: Session = new Session(uuid.v4(), ws, SessionState.OPEN);
    sessions.add(session);
    console.log(`Created session [${session}]`);

    ws.on('message', (message: string) => {
        console.log(`Session is [${session.id}]`);
        try {
            console.log('->\nRequest:', JSON.parse(message));
            const msg = Message.fromJson(JSON.parse(message));
            let response: Message[] = processMessage(session, msg);
            sendMessages(wss, ws, response);
            // response.forEach((resp) => {
            //     let str: string = resp.toString();
            //     console.log('<-\nResponse:', JSON.parse(str));
            //     if (resp.type === 'update_room' || resp.type === 'update_winners') {
            //         wss.clients.forEach(client => {
            //             if (client.readyState === WebSocket.OPEN) {
            //                 client.send(str, { binary: false });
            //             }
            //         });
            //     }
            //     else {
            //         ws.send(str);
            //     }
            // });
        } catch (error) {
            console.log(error);
        }
    });

    ws.on('close', () => {
        console.log('Connection closed');
    });

    ws.send(Message.fromJson({ type: "connected", data: { session: session.id }, id: 0 }).toString());
});

// server.listen(3000, () => {
//     console.log('WebSocket server is listening on port 3000');
// });
