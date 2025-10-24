import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import { generateToken, generateMultipleTokens, getAgoraConfig } from '../../controllers/agora.controller.js';
import { generateToken as generateTokenValidation, generateMultipleTokens as generateMultipleTokensValidation } from '../../validations/agora.validation.js';

const router = express.Router();

/**
 * @swagger
 * /agora/token:
 *   post:
 *     summary: Generate Agora RTC token
 *     description: Generate a secure Agora RTC token for video/audio communication
 *     tags: [Agora]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelName
 *             properties:
 *               channelName:
 *                 type: string
 *                 description: Channel name for the video/audio session
 *                 example: "meeting-room-123"
 *               uid:
 *                 type: integer
 *                 description: User ID (0 for auto-generated)
 *                 example: 12345
 *               account:
 *                 type: string
 *                 description: User account (alternative to uid)
 *                 example: "user123"
 *               role:
 *                 type: integer
 *                 enum: [1, 2]
 *                 description: User role (1 for publisher, 2 for subscriber)
 *                 default: 1
 *               expirationTimeInSeconds:
 *                 type: integer
 *                 description: Token expiration time in seconds
 *                 default: 3600
 *                 minimum: 1
 *                 maximum: 86400
 *     responses:
 *       200:
 *         description: Token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Generated Agora token
 *                     channelName:
 *                       type: string
 *                       description: Channel name
 *                     uid:
 *                       type: integer
 *                       description: User ID
 *                     role:
 *                       type: integer
 *                       description: User role
 *                     expirationTime:
 *                       type: integer
 *                       description: Token expiration timestamp
 *                     appId:
 *                       type: string
 *                       description: Agora App ID
 *                 message:
 *                   type: string
 *                   example: "Agora token generated successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/token', auth(), validate(generateTokenValidation), generateToken);

/**
 * @swagger
 * /agora/tokens:
 *   post:
 *     summary: Generate multiple Agora RTC tokens
 *     description: Generate multiple secure Agora RTC tokens for different users
 *     tags: [Agora]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - users
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - channelName
 *                   properties:
 *                     channelName:
 *                       type: string
 *                       description: Channel name for the video/audio session
 *                       example: "meeting-room-123"
 *                     uid:
 *                       type: integer
 *                       description: User ID (0 for auto-generated)
 *                       example: 12345
 *                     account:
 *                       type: string
 *                       description: User account (alternative to uid)
 *                       example: "user123"
 *                     role:
 *                       type: integer
 *                       enum: [1, 2]
 *                       description: User role (1 for publisher, 2 for subscriber)
 *                       default: 1
 *                 minItems: 1
 *                 maxItems: 50
 *               expirationTimeInSeconds:
 *                 type: integer
 *                 description: Token expiration time in seconds
 *                 default: 3600
 *                 minimum: 1
 *                 maximum: 86400
 *     responses:
 *       200:
 *         description: Tokens generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           token:
 *                             type: string
 *                             description: Generated Agora token
 *                           channelName:
 *                             type: string
 *                             description: Channel name
 *                           uid:
 *                             type: integer
 *                             description: User ID
 *                           role:
 *                             type: integer
 *                             description: User role
 *                           expirationTime:
 *                             type: integer
 *                             description: Token expiration timestamp
 *                           appId:
 *                             type: string
 *                             description: Agora App ID
 *                     count:
 *                       type: integer
 *                       description: Number of tokens generated
 *                 message:
 *                   type: string
 *                   example: "Agora tokens generated successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/tokens', auth(), validate(generateMultipleTokensValidation), generateMultipleTokens);

/**
 * @swagger
 * /agora/config:
 *   get:
 *     summary: Get Agora configuration
 *     description: Get Agora App ID for client configuration
 *     tags: [Agora]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     appId:
 *                       type: string
 *                       description: Agora App ID
 *                 message:
 *                   type: string
 *                   example: "Agora configuration retrieved successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/config', auth(), getAgoraConfig);

export default router;
