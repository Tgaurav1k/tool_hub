import nodemailer, { type Transporter } from 'nodemailer'

let cachedTransporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter

  const host = process.env.EMAIL_HOST
  const portRaw = process.env.EMAIL_PORT
  const user = process.env.EMAIL_HOST_USER
  const pass = process.env.EMAIL_HOST_PASSWORD
  const useTls = (process.env.EMAIL_USE_TLS ?? '').toLowerCase() === 'true'

  if (!host || !portRaw || !user || !pass) return null

  const port = Number(portRaw)
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = SMTPS, 587 = STARTTLS
    requireTLS: useTls && port !== 465,
    auth: { user, pass },
  })
  return cachedTransporter
}

export interface WelcomeEmailPayload {
  to: string
  name: string
  password: string
  role: 'user' | 'admin'
  categories: string[]
  tools: { name: string; url?: string | null }[]
  loginUrl?: string
}

function renderWelcomeEmail(p: WelcomeEmailPayload): { subject: string; text: string; html: string } {
  const appName = process.env.APP_NAME ?? 'Toolhub'
  const companyName = process.env.COMPANY_NAME ?? 'Zero Drag Automation'
  const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.EMAIL_HOST_USER ?? ''
  const loginUrl = p.loginUrl ?? process.env.APP_LOGIN_URL ?? ''
  const roleLabel = p.role === 'admin' ? 'Administrator' : 'User'
  const subject = `Your ${appName} account has been created`

  const categoryLine = p.categories.length
    ? p.categories.join(', ')
    : 'None assigned at this time'

  // Plain-text version — clean, no bullet glyphs that render poorly in some clients.
  const toolListText = p.tools.length
    ? p.tools
        .map((t, i) => (t.url ? `${i + 1}. ${t.name} (${t.url})` : `${i + 1}. ${t.name}`))
        .join('\n')
    : 'No tools have been assigned at this time.'

  const text = [
    `Dear ${p.name},`,
    '',
    `An account has been created for you on ${appName} with the role of ${roleLabel}.`,
    'Your sign-in credentials are provided below.',
    '',
    '— Account details —',
    `Login email : ${p.to}`,
    `Password    : ${p.password}`,
    loginUrl ? `Sign-in URL : ${loginUrl}` : '',
    '',
    '— Access granted —',
    `Categories  : ${categoryLine}`,
    '',
    'Tools available to you:',
    toolListText,
    '',
    'For security reasons, please sign in and change your password as soon as possible.',
    'Do not share these credentials with anyone.',
    '',
    supportEmail ? `If you have any questions, contact ${supportEmail}.` : '',
    '',
    'Regards,',
    `${companyName} Team`,
  ]
    .filter((line) => line !== '')
    .join('\n')

  const toolsHtml = p.tools.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;border-collapse:collapse;">
         ${p.tools
           .map(
             (t) => `
           <tr>
             <td style="padding:6px 0;border-bottom:1px solid #EFE7D7;font-size:14px;color:#3E2E1E;">
               <strong>${escapeHtml(t.name)}</strong>
               ${t.url ? `<div style="font-size:12px;color:#7A6951;margin-top:2px;"><a href="${encodeURI(t.url)}" style="color:#7A6951;text-decoration:none;">${escapeHtml(t.url)}</a></div>` : ''}
             </td>
           </tr>`,
           )
           .join('')}
       </table>`
    : '<p style="margin:0;color:#7A6951;font-size:14px;">No tools have been assigned at this time.</p>'

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F4EEE2;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#3E2E1E;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE2;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E6DCCB;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 16px;border-bottom:1px solid #EFE7D7;">
                <div style="font-size:12px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">${escapeHtml(companyName)}</div>
                <div style="font-size:20px;color:#3E2E1E;font-weight:700;margin-top:4px;">${escapeHtml(appName)} account created</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px;font-size:15px;line-height:1.55;color:#3E2E1E;">
                <p style="margin:0 0 12px;">Dear ${escapeHtml(p.name)},</p>
                <p style="margin:0 0 12px;">
                  An account has been created for you on <strong>${escapeHtml(appName)}</strong> with the role of
                  <strong>${roleLabel}</strong>. Your sign-in credentials are listed below.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6EF;border:1px solid #E6DCCB;border-radius:10px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <div style="font-size:11px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:4px;">Login email</div>
                      <div style="font-size:14px;color:#3E2E1E;font-weight:600;margin-bottom:14px;">${escapeHtml(p.to)}</div>
                      <div style="font-size:11px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:4px;">Password</div>
                      <div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:14px;font-weight:700;color:#3E2E1E;background:#FFFFFF;border:1px solid #E6DCCB;border-radius:6px;padding:8px 10px;display:inline-block;">${escapeHtml(p.password)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${
              loginUrl
                ? `<tr>
              <td align="center" style="padding:4px 32px 16px;">
                <a href="${encodeURI(loginUrl)}" style="display:inline-block;background:#B08D62;color:#FFFFFF;font-weight:600;font-size:14px;padding:11px 22px;border-radius:8px;text-decoration:none;">Sign in to ${escapeHtml(appName)}</a>
              </td>
            </tr>`
                : ''
            }
            <tr>
              <td style="padding:8px 32px 4px;">
                <div style="font-size:11px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:6px;">Assigned categories</div>
                <div style="font-size:14px;color:#3E2E1E;margin-bottom:18px;">${escapeHtml(categoryLine)}</div>
                <div style="font-size:11px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:8px;">Tools available to you</div>
                ${toolsHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 8px;">
                <div style="background:#FDF6EA;border:1px solid #F0E1BF;border-radius:8px;padding:12px 14px;font-size:13px;color:#6A5A36;line-height:1.5;">
                  <strong>Security notice:</strong> For your protection, please sign in and change your password as soon as possible. Do not share these credentials with anyone.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px;font-size:13px;color:#7A6951;line-height:1.55;">
                ${supportEmail ? `<p style="margin:0 0 10px;">If you have any questions, please contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#7A6951;">${escapeHtml(supportEmail)}</a>.</p>` : ''}
                <p style="margin:0;">Regards,<br /><strong style="color:#3E2E1E;">${escapeHtml(companyName)} Team</strong></p>
              </td>
            </tr>
          </table>
          <div style="max-width:600px;width:100%;padding:14px 24px 0;font-size:11px;color:#9C8A6F;text-align:center;line-height:1.5;">
            This message was sent to ${escapeHtml(p.to)} because an account was created for this address on ${escapeHtml(appName)}.<br />
            If you did not expect this email, please contact ${escapeHtml(supportEmail || 'your administrator')} immediately.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, text, html }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface AccessUpdateEmailPayload {
  to: string
  name: string
  role: 'user' | 'admin'
  categories: string[]
  tools: { name: string; url?: string | null }[]
  /** Short human phrase describing what changed, e.g. "Marketing category granted; 2 linked tools added". */
  changeSummary?: string
}

