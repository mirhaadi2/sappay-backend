import { Router } from "express";
import {
  createAddressHandler,
  getAddressesHandler,
  getAddressByIdHandler,
  updateAddressHandler,
  deleteAddressHandler,
  setDefaultAddressHandler,
  getDefaultAddressHandler,
} from "./controller";
import { requireAuth } from "../../../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Create new address
router.post("/", createAddressHandler);

// Get all addresses for current user
router.get("/", getAddressesHandler);

// Get default address
router.get("/default", getDefaultAddressHandler);

// Get address by ID
router.get("/:id", getAddressByIdHandler);

// Update address
router.put("/:id", updateAddressHandler);

// Delete address
router.delete("/:id", deleteAddressHandler);

// Set address as default
router.post("/:id/set-default", setDefaultAddressHandler);

export default router;
