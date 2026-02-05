import { Router } from "express";
import { register, login, logout, me } from "../controllers/authController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.get("/me", asyncHandler(me));

export default router;
