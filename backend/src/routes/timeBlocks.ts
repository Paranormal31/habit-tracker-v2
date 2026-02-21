import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getTimeBlocks, upsertTimeBlocks } from "../controllers/timeBlocksController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(getTimeBlocks));
router.put("/", asyncHandler(upsertTimeBlocks));

export default router;
