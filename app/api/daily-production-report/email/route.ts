import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ExportDataRow } from '@/components/daily-production-report/types';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, reportData } = body;

    if (!date || !reportData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: date, reportData' },
        { status: 400 }
      );
    }

    // Format the date for display
    const reportDate = new Date(date);
    const formattedDate = reportDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate HTML email content
    const htmlContent = generateEmailHTML(reportData, formattedDate);

    // Send email using the configured email service
    try {
      await sendEmail({
        to: process.env.EMAIL_TO_ADDRESS || 'recipient@example.com',
        subject: `Daily Production Report - ${formattedDate}`,
        html: htmlContent
      });

      return NextResponse.json({
        success: true,
        message: 'Daily production report sent successfully'
      });

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in email API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate HTML email content
function generateEmailHTML(reportData: ExportDataRow[], date: string): string {
  const rows = reportData.map(row => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row['LINE'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row['P/COD'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${row['BUYER'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row['ART/NO'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['OR/QTY'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${row['ITEM'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['DAILY TARGET'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['DAILY PRODUCTION'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['UNIT PRICE'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['TOTAL PRICE'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row['%'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['% Dollar'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row['Taka'] || ''}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${row['Remarks'] || ''}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Daily Production Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .title { color: #2c3e50; margin: 0; font-size: 24px; }
        .date { color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 12px; }
        th { background-color: #34495e; color: white; padding: 12px 8px; text-align: center; font-weight: bold; }
        .total-row { background-color: #ecf0f1; font-weight: bold; }
        .footer { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center; color: #7f8c8d; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">📊 Daily Production Report</h1>
        <p class="date">📅 ${date}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>LINE</th>
            <th>P/COD</th>
            <th>BUYER</th>
            <th>ART/NO</th>
            <th>OR/QTY</th>
            <th>ITEM</th>
            <th>DAILY TARGET</th>
            <th>DAILY PRODUCTION</th>
            <th>UNIT PRICE</th>
            <th>TOTAL PRICE</th>
            <th>%</th>
            <th>% DOLLAR</th>
            <th>TAKA</th>
            <th>REMARKS</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Generated by Production Management System</p>
        <p>This report shows production targets calculated using actual production hours from your target system</p>
      </div>
    </body>
    </html>
  `;
}

// Email sending function
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  // For now, we'll use a simple console log to simulate email sending
  // In production, you would integrate with your email service (Gmail, SendGrid, etc.)
  
  // TODO: Integrate with actual email service
  // Example with Gmail:
  /*
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_FROM_ADDRESS,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM_ADDRESS,
    to: to,
    subject: subject,
    html: html
  });
  */
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
}
