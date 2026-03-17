import { Router } from "express";
import AddressController from "./controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Create new address
router.post("/", AddressController.createAddress.bind(AddressController));

// Get all addresses for current user
router.get("/", AddressController.getAddresses.bind(AddressController));

// Get default address
router.get("/default", AddressController.getDefaultAddress.bind(AddressController));

// Get address by ID
router.get("/:id", AddressController.getAddressById.bind(AddressController));

// Update address
router.put("/:id", AddressController.updateAddress.bind(AddressController));

// Delete address
router.delete("/:id", AddressController.deleteAddress.bind(AddressController));

// Set address as default
router.post("/:id/set-default", AddressController.setDefaultAddress.bind(AddressController));

export default router;
