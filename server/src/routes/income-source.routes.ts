import express from "express";
import { authenticateLean } from "../middleware/authenticate";
import {
  getIncomeSources,
  createIncomeSource,
  updateIncomeSource,
  deleteIncomeSource,
} from "../controllers/income-source.controller";
import { validate } from "../middleware/validate";
import {
  createIncomeSourceSchema,
  updateIncomeSourceSchema,
} from "../validation/income.validation";

const router = express.Router();

router.use(authenticateLean);

router
  .route("/")
  .get(getIncomeSources)
  .post(validate(createIncomeSourceSchema), createIncomeSource);

router
  .route("/:id")
  .put(validate(updateIncomeSourceSchema), updateIncomeSource)
  .delete(deleteIncomeSource);

export default router;
