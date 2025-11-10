import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as meetingValidation from '../../validations/meeting.validation.js';
import * as meetingController from '../../controllers/meeting.controller.js';

const router = express.Router();

/**
 * @swagger
 * /meetings:
 *   post:
 *     summary: Create a new meeting
 *     description: Create a new meeting with a shareable link
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Meeting title
 *                 example: "Interview with John Doe"
 *               description:
 *                 type: string
 *                 description: Meeting description
 *                 example: "Technical interview for Software Engineer position"
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled meeting time
 *                 example: "2024-01-15T14:00:00Z"
 *               duration:
 *                 type: integer
 *                 description: Meeting duration in minutes
 *                 default: 60
 *                 minimum: 5
 *                 maximum: 480
 *               maxParticipants:
 *                 type: integer
 *                 description: Maximum participants
 *                 default: 50
 *                 minimum: 2
 *                 maximum: 100
 *               allowGuestJoin:
 *                 type: boolean
 *                 description: Allow guest participants
 *                 default: true
 *               requireApproval:
 *                 type: boolean
 *                 description: Require approval for joining
 *                 default: false
 *     responses:
 *       201:
 *         description: Meeting created successfully
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
 *                     meetingId:
 *                       type: string
 *                       description: Unique meeting ID
 *                     title:
 *                       type: string
 *                       description: Meeting title
 *                     meetingUrl:
 *                       type: string
 *                       description: Shareable meeting URL
 *                     joinToken:
 *                       type: string
 *                       description: Meeting join token
 *                     channelName:
 *                       type: string
 *                       description: Agora channel name
 *                     appId:
 *                       type: string
 *                       description: Agora App ID
 *                     status:
 *                       type: string
 *                       description: Meeting status
 *                 message:
 *                   type: string
 *                   example: "Meeting created successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth(), validate(meetingValidation.createMeeting), meetingController.create);

/**
 * @swagger
 * /meetings:
 *   get:
 *     summary: Get user's meetings
 *     description: Get list of meetings created by the user
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, active, ended, cancelled]
 *         description: Filter by meeting status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of meetings to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Meetings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth(), validate(meetingValidation.getUserMeetings), meetingController.getUserMeetingsList);

/**
 * @swagger
 * /meetings/{meetingId}:
 *   get:
 *     summary: Get meeting details
 *     description: Get detailed information about a specific meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     responses:
 *       200:
 *         description: Meeting details retrieved successfully
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:meetingId', auth(), validate(meetingValidation.getMeeting), meetingController.get);

/**
 * @swagger
 * /meetings/{meetingId}:
 *   patch:
 *     summary: Update meeting
 *     description: Update meeting details (meeting creator only)
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Meeting title
 *               description:
 *                 type: string
 *                 description: Meeting description
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled meeting time
 *               duration:
 *                 type: integer
 *                 description: Meeting duration in minutes
 *               maxParticipants:
 *                 type: integer
 *                 description: Maximum participants
 *               notes:
 *                 type: string
 *                 description: Meeting notes
 *               outcome:
 *                 type: string
 *                 enum: [successful, unsuccessful, rescheduled, cancelled]
 *                 description: Meeting outcome
 *     responses:
 *       200:
 *         description: Meeting updated successfully
 *       403:
 *         description: Forbidden - Only meeting creator can update
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:meetingId', auth(), validate(meetingValidation.updateMeeting), meetingController.update);

/**
 * @swagger
 * /meetings/{meetingId}:
 *   delete:
 *     summary: Delete meeting
 *     description: Delete a meeting (meeting creator only)
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     responses:
 *       204:
 *         description: Meeting deleted successfully
 *       403:
 *         description: Forbidden - Only meeting creator can delete
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:meetingId', auth(), validate(meetingValidation.deleteMeeting), meetingController.remove);

/**
 * @swagger
 * /meetings/{meetingId}/join:
 *   post:
 *     summary: Join meeting
 *     description: Join a meeting with name and email (no authentication required)
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - joinToken
 *               - name
 *               - email
 *             properties:
 *               joinToken:
 *                 type: string
 *                 description: Meeting join token
 *                 example: "abc123def456"
 *               name:
 *                 type: string
 *                 description: Participant name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Participant email
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Successfully joined the meeting
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
 *                     meeting:
 *                       type: object
 *                       description: Meeting details
 *                     participant:
 *                       type: object
 *                       description: Participant details
 *                     agoraToken:
 *                       type: object
 *                       description: Agora token for video call
 *                     meetingUrl:
 *                       type: string
 *                       description: Meeting URL
 *                 message:
 *                   type: string
 *                   example: "Successfully joined the meeting"
 *       400:
 *         description: Bad request - Meeting full or invalid data
 *       404:
 *         description: Meeting not found or invalid token
 */
