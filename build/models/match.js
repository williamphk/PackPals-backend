"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Match {
    constructor(product_name, created_date, requesterId, status, requesteeId) {
        this.product_name = product_name;
        this.created_date = created_date;
        this.requesterId = requesterId;
        this.status = status;
        this.requesteeId = requesteeId;
    }
}
exports.default = Match;
