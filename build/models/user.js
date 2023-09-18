"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class User {
    constructor(first_name, last_name, email, hashed_password, created_date, id) {
        this.first_name = first_name;
        this.last_name = last_name;
        this.email = email;
        this.hashed_password = hashed_password;
        this.created_date = created_date;
        this.id = id;
    }
}
exports.default = User;
