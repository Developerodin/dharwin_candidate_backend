import { spawn } from 'child_process';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/config.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store active recording processes
const activeRecordings = new Map();

/**
 * Ensure recording storage directory exists
 * @param {string} storagePath - Storage path
 */
const ensureStorageDirectory = async (storagePath) => {
  try {
    if (!existsSync(storagePath)) {
      mkdirSync(storagePath, { recursive: true });
    }
  } catch (error) {
    logger.error(`Failed to create storage directory: ${error.message}`);
    throw error;
  }
};

/**
 * Start FFmpeg recording process
 * @param {string} recordingId - Unique recording ID
 * @param {string} rtmpUrl - RTMP stream URL to record from
 * @param {Object} options - Recording options
 * @returns {Promise<Object>} Recording process information
 */
const startRecording = async (recordingId, rtmpUrl, options = {}) => {
  const {
    format = config.recording.defaultFormat,
    resolution = config.recording.defaultResolution,
    fps = config.recording.defaultFps,
    bitrate = config.recording.defaultBitrate,
  } = options;
  
  // Ensure storage directory exists
  await ensureStorageDirectory(config.recording.storagePath);
  
  // Generate output file path
  const fileName = `${recordingId}.${format}`;
  const outputPath = path.join(config.recording.storagePath, fileName);
  
  // Parse resolution
  const [width, height] = resolution.split('x').map(Number);
  
  // Build FFmpeg command
  // Note: fluent-ffmpeg can be used as alternative, but direct spawn is more control
  const ffmpegArgs = [
    '-i', rtmpUrl, // Input RTMP stream
    '-c:v', 'libx264', // Video codec
    '-preset', 'fast', // Encoding preset
    '-crf', '23', // Quality (lower = better quality, 18-28 is good range)
    '-c:a', 'aac', // Audio codec
    '-b:a', '128k', // Audio bitrate
    '-b:v', `${bitrate}k`, // Video bitrate
    '-r', String(fps), // Frame rate
    '-s', resolution, // Resolution
    '-pix_fmt', 'yuv420p', // Pixel format for compatibility
    '-movflags', '+faststart', // Enable fast start for web playback
    '-f', format, // Output format
    '-y', // Overwrite output file
    outputPath,
  ];
  
  logger.info(`Starting FFmpeg recording: ${recordingId}`, {
    rtmpUrl,
    outputPath,
    options: { format, resolution, fps, bitrate },
  });
  
  // Spawn FFmpeg process
  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
  
  // Handle process events
  let processError = null;
  let processStopped = false;
  
  ffmpegProcess.on('error', (error) => {
    logger.error(`FFmpeg process error for ${recordingId}:`, error);
    processError = error;
    activeRecordings.delete(recordingId);
  });
  
  ffmpegProcess.on('exit', (code, signal) => {
    processStopped = true;
    logger.info(`FFmpeg process exited for ${recordingId}: code=${code}, signal=${signal}`);
    activeRecordings.delete(recordingId);
  });
  
  // Capture stderr for logging (FFmpeg outputs progress to stderr)
  let stderrOutput = '';
  ffmpegProcess.stderr.on('data', (data) => {
    const output = data.toString();
    stderrOutput += output;
    
    // Log progress (FFmpeg outputs time=... to stderr)
    if (output.includes('time=')) {
      const timeMatch = output.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        const [, hours, minutes, seconds] = timeMatch;
        logger.debug(`Recording ${recordingId} progress: ${hours}:${minutes}:${seconds}`);
      }
    }
  });
  
  // Store recording process info
  const recordingInfo = {
    recordingId,
    process: ffmpegProcess,
    outputPath,
    rtmpUrl,
    options: { format, resolution, fps, bitrate },
    startedAt: new Date(),
    error: null,
  };
  
  activeRecordings.set(recordingId, recordingInfo);
  
  // Wait a bit to check if process started successfully
  await new Promise((resolve) => {
    setTimeout(() => {
      if (processError) {
        recordingInfo.error = processError.message;
        throw new Error(`Failed to start FFmpeg: ${processError.message}`);
      }
      if (processStopped && ffmpegProcess.exitCode !== 0) {
        recordingInfo.error = stderrOutput || 'FFmpeg process exited unexpectedly';
        throw new Error(`FFmpeg process failed: ${recordingInfo.error}`);
      }
      resolve();
    }, 2000); // Wait 2 seconds to check if process is stable
  });
  
  return recordingInfo;
};

/**
 * Stop FFmpeg recording process
 * @param {string} recordingId - Recording ID
 * @returns {Promise<Object>} Recording information
 */
const stopRecording = async (recordingId) => {
  const recordingInfo = activeRecordings.get(recordingId);
  
  if (!recordingInfo) {
    throw new Error(`Recording ${recordingId} not found or already stopped`);
  }
  
  logger.info(`Stopping FFmpeg recording: ${recordingId}`);
  
  return new Promise((resolve, reject) => {
    const { process, outputPath } = recordingInfo;
    
    // Send 'q' to FFmpeg to gracefully stop recording
    process.stdin.write('q');
    
    // Wait for process to exit
    process.on('exit', async (code) => {
      recordingInfo.stoppedAt = new Date();
      recordingInfo.duration = Math.floor(
        (recordingInfo.stoppedAt - recordingInfo.startedAt) / 1000
      );
      
      // Check if output file exists and get its size
      try {
        const stats = await fs.stat(outputPath);
        recordingInfo.fileSize = stats.size;
        recordingInfo.outputPath = outputPath;
        
        logger.info(`Recording ${recordingId} stopped successfully`, {
          duration: recordingInfo.duration,
          fileSize: recordingInfo.fileSize,
          outputPath,
        });
        
        resolve(recordingInfo);
      } catch (error) {
        logger.error(`Failed to get file stats for ${recordingId}:`, error);
        recordingInfo.error = `File not found: ${error.message}`;
        reject(new Error(`Recording file not found: ${error.message}`));
      }
    });
    
    // Force kill if process doesn't exit within 10 seconds
    setTimeout(() => {
      if (!process.killed) {
        logger.warn(`Force killing FFmpeg process for ${recordingId}`);
        process.kill('SIGKILL');
        recordingInfo.error = 'Process was force killed';
        reject(new Error('Recording process did not stop gracefully'));
      }
    }, 10000);
  });
};

/**
 * Get recording process status
 * @param {string} recordingId - Recording ID
 * @returns {Object|null} Recording information or null if not found
 */
const getRecordingStatus = (recordingId) => {
  const recordingInfo = activeRecordings.get(recordingId);
  
  if (!recordingInfo) {
    return null;
  }
  
  return {
    recordingId: recordingInfo.recordingId,
    isActive: !recordingInfo.process.killed && recordingInfo.process.exitCode === null,
    startedAt: recordingInfo.startedAt,
    outputPath: recordingInfo.outputPath,
    error: recordingInfo.error,
  };
};

/**
 * Cleanup old recording files
 * @param {number} maxAgeHours - Maximum age in hours (default: 24)
 */
const cleanupOldRecordings = async (maxAgeHours = 24) => {
  try {
    const files = await fs.readdir(config.recording.storagePath);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(config.recording.storagePath, file);
      const stats = await fs.stat(filePath);
      const age = now - stats.mtime.getTime();
      
      if (age > maxAge) {
        await fs.unlink(filePath);
        logger.info(`Cleaned up old recording file: ${file}`);
      }
    }
  } catch (error) {
    logger.error(`Failed to cleanup old recordings: ${error.message}`);
  }
};

export {
  startRecording,
  stopRecording,
  getRecordingStatus,
  cleanupOldRecordings,
};

