import React, { useEffect, useState, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
    FlatList,
    Text,
    View,
    TouchableOpacity,
    RefreshControl,
    StyleSheet,
    Pressable,
    Alert,
} from 'react-native';
import {
    getPostStats,
    initDatabase,
    likePost,
    unlikePost,
    deletePost,
} from '../services/database';
import { useFocusEffect } from '@react-navigation/native';
import CollapsibleText from '../components/Collapsible';

export default function FeedScreen() {
    const router = useRouter();
    const [dbReady, setDbReady] = useState(false);
    const [posts, setPosts] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [revealed, setRevealed] = useState<{ [postId: number]: boolean }>({});

    const TAG_COLORS: Record<string, { text: string }> = {
        General: { text: '#333' },
        Question: { text: '#004085' },
        Request: { text: '#155724' },
        Nsfw: { text: '#721c24' },
        Spoiler: { text: '#856404' },
    };

    const loadPosts = async (isInitial = false) => {
        isInitial ? setLoading(true) : setRefreshing(true);
        try {
            const data = await getPostStats();
            if (Array.isArray(data)) {
                setPosts(data);
                setRevealed({});
            } else {
                console.warn('Unexpected response from getPostStats:', data);
            }
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            isInitial ? setLoading(false) : setRefreshing(false);
        }
    };

    const handleLike = async (postId: number, liked: boolean) => {
        try {
            liked ? await unlikePost(postId, 1) : await likePost(postId, 1);
            await loadPosts();
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    };

    useEffect(() => {
        const initAndLoad = async () => {
            try {
                await initDatabase();
                setDbReady(true);
                await loadPosts(true);
            } catch (err) {
                console.error('Initialization error:', err);
            }
        };
        initAndLoad();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (dbReady) loadPosts();
        }, [dbReady])
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Feed',
                    headerRight: () => (
                        <TouchableOpacity onPress={() => router.push('/create-new-discussion')}>
                            <Text style={styles.headerButton}>Compose</Text>
                        </TouchableOpacity>
                    ),
                }}
            />
            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={loadPosts} />
                    }
                    ListEmptyComponent={<Text>No posts yet.</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.post}>
                            <Text style={styles.postTitle}>{item.title}</Text>
                            <Pressable
                                onPress={() => {
                                    if (
                                        (item.tag === 'Nsfw' || item.tag === 'Spoiler') &&
                                        !revealed[item.id]
                                    ) {
                                        Alert.alert(
                                            `${item.tag} Content`,
                                            `This post is marked as ${item.tag}. Are you sure you want to view it?`,
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                {
                                                    text: 'Reveal',
                                                    style: 'default',
                                                    onPress: () =>
                                                        setRevealed((prev) => ({
                                                            ...prev,
                                                            [item.id]: true,
                                                        })),
                                                },
                                            ]
                                        );
                                    }
                                }}
                            >
                                <Text
                                    style={[
                                        styles.postTag,
                                        { color: TAG_COLORS[item.tag]?.text || '#000' },
                                    ]}
                                >
                                    [{item.tag}]
                                </Text>
                            </Pressable>

                            {(item.tag === 'Nsfw' || item.tag === 'Spoiler') && !revealed[item.id] ? (
                                <Text style={{ fontStyle: 'italic', color: '#999', fontWeight: '700' }}>
                                    Content hidden. Tap the [{item.tag}] tag to reveal.
                                </Text>
                            ) : (
                                <CollapsibleText text={item.content} numberOfLines={3} />
                            )}

                            <Text style={styles.timestamp}>
                                {new Date(item.created_at).toLocaleString()}
                            </Text>

                            <View style={styles.likecontainer}>
                                <Pressable
                                    onPress={() => handleLike(item.id, item.liked_by_user)}
                                    style={styles.like}
                                >
                                    <Text style={styles.like}>
                                        {item.liked_by_user ? 'Unlike' : 'Like'}
                                    </Text>
                                    <Text style={styles.likecount}>{item.like_count}</Text>
                                </Pressable>
                                <Text>|</Text>

                                <TouchableOpacity
                                    style={styles.replycontainer}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/post-replies',
                                            params: { postId: item.id },
                                        })
                                    }
                                >
                                    <Text style={styles.reply}>Replies</Text>
                                    <Text style={styles.replycount}>{item.comment_count}</Text>
                                </TouchableOpacity>
                                <Text>|</Text>

                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/edit-post',
                                            params: {
                                                postId: item.id,
                                                title: item.title,
                                                content: item.content,
                                                tag: item.tag,
                                            },
                                        })
                                    }
                                >
                                    <Text style={styles.editText}>Edit</Text>
                                </TouchableOpacity>
                                <Text>|</Text>

                                <Pressable
                                    onPress={() => {
                                        Alert.alert(
                                            'Delete Discussion',
                                            'Are you sure you want to delete this discussion?',
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                {
                                                    text: 'Delete',
                                                    style: 'destructive',
                                                    onPress: async () => {
                                                        try {
                                                            await deletePost(item.id);
                                                            await loadPosts();
                                                        } catch (err) {
                                                            console.error('Failed to delete discussion:', err);
                                                            Alert.alert('Error deleting discussion');
                                                        }
                                                    },
                                                },
                                            ]
                                        );
                                    }}
                                    style={styles.deleteButton}
                                >
                                    <Text style={styles.editText}>Delete</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },

    postTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },

    postTag: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 4,
    },

    post: {
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#f2f2f2',
        borderBottomWidth: 2,
        borderColor: '#ddd',
        borderRadius: 8,
    },

    timestamp: {
        fontSize: 12,
        color: '#888',
        marginTop: 6,
    },

    likecontainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },

    like: {
        marginRight: 8,
        color: '#444444',
        fontWeight: '400',
        flexDirection: 'row',
    },

    likecount: {
        color: '#000000',
        fontWeight: '600',
    },

    replycontainer: {
        marginLeft: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },

    reply: {
        marginRight: 8,
        color: '#444444',
        fontWeight: '400',
    },

    replycount: {
        marginRight: 8,
        color: '#000000',
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

    headerButton: {
        marginRight: 12,
        fontWeight: 'bold',
        color: '#007aff',
    },
});

