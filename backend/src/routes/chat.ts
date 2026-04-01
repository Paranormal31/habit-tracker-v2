import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { chatWithHabits } from "../controllers/chatController";

const router = Router();

router.use(requireAuth);
router.post("/", asyncHandler(chatWithHabits));

export default router;
