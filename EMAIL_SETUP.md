# Email Configuration Setup

The Survey Management System requires email configuration to send consent request emails to employees. Follow these steps to set up email functionality.

## Quick Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your email configuration (see options below)

3. **Restart the server** to load the new configuration

## Email Configuration Options

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Update your `.env` file:**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   EMAIL_FROM=Survey Management System <your-email@gmail.com>
   ```

### Option 2: Outlook/Hotmail

```env
EMAIL_SERVICE=hotmail
EMAIL_USERNAME=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Survey Management System <your-email@outlook.com>
```

### Option 3: Custom SMTP Server (Example: Paisalo)

```env
EMAIL_HOST=email.paisalo.in
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USERNAME=noreply1@paisalo.in
EMAIL_PASSWORD=your-password
EMAIL_FROM=Survey Management System <noreply1@paisalo.in>
```

**Note:** For Paisalo SMTP server:
- Use **port 465** with **SSL enabled** (`EMAIL_SECURE=true`)
- This corresponds to `SecureSocketOptions.SslOnConnect` in C# code
- The server requires implicit SSL connection

## Testing Email Configuration

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Create a survey** with target employees

3. **Click "Send Consent Emails"** in the Consent Management page

4. **Check the server logs** for any email-related errors

## Troubleshooting

### Error: `connect ECONNREFUSED ::1:587`
- **Cause:** No email configuration found
- **Solution:** Create a `.env` file with proper email settings

### Error: `Invalid login`
- **Cause:** Wrong username/password or 2FA not configured
- **Solution:** 
  - For Gmail: Use App Password instead of regular password
  - For Outlook: Ensure account allows SMTP access
  - Check username/password are correct

### Error: `self signed certificate`
- **Cause:** SSL certificate issues
- **Solution:** Add `EMAIL_SECURE=false` to your `.env` file

### Emails not being received
- **Check spam folder**
- **Verify recipient email addresses**
- **Check server logs** for sending confirmation
- **Test with a different email service**

## Development vs Production

### Development
- Use Gmail with App Password (easiest setup)
- Use your personal email for testing

### Production
- Use a dedicated email service (SendGrid, AWS SES, etc.)
- Use a professional email address
- Consider email delivery monitoring

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EMAIL_SERVICE` | Yes* | Email service provider | `gmail`, `hotmail`, `yahoo` |
| `EMAIL_HOST` | Yes* | SMTP server hostname | `smtp.gmail.com` |
| `EMAIL_PORT` | No | SMTP port | `587` (default) |
| `EMAIL_SECURE` | No | Use SSL/TLS | `false` (default) |
| `EMAIL_USERNAME` | Yes | Email username | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | Yes | Email password/app password | `your-app-password` |
| `EMAIL_FROM` | No | From address with name | `Survey System <email@domain.com>` |
| `FRONTEND_URL` | Yes | Frontend URL for email links | `http://localhost:3000` |

*Either `EMAIL_SERVICE` or `EMAIL_HOST` is required

## Security Notes

- **Never commit your `.env` file** to version control
- **Use App Passwords** for Gmail (more secure than regular passwords)
- **Use environment-specific configurations** for different deployments
- **Consider using email services** like SendGrid for production
