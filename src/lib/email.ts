import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: `"단어 테스트" <${process.env.SMTP_USER}>`,
    to,
    subject: '[단어 테스트] 비밀번호 초기화',
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:sans-serif;padding:24px;">
        <h2 style="color:#1e40af;">📚 단어 테스트 - 비밀번호 초기화</h2>
        <p>아래 버튼을 클릭하여 비밀번호를 초기화해주세요.</p>
        <p style="color:#dc2626;font-size:14px;">⏰ 이 링크는 <strong>5분</strong> 동안만 유효합니다.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;">비밀번호 초기화</a>
        <p style="font-size:13px;color:#6b7280;">버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣어주세요:</p>
        <p style="font-size:12px;color:#9ca3af;word-break:break-all;">${resetUrl}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="font-size:12px;color:#9ca3af;">본인이 요청하지 않은 경우 이 이메일을 무시해주세요.</p>
      </div>
    `,
  });
}
