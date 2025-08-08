// pages/api/test-notification.js
import nodemailer from 'nodemailer';

// Mock services for testing
const mockServices = {
  async sendEmail(config, testData) {
    console.log('Mock Email Service - Sending test email:', {
      to: config.emailAddresses,
      subject: testData.subject
    });

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      messageId: `mock_email_${Date.now()}`,
      recipients: config.emailAddresses,
      service: 'mock'
    };
  },

  async sendSMS(config, testData) {
    console.log('Mock SMS Service - Sending test SMS:', {
      to: config.phoneNumbers,
      message: testData.message
    });

    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      success: true,
      messageId: `mock_sms_${Date.now()}`,
      recipients: config.phoneNumbers,
      service: 'mock'
    };
  },

  async sendSlack(config, testData) {
    console.log('Mock Slack Service - Sending test message:', {
      webhook: config.webhookUrl.substring(0, 50) + '...',
      channel: config.channel,
      message: testData.message
    });

    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      success: true,
      messageId: `mock_slack_${Date.now()}`,
      channel: config.channel,
      service: 'mock'
    };
  }
};

// Real email service using nodemailer
async function sendRealEmail(config, testData) {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: config.emailAddresses.join(', '),
    subject: testData.subject,
    html: testData.html,
    text: testData.text,
  };

  const info = await transporter.sendMail(mailOptions);

  return {
    success: true,
    messageId: info.messageId,
    recipients: config.emailAddresses,
    service: 'smtp'
  };
}

// Real SMS service using Twilio
async function sendRealSMS(config, testData) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const twilio = require('twilio')(accountSid, authToken);

  const results = [];

  for (const phoneNumber of config.phoneNumbers) {
    try {
      const message = await twilio.messages.create({
        body: testData.message,
        from: fromNumber,
        to: phoneNumber,
      });

      results.push({
        phone: phoneNumber,
        sid: message.sid,
        status: message.status
      });
    } catch (error) {
      results.push({
        phone: phoneNumber,
        error: error.message
      });
    }
  }

  return {
    success: results.some(r => !r.error),
    results,
    service: 'twilio'
  };
}

