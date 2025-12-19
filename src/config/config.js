import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

dotenv.config();

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('MongoDB URL'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(1440)
      .description('minutes after which verify email token expires'),
    FRONTEND_URL: Joi.string().default('https://main.d17v4yz0vw03r0.amplifyapp.com').description('Frontend application URL'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    AWS_ACCESS_KEY_ID: Joi.string().description('AWS access key ID'),
    AWS_SECRET_ACCESS_KEY: Joi.string().description('AWS secret access key'),
    AWS_REGION: Joi.string().default('us-east-1').description('AWS region'),
    AWS_S3_BUCKET_NAME: Joi.string().description('AWS S3 bucket name'),
    AGORA_APP_ID: Joi.string().required().description('Agora App ID'),
    AGORA_APP_CERTIFICATE: Joi.string().required().description('Agora App Certificate'),
    AGORA_REST_API_CUSTOMER_ID: Joi.string().description('Agora REST API Customer ID'),
    AGORA_REST_API_CUSTOMER_SECRET: Joi.string().description('Agora REST API Customer Secret'),
    RECORDING_STORAGE_PATH: Joi.string().default('/tmp/recordings').description('Local storage path for recordings'),
    RECORDING_MAX_DURATION: Joi.number().default(7200).description('Max recording duration in seconds'),
    RECORDING_DEFAULT_FORMAT: Joi.string().default('mp4').description('Default recording format'),
    RECORDING_DEFAULT_RESOLUTION: Joi.string().default('1280x720').description('Default recording resolution'),
    RECORDING_DEFAULT_FPS: Joi.number().default(30).description('Default recording FPS'),
    RECORDING_DEFAULT_BITRATE: Joi.number().default(2000).description('Default recording bitrate in kbps'),
    RTMP_SERVER_URL: Joi.string().default('rtmp://localhost:1935/live').description('RTMP server URL'),
    TRANSCRIPTION_PROVIDER: Joi.string().valid('assemblyai', 'openai', 'google').default('assemblyai').description('Transcription service provider'),
    ASSEMBLYAI_API_KEY: Joi.string().description('AssemblyAI API key'),
    OPENAI_API_KEY: Joi.string().description('OpenAI API key'),
    TRANSCRIPTION_LANGUAGE: Joi.string().default('en').description('Default transcription language'),
    TRANSCRIPTION_AUTO_START: Joi.boolean().default(true).description('Auto-start transcription after recording upload'),
    ATTENDANCE_AUTO_PUNCH_OUT_DURATION_HOURS: Joi.number().default(9).description('Auto punch-out duration in hours (default: 9)'),
    ATTENDANCE_SCHEDULER_INTERVAL_MINUTES: Joi.number().default(15).description('Attendance scheduler interval in minutes (default: 15)'),
    TZ: Joi.string().optional().description('Server timezone (e.g., America/New_York, UTC). If not set, uses server default.'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  frontendUrl: envVars.FRONTEND_URL,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useCreateIndex: true, // Optional: Remove this if using Mongoose v6+
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    region: envVars.AWS_REGION,
    bucketName: envVars.AWS_S3_BUCKET_NAME,
  },
  agora: {
    appId: envVars.AGORA_APP_ID,
    appCertificate: envVars.AGORA_APP_CERTIFICATE,
    restApiCustomerId: envVars.AGORA_REST_API_CUSTOMER_ID,
    restApiCustomerSecret: envVars.AGORA_REST_API_CUSTOMER_SECRET,
  },
  recording: {
    storagePath: envVars.RECORDING_STORAGE_PATH,
    maxDuration: envVars.RECORDING_MAX_DURATION,
    defaultFormat: envVars.RECORDING_DEFAULT_FORMAT,
    defaultResolution: envVars.RECORDING_DEFAULT_RESOLUTION,
    defaultFps: envVars.RECORDING_DEFAULT_FPS,
    defaultBitrate: envVars.RECORDING_DEFAULT_BITRATE,
    rtmpServerUrl: envVars.RTMP_SERVER_URL,
  },
  transcription: {
    provider: envVars.TRANSCRIPTION_PROVIDER,
    assemblyaiApiKey: envVars.ASSEMBLYAI_API_KEY,
    openaiApiKey: envVars.OPENAI_API_KEY,
    language: envVars.TRANSCRIPTION_LANGUAGE,
    autoStart: envVars.TRANSCRIPTION_AUTO_START,
  },
  attendance: {
    autoPunchOutDurationHours: envVars.ATTENDANCE_AUTO_PUNCH_OUT_DURATION_HOURS,
    schedulerIntervalMinutes: envVars.ATTENDANCE_SCHEDULER_INTERVAL_MINUTES,
  },
};

export default config;
