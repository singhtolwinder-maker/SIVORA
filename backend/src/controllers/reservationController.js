import { ROLES } from "../config/constants.js";
import * as reservationService from "../services/reservationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, sendCreated, sendSuccess } from "../utils/apiResponse.js";
import { readPagination } from "../utils/pagination.js";

export const availability = asyncHandler(async (req, res) => {
  const slots = await reservationService.getAvailability(req.valid.query.date);
  return sendSuccess(res, { data: { date: req.valid.query.date, slots } });
});

export const create = asyncHandler(async (req, res) => {
  const reservation = await reservationService.createReservation(req.valid.body, req.user ?? null);
  return sendCreated(res, {
    message: "Your table request is in. We confirm by email within the hour.",
    data: reservation,
  });
});

export const listMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPagination(req.valid.query, { defaultLimit: 10 });
  const { items, total } = await reservationService.listReservations({
    user: req.user,
    isAdmin: false,
    query: { ...req.valid.query, page, limit, skip },
  });

  return sendSuccess(res, { data: items, meta: buildMeta({ page, limit, total }) });
});

export const detail = asyncHandler(async (req, res) => {
  const reservation = await reservationService.getReservation({
    user: req.user,
    isAdmin: req.user.role === ROLES.ADMIN,
    id: req.valid.params.id,
  });
  return sendSuccess(res, { data: reservation });
});

export const cancel = asyncHandler(async (req, res) => {
  const reservation = await reservationService.getReservation({
    user: req.user,
    isAdmin: req.user.role === ROLES.ADMIN,
    id: req.valid.params.id,
  });
  const cancelled = await reservationService.cancelReservation({
    actor: req.user,
    reservation,
    reason: req.valid.body.reason,
  });
  return sendSuccess(res, { message: "Reservation cancelled.", data: cancelled });
});

export const adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPagination(req.valid.query, { defaultLimit: 20 });
  const { items, total } = await reservationService.listReservations({
    user: req.user,
    isAdmin: true,
    query: { ...req.valid.query, page, limit, skip },
  });

  return sendSuccess(res, { data: items, meta: buildMeta({ page, limit, total }) });
});

export const adminUpdate = asyncHandler(async (req, res) => {
  const reservation = await reservationService.getReservation({
    user: req.user,
    isAdmin: true,
    id: req.valid.params.id,
  });
  const updated = await reservationService.updateReservationStatus({
    actor: req.user,
    reservation,
    status: req.valid.body.status,
    note: req.valid.body.note,
  });
  return sendSuccess(res, { message: "Reservation updated.", data: updated });
});
