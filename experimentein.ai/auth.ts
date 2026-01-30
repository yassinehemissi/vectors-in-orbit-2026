import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { initCreditAccountForUser } from "@/lib/credits";

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) {
        return false;
      }

      await connectToDatabase();
      const existingUser = await User.findOne({ email: user.email });

      const updatedUser =
        existingUser ??
        (await User.create({
          email: user.email,
          name: user.name ?? "",
          image: user.image ?? "",
        }));

      if (existingUser) {
        existingUser.name = user.name ?? existingUser.name ?? "";
        existingUser.image = user.image ?? existingUser.image ?? "";
        await existingUser.save();
      }

      if (!updatedUser.creditAccountId) {
        const creditAccount = await initCreditAccountForUser(updatedUser._id);
        updatedUser.creditAccountId = creditAccount._id;
        if (!updatedUser.month_plan_accredated) {
          updatedUser.month_plan_accredated = new Date();
        }
        await updatedUser.save();
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name as string | undefined;
        session.user.email = token.email as string | undefined;
        session.user.image = token.picture as string | undefined;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    },
  },
};
