"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class User {
    constructor(first_name, last_name, email, hashed_password, postal_code, created_date, refreshToken, id) {
        this.first_name = first_name;
        this.last_name = last_name;
        this.email = email;
        this.hashed_password = hashed_password;
        this.postal_code = postal_code;
        this.created_date = created_date;
        this.refreshToken = refreshToken;
        this.id = id;
    }
}
exports.default = User;
