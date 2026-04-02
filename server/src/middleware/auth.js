import { getAuth } from "@clerk/express";
import { createClerkClient } from "@clerk/backend";
import User from "../models/User.js";

const clerkSecret = process.env.CLERK_SECRET_KEY?.trim();

const clerkClient = clerkSecret
  ? createClerkClient({ secretKey: clerkSecret })
  : null;

/**
 * After `clerkMiddleware()`, resolves MongoDB user from Clerk session and sets req.userId / req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    if (!clerkClient) {
      return res.status(503).json({ message: "Authentication is not configured (CLERK_SECRET_KEY)" });
    }
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
      const cu = await clerkClient.users.getUser(clerkUserId);
      const primary =
        cu.emailAddresses?.find((e) => e.id === cu.primaryEmailAddressId) || cu.emailAddresses?.[0];
      const email = primary?.emailAddress?.toLowerCase();
      if (!email) {
        return res.status(400).json({ message: "Your Clerk account has no email address" });
      }
      const byEmail = await User.findOne({ email });
      if (byEmail) {
        byEmail.clerkId = clerkUserId;
        if (cu.imageUrl && !byEmail.picture) byEmail.picture = cu.imageUrl;
        await byEmail.save();
        user = byEmail;
      } else {
        const name =
          [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim() ||
          email.split("@")[0] ||
          "User";
        user = await User.create({
          clerkId: clerkUserId,
          email,
          name: name.slice(0, 120),
          currency: "INR",
          picture: cu.imageUrl || undefined,
        });
      }
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
