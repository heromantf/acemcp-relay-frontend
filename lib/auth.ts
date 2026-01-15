import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "postgres",
  }),
  user: {
    additionalFields: {
      trustLevel: {
        type: "number",
        required: false,
        defaultValue: 0,
      },
      username: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "linuxdo",
          clientId: process.env.AUTH_LINUXDO_ID!,
          clientSecret: process.env.AUTH_LINUXDO_SECRET!,
          authorizationUrl: "https://connect.linux.do/oauth2/authorize",
          tokenUrl: "https://connect.linuxdo.org/oauth2/token",
          userInfoUrl: "https://connect.linuxdo.org/api/user",
          scopes: ["profile", "email"],
          mapProfileToUser: (profile) => {
            return {
              name: profile.name || profile.username,
              email: profile.email,
              image: profile.avatar_url || profile.avatar_template?.replace("{size}", "120"),
              username: profile.username,
              trustLevel: profile.trust_level,
            };
          },
        },
      ],
    }),
  ],
});