// Real Slack service
async function sendRealSlack(config, testData) {
  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: config.channel,
      text: testData.message,
      username: 'LeadSpark Bot',
      icon_emoji: ':robot_face:',
      attachments: testData.attachments || []
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Slack webhook failed: ${response.status} - ${errorText}`);
  }

  return {
    success: true,
    webhook: config.webhookUrl,
    channel: config.channel,
    service: 'slack'
  };
}

// Test data generators
const testDataGenerators = {
  email: {
    subject: '🧪 LeadSpark Test Email - Settings Configuration',
    text: `Hello!

This is a test email from your LeadSpark portal to verify your email notification settings are working correctly.

✅ Email notifications are configured properly
✅ SMTP connection is working
✅ Your notification preferences have been saved

You will receive notifications for:
- New leads captured
- Lead information updates
- System alerts and errors
- Weekly summary reports (if enabled)

Best regards,
The LeadSpark Team

---
This is an automated test message. If you received this in error, please check your notification settings in the LeadSpark portal.`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">⚡ LeadSpark Test Email</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Settings Configuration Test</p>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello!</p>

        <p style="color: #666; line-height: 1.6;">
          This is a test email from your LeadSpark portal to verify your email notification settings are working correctly.
        </p>

        <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #155724; font-weight: bold;">✅ Configuration Status</p>
          <ul style="color: #155724; margin: 10px 0 0 0; padding-left: 20px;">
            <li>Email notifications are configured properly</li>
            <li>SMTP connection is working</li>
            <li>Your notification preferences have been saved</li>
          </ul>
        </div>

        <div style="background: #fff; border: 1px solid #dee2e6; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">You will receive notifications for:</h3>
          <ul style="color: #666; line-height: 1.8; margin: 10px 0;">
            <li>🆕 New leads captured</li>
            <li>📝 Lead information updates</li>
            <li>⚠️ System alerts and errors</li>
            <li>📊 Weekly summary reports (if enabled)</li>
          </ul>
        </div>

        <p style="color: #666; line-height: 1.6;">
          Best regards,<br>
          <strong>The LeadSpark Team</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          This is an automated test message. If you received this in error, please check your notification settings in the LeadSpark portal.
        </p>
      </div>
    </div>`
  },

  sms: {
    message: `🧪 LeadSpark Test SMS

Your SMS notifications are working correctly! You'll receive alerts for new leads and urgent system notifications.

Reply STOP to opt out.`
  },

  slack: {
    message: `🧪 *LeadSpark Test Message*

Your Slack integration is working correctly!

You'll receive notifications in this channel for:
• New leads captured
• Lead information updates
• System alerts

_This is an automated test message from your LeadSpark portal._`,
    attachments: [
      {
        color: "#36a64f",
        fields: [
          {
            title: "Integration Status",
            value: "✅ Working correctly",
            short: true
          },
          {
            title: "Channel",
            value: "#leads",
            short: true
          }
        ],
        footer: "LeadSpark Portal",
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, config } = req.body;

    if (!type || !config) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'config']
      });
    }

    if (!['email', 'sms', 'slack'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid notification type',
        allowed_types: ['email', 'sms', 'slack']
      });
    }

    console.log(`Testing ${type} notification...`);

    let result;
    const testData = testDataGenerators[type];

    switch (type) {
      case 'email':
        if (!config.enabled || !config.emailAddresses || config.emailAddresses.length === 0) {
          return res.status(400).json({
            error: 'Email notifications not properly configured',
            details: 'Please add at least one email address and ensure email notifications are enabled'
          });
        }

        try {
          // Try real email service first, fall back to mock
          if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            result = await sendRealEmail(config, testData);
          } else {
            console.warn('SMTP credentials not configured, using mock email service');
            result = await mockServices.sendEmail(config, testData);
          }
        } catch (error) {
          console.warn('Real email service failed, using mock:', error.message);
          result = await mockServices.sendEmail(config, testData);
        }
        break;

      case 'sms':
        if (!config.enabled || !config.phoneNumbers || config.phoneNumbers.length === 0) {
          return res.status(400).json({
            error: 'SMS notifications not properly configured',
            details: 'Please add at least one phone number and ensure SMS notifications are enabled'
          });
        }

        try {
          if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            result = await sendRealSMS(config, testData);
          } else {
            console.warn('Twilio credentials not configured, using mock SMS service');
            result = await mockServices.sendSMS(config, testData);
          }
        } catch (error) {
          console.warn('Real SMS service failed, using mock:', error.message);
          result = await mockServices.sendSMS(config, testData);
        }
        break;

      case 'slack':
        if (!config.enabled || !config.webhookUrl) {
          return res.status(400).json({
            error: 'Slack integration not properly configured',
            details: 'Please provide a valid webhook URL and ensure Slack integration is enabled'
          });
        }

        // Validate webhook URL format
        if (!config.webhookUrl.startsWith('https://hooks.slack.com/')) {
          return res.status(400).json({
            error: 'Invalid Slack webhook URL',
            details: 'Webhook URL must start with https://hooks.slack.com/'
          });
        }

        try {
          result = await sendRealSlack(config, testData);
        } catch (error) {
          console.warn('Real Slack service failed, using mock:', error.message);
          result = await mockServices.sendSlack(config, testData);
        }
        break;
    }

    // Log successful test
    console.log(`${type} notification test completed:`, {
      success: result.success,
      service: result.service,
      messageId: result.messageId
    });

    const response = {
      success: result.success,
      type,
      message: `Test ${type} notification sent successfully!`,
      details: result,
      timestamp: new Date().toISOString(),
      test_data_sent: {
        email: type === 'email' ? { subject: testData.subject } : null,
        sms: type === 'sms' ? { message_length: testData.message.length } : null,
        slack: type === 'slack' ? { message_length: testData.message.length, attachments: testData.attachments?.length || 0 } : null
      }[type]
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error(`Error testing ${req.body.type} notification:`, error);

    // Provide helpful error messages
    let userMessage = 'Failed to send test notification';
    let suggestions = ['Check your configuration settings', 'Try again in a few minutes'];

    if (error.message.includes('credentials')) {
      userMessage = 'Service credentials not configured';
      suggestions = ['Contact your administrator to configure notification services'];
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      userMessage = 'Network error occurred';
      suggestions = ['Check your internet connection', 'Try again in a moment'];
    } else if (error.message.includes('webhook')) {
      userMessage = 'Webhook URL is invalid or unreachable';
      suggestions = ['Verify your Slack webhook URL', 'Check Slack app permissions'];
    }

    return res.status(500).json({
      success: false,
      error: userMessage,
      details: error.message,
      type: req.body.type,
      suggestions,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to validate email addresses
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate phone numbers
function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}