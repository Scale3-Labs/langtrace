import prisma from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "root" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // verify credentials
        if (
          credentials?.username !== process.env.ADMIN_EMAIL ||
          credentials?.password !== process.env.ADMIN_PASSWORD
        ) {
          return null;
        }

        // if valid, return user
        let resp = await prisma.user.findUnique({
          where: { email: process.env.ADMIN_EMAIL },
        });

        if (!resp) {
          // create user if not exists
          resp = await prisma.user.create({
            data: {
              email: process.env.ADMIN_EMAIL,
              name: "Admin",
              image: null,
              role: "owner",
              status: "active",
            },
          });
        }

        if (resp) {
          // Any object returned will be saved in `user` property of the JWT
          const user = {
            id: resp?.id,
            name: resp?.name,
            email: process.env.ADMIN_EMAIL,
          };
          return user;
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;
        }
      },
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID as string,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET as string,
      tenantId: process.env.AZURE_AD_TENANT_ID as string,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    error: "/login",
  },
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      if (!user.email) {
        return false;
      }
      if (account?.provider === "google") {
        const userExists = await prisma.user.findUnique({
          where: { email: user.email },
          select: { name: true },
        });
        // if the user already exists via email,
        // update the user with their name and image from Google
        if (userExists && !userExists.name) {
          await prisma.user.update({
            where: { email: user.email },
            data: {
              name: profile?.name,
              // @ts-ignore - this is a bug in the types, `picture` is a valid on the `Profile` type
              image: profile?.picture,
            },
          });
        }
      }
      return true;
    },
    jwt: async ({ token, account, user, trigger }) => {
      // force log out
      if (!token.email) {
        return {};
      }

      if (user) {
        token.user = user;
      }

      // refresh the user's data if they update their name / email
      if (trigger === "update") {
        const refreshedUser = await prisma.user.findUnique({
          where: { id: token.sub },
        });
        if (refreshedUser) {
          token.user = refreshedUser;
        } else {
          return {};
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      session.user = {
        id: token.sub,
        // @ts-ignore
        ...(token || session).user,
      };
      return session;
    },
  },
};
