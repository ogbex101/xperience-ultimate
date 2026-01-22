const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  async init() {
    if (process.env.SMTP_ENABLED === 'true') {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        // Verify connection
        await this.transporter.verify();
        console.log('✅ Email service connected successfully');
      } catch (error) {
        console.error('❌ Email service connection failed:', error.message);
        console.log('⚠️ Email notifications will be logged but not sent');
      }
    } else {
      console.log('⚠️ Email service disabled (SMTP_ENABLED=false)');
    }
  }

  async sendEmail(to, subject, html, text = '') {
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Xperience Platform'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    try {
      if (this.transporter) {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('📧 Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
      } else {
        // Log email instead of sending
        console.log('📧 Email would be sent (simulation):', { to, subject });
        return { success: true, simulated: true };
      }
    } catch (error) {
      console.error('❌ Email send error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendToUsers(userEmails, subject, message) {
    const results = [];
    const emails = Array.isArray(userEmails) ? userEmails : [userEmails];
    
    for (const email of emails) {
      const result = await this.sendEmail(
        email,
        subject,
        `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 20px; color: #333; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Xperience Platform</h1>
              <p>Gaming & Tournament System</p>
            </div>
            <div class="content">
              <h2>${subject}</h2>
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Xperience Platform.</p>
              <p>© ${new Date().getFullYear()} Xperience Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        `,
        `Xperience Platform Notification:\n\n${subject}\n\n${message}\n\nThis is an automated message.`
      );
      
      results.push({ email, success: result.success });
    }
    
    return results;
  }
}

module.exports = new EmailService();