export interface StatusChangeEmailPayload {
  to: string
  name: string
  newStatus: 'active' | 'inactive' | 'pending'
}

export interface PasswordResetEmailPayload {
  to: string
  name: string
  password: string
}

export interface PasswordResetLinkEmailPayload {
  to: string
  name: string
  resetUrl: string
  /** Human phrase for the link lifetime, e.g. "1 hour". */
  expiresIn: string
}

function renderAccessUpdateEmail(p: AccessUpdateEmailPayload): { subject: string; text: string; html: string } {
  const appName = process.env.APP_NAME ?? 'Toolhub'
  const companyName = process.env.COMPANY_NAME ?? 'Zero Drag Automation'
  const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.EMAIL_HOST_USER ?? ''
  const loginUrl = process.env.APP_LOGIN_URL ?? ''
  const roleLabel = p.role === 'admin' ? 'Administrator' : 'User'
  const subject = `Your ${appName} access has been updated`

  const categoryLine = p.categories.length ? p.categories.join(', ') : 'None assigned at this time'

  const toolListText = p.tools.length
    ? p.tools.map((t, i) => (t.url ? `${i + 1}. ${t.name} (${t.url})` : `${i + 1}. ${t.name}`)).join('\n')
    : 'No tools available at this time.'

  const text = [
    `Dear ${p.name},`,
    '',
    `Your access on ${appName} has been updated. Here is your current access as a ${roleLabel}:`,
    '',
    p.changeSummary ? `Change summary: ${p.changeSummary}` : '',
    '',
    '— Access summary —',
    `Categories : ${categoryLine}`,
    '',
    'Tools available to you:',
    toolListText,
    '',
    loginUrl ? `Sign in: ${loginUrl}` : '',
    '',
    supportEmail ? `If you have any questions, contact ${supportEmail}.` : '',
    '',
    'Regards,',
    `${companyName} Team`,
  ].filter((line) => line !== '').join('\n')

  const toolsHtml = p.tools.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;border-collapse:collapse;">
         ${p.tools.map((t) => `
           <tr>
             <td style="padding:6px 0;border-bottom:1px solid #EFE7D7;font-size:14px;color:#3E2E1E;">
               <strong>${escapeHtml(t.name)}</strong>
               ${t.url ? `<div style="font-size:12px;color:#7A6951;margin-top:2px;"><a href="${encodeURI(t.url)}" style="color:#7A6951;text-decoration:none;">${escapeHtml(t.url)}</a></div>` : ''}
             </td>
           </tr>`).join('')}
       </table>`
    : '<p style="margin:0;color:#7A6951;font-size:14px;">No tools available at this time.</p>'

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#F4EEE2;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#3E2E1E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE2;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E6DCCB;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 32px 16px;border-bottom:1px solid #EFE7D7;">
          <div style="font-size:12px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">${escapeHtml(companyName)}</div>
          <div style="font-size:20px;color:#3E2E1E;font-weight:700;margin-top:4px;">${escapeHtml(appName)} access updated</div>
        </td></tr>
        <tr><td style="padding:24px 32px 8px;font-size:15px;line-height:1.55;color:#3E2E1E;">
          <p style="margin:0 0 12px;">Dear ${escapeHtml(p.name)},</p>
          <p style="margin:0 0 12px;">Your access on <strong>${escapeHtml(appName)}</strong> has been updated by your administrator. Your current role is <strong>${roleLabel}</strong>. Below is the latest summary of what you can access.</p>
          ${p.changeSummary ? `<p style="margin:0 0 12px;background:#FDF6EA;border:1px solid #F0E1BF;border-radius:8px;padding:10px 12px;font-size:13px;color:#6A5A36;"><strong>Change summary:</strong> ${escapeHtml(p.changeSummary)}</p>` : ''}
        </td></tr>
        <tr><td style="padding:0 32px 4px;">
          <div style="font-size:11px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:6px;">Assigned categories</div>
          <div style="font-size:14px;color:#3E2E1E;margin-bottom:18px;">${escapeHtml(categoryLine)}</div>
          <div style="font-size:11px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:8px;">Tools available to you</div>
          ${toolsHtml}
        </td></tr>
        ${loginUrl ? `<tr><td align="center" style="padding:20px 32px 8px;"><a href="${encodeURI(loginUrl)}" style="display:inline-block;background:#B08D62;color:#FFFFFF;font-weight:600;font-size:14px;padding:11px 22px;border-radius:8px;text-decoration:none;">Sign in to ${escapeHtml(appName)}</a></td></tr>` : ''}
        <tr><td style="padding:16px 32px 24px;font-size:13px;color:#7A6951;line-height:1.55;">
          ${supportEmail ? `<p style="margin:0 0 10px;">If you have any questions, please contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#7A6951;">${escapeHtml(supportEmail)}</a>.</p>` : ''}
          <p style="margin:0;">Regards,<br /><strong style="color:#3E2E1E;">${escapeHtml(companyName)} Team</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  return { subject, text, html }
}

