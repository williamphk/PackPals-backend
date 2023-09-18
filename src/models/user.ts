import { ObjectId } from "mongodb";

export default class User {
  constructor(
    public first_name: string,
    public last_name: string,
    public email: string,
    public hashed_password: string,
    public created_date: Date,
    public id?: ObjectId
  ) {}
}
