import express from "express";
import { authenticateLean } from "../middleware/authenticate";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";

const router = express.Router();

router.use(authenticateLean);

router.route("/").get(getCategories).post(createCategory);

router.route("/:id").put(updateCategory).delete(deleteCategory);

export default router;
