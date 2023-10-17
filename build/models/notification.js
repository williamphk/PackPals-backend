"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Notification {
    constructor(userId, content, seen, created_date) {
        this.userId = userId;
        this.content = content;
        this.seen = seen;
        this.created_date = created_date;
    }
}
exports.default = Notification;
