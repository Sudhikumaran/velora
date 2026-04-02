import mongoose from "mongoose";
import Account from "../models/Account.js";

export async function assertAccountOwnership(userId, accountId) {
  const acc = await Account.findOne({
    _id: accountId,
    userId: new mongoose.Types.ObjectId(userId),
  });
  if (!acc) {
    const err = new Error("Account not found");
    err.status = 404;
    throw err;
  }
  return acc;
}

export async function applyTransactionEffect(tx, { session } = {}) {
  const opts = session ? { session } : {};
  if (tx.type === "income") {
    await Account.updateOne(
      { _id: tx.accountId },
      { $inc: { balance: tx.amount } },
      opts
    );
  } else if (tx.type === "expense") {
    await Account.updateOne(
      { _id: tx.accountId },
      { $inc: { balance: -tx.amount } },
      opts
    );
  } else if (tx.type === "transfer") {
    if (!tx.toAccountId) {
      const err = new Error("Transfer requires destination account");
      err.status = 400;
      throw err;
    }
    await Account.updateOne(
      { _id: tx.accountId },
      { $inc: { balance: -tx.amount } },
      opts
    );
    await Account.updateOne(
      { _id: tx.toAccountId },
      { $inc: { balance: tx.amount } },
      opts
    );
  }
}

export async function reverseTransactionEffect(tx, { session } = {}) {
  const opts = session ? { session } : {};
  if (tx.type === "income") {
    await Account.updateOne(
      { _id: tx.accountId },
      { $inc: { balance: -tx.amount } },
      opts
    );
  } else if (tx.type === "expense") {
    await Account.updateOne(
      { _id: tx.accountId },
      { $inc: { balance: tx.amount } },
      opts
    );
  } else if (tx.type === "transfer") {
    await Account.updateOne(
      { _id: tx.accountId },
      { $inc: { balance: tx.amount } },
      opts
    );
    await Account.updateOne(
      { _id: tx.toAccountId },
      { $inc: { balance: -tx.amount } },
      opts
    );
  }
}
