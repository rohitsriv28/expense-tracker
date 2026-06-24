import express from "express";
import { authenticateLean } from "../middleware/authenticate";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { validate } from "../middleware/validate";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validation/category.validation";

const router = express.Router();

router.use(authenticateLean);

router
  .route("/")
  .get(getCategories)
  .post(validate(createCategorySchema), createCategory);

router
  .route("/:id")
  .put(validate(updateCategorySchema), updateCategory)
  .delete(deleteCategory);

export default router;
