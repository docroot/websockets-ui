import { Player } from "./Player";

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


    constructor(id: string, state: SessionState) {
        this.id = id;
        this.state = state;
        this.player = undefined;
    }
};
