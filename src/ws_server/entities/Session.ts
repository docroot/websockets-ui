import { OPEN } from "ws";
import { Player } from "./Player";
import WebSocket from "ws";

export enum SessionState {
    OPEN,
    CLOSED,
    SUSPENDED,
    TERMINATED
}

export class Session {
    id: string;
    player?: Player;
    state: SessionState;
    ws: WebSocket;


    constructor(id: string, ws: WebSocket, state: SessionState = OPEN) {
        this.id = id;
        this.ws = ws;
        this.state = state;
        this.player = undefined;
    }
};
