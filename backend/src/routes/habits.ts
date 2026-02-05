import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  listHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  reorderHabits,
  toggleStreakFreeze
} from "../controllers/habitsController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(listHabits));
router.post("/", asyncHandler(createHabit));
router.patch("/:id", asyncHandler(updateHabit));
router.delete("/:id", asyncHandler(deleteHabit));
router.post("/:id/freeze", asyncHandler(toggleStreakFreeze));
router.post("/reorder", asyncHandler(reorderHabits));

export default router;
