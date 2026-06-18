import express from "express";
import { authenticateLean } from "../middleware/authenticate";
import {
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
} from "../controllers/income.controller";
import { validate } from "../middleware/validate";
import {
  createIncomeSchema,
  updateIncomeSchema,
} from "../validation/income.validation";

const router = express.Router();

router.use(authenticateLean);

router.route("/")
  .get(getIncome)
  .post(validate(createIncomeSchema), createIncome);

router.route("/:id")
  .put(validate(updateIncomeSchema), updateIncome)
  .delete(deleteIncome);

export default router;
