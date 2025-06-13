import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createPost } from '../services/database';

const TAG_COLORS = {
    General: { background: '#e0e0e0', text: '#333' },
    Question: { background: '#cce5ff', text: '#004085' },
    Request: { background: '#d4edda', text: '#155724' },
    Nsfw: { background: '#f8d7da', text: '#721c24' },
    Spoiler: { background: '#fff3cd', text: '#856404' },
};

export default function CreateNewDiscussionScreen() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tag, setTag] = useState('General');
    const router = useRouter();

    const handlePost = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Error', 'Please fill in both the title and content.');
            return;
        }

        try {
            await createPost(1, title, content, tag);
            router.replace('/');
        } catch (err) {
            console.error('Failed to create post:', err);
            Alert.alert('Error', 'Failed to create post. Please try again.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Title"
                />
                <TextInput
                    style={[styles.input, styles.textarea]}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    placeholder="Content"
                />
                <Text style={styles.label}>Tag:</Text>
                <View style={styles.tagContainer}>
                    {Object.keys(TAG_COLORS).map((item) => {
                        const isSelected = tag === item;
                        const colors = TAG_COLORS[item];

                        return (
                            <Pressable
                                key={item}
                                onPress={() => setTag(item)}
                                style={[
                                    styles.tagButton,
                                    {
                                        backgroundColor: isSelected
                                            ? colors.background
                                            : '#f4f4f4',
                                        borderColor: isSelected
                                            ? colors.text
                                            : '#ccc',
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.tagButtonText,
                                        {
                                            color: isSelected
                                                ? colors.text
                                                : '#333',
                                        },
                                    ]}
                                >
                                    {item}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
                <Button title="Publish" onPress={handlePost} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
    },
    textarea: {
        height: 120,
        textAlignVertical: 'top',
    },
    label: {
        marginBottom: 6,
        fontWeight: '600',
        color: '#333',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    tagButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 8,
        marginBottom: 8,
    },
    tagButtonText: {
        fontWeight: '500',
    },
});
