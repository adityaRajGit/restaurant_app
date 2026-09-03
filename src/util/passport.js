// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import userHelper from "../common/helpers/user.helper";
// import serverConfig from "../../src/server/config";

// passport.serializeUser((user, done) => done(null, user._id));
// passport.deserializeUser(async (id, done) => {
//   const user = await userHelper.getObjectById({ id });
//   done(null, user);
// });

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: serverConfig.GOOGLE_CLIENT_ID,
//       clientSecret: serverConfig.GOOGLE_CLIENT_SECRET,
//       callbackURL: serverConfig.GOOGLE_CALLBACK_URL,
//     },
//     async (accessToken, refreshToken, profile, done) => {
      
//       let user = await userHelper.getObjectByQuery({ query: { email: profile.emails[0].value } });
//       if (!user) {
//         user = await userHelper.addObject({
//           name: profile.displayName,
//           email: profile.emails[0].value,
//           username: profile.emails[0].value.split("@")[0],
//           profile_image: profile.photos[0]?.value,
//         });
//       }
//       return done(null, user);
//     }
//   )
// );

// export default passport;