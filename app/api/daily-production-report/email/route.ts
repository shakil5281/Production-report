import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Email API called');
    
    const { date, reportData, summary } = await request.json();
    console.log('📊 Data received:', { 
      hasDate: !!date, 
      reportDataLength: reportData?.length, 
      hasSummary: !!summary 
    });

    if (!date || !reportData) {
      console.error('❌ Missing required fields:', { date: !!date, reportData: !!reportData });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for required environment variables
    const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
    const emailFromAddress = process.env.EMAIL_FROM_ADDRESS || 'shakilhossen3001@gmail.com';
    const emailToAddress = process.env.EMAIL_TO_ADDRESS || 'shakilhossen3001@gmail.com';
    const emailFromName = process.env.EMAIL_FROM_NAME || 'Production Management System - Shakil';

    if (!emailAppPassword) {
      console.error('❌ EMAIL_APP_PASSWORD environment variable is not set');
      return NextResponse.json(
        { success: false, error: 'Email configuration is incomplete. Please set EMAIL_APP_PASSWORD environment variable.' },
        { status: 500 }
      );
    }

    console.log('📧 Using email configuration:', {
      from: emailFromAddress,
      to: emailToAddress,
      fromName: emailFromName,
      hasPassword: !!emailAppPassword
    });

    console.log('📧 Creating email transporter...');
    // Create email transporter (using Gmail SMTP with explicit configuration)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailFromAddress,
        pass: emailAppPassword, // Gmail app password from environment
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter configuration
    console.log('🔐 Verifying email configuration...');
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError);
      return NextResponse.json(
        { success: false, error: `Email configuration error: ${verifyError instanceof Error ? verifyError.message : 'Unknown verification error'}` },
        { status: 500 }
      );
    }

    const dateString = format(new Date(date), 'dd/MM/yyyy');
    const subject = `Daily Production Report (${dateString})`;
    console.log('📧 Email subject:', subject);

    // Generate HTML email content
    console.log('🎨 Generating email HTML...');
    const htmlContent = generateEmailHTML(dateString, reportData, summary);

    const mailOptions = {
      from: {
        name: emailFromName,
        address: emailFromAddress
      },
      to: emailToAddress,
      subject,
      html: htmlContent,
    };

    console.log('📤 Sending email...');
    // Send email
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    // More detailed error handling
    let errorMessage = 'Failed to send email';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

function generateEmailHTML(dateString: string, reportData: any[], summary: any) {
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
                <div class="summary-label">Total UNIT PRICE</div>
                <div class="summary-value">$${(summary.totalUnitPrice || 0).toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Average %</div>
                <div class="summary-value">{(summary.averagePercentage || 0).toFixed(2)}%</div>
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