router.post('/:meetingId/join', validate(meetingValidation.joinMeeting), meetingController.join);

/**
 * @swagger
 * /meetings/{meetingId}/leave:
 *   post:
 *     summary: Leave meeting
 *     description: Leave a meeting
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
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
 *                 description: Participant email
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Successfully left the meeting
 *       404:
 *         description: Meeting or participant not found
 */
router.post('/:meetingId/leave', validate(meetingValidation.leaveMeeting), meetingController.leave);

/**
 * @swagger
 * /meetings/{meetingId}/participants:
 *   get:
 *     summary: Get meeting participants
 *     description: Get list of meeting participants (meeting creator only)
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     responses:
 *       200:
 *         description: Meeting participants retrieved successfully
 *       403:
 *         description: Forbidden - Only meeting creator can view participants
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:meetingId/participants', auth(), validate(meetingValidation.getMeetingParticipants), meetingController.getParticipants);

/**
 * @swagger
 * /meetings/{meetingId}/end:
 *   post:
 *     summary: End meeting
 *     description: End a meeting (meeting creator only)
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     responses:
 *       200:
 *         description: Meeting ended successfully
 *       403:
 *         description: Forbidden - Only meeting creator can end meeting
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:meetingId/end', auth(), validate(meetingValidation.endMeeting), meetingController.end);

/**
 * @swagger
 * /meetings/{meetingId}/info:
 *   get:
 *     summary: Get meeting info for joining
 *     description: Get public meeting information for joining (no authentication required)
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting join token
 *     responses:
 *       200:
 *         description: Meeting info retrieved successfully
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
 *                     meetingId:
 *                       type: string
 *                       description: Meeting ID
 *                     title:
 *                       type: string
 *                       description: Meeting title
 *                     description:
 *                       type: string
 *                       description: Meeting description
 *                     status:
 *                       type: string
 *                       description: Meeting status
 *                     scheduledAt:
 *                       type: string
 *                       format: date-time
 *                       description: Scheduled meeting time
 *                     duration:
 *                       type: integer
 *                       description: Meeting duration in minutes
 *                     maxParticipants:
 *                       type: integer
 *                       description: Maximum participants
 *                     currentParticipants:
 *                       type: integer
 *                       description: Current number of participants
 *                     canJoin:
 *                       type: boolean
 *                       description: Whether the meeting can be joined
 *                     meetingUrl:
 *                       type: string
 *                       description: Meeting URL
 *                     appId:
 *                       type: string
 *                       description: Agora App ID
 *                     channelName:
 *                       type: string
 *                       description: Agora channel name
 *                 message:
 *                   type: string
 *                   example: "Meeting info retrieved successfully"
 *       400:
 *         description: Bad request - Missing token
 *       404:
 *         description: Meeting not found or invalid token
 */
router.get('/:meetingId/info', validate(meetingValidation.getMeetingInfo), meetingController.getMeetingInfo);

/**
 * @swagger
 * /meetings/{meetingId}/screen-share-token:
 *   post:
 *     summary: Get screen share token
 *     description: Generate Agora token for screen sharing (no authentication required)
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - joinToken
 *               - screenShareUid
 *               - email
 *             properties:
 *               joinToken:
 *                 type: string
 *                 description: Meeting join token
 *                 example: "abc123def456"
 *               screenShareUid:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                 description: Screen share UID (number or string)
 *                 example: "12345"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Participant email
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Screen share token generated successfully
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
 *                     agoraToken:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           description: Agora token for screen sharing
 *                         channelName:
 *                           type: string
 *                           description: Agora channel name
 *                         account:
 *                           type: string
 *                           description: Screen share UID
 *                         role:
 *                           type: number
 *                           description: User role (1 for publisher)
 *                         expirationTime:
 *                           type: number
 *                           description: Token expiration timestamp
 *                         appId:
 *                           type: string
 *                           description: Agora App ID
 *                 message:
 *                   type: string
 *                   example: "Screen share token generated successfully"
 *       400:
 *         description: Bad request - Invalid meeting ID
 *       404:
 *         description: Meeting not found, invalid token, or participant not found
 */
router.post('/:meetingId/screen-share-token', validate(meetingValidation.getScreenShareToken), meetingController.getScreenShareToken);

export default router;
