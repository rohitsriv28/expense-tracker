import express from "express";
import { authenticate } from "../middleware/authenticate";
import {
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
} from "../controllers/income.controller";

const router = express.Router();

router.use(authenticate);

router.route("/").get(getIncome).post(createIncome);

router.route("/:id").put(updateIncome).delete(deleteIncome);

export default router;
