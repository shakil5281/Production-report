# 📧 Email Setup Guide for Daily Production Reports

## 🚨 Important: Gmail Security Update

Gmail has updated its security requirements. Follow these steps carefully to set up email functionality.

## 📋 Step-by-Step Setup

### 1. 🔐 Enable 2-Factor Authentication on Gmail Account

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **Security** in the left menu
3. Under **Signing in to Google**, click **2-Step Verification**
4. Follow the setup process to enable 2FA (required for app passwords)

### 2. 🗝️ Generate App Password

1. Still in **Security** settings
2. Click **2-Step Verification** 
3. Scroll down to **App passwords**
4. Click **App passwords**
5. Select **Mail** from the dropdown
6. Select **Other (Custom name)** and type: "Production Report System"
7. Click **Generate**
8. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### 3. 📝 Update Environment Variables

Create or update your `.env` file in the project root:

```bash
# Add this to your .env file
EMAIL_APP_PASSWORD="abcd efgh ijkl mnop"
```

**⚠️ Important:** 
- Remove all spaces from the app password
- Don't use your regular Gmail password
- Keep this password secure

### 4. 🔄 Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
yarn dev
```

## 🐛 Troubleshooting

### Error: "Username and Password not accepted"

**Causes:**
1. ❌ App password not generated
2. ❌ 2FA not enabled
3. ❌ Wrong app password copied
4. ❌ Spaces in the app password

**Solutions:**
1. ✅ Complete steps 1-2 above
2. ✅ Double-check the app password
3. ✅ Remove all spaces from the password
4. ✅ Try generating a new app password

### Error: "Less secure app access"

**Solution:** 
- ✅ Use App Password (not regular password)
- ✅ This error means you're using your regular password instead of app password

### Error: "SMTP connection failed"

**Solutions:**
1. ✅ Check internet connection
2. ✅ Verify Gmail account is accessible
3. ✅ Try restarting the development server

## ✅ Testing

After setup:
1. Go to Daily Production Report page
2. Select a date with data
3. Click **Send Email** button
4. Check console for detailed logs
5. Check `shakilhossen3001@gmail.com` for the email

## 📧 Email Configuration Details

**From:** shakilhossen307@gmail.com
**To:** shakilhossen3001@gmail.com
**SMTP:** smtp.gmail.com:587
**Security:** TLS

## 🆘 Still Having Issues?

1. **Verify 2FA is enabled** on shakilhossen307@gmail.com
2. **Generate a new app password** and update .env file
3. **Check the console logs** for detailed error messages
4. **Ensure EMAIL_APP_PASSWORD is set** in environment variables

## 📱 Alternative: Using Different Email Service

If Gmail continues to cause issues, you can modify the email configuration to use:
- **Outlook/Hotmail**
- **Yahoo Mail** 
- **Custom SMTP server**

Contact for assistance if needed!
