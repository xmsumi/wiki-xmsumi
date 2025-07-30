import * as nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';

/**
 * 邮件配置接口
 */
export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  emailFromAddress: string;
  emailFromName?: string;
}

/**
 * 邮件发送选项接口
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

/**
 * 邮件服务类
 * 处理邮件发送相关功能，支持QQ邮箱等SMTP服务
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  /**
   * 配置邮件服务
   */
  configure(config: EmailConfig): void {
    this.config = config;
    
    // QQ邮箱特殊配置
    const transporterConfig: any = {
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure, // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    };

    // QQ邮箱特殊配置
    if (config.smtpHost === 'smtp.qq.com') {
      transporterConfig.tls = {
        rejectUnauthorized: false
      };
      
      // 如果使用587端口，启用STARTTLS
      if (config.smtpPort === 587) {
        transporterConfig.secure = false;
        transporterConfig.requireTLS = true;
      }
      
      logger.info('应用QQ邮箱特殊配置');
    }

    // 创建邮件传输器
    this.transporter = nodemailer.createTransport(transporterConfig);

    logger.info('邮件服务已配置', {
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      user: config.smtpUser,
      transporterConfig: JSON.stringify(transporterConfig, null, 2)
    });
  }

  /**
   * 测试邮件连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return {
        success: false,
        message: '邮件服务未配置'
      };
    }

    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP连接测试成功'
      };
    } catch (error) {
      logger.error('SMTP连接测试失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'SMTP连接测试失败'
      };
    }
  }

  /**
   * 发送邮件
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string; messageId?: string }> {
    if (!this.transporter || !this.config) {
      return {
        success: false,
        message: '邮件服务未配置'
      };
    }

    try {
      const mailOptions = {
        from: {
          name: this.config.emailFromName || 'Wiki知识库',
          address: this.config.emailFromAddress
        },
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('邮件发送成功', {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject
      });

      return {
        success: true,
        message: '邮件发送成功',
        messageId: result.messageId
      };
    } catch (error) {
      logger.error('邮件发送失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '邮件发送失败'
      };
    }
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail(testEmailTo: string): Promise<{ success: boolean; message: string }> {
    const testEmailOptions: EmailOptions = {
      to: testEmailTo,
      subject: 'Wiki知识库 - 邮件配置测试',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1890ff;">邮件配置测试</h2>
          <p>恭喜！您的邮件配置已成功设置。</p>
          <div style="background-color: #f6f8fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>配置信息：</h3>
            <ul>
              <li><strong>SMTP服务器：</strong>${this.config?.smtpHost}</li>
              <li><strong>端口：</strong>${this.config?.smtpPort}</li>
              <li><strong>安全连接：</strong>${this.config?.smtpSecure ? 'SSL/TLS' : '否'}</li>
              <li><strong>发件人：</strong>${this.config?.emailFromAddress}</li>
            </ul>
          </div>
          <p>测试时间：${new Date().toLocaleString('zh-CN')}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            这是一封自动发送的测试邮件，请勿回复。<br>
            如果您收到此邮件，说明邮件配置正常工作。
          </p>
        </div>
      `,
      text: `
Wiki知识库 - 邮件配置测试

恭喜！您的邮件配置已成功设置。

配置信息：
- SMTP服务器：${this.config?.smtpHost}
- 端口：${this.config?.smtpPort}
- 安全连接：${this.config?.smtpSecure ? 'SSL/TLS' : '否'}
- 发件人：${this.config?.emailFromAddress}

测试时间：${new Date().toLocaleString('zh-CN')}

这是一封自动发送的测试邮件，请勿回复。
如果您收到此邮件，说明邮件配置正常工作。
      `
    };

    return await this.sendEmail(testEmailOptions);
  }

  /**
   * 发送用户注册验证邮件
   */
  async sendVerificationEmail(
    to: string, 
    verificationCode: string, 
    verificationUrl: string,
    username: string
  ): Promise<{ success: boolean; message: string }> {
    const emailOptions: EmailOptions = {
      to,
      subject: 'Wiki知识库 - 邮箱验证',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1890ff; margin: 0;">Wiki知识库</h1>
            <p style="color: #666; margin: 5px 0;">智能知识管理系统</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">欢迎注册Wiki知识库！</h2>
            <p style="color: #555; line-height: 1.6;">
              亲爱的 <strong>${username}</strong>，感谢您注册Wiki知识库！
            </p>
            <p style="color: #555; line-height: 1.6;">
              为了确保您的账户安全，请点击下面的按钮验证您的邮箱地址：
            </p>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #1890ff; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: bold; font-size: 16px;">
              验证邮箱地址
            </a>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>验证码：</strong><code style="background-color: #f8f9fa; padding: 2px 6px; border-radius: 3px;">${verificationCode}</code>
            </p>
          </div>

          <div style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              如果上面的按钮无法点击，请复制以下链接到浏览器地址栏：
            </p>
            <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px;">
              ${verificationUrl}
            </div>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; line-height: 1.5;">
              <strong>重要提醒：</strong><br>
              • 此验证链接将在24小时后失效<br>
              • 如果您没有注册Wiki知识库账户，请忽略此邮件<br>
              • 这是一封系统自动发送的邮件，请勿回复
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} Wiki知识库 - 让知识更有价值
            </p>
          </div>
        </div>
      `,
      text: `
Wiki知识库 - 邮箱验证

欢迎注册Wiki知识库！

亲爱的 ${username}，感谢您注册Wiki知识库！

为了确保您的账户安全，请复制以下链接到浏览器地址栏验证您的邮箱地址：
${verificationUrl}

验证码：${verificationCode}

重要提醒：
• 此验证链接将在24小时后失效
• 如果您没有注册Wiki知识库账户，请忽略此邮件
• 这是一封系统自动发送的邮件，请勿回复

© ${new Date().getFullYear()} Wiki知识库 - 让知识更有价值
      `
    };

    return await this.sendEmail(emailOptions);
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(
    to: string, 
    resetToken: string, 
    resetUrl: string,
    username: string
  ): Promise<{ success: boolean; message: string }> {
    const emailOptions: EmailOptions = {
      to,
      subject: 'Wiki知识库 - 密码重置',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1890ff; margin: 0;">Wiki知识库</h1>
            <p style="color: #666; margin: 5px 0;">智能知识管理系统</p>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #856404; margin-top: 0;">
              <span style="font-size: 20px;">⚠️</span> 密码重置请求
            </h2>
            <p style="color: #856404; line-height: 1.6; margin: 0;">
              我们收到了您的密码重置请求。如果这不是您本人的操作，请忽略此邮件。
            </p>
          </div>

          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #555; line-height: 1.6;">
              亲爱的 <strong>${username}</strong>，
            </p>
            <p style="color: #555; line-height: 1.6;">
              您请求重置Wiki知识库账户的密码。请点击下面的按钮设置新密码：
            </p>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: bold; font-size: 16px;">
              重置密码
            </a>
          </div>

          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;">
              <strong>重置令牌：</strong><code style="background-color: #f8f9fa; padding: 2px 6px; border-radius: 3px;">${resetToken}</code>
            </p>
          </div>

          <div style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              如果上面的按钮无法点击，请复制以下链接到浏览器地址栏：
            </p>
            <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px;">
              ${resetUrl}
            </div>
          </div>

          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24; font-size: 14px;">
              <strong>🔒 安全提醒：</strong><br>
              • 此重置链接将在1小时后失效<br>
              • 如果您没有请求密码重置，请立即联系管理员<br>
              • 为了账户安全，请设置一个强密码
            </p>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; line-height: 1.5;">
              <strong>注意事项：</strong><br>
              • 如果您没有请求密码重置，请忽略此邮件，您的密码不会被更改<br>
              • 这是一封系统自动发送的邮件，请勿回复<br>
              • 如有疑问，请联系系统管理员
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} Wiki知识库 - 让知识更有价值
            </p>
          </div>
        </div>
      `,
      text: `
Wiki知识库 - 密码重置

⚠️ 密码重置请求

亲爱的 ${username}，

您请求重置Wiki知识库账户的密码。请复制以下链接到浏览器地址栏设置新密码：
${resetUrl}

重置令牌：${resetToken}

🔒 安全提醒：
• 此重置链接将在1小时后失效
• 如果您没有请求密码重置，请立即联系管理员
• 为了账户安全，请设置一个强密码

注意事项：
• 如果您没有请求密码重置，请忽略此邮件，您的密码不会被更改
• 这是一封系统自动发送的邮件，请勿回复
• 如有疑问，请联系系统管理员

© ${new Date().getFullYear()} Wiki知识库 - 让知识更有价值
      `
    };

    return await this.sendEmail(emailOptions);
  }

  /**
   * 发送系统通知邮件
   */
  async sendNotificationEmail(
    to: string | string[], 
    subject: string, 
    content: string,
    type: 'info' | 'warning' | 'success' | 'error' = 'info'
  ): Promise<{ success: boolean; message: string }> {
    const typeConfig = {
      info: { color: '#1890ff', icon: 'ℹ️', bgColor: '#e6f7ff', borderColor: '#91d5ff' },
      warning: { color: '#faad14', icon: '⚠️', bgColor: '#fffbe6', borderColor: '#ffd666' },
      success: { color: '#52c41a', icon: '✅', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
      error: { color: '#ff4d4f', icon: '❌', bgColor: '#fff2f0', borderColor: '#ffb3b3' }
    };

    const config = typeConfig[type];

    const emailOptions: EmailOptions = {
      to,
      subject: `Wiki知识库 - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1890ff; margin: 0;">Wiki知识库</h1>
            <p style="color: #666; margin: 5px 0;">智能知识管理系统</p>
          </div>
          
          <div style="background-color: ${config.bgColor}; border: 1px solid ${config.borderColor}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: ${config.color}; margin-top: 0;">
              <span style="font-size: 20px;">${config.icon}</span> ${subject}
            </h2>
            <div style="color: #555; line-height: 1.6;">
              ${content}
            </div>
          </div>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>通知时间：</strong>${new Date().toLocaleString('zh-CN')}
            </p>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; line-height: 1.5;">
              这是一封系统自动发送的通知邮件，请勿回复。<br>
              如有疑问，请联系系统管理员。
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} Wiki知识库 - 让知识更有价值
            </p>
          </div>
        </div>
      `,
      text: `
Wiki知识库 - ${subject}

${config.icon} ${subject}

${content.replace(/<[^>]*>/g, '')}

通知时间：${new Date().toLocaleString('zh-CN')}

这是一封系统自动发送的通知邮件，请勿回复。
如有疑问，请联系系统管理员。

© ${new Date().getFullYear()} Wiki知识库 - 让知识更有价值
      `
    };

    return await this.sendEmail(emailOptions);
  }

  /**
   * 获取邮件服务状态
   */
  getStatus(): { configured: boolean; config?: Partial<EmailConfig> } {
    if (!this.config) {
      return { configured: false };
    }

    return {
      configured: true,
      config: {
        smtpHost: this.config.smtpHost,
        smtpPort: this.config.smtpPort,
        smtpSecure: this.config.smtpSecure,
        emailFromAddress: this.config.emailFromAddress,
        emailFromName: this.config.emailFromName
      }
    };
  }

  /**
   * 关闭邮件服务
   */
  close(): void {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.config = null;
      logger.info('邮件服务已关闭');
    }
  }
}

// 导出邮件服务单例
export const emailService = new EmailService();