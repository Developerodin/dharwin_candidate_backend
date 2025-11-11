import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import config from '../config/config.js';
import { generateRtcTokenWithAccount } from './meeting.service.js';
import logger from '../config/logger.js';

// Note: axios needs to be installed: npm install axios
// For now, we'll use fetch API which is available in Node.js 18+
// If using Node.js < 18, install axios and use it instead

/**
 * Get Agora REST API authentication header
 * @returns {string} Base64 encoded credentials
 */
const getAuthHeader = () => {
  if (!config.agora.restApiCustomerId || !config.agora.restApiCustomerSecret) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Agora REST API credentials not configured'
    );
  }
  
  const credentials = `${config.agora.restApiCustomerId}:${config.agora.restApiCustomerSecret}`;
  return Buffer.from(credentials).toString('base64');
};

/**
 * Make request to Agora REST API
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} body - Request body
 * @returns {Promise<Object>}
 */
const makeAgoraRequest = async (endpoint, method = 'GET', body = null) => {
  const baseUrl = 'https://api.agora.io';
  const url = `${baseUrl}${endpoint}`;
  const authHeader = getAuthHeader();
  
  const options = {
    method,
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    logger.info(`Making Agora API request: ${method} ${url}`);
    if (body) {
      logger.debug(`Request body: ${JSON.stringify(body, null, 2)}`);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      logger.error(`Agora API error: ${response.status} ${response.statusText}`);
      logger.error(`Response body: ${JSON.stringify(data, null, 2)}`);
      logger.error(`Request URL: ${url}`);
      logger.error(`Request method: ${method}`);
      if (body) {
        logger.error(`Request body sent: ${JSON.stringify(body, null, 2)}`);
      }
      
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Agora API error: ${data.message || data.error || data.errorMessage || response.statusText || JSON.stringify(data)}`
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Agora API request failed: ${error.message}`);
    logger.error(`Request URL: ${url}`);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to communicate with Agora API: ${error.message}`
    );
  }
};

/**
 * Start RTMP streaming from Agora channel
 * @param {string} channelName - Agora channel name
 * @param {string} rtmpUrl - RTMP server URL to push stream to
 * @param {string} streamName - Stream name (optional)
 * @returns {Promise<Object>} Stream information including streamId
 */
const startRtmpStream = async (channelName, rtmpUrl, streamName = null) => {
  // Generate token for recording bot
  // Note: uid should be a number (not string) for Agora API
  // Use a numeric UID (e.g., last 8 digits of timestamp as number)
  const recordingUid = parseInt(Date.now().toString().slice(-8), 10); // Numeric UID
  const recordingAccount = `recording_${channelName}_${recordingUid}`;
  
  // Generate token using account name (for token generation)
  const token = generateRtcTokenWithAccount(
    channelName,
    recordingAccount,
    1, // Publisher role
    3600 // 1 hour expiration
  );
  
  const streamNameToUse = streamName || `stream_${channelName}_${Date.now()}`;
  
  // Construct full RTMP URL
  // Format: rtmp://server:port/path/stream_name
  const fullRtmpUrl = rtmpUrl.endsWith('/') 
    ? `${rtmpUrl}${streamNameToUse}` 
    : `${rtmpUrl}/${streamNameToUse}`;
  
  // Correct request body format based on Agora documentation
  // Endpoint: /v1/apps/{APP_ID}/rtsc/single-stream/start
  const requestBody = {
    cname: channelName,
    uid: recordingUid.toString(), // Convert to string (Agora expects string representation of number)
    clientRequest: {
      token: token.token,
      videoStreamType: 1, // High stream (1) for better quality
      outputStreamConfig: {
        outputStreamUrl: fullRtmpUrl, // Full RTMP URL including stream name
      },
    },
  };
  
  logger.info(`Prepared RTMP stream request:`, {
    channelName,
    uid: recordingUid,
    rtmpUrl: fullRtmpUrl,
    endpoint: `/v1/apps/${config.agora.appId}/rtsc/single-stream/start`
  });
  
  // Agora REST API format: /v1/apps/{APP_ID}/rtsc/single-stream/start
  // This is the correct endpoint format
  const endpoints = [
    // Format 1: CORRECT - Agora's documented format (prioritize this)
    {
      path: `/v1/apps/${config.agora.appId}/rtsc/single-stream/start`,
      body: requestBody
    },
    // Format 2: Alternative endpoint (if single-stream doesn't work)
    {
      path: `/v1/apps/${config.agora.appId}/rtsc/rtmp/start`,
      body: requestBody
    },
    // Format 3: With additional video/audio config (if needed)
    {
      path: `/v1/apps/${config.agora.appId}/rtsc/single-stream/start`,
      body: {
        cname: channelName,
        uid: recordingAccount,
        clientRequest: {
          token: token.token,
          videoStreamType: 1,
          audioConfig: {
            sampleRate: 48000,
            channel: 1,
            codecProfile: 1, // LC-AAC
            bitrate: 48,
          },
          videoConfig: {
            width: 1280,
            height: 720,
            fps: 30,
            bitrate: 2000,
            codecProfile: 100, // Baseline profile
          },
          outputStreamConfig: {
            outputStreamUrl: `${rtmpUrl}/${streamNameToUse}`,
          },
        },
      }
    }
  ];

  let lastError = null;
  const attemptedEndpoints = [];
  
  for (const endpoint of endpoints) {
    try {
      logger.info(`Attempting RTMP stream start with endpoint: ${endpoint.path}`);
      attemptedEndpoints.push(endpoint.path);
      
      const response = await makeAgoraRequest(
        endpoint.path,
        'POST',
        endpoint.body
      );
      
      // Success - return the response
      logger.info(`RTMP stream started successfully with endpoint: ${endpoint.path}`);
      return {
        streamId: response.streamId || response.data?.streamId || response.id || response.stream_id,
        rtmpUrl: `${rtmpUrl}/${streamNameToUse}`,
        recordingAccount,
        token: token.token,
      };
    } catch (error) {
      lastError = error;
      logger.warn(`Endpoint ${endpoint.path} failed: ${error.message}`);
      // Continue to next endpoint
      continue;
    }
  }
  
  // All endpoints failed - provide detailed error
  const errorDetails = {
    attemptedEndpoints,
    lastError: lastError?.message || 'Unknown error',
    appId: config.agora.appId,
    channelName,
    hasRestApiCredentials: !!(config.agora.restApiCustomerId && config.agora.restApiCustomerSecret),
  };
  
  logger.error('All RTMP stream endpoints failed', errorDetails);
  
  throw new ApiError(
    httpStatus.INTERNAL_SERVER_ERROR,
    `Failed to start RTMP stream. Tried ${attemptedEndpoints.length} endpoints: ${attemptedEndpoints.join(', ')}. Last error: ${lastError?.message || 'Unknown error'}. Please verify: 1) Media Gateway is enabled in Agora Console, 2) REST API credentials are correct, 3) App ID (${config.agora.appId}) matches your project, 4) Wait a few minutes after enabling Media Gateway for activation.`
  );
};

/**
 * Stop RTMP streaming
 * @param {string} streamId - Stream ID from startRtmpStream
 * @returns {Promise<Object>}
 */
const stopRtmpStream = async (streamId) => {
  // Agora REST API format: /v1/apps/{APP_ID}/rtsc/single-stream/stop
  // Try multiple endpoint formats, prioritizing the correct one first
  const endpoints = [
    // Format 1: CORRECT - Agora's documented format (prioritize this)
    `/v1/apps/${config.agora.appId}/rtsc/single-stream/stop`,
    // Format 2: Alternative stop format
    `/v1/apps/${config.agora.appId}/rtsc/rtmp/stop`,
    // Format 3: Stream-specific format
    `/v1/apps/${config.agora.appId}/rtsc/streams/${streamId}/stop`,
  ];

  let lastError = null;
  
  for (const endpoint of endpoints) {
    try {
      logger.info(`Attempting RTMP stream stop with endpoint: ${endpoint}`);
      const response = await makeAgoraRequest(
        endpoint,
        'POST',
        { streamId }
      );
      logger.info(`RTMP stream stopped successfully with endpoint: ${endpoint}`);
      return response;
    } catch (error) {
      lastError = error;
      logger.warn(`Endpoint ${endpoint} failed: ${error.message}`);
      continue;
    }
  }
  
  throw new ApiError(
    httpStatus.INTERNAL_SERVER_ERROR,
    `Failed to stop RTMP stream: ${lastError?.message || 'Unknown error'}`
  );
};

/**
 * Get RTMP stream status
 * @param {string} streamId - Stream ID
 * @returns {Promise<Object>}
 */
const getRtmpStreamStatus = async (streamId) => {
  try {
    const response = await makeAgoraRequest(
      `/v1/projects/${config.agora.appId}/rtsc/single-stream/query/${streamId}`,
      'GET'
    );
    
    return response;
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to get RTMP stream status: ${error.message}`
    );
  }
};

export {
  startRtmpStream,
  stopRtmpStream,
  getRtmpStreamStatus,
};

