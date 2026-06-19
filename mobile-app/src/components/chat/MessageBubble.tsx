import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import Animated, { FadeInUp, FadeInRight, FadeInLeft, Layout } from 'react-native-reanimated';

interface MessageBubbleProps {
  id: string;
  text: string;
  isMe: boolean;
  timestamp: string;
  seen?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'audio' | 'document';
  reaction?: string | null;
  replyTo?: string | null;
  isVoice?: boolean;
  voiceDuration?: number;
  isPlaying?: boolean;
  onPlayVoice?: () => void;
  onDelete?: () => void;
  onReact?: (reaction: string) => void;
  onReply?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onSave?: () => void;
  onUnsave?: () => void;
  onShare?: () => void;
  onCopy?: () => void;
  onForward?: () => void;
  onEdit?: () => void;
  isNew?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  isSelectionMode?: boolean;
  isEdited?: boolean;
  isPinned?: boolean;
  isSaved?: boolean;
}

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

export const MessageBubble = ({
  id,
  text,
  isMe,
  timestamp,
  seen,
  status,
  mediaUrl,
  mediaType,
  reaction,
  replyTo,
  isVoice,
  voiceDuration,
  isPlaying,
  onPlayVoice,
  onDelete,
  onReact,
  onReply,
  onPin,
  onUnpin,
  onSave,
  onUnsave,
  onShare,
  onCopy,
  onForward,
  onEdit,
  isNew,
  isSelected,
  onSelect,
  isSelectionMode = false,
  isEdited = false,
  isPinned = false,
  isSaved = false,
}: MessageBubbleProps) => {
  const [showActions, setShowActions] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const dateObj = new Date(timestamp);
  const isInvalid = isNaN(dateObj.getTime());

  const formattedTime = isInvalid ? '--:--' : dateObj.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleLongPress = () => {
    if (isSelectionMode) {
      onSelect?.();
    } else {
      setShowActions(true);
    }
  };

  const handlePress = () => {
    if (isSelectionMode) {
      onSelect?.();
    }
  };

  const enteringAnimation = isMe ? FadeInRight.springify() : FadeInLeft.springify();
  const resolvedIsVoice = isVoice || mediaType === 'audio';

  const renderStatusTicks = (resolvedStatus: 'sent' | 'delivered' | 'read') => {
    const size = 12;
    const activeColor = COLORS.primary;
    const inactiveColor = COLORS.subtext;

    if (resolvedStatus === 'read') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
          <FontAwesome name="check" size={size} color={activeColor} />
          <FontAwesome name="check" size={size} color={activeColor} style={{ marginLeft: -4 }} />
        </View>
      );
    }
    if (resolvedStatus === 'delivered') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
          <FontAwesome name="check" size={size} color={inactiveColor} />
          <FontAwesome name="check" size={size} color={inactiveColor} style={{ marginLeft: -4 }} />
        </View>
      );
    }
    return (
      <FontAwesome name="check" size={size} color={inactiveColor} style={{ marginLeft: 4 }} />
    );
  };

  const formattedVoiceDuration = (secs?: number) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const bubbleContent = (
    <Animated.View
      layout={Layout.springify()}
      entering={isNew ? enteringAnimation : undefined}
      style={[
        styles.bubbleWrapper,
        isMe ? styles.myContainer : styles.partnerContainer,
        isSelected && styles.selectedBubbleWrapper
      ]}
    >
      {/* Reply preview */}
      {replyTo && (
        <View style={[styles.replyPreview, isMe ? styles.myReplyPreview : styles.partnerReplyPreview]}>
          <View style={styles.replyBar} />
          <Text style={styles.replyText} numberOfLines={1}>
            {replyTo}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onLongPress={handleLongPress}
        onPress={handlePress}
        activeOpacity={0.8}
        style={[styles.bubble, isMe ? styles.myBubble : styles.partnerBubble]}
      >
        {/* Photo preview */}
        {mediaUrl && mediaType === 'photo' && (
          <TouchableOpacity onPress={() => setImageModalVisible(true)}>
            <Image source={{ uri: mediaUrl }} style={styles.mediaImage} resizeMode="cover" />
          </TouchableOpacity>
        )}

        {/* Video preview */}
        {mediaUrl && mediaType === 'video' && (
          <View style={styles.videoContainer}>
            <FontAwesome name="play-circle" size={40} color="#fff" />
            <Text style={styles.videoLabel}>Video</Text>
          </View>
        )}

        {/* Voice/Audio player */}
        {resolvedIsVoice && mediaUrl && (
          <TouchableOpacity
            style={styles.voicePlayer}
            onPress={onPlayVoice}
            activeOpacity={0.7}
          >
            <FontAwesome name={isPlaying ? "pause-circle" : "play-circle"} size={32} color={isMe ? "#fff" : COLORS.primary} />
            <View style={styles.voiceProgressContainer}>
              <View style={[styles.voiceProgressBar, { backgroundColor: isMe ? '#fff' : COLORS.primary, width: isPlaying ? '100%' : '10%' }]} />
            </View>
            <Text style={[styles.voiceDuration, { color: isMe ? '#eee' : COLORS.subtext }]}>
              {formattedVoiceDuration(voiceDuration)}
            </Text>
          </TouchableOpacity>
        )}

        {/* Document card */}
        {mediaUrl && mediaType === 'document' && (
          <TouchableOpacity
            style={styles.documentContainer}
            onPress={() => Linking.openURL(mediaUrl)}
            activeOpacity={0.7}
          >
            <FontAwesome name="file-text" size={28} color={isMe ? "#fff" : COLORS.primary} />
            <View style={styles.documentInfo}>
              <Text style={[styles.documentName, { color: isMe ? '#fff' : '#fff' }]} numberOfLines={1}>
                {mediaUrl.split('/').pop() || 'Document.pdf'}
              </Text>
              <Text style={[styles.documentSize, { color: isMe ? '#eee' : COLORS.subtext }]}>
                Tap to open document
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Message text */}
        {text && !resolvedIsVoice && mediaType !== 'document' ? (
          <Text style={[styles.text, isMe ? styles.myText : styles.partnerText]}>{text}</Text>
        ) : null}
      </TouchableOpacity>

      {/* Reaction bubble */}
      {reaction && (
        <View style={[styles.reactionBubble, isMe ? styles.myReactionBubble : styles.partnerReactionBubble]}>
          <Text style={styles.reactionEmoji}>{reaction}</Text>
        </View>
      )}

      {/* Timestamp + status */}
      <View style={[styles.statusContainer, isMe ? styles.myStatusContainer : styles.partnerStatusContainer]}>
        {isPinned && <FontAwesome name="thumb-tack" size={10} color={COLORS.primary} style={{ marginRight: 4 }} />}
        {isSaved && <FontAwesome name="bookmark" size={10} color={COLORS.primary} style={{ marginRight: 4 }} />}
        <Text style={styles.timestamp}>
          {formattedTime}{isEdited ? ' (edited)' : ''}
        </Text>
        {isMe && renderStatusTicks(status || (seen ? 'read' : 'sent'))}
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.rowLayout, isMe ? styles.myRowLayout : styles.partnerRowLayout]}>
      {isSelectionMode && (
        <TouchableOpacity onPress={onSelect} style={styles.checkboxContainer}>
          <FontAwesome
            name={isSelected ? "check-circle" : "circle-o"}
            size={22}
            color={isSelected ? COLORS.primary : COLORS.border}
          />
        </TouchableOpacity>
      )}

      {bubbleContent}

      {/* Actions Modal */}
      <Modal
        visible={showActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity
          style={styles.actionOverlay}
          activeOpacity={1}
          onPress={() => setShowActions(false)}
        >
          <View style={styles.actionMenu}>
            {/* Emoji Reactions row */}
            <View style={styles.emojiRow}>
              {EMOJI_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiBtn, reaction === emoji && styles.emojiBtnActive]}
                  onPress={() => {
                    onReact?.(emoji);
                    setShowActions(false);
                  }}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionDivider} />

            {/* Action buttons */}
            {onReply && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => { onReply(); setShowActions(false); }}
              >
                <FontAwesome name="reply" size={16} color="#fff" />
                <Text style={styles.actionLabel}>Reply</Text>
              </TouchableOpacity>
            )}

            {onCopy && text && !resolvedIsVoice && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => { onCopy(); setShowActions(false); }}
              >
                <FontAwesome name="copy" size={16} color="#fff" />
                <Text style={styles.actionLabel}>Copy</Text>
              </TouchableOpacity>
            )}

            {isMe && onEdit && text && !resolvedIsVoice && mediaType !== 'document' && mediaType !== 'video' && mediaType !== 'photo' && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => { onEdit(); setShowActions(false); }}
              >
                <FontAwesome name="edit" size={16} color="#fff" />
                <Text style={styles.actionLabel}>Edit</Text>
              </TouchableOpacity>
            )}

            {(onPin || onUnpin) && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  if (isPinned) {
                    onUnpin?.();
                  } else {
                    onPin?.();
                  }
                  setShowActions(false);
                }}
              >
                <FontAwesome name="thumb-tack" size={16} color="#fff" />
                <Text style={styles.actionLabel}>{isPinned ? 'Unpin' : 'Pin'}</Text>
              </TouchableOpacity>
            )}

            {(onSave || onUnsave) && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  if (isSaved) {
                    onUnsave?.();
                  } else {
                    onSave?.();
                  }
                  setShowActions(false);
                }}
              >
                <FontAwesome name={isSaved ? "bookmark" : "bookmark-o"} size={16} color="#fff" />
                <Text style={styles.actionLabel}>{isSaved ? 'Unsave' : 'Save'}</Text>
              </TouchableOpacity>
            )}

            {onForward && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => { onForward(); setShowActions(false); }}
              >
                <FontAwesome name="mail-forward" size={16} color="#fff" />
                <Text style={styles.actionLabel}>Forward</Text>
              </TouchableOpacity>
            )}

            {onShare && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => { onShare(); setShowActions(false); }}
              >
                <FontAwesome name="share" size={16} color="#fff" />
                <Text style={styles.actionLabel}>Share</Text>
              </TouchableOpacity>
            )}

            {onDelete && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => { onDelete(); setShowActions(false); }}
              >
                <FontAwesome name="trash" size={16} color={COLORS.danger} />
                <Text style={[styles.actionLabel, { color: COLORS.danger }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full-screen image modal */}
      {mediaUrl && mediaType === 'photo' && (
        <Modal visible={imageModalVisible} transparent animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
          <View style={styles.imageModalOverlay}>
            <TouchableOpacity style={styles.imageModalClose} onPress={() => setImageModalVisible(false)}>
              <FontAwesome name="times" size={24} color="#fff" />
            </TouchableOpacity>
            <Image source={{ uri: mediaUrl }} style={styles.fullImage} resizeMode="contain" />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 4,
  },
  myRowLayout: {
    justifyContent: 'flex-end',
  },
  partnerRowLayout: {
    justifyContent: 'flex-start',
  },
  checkboxContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleWrapper: {
    maxWidth: '80%',
    marginBottom: 6,
  },
  selectedBubbleWrapper: {
    opacity: 0.8,
  },
  myContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  partnerContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 6,
    marginBottom: 4,
    maxWidth: '100%',
  },
  myReplyPreview: { alignSelf: 'flex-end' },
  partnerReplyPreview: { alignSelf: 'flex-start' },
  replyBar: {
    width: 3,
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  replyText: {
    color: COLORS.subtext,
    fontSize: 11,
    flex: 1,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '100%',
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  partnerBubble: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 4,
  },
  videoContainer: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  voicePlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 180,
    paddingVertical: 4,
    gap: 8,
  },
  voiceProgressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  voiceProgressBar: {
    height: '100%',
  },
  voiceDuration: {
    fontSize: 12,
    fontWeight: '500',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
    gap: 12,
    paddingVertical: 6,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  documentSize: {
    fontSize: 11,
    marginTop: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  myText: { color: '#fff' },
  partnerText: { color: '#eee' },
  reactionBubble: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 1,
  },
  myReactionBubble: { left: 10 },
  partnerReactionBubble: { right: 10 },
  reactionEmoji: { fontSize: 14 },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  myStatusContainer: { justifyContent: 'flex-end' },
  partnerStatusContainer: { justifyContent: 'flex-start' },
  timestamp: {
    color: COLORS.subtext,
    fontSize: 10,
  },
  actionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenu: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    width: 260,
    borderWidth: 1,
    borderColor: '#333',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  emojiBtn: {
    padding: 6,
    borderRadius: 20,
  },
  emojiBtnActive: {
    backgroundColor: 'rgba(255, 77, 141, 0.2)',
  },
  emojiText: { fontSize: 22 },
  actionDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 12,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 15,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