function renderStatusChangeEmail(p: StatusChangeEmailPayload): { subject: string; text: string; html: string } {
  const appName = process.env.APP_NAME ?? 'Toolhub'
  const companyName = process.env.COMPANY_NAME ?? 'Zero Drag Automation'
  const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.EMAIL_HOST_USER ?? ''
  const loginUrl = process.env.APP_LOGIN_URL ?? ''
  const activated = p.newStatus === 'active'
  const subject = activated
    ? `Your ${appName} account has been reactivated`
    : `Your ${appName} account has been deactivated`

  const text = [
    `Dear ${p.name},`,
    '',
    activated
      ? `Your ${appName} account has been reactivated by your administrator and you may now sign in again.`
      : `Your ${appName} account has been deactivated by your administrator. You will not be able to sign in until it is reactivated.`,
    '',
    activated && loginUrl ? `Sign in: ${loginUrl}` : '',
    '',
    supportEmail ? `If you believe this is a mistake, please contact ${supportEmail}.` : '',
    '',
    'Regards,',
    `${companyName} Team`,
  ].filter((line) => line !== '').join('\n')

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#F4EEE2;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#3E2E1E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE2;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E6DCCB;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 32px 16px;border-bottom:1px solid #EFE7D7;">
          <div style="font-size:12px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">${escapeHtml(companyName)}</div>
          <div style="font-size:20px;color:#3E2E1E;font-weight:700;margin-top:4px;">${escapeHtml(subject)}</div>
        </td></tr>
        <tr><td style="padding:24px 32px 8px;font-size:15px;line-height:1.55;color:#3E2E1E;">
          <p style="margin:0 0 12px;">Dear ${escapeHtml(p.name)},</p>
          <p style="margin:0 0 12px;">${activated
            ? `Your <strong>${escapeHtml(appName)}</strong> account has been <strong>reactivated</strong> by your administrator. You may now sign in again using your existing credentials.`
            : `Your <strong>${escapeHtml(appName)}</strong> account has been <strong>deactivated</strong> by your administrator. You will not be able to sign in until the account is reactivated.`}</p>
        </td></tr>
        ${activated && loginUrl ? `<tr><td align="center" style="padding:8px 32px 16px;"><a href="${encodeURI(loginUrl)}" style="display:inline-block;background:#B08D62;color:#FFFFFF;font-weight:600;font-size:14px;padding:11px 22px;border-radius:8px;text-decoration:none;">Sign in to ${escapeHtml(appName)}</a></td></tr>` : ''}
        <tr><td style="padding:12px 32px 24px;font-size:13px;color:#7A6951;line-height:1.55;">
          ${supportEmail ? `<p style="margin:0 0 10px;">If you believe this is a mistake, please contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#7A6951;">${escapeHtml(supportEmail)}</a>.</p>` : ''}
          <p style="margin:0;">Regards,<br /><strong style="color:#3E2E1E;">${escapeHtml(companyName)} Team</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  return { subject, text, html }
}

