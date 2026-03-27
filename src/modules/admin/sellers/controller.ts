import { Response } from "express";
import {
  adminListSellers,
  adminGetSeller,
  adminUpdateSeller,
  adminDeleteSeller,
  adminApproveSeller,
  adminRejectSeller,
  adminSuspendSeller,
  adminRestoreSeller,
  adminCreateSeller,
} from "./service";
import { AuthenticatedRequest } from "../middleware";
import logger from "../../../utils/logger";
import { sendSellerApprovalEmail, sendSellerRejectionEmail } from "../../../utils/sendEmail";

export const listSellersHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const {
      page,
      limit,
      search,
      status,
      verificationStatus,
      sortBy,
      sortOrder,
    } = req.query;
    const result = await adminListSellers({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      status: (status as "active" | "suspended") || undefined,
      verificationStatus:
        (verificationStatus as "pending" | "approved" | "rejected") ||
        undefined,
      sortBy: (sortBy as "createdAt" | "businessName") || "createdAt",
      sortOrder: (sortOrder as "asc" | "desc") || "desc",
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error("List sellers error", { error });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const createSellerHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { email, name, businessName, businessLicense, phone } = req.body;
    const seller = await adminCreateSeller({
      email,
      name,
      businessName,
      businessLicense,
      phone,
    });
    res.status(201).json({ success: true, data: seller });
  } catch (error: any) {
    logger.error("Create seller error", { error });
    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
};

export const getSellerHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const seller = await adminGetSeller(id);
    res.json({ success: true, data: seller });
  } catch (error: any) {
    logger.error("Get seller error", { error });
    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
};

export const updateSellerHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { name, phone, status } = req.body;
    const seller = await adminUpdateSeller(id, { name, phone, status });
    res.json({ success: true, data: seller });
  } catch (error: any) {
    logger.error("Update seller error", { error });
    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
};

export const deleteSellerHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    await adminDeleteSeller(id);
    res.json({ success: true, message: "Seller deleted successfully" });
  } catch (error: any) {
    logger.error("Delete seller error", { error });
    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
};

export const approveSellerHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const seller = await adminApproveSeller(id);
    res.json({ success: true, data: seller });
    sendSellerApprovalEmail(seller.email, seller.name).catch((err) => {
      console.error("Failed to send seller approval email:", err);
    });
  } catch (error: any) {
    logger.error("Approve seller error", { error });
    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
};

export const rejectSellerHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const seller: any = await adminRejectSeller(id, req.body.reason);
    res.json({ success: true, data: seller });

    sendSellerRejectionEmail(seller.email, seller.name, seller?.reason).catch(
      (err) => {
        console.error("Failed to send seller rejection email:", err);
      },
    );
  } catch (error: any) {
    logger.error("Reject seller error", { error });
    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
};

export const suspendSellerHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const seller = await adminSuspendSeller(id);
    res.json({ success: true, data: seller });
  } catch (error: any) {
    logger.error("Suspend seller error", { error });
    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
};

export const restoreSellerHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const seller = await adminRestoreSeller(id);
    res.json({ success: true, data: seller });
  } catch (error: any) {
    logger.error("Restore seller error", { error });
    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
};
