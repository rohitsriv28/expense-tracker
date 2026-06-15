import request from "supertest";
import app from "../../app";
import Income from "../../models/Income.model";
import { setupTestDB, teardownTestDB, createTestUser } from '../../__tests__/setup';

let token: string;
let userId: string;

beforeAll(async () => {
  await setupTestDB();
  const testData = await createTestUser();
  token = testData.token;
  userId = testData.user._id.toString();
}, 60000);

afterAll(async () => {
  await teardownTestDB();
}, 30000);

beforeEach(async () => {
  await Income.deleteMany({});
});

const validIncome = {
  amount: 50000,
  source: "Salary",
  date: new Date().toISOString(),
  description: "Monthly salary",
};

describe("Income Controller", () => {
  describe("GET /api/income", () => {
    it("should return empty array when no income", async () => {
      const res = await request(app)
        .get("/api/income")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it("should return income sorted by date descending", async () => {
      await Income.create([
        { userId, amount: 100, source: "Old", date: new Date("2025-01-01") },
        { userId, amount: 200, source: "New", date: new Date("2026-06-01") },
      ]);

      const res = await request(app)
        .get("/api/income")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].source).toBe("New");
    });
  });

  describe("POST /api/income", () => {
    it("should create income successfully", async () => {
      const res = await request(app)
        .post("/api/income")
        .set("Authorization", `Bearer ${token}`)
        .send(validIncome);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(50000);
      expect(res.body.data.source).toBe("Salary");
    });

    it("should reject missing required fields", async () => {
      const res = await request(app)
        .post("/api/income")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 100 }); // missing source and date

      expect(res.status).toBe(400);
    });

    it("should handle recurring income", async () => {
      const res = await request(app)
        .post("/api/income")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validIncome,
          isRecurring: true,
          recurringFrequency: "monthly",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isRecurring).toBe(true);
      expect(res.body.data.recurringFrequency).toBe("monthly");
    });
  });

  describe("PUT /api/income/:id", () => {
    it("should update income successfully", async () => {
      const income = await Income.create({ ...validIncome, userId });

      const res = await request(app)
        .put(`/api/income/${income._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 60000 });

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(60000);
    });

    it("should return 404 for non-existent income", async () => {
      const fakeId = new (require("mongoose").Types.ObjectId)();
      const res = await request(app)
        .put(`/api/income/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 100 });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/income/:id", () => {
    it("should delete income successfully", async () => {
      const income = await Income.create({ ...validIncome, userId });

      const res = await request(app)
        .delete(`/api/income/${income._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await Income.findById(income._id);
      expect(deleted).toBeNull();
    });

    it("should return 404 for non-existent income", async () => {
      const fakeId = new (require("mongoose").Types.ObjectId)();
      const res = await request(app)
        .delete(`/api/income/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("Ownership isolation", () => {
    it("should not return another user's income", async () => {
      const other = await createTestUser({
        googleId: "inc_other",
        email: "inc_other@ex.com",
      });
      await Income.create({ ...validIncome, userId: other.user._id });

      const res = await request(app)
        .get("/api/income")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.data.length).toBe(0);
    });
  });
});