function renderPasswordResetEmail(p: PasswordResetEmailPayload): { subject: string; text: string; html: string } {
  const appName = process.env.APP_NAME ?? 'Toolhub'
  const companyName = process.env.COMPANY_NAME ?? 'Zero Drag Automation'
  const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.EMAIL_HOST_USER ?? ''
  const loginUrl = process.env.APP_LOGIN_URL ?? ''
  const subject = `Your ${appName} password has been reset`

  const text = [
    `Dear ${p.name},`,
    '',
    `Your ${appName} password has been reset by your administrator. Please use the new password below to sign in.`,
    '',
    '— New credentials —',
    `Login email : ${p.to}`,
    `Password    : ${p.password}`,
    loginUrl ? `Sign-in URL : ${loginUrl}` : '',
    '',
    'For security reasons, please sign in and change this password as soon as possible. Do not share these credentials with anyone.',
    '',
    supportEmail ? `If you did not request this reset, please contact ${supportEmail} immediately.` : '',
    '',
    'Regards,',
    `${companyName} Team`,
  ].filter((line) => line !== '').join('\n')

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#F4EEE2;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#3E2E1E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE2;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E6DCCB;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 32px 16px;border-bottom:1px solid #EFE7D7;">
          <div style="font-size:12px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">${escapeHtml(companyName)}</div>
          <div style="font-size:20px;color:#3E2E1E;font-weight:700;margin-top:4px;">${escapeHtml(appName)} password reset</div>
        </td></tr>
        <tr><td style="padding:24px 32px 8px;font-size:15px;line-height:1.55;color:#3E2E1E;">
          <p style="margin:0 0 12px;">Dear ${escapeHtml(p.name)},</p>
          <p style="margin:0 0 12px;">Your <strong>${escapeHtml(appName)}</strong> password has been reset by your administrator. Please use the new credentials below to sign in.</p>
        </td></tr>
        <tr><td style="padding:0 32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6EF;border:1px solid #E6DCCB;border-radius:10px;">
            <tr><td style="padding:16px 18px;">
              <div style="font-size:11px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:4px;">Login email</div>
              <div style="font-size:14px;color:#3E2E1E;font-weight:600;margin-bottom:14px;">${escapeHtml(p.to)}</div>
              <div style="font-size:11px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:4px;">New password</div>
              <div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:14px;font-weight:700;color:#3E2E1E;background:#FFFFFF;border:1px solid #E6DCCB;border-radius:6px;padding:8px 10px;display:inline-block;">${escapeHtml(p.password)}</div>
            </td></tr>
          </table>
        </td></tr>
        ${loginUrl ? `<tr><td align="center" style="padding:4px 32px 16px;"><a href="${encodeURI(loginUrl)}" style="display:inline-block;background:#B08D62;color:#FFFFFF;font-weight:600;font-size:14px;padding:11px 22px;border-radius:8px;text-decoration:none;">Sign in to ${escapeHtml(appName)}</a></td></tr>` : ''}
        <tr><td style="padding:8px 32px 4px;">
          <div style="background:#FDF6EA;border:1px solid #F0E1BF;border-radius:8px;padding:12px 14px;font-size:13px;color:#6A5A36;line-height:1.5;">
            <strong>Security notice:</strong> Please sign in and change this password as soon as possible. Do not share these credentials with anyone.
          </div>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;font-size:13px;color:#7A6951;line-height:1.55;">
          ${supportEmail ? `<p style="margin:0 0 10px;">If you did not request this reset, please contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#7A6951;">${escapeHtml(supportEmail)}</a> immediately.</p>` : ''}
          <p style="margin:0;">Regards,<br /><strong style="color:#3E2E1E;">${escapeHtml(companyName)} Team</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  return { subject, text, html }
}

