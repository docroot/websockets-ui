import { Player } from "./Player";
import { GameField } from "./GameField";
import { Ship } from "./Ship";

export enum PlayerState {
    NONE,
    CONNECTED,
    READY,
    INGAME,
    DISCONECTED,
    WON,
    LOOSE
}

class PlayerInRoom {
    player: Player;
    idx: number;
    state: PlayerState;
    shipsPlacedCount: number;
    gameField: GameField;

    constructor(player: Player, idx: number, state: PlayerState = PlayerState.CONNECTED) {
        this.player = player;
        this.idx = idx;
        this.state = state;
        this.gameField = new GameField();
        this.shipsPlacedCount = 0;
    }
}

export class Room {
    id: number;
    players: Array<PlayerInRoom>;
    //    playersFields: Array<GameField>;
    activePlayerIdx: number;
    //    playersStates: Array<PlayerState>;

    constructor(id: number) {
        this.id = id;
        this.players = new Array<PlayerInRoom>;
        //       this.playersFields = new Array<GameField>;
        this.activePlayerIdx = 0;
        //        this.playersStates = new Array<PlayerState>;
    }

    addPlayer(newPlayer: Player): boolean {
        let idx = this.players.findIndex(el => { el.player.login === newPlayer.login; });
        if (idx < 0) {
            if (this.players.length < 2) {
                const player = new PlayerInRoom(newPlayer, this.players.length);
                this.players.push(player);
                const idx = this.players.length - 1;
                return true;
            }
        }
        return false;
    }

    addShips(playerIdx: number, ships: Array<{ poistion: { x: number, y: number }, type: string, length: number }>): boolean {
        const player = this.players[playerIdx];
        if (player) {
            const field = player.gameField;
            ships.forEach(element => {
                const ship = Ship.fromJson(element);
                console.log(ship);
                if (!field.addShip(ship)) return false;
            });
            field.printField();
            // console.log(field.ships);
            player.state = PlayerState.READY;
            return true;
        }
        return false;
    }


    attack(playerIdx: number, x: number, y: number): number {
        let idx: number = 1;
        if (playerIdx > 0) {
            idx = 0;
        }

        const res = this.players[idx].gameField.checkShipHit(x, y);
        return res;
    }


    numPlayersInState(state: PlayerState): number {
        let num = 0;
        this.players.forEach(player => {
            if (player.state === state) {
                num++;
            }
        });

        return num;
    }

    toJSON() {
        let json = {
            roomId: this.id,
            roomUsers: new Array<{ name: string, index: number }>
        };

        // let rUsers: { name: string, index: number }[] = [];
        this.players.forEach((elm, index) => {
            let user = {
                name: elm.player.login,
                index: index
            };
            json.roomUsers.push(user);
        });
        // json['roomUsers'] = rUsers;
        return json;
    }

    // static fromJson(json: any): Player {
    //     const { name, password } = json;
    //     return new Player(name, password);
    // }
};
