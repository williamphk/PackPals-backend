import { ObjectId } from "mongodb";

export default class Notification {
  constructor(
    public userId: string,
    public content: string,
    public seen: boolean,
    public created_date: Date
  ) {}
}