function renderPasswordResetLinkEmail(p: PasswordResetLinkEmailPayload): { subject: string; text: string; html: string } {
  const appName = process.env.APP_NAME ?? 'Toolhub'
  const companyName = process.env.COMPANY_NAME ?? 'Zero Drag Automation'
  const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.EMAIL_HOST_USER ?? ''
  const subject = `Reset your ${appName} password`

  const text = [
    `Dear ${p.name},`,
    '',
    `We received a request to reset your ${appName} password.`,
    `Open the link below to choose a new password. This link expires in ${p.expiresIn} and can only be used once.`,
    '',
    p.resetUrl,
    '',
    'If you did not request this, you can safely ignore this email — your password will not change.',
    '',
    supportEmail ? `Questions? Contact ${supportEmail}.` : '',
    '',
    'Regards,',
    `${companyName} Team`,
  ].filter((line) => line !== '').join('\n')

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#F4EEE2;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#3E2E1E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE2;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E6DCCB;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 32px 16px;border-bottom:1px solid #EFE7D7;">
          <div style="font-size:12px;color:#7A6951;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">${escapeHtml(companyName)}</div>
          <div style="font-size:20px;color:#3E2E1E;font-weight:700;margin-top:4px;">Reset your ${escapeHtml(appName)} password</div>
        </td></tr>
        <tr><td style="padding:24px 32px 8px;font-size:15px;line-height:1.55;color:#3E2E1E;">
          <p style="margin:0 0 12px;">Dear ${escapeHtml(p.name)},</p>
          <p style="margin:0 0 12px;">We received a request to reset your <strong>${escapeHtml(appName)}</strong> password. Click the button below to choose a new one.</p>
        </td></tr>
        <tr><td align="center" style="padding:8px 32px 20px;">
          <a href="${encodeURI(p.resetUrl)}" style="display:inline-block;background:#B08D62;color:#FFFFFF;font-weight:600;font-size:15px;padding:13px 26px;border-radius:8px;text-decoration:none;">Choose a new password</a>
        </td></tr>
        <tr><td style="padding:0 32px 8px;font-size:13px;color:#7A6951;line-height:1.55;">
          <p style="margin:0 0 10px;">Or paste this link into your browser:</p>
          <p style="margin:0 0 12px;word-break:break-all;"><a href="${encodeURI(p.resetUrl)}" style="color:#7A6951;">${escapeHtml(p.resetUrl)}</a></p>
        </td></tr>
        <tr><td style="padding:0 32px 4px;">
          <div style="background:#FDF6EA;border:1px solid #F0E1BF;border-radius:8px;padding:12px 14px;font-size:13px;color:#6A5A36;line-height:1.5;">
            This link expires in <strong>${escapeHtml(p.expiresIn)}</strong> and can only be used once. If you did not request a reset, ignore this email — your password will not change.
          </div>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;font-size:13px;color:#7A6951;line-height:1.55;">
          ${supportEmail ? `<p style="margin:0 0 10px;">Questions? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#7A6951;">${escapeHtml(supportEmail)}</a>.</p>` : ''}
          <p style="margin:0;">Regards,<br /><strong style="color:#3E2E1E;">${escapeHtml(companyName)} Team</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  return { subject, text, html }
}

