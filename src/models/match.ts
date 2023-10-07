import { ObjectId } from "mongodb";

export default class Match {
  constructor(
    public product_name: string,
    public created_date: Date,
    public requesterId: ObjectId,
    public status: string,
    public requesteeId?: ObjectId,
    public id?: ObjectId
  ) {}
}
