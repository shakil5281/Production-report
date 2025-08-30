import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email-service';
import { ComprehensiveTargetData, SummaryData } from '@/components/target/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportData, timeSlotHeaders, summary, recipientEmail, date } = body;

    if (!reportData || !timeSlotHeaders || !summary || !recipientEmail || !date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Generate HTML content for the email
    const htmlContent = generateEmailHTML(reportData, timeSlotHeaders, summary, date);

    // Create email service instance and send email
    const emailService = new EmailService();
    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: `Comprehensive Target Report - ${date}`,
      html: htmlContent
    });

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: result.messageId 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to send email' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending comprehensive target report email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send email' 
    }, { status: 500 });
  }
}

// Generate HTML content for the comprehensive target report email
function generateEmailHTML(
  reportData: any[], 
  timeSlotHeaders: string[], 
  summary: SummaryData, 
  date: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comprehensive Target Report - ${date}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .email-container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .date { margin-top: 10px; font-size: 18px; opacity: 0.9; }
        .content { padding: 30px; }
        .summary-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #333; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .summary-item { text-align: center; }
        .summary-label { font-size: 14px; color: #666; margin-bottom: 5px; }
        .summary-value { font-size: 24px; font-weight: bold; color: #333; }
        .table-section { margin-top: 30px; }
        .table-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #333; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .data-table th { background-color: #f8f9fa; font-weight: bold; color: #333; }
        .data-table tr:hover { background-color: #f5f5f5; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; }
        .footer-info { margin-top: 10px; font-size: 12px; }
        @media (max-width: 768px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🎯 Comprehensive Target Report</h1>
          <div class="date">📅 ${date}</div>
        </div>
        
        <div class="content">
          ${summary ? `
          <div class="summary-section">
            <div class="summary-title">📊 Report Summary</div>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Lines</div>
                <div class="summary-value">${summary.totalLines || 0}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Target</div>
                <div class="summary-value">${(summary.totalTarget || 0).toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Production</div>
                <div class="summary-value">${(summary.totalProduction || 0).toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Avg Production/Hour</div>
                <div class="summary-value">${(summary.averageProductionPerHour || 0).toFixed(1)}</div>
              </div>
            </div>
          </div>
          ` : ''}
          
          <div class="table-section">
            <div class="table-title">📋 Target Details</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>LINE</th>
                  <th>STYLE</th>
                  <th>TARGET</th>
                  <th>PRODUCTION</th>
                  <th>EFFICIENCY</th>
                  <th>IN TIME</th>
                  <th>OUT TIME</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.map((row: any) => `
                  <tr>
                    <td>${row.lineNo || ''}</td>
                    <td>${row.styleNo || ''}</td>
                    <td>${row.lineTarget ? row.lineTarget.toLocaleString() : ''}</td>
                    <td>${row.production || 0}</td>
                    <td>${row.efficiency ? row.efficiency.toFixed(1) + '%' : '0%'}</td>
                    <td>${row.inTime || ''}</td>
                    <td>${row.outTime || ''}</td>
                    <td>${row.remarks || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="footer">
          <div>🏭 Production Management System</div>
          <div class="footer-info">
            Generated on ${new Date().toLocaleString()} | Automated Target Report
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}