async function trySend(
  to: string,
  subject: string,
  text: string,
  html: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const transporter = getTransporter()
  if (!transporter) {
    const message = 'SMTP is not configured (EMAIL_HOST / EMAIL_PORT / EMAIL_HOST_USER / EMAIL_HOST_PASSWORD).'
    console.error('[email] skipped:', message)
    return { ok: false, message }
  }
  const from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER!
  console.log(`[email] sending "${subject}" to ${to} (from=${from}, host=${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT})`)
  try {
    const info = await transporter.sendMail({ from, to, subject, text, html })
    console.log(`[email] sent to ${to}:`, info.messageId, info.response)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown SMTP error'
    console.error(`[email] failed to send to ${to}:`, message)
    return { ok: false, message }
  }
}

export async function sendAccessUpdateEmail(
  payload: AccessUpdateEmailPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { subject, text, html } = renderAccessUpdateEmail(payload)
  return trySend(payload.to, subject, text, html)
}

export async function sendStatusChangeEmail(
  payload: StatusChangeEmailPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { subject, text, html } = renderStatusChangeEmail(payload)
  return trySend(payload.to, subject, text, html)
}

export async function sendPasswordResetEmail(
  payload: PasswordResetEmailPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { subject, text, html } = renderPasswordResetEmail(payload)
  return trySend(payload.to, subject, text, html)
}

export async function sendPasswordResetLinkEmail(
  payload: PasswordResetLinkEmailPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { subject, text, html } = renderPasswordResetLinkEmail(payload)
  return trySend(payload.to, subject, text, html)
}

export async function sendWelcomeEmail(
  payload: WelcomeEmailPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { subject, text, html } = renderWelcomeEmail(payload)
  return trySend(payload.to, subject, text, html)
}
