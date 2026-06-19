import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onSendMedia?: () => void;
  onTyping?: (isTyping: boolean) => void;
  partnerId?: string;
  isSendingMedia?: boolean;
  isSending?: boolean;
  voiceRecorder?: React.ReactNode;
}

export const ChatInput = ({
  onSendMessage,
  onSendMedia,
  onTyping,
  partnerId,
  isSendingMedia,
  isSending,
  voiceRecorder,
}: ChatInputProps) => {
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef<any>(null);
  const isTypingRef = useRef(false);

  const handleTextChange = (newText: string) => {
    setText(newText);

    // Emit typing started
    if (onTyping && newText.trim() && !isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }

    // Reset typing timeout — stop typing after 2s of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTyping?.(false);
      }
    }, 2000);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Stop typing indicator on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping?.(false);
    }

    onSendMessage(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.attachBtn} onPress={onSendMedia} disabled={isSendingMedia}>
        {isSendingMedia ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <FontAwesome name="image" size={22} color={COLORS.subtext} />
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Write a love note..."
        placeholderTextColor="#777"
        value={text}
        onChangeText={handleTextChange}
        multiline
        maxLength={1000}
      />

      {text.trim() ? (
        <TouchableOpacity
          style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <FontAwesome name="paper-plane" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      ) : (
        voiceRecorder
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 15,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  attachBtn: {
    padding: 10,
    width: 40,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
    marginHorizontal: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#333',
  },
});
