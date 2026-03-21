function readRequired(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const mailConfig = {
  transport: {
    host: readRequired("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: (process.env.SMTP_SECURE ?? "false") === "true",
    auth: {
      user: readRequired("SMTP_USER"),
      pass: readRequired("SMTP_PASS"),
    },
  },
  identity: {
    fromEmail: readRequired("MAIL_FROM_EMAIL"),
    fromName: readRequired("MAIL_FROM_NAME"),
    replyTo: process.env.MAIL_REPLY_TO?.trim() || undefined,
  },
  links: {
    socioAppUrl: readRequired("SOCIO_APP_URL"),
  },
};
