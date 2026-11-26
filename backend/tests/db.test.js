import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectDatabase, isAuthenticationError } from "../src/config/db.js";

describe("database connection errors", () => {
  afterEach(() => {
    mongoose.connect = originalConnect;
  });

  const originalConnect = mongoose.connect;

  it("recognizes MongoDB authentication failures", () => {
    assert.equal(isAuthenticationError({ code: 18 }), true);
    assert.equal(isAuthenticationError(new Error("bad auth : authentication failed")), true);
    assert.equal(isAuthenticationError(new Error("server selection timed out")), false);
  });

  it("does not add duplicate connection listeners after failed connections", async () => {
    const disconnectedListeners = mongoose.connection.listenerCount("disconnected");
    const reconnectedListeners = mongoose.connection.listenerCount("reconnected");
    mongoose.connect = async () => {
      throw new Error("authentication failed");
    };

    await assert.rejects(connectDatabase("mongodb://invalid.example/savora"), /authentication failed/);
    await assert.rejects(connectDatabase("mongodb://invalid.example/savora"), /authentication failed/);

    assert.equal(mongoose.connection.listenerCount("disconnected"), disconnectedListeners);
    assert.equal(mongoose.connection.listenerCount("reconnected"), reconnectedListeners);
  });
});
