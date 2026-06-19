import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

interface VideoBackgroundProps {
  opacity?: number;
}

export default function VideoBackground({ opacity = 0.3 }: VideoBackgroundProps) {
  const videoSource = require('../../assets/homescreen_background.mp4');
  
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <View style={[styles.backgroundContainer, { opacity }]} pointerEvents="none">
      <VideoView
        style={styles.backgroundVideo}
        player={player}
        allowsFullscreen={false}
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
    overflow: 'hidden',
  },
  backgroundVideo: {
    width: '100%',
    height: '100%',
  },
});
