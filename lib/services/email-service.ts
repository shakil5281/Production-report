import nodemailer from 'nodemailer';
import { format } from 'date-fns';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromAddress: string;
}

export interface EmailOptions {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor(config?: Partial<EmailConfig>) {
    // Use provided config or fall back to environment variables
    this.config = {
      host: config?.host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: config?.port || parseInt(process.env.SMTP_PORT || '587'),
      secure: config?.secure || (process.env.SMTP_SECURE === 'true'),
      user: config?.user || process.env.EMAIL_FROM_ADDRESS || 'shakilhossen3001@gmail.com',
      pass: config?.pass || process.env.EMAIL_APP_PASSWORD || '',
      fromName: config?.fromName || process.env.EMAIL_FROM_NAME || 'Production Management System',
      fromAddress: config?.fromAddress || process.env.EMAIL_FROM_ADDRESS || 'shakilhossen3001@gmail.com',
    };

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Verify email configuration
   */
  async verifyConfig(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email configuration verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email configuration verification failed:', error);
      return false;
    }
  }

  /**
   * Send email with the given options
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Verify configuration first
      const isConfigValid = await this.verifyConfig();
      if (!isConfigValid) {
        return {
          success: false,
          error: 'Email configuration is invalid'
        };
      }

      const mailOptions = {
        from: {
          name: this.config.fromName,
          address: this.config.fromAddress
        },
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error sending email:', error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Send comprehensive target report email
   */
  async sendTargetReportEmail(data: {
    date: string;
    reportData: any[];
    summary: any;
    timeSlotHeaders: string[];
    timeSlotTotals: Record<string, number>;
    emailOptions?: Partial<EmailOptions>;
  }): Promise<EmailResult> {
    const { date, reportData, summary, timeSlotHeaders, timeSlotTotals, emailOptions } = data;

    // Generate email content
    const dateString = format(new Date(date), 'dd/MM/yyyy');
    const subject = emailOptions?.subject || `Comprehensive Target Report (${dateString})`;
    
    const htmlContent = this.generateTargetReportEmailHTML(
      dateString,
      reportData,
      summary,
      timeSlotHeaders,
      timeSlotTotals
    );

    // Use default email settings if not provided
    const to = emailOptions?.to || process.env.TARGET_REPORT_EMAIL_TO || this.config.fromAddress;
    const cc = emailOptions?.cc;
    const bcc = emailOptions?.bcc;

    return this.sendEmail({
      to,
      cc,
      bcc,
      subject,
      html: htmlContent
    });
  }

  /**
   * Send daily production report email
   */
  async sendProductionReportEmail(data: {
    date: string;
    reportData: any[];
    summary: any;
    emailOptions?: Partial<EmailOptions>;
  }): Promise<EmailResult> {
    const { date, reportData, summary, emailOptions } = data;

    const dateString = format(new Date(date), 'dd/MM/yyyy');
    const subject = emailOptions?.subject || `Daily Production Report (${dateString})`;
    
    const htmlContent = this.generateProductionReportEmailHTML(dateString, reportData, summary);

    const to = emailOptions?.to || process.env.EMAIL_TO_ADDRESS || this.config.fromAddress;
    const cc = emailOptions?.cc;
    const bcc = emailOptions?.bcc;

    return this.sendEmail({
      to,
      cc,
      bcc,
      subject,
      html: htmlContent
    });
  }

