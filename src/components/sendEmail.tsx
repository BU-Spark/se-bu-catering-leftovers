import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.NEXT_PUBLIC_SENDGRID_API_KEY as string);

const sendEmail = async (to: string, subject: string, text: string, html: string) => {
  const msg = {
    to,
    from: 'leftover@bu.edu', // Use the email address or domain you verified with SendGrid
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent');
  } catch (error: any) {
    console.error(error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

export default sendEmail;