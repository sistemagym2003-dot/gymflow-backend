import { mailConfig } from "./config";
import { mailTransporter } from "./transporter";
import {
  buildAccessCredentialsTemplate,
  buildTestMailTemplate,
} from "./templates";

function formatFrom() {
  return `${mailConfig.identity.fromName} <${mailConfig.identity.fromEmail}>`;
}

export async function sendTestMail(input: {
  to: string;
  recipientName?: string;
  serviceName?: string;
}) {
  const template = buildTestMailTemplate(input);

  return mailTransporter.sendMail({
    from: formatFrom(),
    to: input.to,
    replyTo: mailConfig.identity.replyTo,
    subject: "Correo de prueba SMTP",
    html: template.html,
    text: template.text,
  });
}

export async function sendAccessCredentialsMail(input: {
  to: string;
  recipientName?: string;
  gymName?: string;
  temporaryPassword: string;
  loginUrl?: string;
}) {
  const loginUrl = input.loginUrl ?? mailConfig.links.socioAppUrl;
  const template = buildAccessCredentialsTemplate({
    recipientName: input.recipientName,
    gymName: input.gymName,
    email: input.to,
    temporaryPassword: input.temporaryPassword,
    loginUrl,
  });

  return mailTransporter.sendMail({
    from: formatFrom(),
    to: input.to,
    replyTo: mailConfig.identity.replyTo,
    subject: `Tus credenciales de acceso${input.gymName ? ` · ${input.gymName}` : ""}`,
    html: template.html,
    text: template.text,
  });
}
