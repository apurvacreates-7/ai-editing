import {Config} from '@remotion/cli/config';

// Output: H.264, 1080x1920, 30 fps (fps/size/duration are set on the <Composition> in src/Root.tsx).
Config.setEntryPoint('./src/index.ts');
Config.setCodec('h264');
// CRF 21 keeps the grain intact at a sane bitrate; bt709 tags the file as
// broadcast-range Rec.709 so phones and social players show the right contrast.
Config.setCrf(21);
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setX264Preset('slow');
Config.setAudioBitrate('192k');
// Frames are captured as high-quality JPEGs before encoding (PNG is lossless but ~3x slower).
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
