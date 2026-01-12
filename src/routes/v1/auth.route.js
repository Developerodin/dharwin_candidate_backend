import express from 'express';
import validate from '../../middlewares/validate.js';
import * as authValidation from '../../validations/auth.validation.js';
import * as authController from '../../controllers/auth.controller.js';
import auth from '../../middlewares/auth.js';


const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/send-verification-email', auth(), authController.sendVerificationEmail);
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);
router.post('/send-candidate-invitation', validate(authValidation.sendCandidateInvitation), authController.sendCandidateInvitation);
router.post('/register-supervisor', auth('manageUsers'), validate(authValidation.registerSupervisor), authController.registerSupervisor);
router.post('/register-recruiter', auth('manageUsers'), validate(authValidation.registerRecruiter), authController.registerRecruiter);
router.post('/register-user', auth('manageUsers'), validate(authValidation.registerUser), authController.registerUser);
router.patch('/register-user/:userId', auth('manageUsers'), validate(authValidation.updateRegisteredUser), authController.updateRegisteredUser);
router.delete('/register-user/:userId', auth('manageUsers'), validate(authValidation.deleteRegisteredUser), authController.deleteRegisteredUser);

export default router;


/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register as user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *             example:
 *               name: fake name
 *               email: fake@example.com
 *               password: password1
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: fake@example.com
 *               password: password1
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: Invalid email or password
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *     responses:
 *       "204":
 *         description: No content
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /auth/refresh-tokens:
 *   post:
 *     summary: Refresh auth tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: An email will be sent to reset password.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             example:
 *               email: fake@example.com
 *     responses:
 *       "204":
 *         description: No content
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The reset password token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *             example:
 *               password: password1
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         description: Password reset failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: Password reset failed
 */

/**
 * @swagger
 * /auth/send-verification-email:
 *   post:
 *     summary: Send verification email
 *     description: An email will be sent to verify email.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: verify email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verify email token
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         description: verify email failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: verify email failed
 */

/**
 * @swagger
 * /auth/send-candidate-invitation:
 *   post:
 *     summary: Send candidate invitation email(s)
 *     description: Send invitation email(s) to candidate(s) with onboarding link. Supports both single and bulk invitations.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 description: Single invitation
 *                 required:
 *                   - email
 *                   - onboardUrl
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Candidate's email address
 *                   onboardUrl:
 *                     type: string
 *                     format: uri
 *                     description: Onboarding URL for the candidate
 *                 example:
 *                   email: candidate@example.com
 *                   onboardUrl: https://app.example.com/onboard?token=abc123
 *               - type: object
 *                 description: Bulk invitations
 *                 required:
 *                   - invitations
 *                 properties:
 *                   invitations:
 *                     type: array
 *                     minItems: 1
 *                     maxItems: 50
 *                     items:
 *                       type: object
 *                       required:
 *                         - email
 *                         - onboardUrl
 *                       properties:
 *                         email:
 *                           type: string
 *                           format: email
 *                           description: Candidate's email address
 *                         onboardUrl:
 *                           type: string
 *                           format: uri
 *                           description: Onboarding URL for the candidate
 *                 example:
 *                   invitations:
 *                     - email: candidate1@example.com
 *                       onboardUrl: https://app.example.com/onboard?token=abc123
 *                     - email: candidate2@example.com
 *                       onboardUrl: https://app.example.com/onboard?token=def456
 *     responses:
 *       "200":
 *         description: Invitation(s) sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Single invitation response
 *                   properties:
 *                     message:
 *                       type: string
 *                     email:
 *                       type: string
 *                   example:
 *                     message: Candidate invitation email sent successfully
 *                     email: candidate@example.com
 *                 - type: object
 *                   description: Bulk invitation response
 *                   properties:
 *                     message:
 *                       type: string
 *                     results:
 *                       type: object
 *                       properties:
 *                         successful:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               email:
 *                                 type: string
 *                               onboardUrl:
 *                                 type: string
 *                         failed:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               email:
 *                                 type: string
 *                               onboardUrl:
 *                                 type: string
 *                               error:
 *                                 type: string
 *                         total:
 *                           type: number
 *                   example:
 *                     message: Bulk invitation processing completed. 2 successful, 0 failed.
 *                     results:
 *                       successful:
 *                         - email: candidate1@example.com
 *                           onboardUrl: https://app.example.com/onboard?token=abc123
 *                         - email: candidate2@example.com
 *                           onboardUrl: https://app.example.com/onboard?token=def456
 *                       failed: []
 *                       total: 2
 *       "400":
 *         description: Bad request - Invalid email, URL, or too many invitations
 *       "500":
 *         description: Internal server error
 */

