import express from "express";
import { authenticate } from "../middleware/authenticate";
import {
  getIncomeSources,
  createIncomeSource,
  updateIncomeSource,
  deleteIncomeSource,
} from "../controllers/income-source.controller";

const router = express.Router();

router.use(authenticate);

router.route("/").get(getIncomeSources).post(createIncomeSource);

router.route("/:id").put(updateIncomeSource).delete(deleteIncomeSource);

export default router;
