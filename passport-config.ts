const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
import { collections } from "./src/services/database.service";

interface JwtPayload {
  email: string;
}

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

export default (passport: any) => {
  passport.use(
    new JwtStrategy(opts, async (jwt_payload: JwtPayload, done: Function) => {
      try {
        if (!collections.users) {
          return done(null, false);
        }

        const user = await collections.users.findOne({
          email: jwt_payload.email,
        });

        if (user) {
          return done(null, user);
        }

        return done(null, false);
      } catch (error) {
        done(error, false);
      }
    })
  );
};
