import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getCompletionsForMonth, toggleCompletion } from "../controllers/completionsController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(getCompletionsForMonth));
router.post("/toggle", asyncHandler(toggleCompletion));

export default router;
