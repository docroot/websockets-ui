import { JsxEmit } from "typescript";

export class Message {
    type: string;
    id: number;
    data: any;
    rcpt: string;

    constructor(type: string, data: any, rcpt: string = '', id: number = 0) {
        this.type = type;
        this.data = data;
        this.id = id;
        this.rcpt = rcpt;
    }

    static fromJson(json: any): Message {
        const { type, data, id } = json;
        return new Message(type, data, id);
    }

    toString(): string {
        return JSON.stringify({
            'type': this.type,
            'data': JSON.stringify(this.data),
            'id': this.id
        });
    }
};
