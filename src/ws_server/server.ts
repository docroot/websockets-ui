import * as http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { Player } from './entities/Player';
import { Message } from './entities/Message';
import * as uuid from 'uuid';
import { Session, SessionState } from './entities/Session';


export const server = http.createServer();
const wss = new WebSocketServer({ server });

const players = new Map<string, Player>();
const sessions = new Set<Session>();
const playersSessions = new Map<string, Session>();

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


function createRoom(session: Session, request: Message): Message {
    let err: boolean = false;
    let erTxt: string = '';
    return new Message(request.type, {
        // name: name,
        index: 1,
        error: err,
        errorText: erTxt,
    });
}


function processMessage(session: Session, request: Message): Message {
    let response: Message;

    switch (request.type) {
        case "reg":
            response = registerPlayer(session, request);
            break;
        case "create_room":
            // const { name, password } = request.data;
            response = new Message('create_game', { 'idGame': 10, 'idPlayer': 1 });
            break;
        case "add_user_to_room":
            // const { name, password } = request.data;
            response = new Message('create_game', { 'idGame': 10, 'idPlayer': 2 });
            break;

        default:
            response = new Message("error", { 'error': true, 'errorText': "Unknow message type" });
            break;
    }

    return response;
}

wss.on('connection', (ws: WebSocket) => {
    const session: Session = new Session(uuid.v4(), SessionState.OPEN);
    sessions.add(session);
    console.log(`Created session [${session}]`);

    ws.on('message', (message: string) => {
        console.log(`Session is [${session.id}]`);
        try {
            console.log('->\nRequest:', JSON.parse(message));
            const msg = Message.fromJson(JSON.parse(message));
            let resp: Message = processMessage(session, msg);
            let str: string = resp.toString();
            console.log('<-\nResponse:', JSON.parse(str));
            ws.send(resp.toString());
        } catch (error) {
            console.log(error);
        }
    });

    ws.on('close', () => {
        console.log('Connection closed');
    });

    ws.send(Message.fromJson({ type: "connected", data: { session: session }, id: 0 }).toString());
});

// server.listen(3000, () => {
//     console.log('WebSocket server is listening on port 3000');
// });
