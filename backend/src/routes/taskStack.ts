import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getTaskStack, upsertTaskStack } from "../controllers/taskStackController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(getTaskStack));
router.put("/", asyncHandler(upsertTaskStack));

export default router;
