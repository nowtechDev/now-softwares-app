import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MediaSkeletonProps {
  type: 'image' | 'video' | 'audio' | 'document';
  width?: number;
  height?: number;
}

export function MediaSkeleton({ type, width, height }: MediaSkeletonProps) {
  const screenWidth = Dimensions.get('window').width;
  const defaultWidth = screenWidth * 0.65;
  const defaultHeight = defaultWidth * 0.75;

  const containerStyle = {
    width: width || defaultWidth,
    height: height || (type === 'audio' ? 60 : type === 'document' ? 80 : defaultHeight),
  };

  switch (type) {
    case 'image':
      return (
        <View style={[styles.skeleton, containerStyle, styles.imageSkeleton]}>
          <Ionicons name="image-outline" size={40} color="#9ca3af" />
        </View>
      );

    case 'video':
      return (
        <View style={[styles.skeleton, containerStyle, styles.videoSkeleton]}>
          <View style={styles.videoPlayButton}>
            <Ionicons name="play" size={32} color="#ffffff" />
          </View>
        </View>
      );

    case 'audio':
      return (
        <View style={[styles.skeleton, containerStyle, styles.audioSkeleton]}>
          <Ionicons name="musical-notes-outline" size={24} color="#9ca3af" />
          <View style={styles.audioWaveform}>
            {[...Array(15)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.audioBar,
                  { height: Math.random() * 20 + 8 },
                ]}
              />
            ))}
          </View>
        </View>
      );

    case 'document':
      return (
        <View style={[styles.skeleton, containerStyle, styles.documentSkeleton]}>
          <Ionicons name="document-text-outline" size={32} color="#6366f1" />
          <View style={styles.documentInfo}>
            <View style={styles.documentLine} />
            <View style={[styles.documentLine, { width: '60%' }]} />
          </View>
        </View>
      );

    default:
      return (
        <View style={[styles.skeleton, containerStyle]}>
          <Ionicons name="help-outline" size={32} color="#9ca3af" />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  imageSkeleton: {
    position: 'relative',
  },
  videoSkeleton: {
    position: 'relative',
    backgroundColor: '#1f2937',
  },
  videoPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: '100%',
  },
  audioBar: {
    width: 3,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
  },
  documentSkeleton: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
    gap: 8,
  },
  documentLine: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    width: '80%',
  },
});
