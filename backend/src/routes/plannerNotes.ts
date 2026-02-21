import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getPlannerNote, upsertPlannerNote } from "../controllers/plannerNotesController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(getPlannerNote));
router.put("/", asyncHandler(upsertPlannerNote));

export default router;
