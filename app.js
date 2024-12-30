const express = require("express");
const multer = require("multer");
const cors = require("cors");
const nodemailer = require("nodemailer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Email configuration
const smtpServer = "smtp.gmail.com";
const smtpPort = 587;
const emailUsername = "yasir.codeblue@gmail.com";
const emailPassword = "xmyf deht uvqj pbur"; // Use app password for Gmail

const transporter = nodemailer.createTransport({
  host: smtpServer,
  port: smtpPort,
  secure: false,
  auth: {
    user: emailUsername,
    pass: emailPassword,
  },
});

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Function to send emails
const sendEmail = async (recipientName, recipientEmail, attachmentPath) => {
  const mailOptions = {
    from: emailUsername,
    to: recipientEmail,
    subject: "Your Unique Attachment",
    text: `Dear ${recipientName},\n\nPlease find your unique attachment.\n\nBest regards,\nYour Name`,
    attachments: [
      {
        filename: path.basename(attachmentPath),
        path: attachmentPath,
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${recipientEmail}: ${error}`);
    return false;
  }
};

// Route for home page
app.get('/', (req, res) => {
  res.render('home');
});

// Route for file upload
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).render('home', { error: "No file uploaded" });
  }

  const filePath = req.file.path;
  const recipients = [];

  // Read CSV and send emails
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      recipients.push(row);
    })
    .on("end", async () => {
      try {
        const results = [];
        for (const recipient of recipients) {
          const {
            "Recipient Name": recipientName,
            "Email Address": recipientEmail,
            "Attachment Path": attachmentPath,
          } = recipient;

          if (recipientName && recipientEmail && attachmentPath) {
            const emailSent = await sendEmail(
              recipientName,
              recipientEmail,
              attachmentPath
            );
            results.push({ email: recipientEmail, sent: emailSent });
          }
        }
        res.render('results', { results });
      } catch (error) {
        res.render('home', { error: `Error processing emails: ${error.message}` });
      } finally {
        // Clean up uploaded file
        fs.unlink(filePath, () => {});
      }
    });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

