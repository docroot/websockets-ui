export class Player {
    // id: string;
    login: string;
    password: string;

    constructor(login: string, password: string = '') {
        // this.id = id;
        this.login = login;
        this.password = password;
    }

    toJSON() {
        return {
            login: this.login,
            password: this.password
        };
    }

    static fromJson(json: any): Player {
        const { name, password } = json;
        return new Player(name, password);
    }

};
