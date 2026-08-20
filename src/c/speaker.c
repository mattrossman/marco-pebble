#include <pebble.h>

int32_t marco_speaker_play(void) {
#ifdef MARCO_DISABLE_SPEAKER
  return 1;
#else
  static const SpeakerNote ping[] = {
    { 72, SpeakerWaveformSine, 30,  40, 0 },
    { 76, SpeakerWaveformSine, 30,  55, 0 },
    { 79, SpeakerWaveformSine, 30,  70, 0 },
    { 84, SpeakerWaveformSine, 30,  85, 0 },
    { 88, SpeakerWaveformSine, 30, 100, 0 },
    { 91, SpeakerWaveformSine, 55,  90, 0 },
    { 88, SpeakerWaveformSine, 40,  65, 0 },
    { 84, SpeakerWaveformSine, 55,  40, 0 },
    {  0, SpeakerWaveformSine, 40,   0, 0 },
    { 76, SpeakerWaveformSine, 25,  35, 0 },
    { 79, SpeakerWaveformSine, 25,  50, 0 },
    { 84, SpeakerWaveformSine, 25,  65, 0 },
    { 88, SpeakerWaveformSine, 25,  80, 0 },
    { 91, SpeakerWaveformSine, 60,  90, 0 },
  };

  return speaker_play_notes(ping, sizeof(ping) / sizeof(ping[0]), 75) ? 1 : 0;
#endif
}

void marco_speaker_stop(void) {
  speaker_stop();
}

int32_t marco_launched_from_phone(void) {
  return launch_reason() == APP_LAUNCH_PHONE ? 1 : 0;
}

void marco_light_set_color_rgb888(uint32_t rgb) {
  light_set_color_rgb888(rgb);
}
