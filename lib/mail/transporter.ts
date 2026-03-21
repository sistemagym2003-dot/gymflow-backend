import nodemailer from "nodemailer";
import { mailConfig } from "./config";

export const mailTransporter = nodemailer.createTransport(mailConfig.transport);
