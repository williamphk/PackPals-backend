import { ObjectId } from "mongodb";

export default class Product {
  constructor(
    public name: string,
    public created_date: Date,
    public id?: ObjectId,
    public user_id?: ObjectId
  ) {}
}
