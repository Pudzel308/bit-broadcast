import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    StyleSheet,
    Alert,
    RefreshControl,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Pressable,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createComment, getCommentsByPost, likeComment, unlikeComment, isCommentLikedByUser,  deleteComment, updateComment } from '../services/database';
import { useFocusEffect } from '@react-navigation/native';

export default function PostRepliesScreen() {
    const { postId } = useLocalSearchParams();
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editedCommentContent, setEditedCommentContent] = useState('');

    const loadComments = async () => {
        setRefreshing(true);
        try {
            const data = await getCommentsByPost(Number(postId), 1);
            setComments(data);
        } catch (err) {
            console.error('Failed to load comments:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleSubmit = async () => {
        if (!comment.trim()) {
            return;
        }

        try {
            await createComment(Number(postId), comment, 1);
            setComment('');
            await loadComments();
        } catch (err) {
            console.error('Failed to post comment:', err);
            Alert.alert('Error posting comment');
        }
    };

    const toggleLike = async (commentId: number, liked: boolean) => {
        try {
            if (liked) {
                await unlikeComment(commentId, 1);
            } else {
                await likeComment(commentId, 1);
            }
            await loadComments();
        } catch (err) {
            console.error('Failed to toggle comment like:', err);
        }
    };

    useEffect(() => {
        loadComments();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadComments();
        }, [])
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 80}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <FlatList
                        data={comments}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.comment}>
                                {editingCommentId === item.id ? (
                                    <>
                                        <TextInput
                                            value={editedCommentContent}
                                            onChangeText={setEditedCommentContent}
                                            style={[styles.input, { marginBottom: 8 }]}
                                            multiline
                                        />
                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                                            <Pressable
                                                onPress={() => setEditingCommentId(null)}
                                                style={[styles.sendButton, { backgroundColor: '#ccc', marginRight: 8 }]}
                                            >
                                                <Text style={styles.sendButtonText}>Cancel</Text>
                                            </Pressable>
                                            <Pressable
                                                onPress={async () => {
                                                    if (!editedCommentContent.trim()) return;
                                                    try {
                                                        await updateComment(item.id, editedCommentContent.trim());
                                                        setEditingCommentId(null);
                                                        setEditedCommentContent('');
                                                        await loadComments();
                                                    } catch (err) {
                                                        console.error('Failed to update reply:', err);
                                                        Alert.alert('Error updating reply');
                                                    }
                                                }}
                                                style={styles.sendButton}
                                            >
                                                <Text style={styles.sendButtonText}>Save</Text>
                                            </Pressable>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.content}>{item.content}</Text>
                                        <Text style={styles.timestamp}>
                                            {new Date(item.created_at).toLocaleString()}
                                        </Text>
                                    </>
                                )}

                                <View style={styles.commentFooter}>
                                    <Pressable
                                        onPress={() => toggleLike(item.id, item.liked_by_user)}
                                        style={styles.likeButton}
                                    >
                                        <Text style={styles.likeText}>
                                            {item.liked_by_user ? 'Unlike' : 'Like'}
                                        </Text>
                                        <Text style={styles.likeCount}>{item.like_count}</Text>
                                    </Pressable>
                                    <Text>|</Text>
                                    <Text style={styles.mention}>@mention</Text>
                                    <Text>|</Text>
                                    <Pressable
                                        onPress={() => {
                                            setEditingCommentId(item.id);
                                            setEditedCommentContent(item.content);
                                        }}
                                        style={styles.editButton}
                                    >
                                        <Text style={styles.editText}>Edit</Text>
                                    </Pressable>
                                    <Text>|</Text>
                                    <Pressable
                                        onPress={() => {
                                            Alert.alert(
                                                'Delete reply',
                                                'Are you sure you want to delete this reply?',
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'Delete',
                                                        style: 'destructive',
                                                        onPress: async () => {
                                                            try {
                                                                await deleteComment(item.id);
                                                                await loadComments();
                                                            } catch (err) {
                                                                console.error('Failed to delete reply:', err);
                                                                Alert.alert('Error deleting reply');
                                                            }
                                                        },
                                                    },
                                                ]
                                            );
                                        }}
                                        style={styles.deleteButton}
                                    >
                                        <Text style={[styles.deleteText]}>Delete</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={loadComments} />
                        }
                        ListEmptyComponent={<Text>No comments yet.</Text>}
                    />

                    <View style={styles.inputRow}>
                        <TextInput
                            placeholder="Write a reply..."
                            placeholderTextColor='#aaa'
                            value={comment}
                            onChangeText={setComment}
                            style={styles.input}
                            multiline
                        />
                        <Pressable onPress={handleSubmit} style={styles.sendButton}>
                            <Text style={styles.sendButtonText}>Send</Text>
                        </Pressable>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    comment: {
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 6,
        marginBottom: 10,
    },
    content: {
        fontSize: 15,
        color: '#333',
    },
    timestamp: {
        fontSize: 12,
        color: '#777',
        marginTop: 4,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        maxHeight: 120,
    },
    sendButton: {
        marginLeft: 8,
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    commentFooter: {
        flexDirection: 'row',
        marginTop: 6,
        alignItems: 'center',
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    likeText: {
        marginRight: 6,
    },
    likeCount: {
        color: '#000',
        fontWeight: '600',
    },
    mention: {
        marginLeft: 8,
        marginRight: 8,
        color: '#000',
        fontWeight: '600',
    },
    editButton: {
        marginLeft: 8,
        marginRight: 8,
    },
    editText: {
        color: '#000',
        fontWeight: '600',
    },
    deleteButton: {
        marginLeft: 8,
    },
    deleteText: {
        color: '#000',
        fontWeight: '600',
    },
});
