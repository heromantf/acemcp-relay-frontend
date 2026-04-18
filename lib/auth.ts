import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { genericOAuth } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: new Pool({
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB || "postgres",
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
      githubCreatedAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      mapProfileToUser: (profile) => ({
        name: profile.name || profile.login,
        email: profile.email,
        image: profile.avatar_url,
        username: profile.login,
        githubCreatedAt: profile.created_at ? new Date(profile.created_at) : undefined,
      }),
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const created = (user as { githubCreatedAt?: Date | string | null })
            .githubCreatedAt;
          if (!created) return;
          const createdMs = new Date(created).getTime();
          if (Number.isNaN(createdMs)) {
            throw new APIError("BAD_REQUEST", {
              message: "GITHUB_ACCOUNT_TOO_YOUNG:unknown:unknown",
            });
          }
          const raw = Number(process.env.AUTH_GITHUB_MIN_ACCOUNT_AGE_DAYS);
          const minDays = Number.isFinite(raw) && raw >= 0 ? raw : 365;
          const ageDays = Math.floor((Date.now() - createdMs) / 86_400_000);
          if (ageDays < minDays) {
            throw new APIError("BAD_REQUEST", {
              message: `GITHUB_ACCOUNT_TOO_YOUNG:${minDays}:${ageDays}`,
            });
          }
        },
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
