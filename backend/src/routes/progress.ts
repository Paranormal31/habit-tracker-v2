import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getProgressForMonth } from "../controllers/progressController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(getProgressForMonth));

export default router;
