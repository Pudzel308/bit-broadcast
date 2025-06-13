import React, { useState } from 'react';
import {
    View,
    TextInput,
    Button,
    StyleSheet,
    Text,
    Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { updatePost } from '../services/database';

export default function EditPostScreen() {
    const { postId, title: initialTitle, content: initialContent, tag: initialTag } = useLocalSearchParams();
    const [title, setTitle] = useState(initialTitle as string);
    const [content, setContent] = useState(initialContent as string);
    const [tag, setTag] = useState((initialTag as string) || 'General');
    const router = useRouter();

    const TAG_COLORS = {
        General: { background: '#e0e0e0', text: '#333' },
        Question: { background: '#cce5ff', text: '#004085' },
        Request: { background: '#d4edda', text: '#155724' },
        Nsfw: { background: '#f8d7da', text: '#721c24' },
        Spoiler: { background: '#fff3cd', text: '#856404' },
    };


    const handleUpdate = async () => {
        await updatePost(Number(postId), title, content, tag);
        router.back();
    };

    return (
        <View style={styles.container}>
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
            <Text style={styles.label}>Edit Tag:</Text>
            <View style={styles.tagContainer}>
                {['General', 'Question', 'Request', 'Nsfw', 'Spoiler'].map((item) => {
                    const isSelected = tag === item;
                    const colors = TAG_COLORS[item];

                    return (
                        <Pressable
                            key={item}
                            onPress={() => setTag(item)}
                            style={[
                                styles.tagButton,
                                {
                                    backgroundColor: isSelected ? colors.background : '#f4f4f4',
                                    borderColor: isSelected ? colors.text : '#ccc',
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tagButtonText,
                                    { color: isSelected ? colors.text : '#333' },
                                ]}
                            >
                                {item}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
            <Button title="Save Changes" onPress={handleUpdate} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
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
        gap: 8,
        marginBottom: 16,
    },
    tagButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#f4f4f4',
    },
    tagButtonSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    tagButtonText: {
        color: '#333',
    },
    tagButtonTextSelected: {
        color: '#fff',
    },
});