  /**
   * Generate HTML content for target report emails
   */
  private generateTargetReportEmailHTML(
    dateString: string,
    reportData: any[],
    summary: any,
    timeSlotHeaders: string[],
    timeSlotTotals: Record<string, number>
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comprehensive Target Report</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header .date {
            font-size: 18px;
            margin-top: 10px;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .summary-section {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            border-left: 4px solid #28a745;
          }
          .summary-title {
            font-size: 20px;
            font-weight: bold;
            color: #495057;
            margin-bottom: 15px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          .summary-item {
            background-color: white;
            padding: 15px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
          }
          .summary-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #495057;
            margin-top: 5px;
          }
          .table-section {
            margin-top: 30px;
          }
          .table-title {
            font-size: 20px;
            font-weight: bold;
            color: #495057;
            margin-bottom: 15px;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 11px;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .data-table th {
            background-color: #495057;
            color: white;
            padding: 10px 6px;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            border-bottom: 2px solid #343a40;
          }
          .data-table td {
            padding: 8px 6px;
            border-bottom: 1px solid #dee2e6;
            text-align: center;
          }
          .data-table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .data-table tr:hover {
            background-color: #e3f2fd;
          }
          .total-row {
            background-color: #fff3cd !important;
            font-weight: bold;
            border-top: 2px solid #ffc107;
          }
          .total-row td {
            border-bottom: 2px solid #ffc107;
          }
          .line-cell { color: #007bff; font-weight: bold; }
          .style-cell { color: #28a745; font-weight: bold; }
          .buyer-cell { text-align: left; font-weight: 600; }
          .target-cell { color: #28a745; background-color: #d4edda; }
          .production-cell { color: #dc3545; background-color: #f8d7da; }
          .hours-cell { color: #6f42c1; background-color: #e2e3e5; }
          .efficiency-cell { color: #007bff; background-color: #cce7ff; }
          .time-slot-header { 
            background-color: #17a2b8 !important; 
            color: white; 
            font-weight: bold; 
          }
          .time-slot-cell { 
            background-color: #e3f2fd; 
            color: #0c5460; 
            font-weight: 600; 
          }
          .footer {
            background-color: #495057;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 14px;
          }
          .footer-info {
            opacity: 0.8;
            margin-top: 10px;
          }
          @media (max-width: 768px) {
            .summary-grid {
              grid-template-columns: 1fr;
            }
            .data-table {
              font-size: 9px;
            }
            .data-table th,
            .data-table td {
              padding: 4px 2px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎯 Comprehensive Target Report</h1>
            <div class="date">📅 ${dateString}</div>
          </div>
          
          <div class="content">
            <div class="summary-section">
              <div class="summary-title">📈 Target Report Summary</div>
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
                <div class="summary-item">
                  <div class="summary-label">Report Date</div>
                  <div class="summary-value">${summary.date || dateString}</div>
                </div>
              </div>
            </div>
            
            <div class="table-section">
              <div class="table-title">📋 Target Details by Line & Style</div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>LINE</th>
                    <th>STYLE</th>
                    <th>BUYER</th>
                    <th>ITEM</th>
                    <th>TARGET</th>
                    <th>HOURS</th>
                    <th>TARGETS</th>
                    ${timeSlotHeaders.map(timeSlot => 
                      `<th class="time-slot-header">${timeSlot}</th>`
                    ).join('')}
                    <th>TOTAL PROD</th>
                    <th>AVG/HR</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.map((row: any) => `
                    <tr>
                      <td class="line-cell">
                        <div>${row.lineNo}</div>
                        <div style="font-size: 9px; color: #6c757d;">${row.lineName}</div>
                      </td>
                      <td class="style-cell">${row.styleNo}</td>
                      <td class="buyer-cell">${row.buyer || 'N/A'}</td>
                      <td class="buyer-cell">${row.item || 'N/A'}</td>
                      <td class="target-cell">${row.target.toLocaleString()}</td>
                      <td class="hours-cell">${row.hours}h</td>
                      <td class="target-cell">${row.totalTargets.toLocaleString()}</td>
                      ${timeSlotHeaders.map(timeSlot => 
                        `<td class="time-slot-cell">${(row.hourlyProduction[timeSlot] || 0).toLocaleString()}</td>`
                      ).join('')}
                      <td class="production-cell">${row.totalProduction.toLocaleString()}</td>
                      <td class="efficiency-cell">${row.averageProductionPerHour.toFixed(1)}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td colspan="4"><strong>TOTALS</strong></td>
                    <td><strong>${reportData.reduce((sum, row) => sum + row.target, 0).toLocaleString()}</strong></td>
                    <td><strong>${reportData.reduce((sum, row) => sum + row.hours, 0)}h</strong></td>
                    <td><strong>${reportData.reduce((sum, row) => sum + row.totalTargets, 0).toLocaleString()}</strong></td>
                    ${timeSlotHeaders.map(timeSlot => 
                      `<td><strong>${(timeSlotTotals[timeSlot] || 0).toLocaleString()}</strong></td>`
                    ).join('')}
                    <td><strong>${reportData.reduce((sum, row) => sum + row.totalProduction, 0).toLocaleString()}</strong></td>
                    <td><strong>${(reportData.reduce((sum, row) => sum + row.averageProductionPerHour, 0) / reportData.length).toFixed(1)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="footer">
            <div>🏭 Production Management System - Target Reports</div>
            <div class="footer-info">
              Generated on ${new Date().toLocaleString()} | Automated Comprehensive Target Report
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML content for production report emails
   */
  private generateProductionReportEmailHTML(dateString: string, reportData: any[], summary: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Daily Production Report</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header .date {
            font-size: 18px;
            margin-top: 10px;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .summary-section {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            border-left: 4px solid #007bff;
          }
          .summary-title {
            font-size: 20px;
            font-weight: bold;
            color: #495057;
            margin-bottom: 15px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          .summary-item {
            background-color: white;
            padding: 15px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
          }
          .summary-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #495057;
            margin-top: 5px;
          }
          .table-section {
            margin-top: 30px;
          }
          .table-title {
            font-size: 20px;
            font-weight: bold;
            color: #495057;
            margin-bottom: 15px;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 12px;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .data-table th {
            background-color: #495057;
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            border-bottom: 2px solid #343a40;
          }
          .data-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #dee2e6;
            text-align: center;
          }
          .data-table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .data-table tr:hover {
            background-color: #e3f2fd;
          }
          .total-row {
            background-color: #fff3cd !important;
            font-weight: bold;
            border-top: 2px solid #ffc107;
          }
          .total-row td {
            border-bottom: 2px solid #ffc107;
          }
          .line-cell { color: #007bff; font-weight: bold; }
          .code-cell { color: #28a745; font-weight: bold; }
          .buyer-cell { text-align: left; font-weight: 600; }
          .qty-cell { color: #6f42c1; font-weight: bold; }
          .target-cell { color: #28a745; background-color: #d4edda; }
          .production-cell { color: #dc3545; background-color: #f8d7da; }
          .price-cell { color: #fd7e14; }
          .percentage-cell { color: #007bff; background-color: #cce7ff; }
          .taka-cell { color: #dc3545; font-weight: bold; }
          .footer {
            background-color: #495057;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 14px;
          }
          .footer-info {
            opacity: 0.8;
            margin-top: 10px;
          }
          @media (max-width: 768px) {
            .summary-grid {
              grid-template-columns: 1fr;
            }
            .data-table {
              font-size: 10px;
            }
            .data-table th,
            .data-table td {
              padding: 6px 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>📊 Daily Production Report</h1>
            <div class="date">📅 ${dateString}</div>
          </div>
          
          <div class="content">
            ${summary ? `
            <div class="summary-section">
              <div class="summary-title">📈 Production Summary</div>
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-label">Total Styles</div>
                  <div class="summary-value">${summary.totalReports || 0}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Target Quantity</div>
                  <div class="summary-value">${(summary.totalTargetQty || 0).toLocaleString()}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Production Quantity</div>
                  <div class="summary-value">${(summary.totalProductionQty || 0).toLocaleString()}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Efficiency</div>
                  <div class="summary-value">${(summary.averageEfficiency || 0).toFixed(1)}%</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Total Amount</div>
                  <div class="summary-value">$${(summary.totalAmount || 0).toLocaleString()}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Net Amount (BDT)</div>
                  <div class="summary-value">${(summary.totalNetAmount || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
            ` : ''}
            
            <div class="table-section">
              <div class="table-title">📋 Production Details</div>
              <table class="data-table">
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
                    <th>% Dollar</th>
                    <th>Taka</th>
                    <th>REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.map((row: any) => {
                    const isTotal = row['ITEM'] === 'Total';
                    return `
                      <tr class="${isTotal ? 'total-row' : ''}">
                        <td class="line-cell">${row['LINE'] || ''}</td>
                        <td class="code-cell">${row['P/COD'] || ''}</td>
                        <td class="buyer-cell">${row['BUYER'] || ''}</td>
                        <td class="code-cell">${row['ART/NO'] || ''}</td>
                        <td class="qty-cell">${row['OR/QTY'] ? row['OR/QTY'].toLocaleString() : ''}</td>
                        <td class="buyer-cell">${row['ITEM'] || ''}</td>
                        <td class="target-cell">${row['DAILY TARGET'] ? row['DAILY TARGET'].toLocaleString() : ''}</td>
                        <td class="production-cell">${row['DAILY PRODUCTION'] ? row['DAILY PRODUCTION'].toLocaleString() : ''}</td>
                        <td class="price-cell">$${row['UNIT PRICE'] || ''}</td>
                        <td class="price-cell">$${row['TOTAL PRICE'] || ''}</td>
                        <td class="percentage-cell">${row['%'] || ''}</td>
                        <td class="price-cell">$${row['% Dollar'] || ''}</td>
                        <td class="taka-cell">${row['Taka'] ? row['Taka'].toLocaleString() : ''}</td>
                        <td class="buyer-cell">${row['Remarks'] || ''}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="footer">
            <div>🏭 Production Management System</div>
            <div class="footer-info">
              Generated on ${new Date().toLocaleString()} | Automated Daily Report
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