/**
 * @swagger
 * /auth/register-user:
 *   post:
 *     summary: Register a new admin user (Admin only)
 *     description: Allows an admin to register a new user with admin role. Email verification is automatically set to true. Navigation permissions structure can be included.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (must be unique)
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Password must contain at least one letter and one number
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^[\+]?[1-9][\d]{0,15}$'
 *                 description: Phone number (optional)
 *               countryCode:
 *                 type: string
 *                 description: Country code (optional)
 *               subRole:
 *                 type: string
 *                 description: Sub-role for the user (optional)
 *               navigation:
 *                 type: object
 *                 description: Navigation permissions structure (optional)
 *                 additionalProperties: true
 *             example:
 *               name: John Doe
 *               email: john@example.com
 *               password: password123
 *               phoneNumber: "+1234567890"
 *               countryCode: "+1"
 *               subRole: "Senior Admin"
 *               navigation:
 *                 Dashboard: false
 *                 ATS:
 *                   Candidates:
 *                     Candidates: false
 *                     "Share Candidate Form": false
 *                     "Track Attendance": false
 *                   Jobs:
 *                     "Manage Jobs": false
 *                   Interviews:
 *                     "Generate Meeting Link": false
 *                     "Manage Meetings": false
 *                 "Project management":
 *                   "Manage Projects": false
 *                   "Manage Tasks": false
 *                 "Support Tickets": false
 *                 Settings:
 *                   Master:
 *                     Jobs:
 *                       "Manage Jobs Templates": false
 *                     Attendance:
 *                       "Manage Week Off": false
 *                       "Holidays List": false
 *                       "Assign Holidays": false
 *                       "Manage Shifts": false
 *                       "Assign Shift": false
 *                       "Assign Leave": false
 *                       "Leave Requests": false
 *                       "Backdated Attendance": false
 *                   Logs:
 *                     "Login Logs": false
 *                     "Recruiter Logs": false
 *     responses:
 *       "201":
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /auth/register-user/{userId}:
 *   patch:
 *     summary: Update a registered admin user (Admin only)
 *     description: Allows an admin to update a user registered via register-user endpoint. Email and password fields cannot be updated through this endpoint.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^[\+]?[1-9][\d]{0,15}$'
 *                 description: Phone number (optional)
 *               countryCode:
 *                 type: string
 *                 description: Country code (optional)
 *               subRole:
 *                 type: string
 *                 description: Sub-role for the user (optional)
 *               isActive:
 *                 type: boolean
 *                 description: Active status of the user (optional, default: true)
 *               navigation:
 *                 type: object
 *                 description: Navigation permissions structure (optional)
 *                 additionalProperties: true
 *             example:
 *               name: John Doe Updated
 *               phoneNumber: "+1987654321"
 *               countryCode: "+1"
 *               subRole: "Senior Admin"
 *               isActive: true
 *               navigation:
 *                 Dashboard: true
 *                 ATS:
 *                   Candidates:
 *                     Candidates: true
 *                     "Share Candidate Form": false
 *                     "Track Attendance": false
 *     responses:
 *       "200":
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       "400":
 *         description: Bad request - Validation error
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
