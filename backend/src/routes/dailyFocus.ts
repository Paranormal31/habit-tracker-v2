import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDailyFocus, upsertDailyFocus } from "../controllers/dailyFocusController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(getDailyFocus));
router.put("/", asyncHandler(upsertDailyFocus));

export default router;
