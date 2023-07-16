import { Player } from "./Player";

export class Room {
    id: number;
    players: Array<Player>;

    constructor(id: number) {
        this.id = id;
        this.players = new Array<Player>;
    }

    addPlayer(palyer: Player): boolean {
        if (this.players.length < 2) {
            this.players.push(palyer);
            return true;
        }
        return false;
    }

    toJSON() {
        let json = {
            roomId: this.id,
            roomUsers: new Array<{ name: string, index: number }>
        };

        // let rUsers: { name: string, index: number }[] = [];
        this.players.forEach((player, index) => {
            let user = {
                name: player.login,
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
