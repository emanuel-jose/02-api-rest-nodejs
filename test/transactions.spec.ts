import { it, beforeAll, afterAll, describe, expect, beforeEach } from "vitest";
import { execSync } from "node:child_process";
import { app } from "../src/app";
import request from "supertest";

describe("Transaction routes", () => {
  // antes de todos os testes precisa verificar se o fastify já registrou todos os plugins
  beforeAll(async () => {
    await app.ready();
  });

  // depois de todos os testes remova a aplicação da memória
  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });

  it("should be able to create a new transaction", async () => {
    await request(app.server)
      .post("/transactions")
      .send({
        title: "New Transaction",
        amount: 5000,
        type: "credit",
      })
      .expect(201);
  });

  it("should be able to list all transactions", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "New Transaction",
        amount: 5000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listTransactionResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies as string[])
      .expect(200);

    expect(listTransactionResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "New Transaction",
        amount: 5000,
      }),
    ]);
  });

  it("should be able to get a specific transaction", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "New Transaction",
        amount: 5000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listTransactionResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies as string[]);

    const transactionId = listTransactionResponse.body.transactions[0].id;

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies as string[])
      .expect(200);

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: "New Transaction",
        amount: 5000,
      })
    );
  });

  it("should be able to get the summary", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Credit Transaction",
        amount: 5000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies as string[])
      .send({
        title: "Debit Transaction",
        amount: 2000,
        type: "debit",
      });

    const summaryResponse = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies as string[])
      .expect(200);

    expect(summaryResponse.body.summary).toEqual({
      amount: 3000,
    });
  });
});
