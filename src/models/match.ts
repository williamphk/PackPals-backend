import { ObjectId } from "mongodb";

export default class Match {
  constructor(
    public product_name: string,
    public created_date: Date,
    public requester: ObjectId,
    public status: string,
    public requestee?: ObjectId,
    public id?: ObjectId
  ) {}
}
