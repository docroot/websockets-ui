import { Ship } from "./Ship";

export class GameField {
    field: number[];
    ships: Ship[];
    shipsByType: Map<string, number>;

    constructor() {
        // this.id = id;
        this.field = new Array<number>;
        for (let index = 0; index < 100; index++) {
            this.field.push(0); // 0 - empty, 1 - ship, 2 - wounded ship, 3 - killed ship, 4 - miss, 5 - no sense to hit.

        }
        this.ships = new Array<Ship>;
        this.shipsByType = new Map<string, number>;
        // this.printField();
    }

    addShip(ship: Ship): boolean {
        this.ships.push(ship);
        // if (!this.shipsByType.get(ship.type)) {
        //     this.shipsByType.set(ship.type, 0);
        // }
        let shipNum = this.shipsByType.get(ship.type) || 0;
        shipNum++;
        this.shipsByType.set(ship.type, shipNum);
        for (let x = ship.start_x; x <= ship.end_x; x++) {
            for (let y = ship.start_y; y <= ship.end_y; y++) {
                this.field[x + y * 10] = 1;
            }
        }
        return true;
    }

    checkShipHit(x: number, y: number): number {
        let res = 4;
        console.log(`CELL[ ${x}, ${y} ] = ` + this.field[x + y * 10]);
        if (x >= 0 && x < 10 && y >= 0 && y < 10 && this.field[x + y * 10] === 1) {
            const ship = this.ships.find((s) => {
                console.log(`${s.start_x} <= ${x} && ${x} <= ${s.end_x} && ${s.start_y} <= ${y} && ${y} <= ${s.end_y} == ` + (s.start_x <= x && x <= s.end_x && s.start_y <= y && y <= s.end_y));
                return (s.start_x <= x && x <= s.end_x && s.start_y <= y && y <= s.end_y);
            });
            console.log(ship);
            if (ship && ship.hits < ship.length) {
                ship.hits++;
                if (ship.hits === ship.length) {
                    res = 3;
                    ship.state = 3;
                }
                else {
                    res = 2;
                    ship.state = 2;
                }
            }
        }
        this.field[x + y * 10] = res;
        return res;
    }

    printField() {
        console.log("____________");
        for (let x = 0; x < 10; x++) {
            let str = "|";
            for (let y = 0; y < 10; y++) {
                str = str + this.field[x * 10 + y];
            }
            console.log(str + "|");
        }
        console.log("~~~~~~~~~~~~");
    }


    getShipsAsJson() {
        const ships = new Array<{ position: { x: number, y: number }, direction: boolean, length: number, type: string }>;
        this.ships.forEach(ship => {
            ships.push(ship.toJson());
        });
        return ships;
    }

    // static fromJson(json: any): GameField {
    //     const { name, password } = json;
    //     return new GameField(name, password);
    // }

};
